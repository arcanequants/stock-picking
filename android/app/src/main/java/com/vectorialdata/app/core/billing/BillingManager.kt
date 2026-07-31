package com.vectorialdata.app.core.billing

import android.app.Activity
import android.content.Context
import com.android.billingclient.api.BillingClient
import com.android.billingclient.api.BillingClientStateListener
import com.android.billingclient.api.BillingFlowParams
import com.android.billingclient.api.BillingResult
import com.android.billingclient.api.PendingPurchasesParams
import com.android.billingclient.api.ProductDetails
import com.android.billingclient.api.Purchase
import com.android.billingclient.api.PurchasesUpdatedListener
import com.android.billingclient.api.QueryProductDetailsParams
import com.android.billingclient.api.QueryPurchasesParams
import com.android.billingclient.api.queryProductDetails
import com.android.billingclient.api.queryPurchasesAsync
import com.vectorialdata.app.R
import com.vectorialdata.app.core.auth.AuthManager
import com.vectorialdata.app.core.i18n.Localizer
import com.vectorialdata.app.core.net.ApiClient
import com.vectorialdata.app.core.store.PickStatusStore
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.serialization.Serializable
import java.time.Period

/**
 * Google Play Billing driver for the single monthly subscription — Android
 * mirror of the iOS `StoreManager` (StoreKit 2).
 *
 * Flow: connect → query the product → `launchBillingFlow()` → Play hands the
 * purchase back through [PurchasesUpdatedListener] → we POST its
 * `purchaseToken` to `/api/iap/verify-play`, which looks it up in the Play
 * Developer API (nothing client-side is trusted), acknowledges it, and writes
 * `subscription_status` on the subscriber row — the same source of truth
 * Stripe and Apple feed. Then we refresh the local stores so the paywall
 * disappears immediately.
 *
 * Acknowledgement is deliberately server-side (`google-play.ts`): Play voids
 * purchases that aren't acknowledged within 3 days, and the backend is the
 * only place guaranteed to run after a successful verify.
 *
 * [available] is false whenever Play Billing can't serve this build (no Play
 * Store, product not published yet, connection refused). Callers fall back to
 * the web checkout instead of showing a dead button — until the Play Console
 * listing exists, that is every build.
 */
object BillingManager {

    /** Play product id; must match the backend's `PLAY_SUBSCRIPTION_ID`. */
    const val SUBSCRIPTION_ID = "premium_monthly"

    sealed interface Phase {
        data object Idle : Phase
        data object Loading : Phase
        data object Purchasing : Phase
        data object Restoring : Phase
        data object Success : Phase
        data class Failed(val message: String) : Phase
    }

    /**
     * The offer we will actually charge against, flattened for the UI.
     * [trialDays] is non-null only when Play returned a free-trial phase —
     * Play filters offers by eligibility, so its presence *is* the eligibility
     * check (the iOS `isEligibleForIntroOffer` equivalent).
     */
    data class Offer(
        val offerToken: String,
        val formattedPrice: String,
        val trialDays: Int?,
    )

    private lateinit var appContext: Context
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)

    private val _phase = MutableStateFlow<Phase>(Phase.Idle)
    val phase: StateFlow<Phase> = _phase.asStateFlow()

    private val _offer = MutableStateFlow<Offer?>(null)
    val offer: StateFlow<Offer?> = _offer.asStateFlow()

    /** False until we have a connected client AND a live product to sell. */
    private val _available = MutableStateFlow(false)
    val available: StateFlow<Boolean> = _available.asStateFlow()

    private var client: BillingClient? = null
    private var productDetails: ProductDetails? = null
    private var connecting = false

    private val purchasesListener = PurchasesUpdatedListener { result, purchases ->
        when (result.responseCode) {
            BillingClient.BillingResponseCode.OK -> {
                val list = purchases.orEmpty()
                if (list.isEmpty()) {
                    _phase.value = Phase.Idle
                } else {
                    scope.launch { handlePurchases(list, restoring = false) }
                }
            }
            BillingClient.BillingResponseCode.USER_CANCELED -> _phase.value = Phase.Idle
            // Ask-to-buy / slow card: Play resolves it later and re-delivers
            // through queryPurchasesAsync on the next launch.
            BillingClient.BillingResponseCode.ITEM_ALREADY_OWNED ->
                scope.launch { restore() }
            else -> _phase.value = Phase.Failed(Localizer.get(R.string.billing_purchase_failed))
        }
    }

    fun init(context: Context) {
        appContext = context.applicationContext
    }

    /**
     * Connect and load the product. Safe to call repeatedly (paywall opens,
     * app resumes) — a live client short-circuits.
     */
    fun start() {
        if (!::appContext.isInitialized) return
        if (client?.isReady == true) {
            scope.launch { loadProduct() }
            return
        }
        if (connecting) return
        connecting = true

        if (_phase.value is Phase.Idle) _phase.value = Phase.Loading

        val c = BillingClient.newBuilder(appContext)
            .setListener(purchasesListener)
            .enablePendingPurchases(
                PendingPurchasesParams.newBuilder().enableOneTimeProducts().build(),
            )
            .build()
        client = c

        c.startConnection(object : BillingClientStateListener {
            override fun onBillingSetupFinished(result: BillingResult) {
                connecting = false
                if (result.responseCode == BillingClient.BillingResponseCode.OK) {
                    scope.launch {
                        loadProduct()
                        // Catch subscriptions bought on another device (or a
                        // reinstall) without making the user hit "Restore".
                        syncExistingPurchases()
                    }
                } else {
                    markUnavailable()
                }
            }

            override fun onBillingServiceDisconnected() {
                connecting = false
                _available.value = false
            }
        })
    }

    private suspend fun loadProduct() {
        val c = client ?: return markUnavailable()
        val params = QueryProductDetailsParams.newBuilder()
            .setProductList(
                listOf(
                    QueryProductDetailsParams.Product.newBuilder()
                        .setProductId(SUBSCRIPTION_ID)
                        .setProductType(BillingClient.ProductType.SUBS)
                        .build(),
                ),
            )
            .build()

        val result = c.queryProductDetails(params)
        val details = result.productDetailsList?.firstOrNull()
        if (result.billingResult.responseCode != BillingClient.BillingResponseCode.OK ||
            details == null
        ) {
            return markUnavailable()
        }

        productDetails = details
        _offer.value = bestOffer(details)
        _available.value = _offer.value != null
        if (_phase.value is Phase.Loading) _phase.value = Phase.Idle
    }

    /**
     * Prefer an offer that starts with a free trial; otherwise the plain base
     * plan. Play only returns offers this account can still redeem, so an
     * offer carrying a zero-price phase means the trial is genuinely available.
     */
    private fun bestOffer(details: ProductDetails): Offer? {
        val offers = details.subscriptionOfferDetails.orEmpty()
        if (offers.isEmpty()) return null

        fun trialDaysOf(o: ProductDetails.SubscriptionOfferDetails): Int? =
            o.pricingPhases.pricingPhaseList
                .firstOrNull { it.priceAmountMicros == 0L }
                ?.let { daysIn(it.billingPeriod) }

        /** Recurring (non-zero) price shown to the user, e.g. "$1.00". */
        fun priceOf(o: ProductDetails.SubscriptionOfferDetails): String =
            o.pricingPhases.pricingPhaseList
                .lastOrNull { it.priceAmountMicros > 0L }
                ?.formattedPrice
                .orEmpty()

        val withTrial = offers.firstOrNull { trialDaysOf(it) != null }
        val chosen = withTrial ?: offers.first()
        val price = priceOf(chosen).ifEmpty { priceOf(offers.first()) }
        if (price.isEmpty()) return null

        return Offer(
            offerToken = chosen.offerToken,
            formattedPrice = price,
            trialDays = trialDaysOf(chosen),
        )
    }

    /** ISO-8601 billing period ("P14D", "P2W", "P1M") → days. */
    private fun daysIn(period: String): Int? = try {
        val p = Period.parse(period)
        (p.years * 365) + (p.months * 30) + p.days
    } catch (_: Exception) {
        null
    }

    private fun markUnavailable() {
        _available.value = false
        _offer.value = null
        if (_phase.value is Phase.Loading) _phase.value = Phase.Idle
    }

    /**
     * Launch Play's purchase sheet. Must be called from an Activity — Play
     * renders its own UI on top of it.
     */
    fun purchase(activity: Activity) {
        val c = client
        val details = productDetails
        val token = _offer.value?.offerToken
        if (c == null || details == null || token == null) {
            _phase.value = Phase.Failed(Localizer.get(R.string.billing_unavailable))
            return
        }

        _phase.value = Phase.Purchasing
        val params = BillingFlowParams.newBuilder()
            .setProductDetailsParamsList(
                listOf(
                    BillingFlowParams.ProductDetailsParams.newBuilder()
                        .setProductDetails(details)
                        .setOfferToken(token)
                        .build(),
                ),
            )
            .build()

        val result = c.launchBillingFlow(activity, params)
        if (result.responseCode != BillingClient.BillingResponseCode.OK) {
            _phase.value = Phase.Failed(Localizer.get(R.string.billing_purchase_failed))
        }
    }

    /** "Restore purchases" — re-reads Play's entitlements and re-verifies. */
    suspend fun restore() {
        val c = client
        if (c?.isReady != true) {
            _phase.value = Phase.Failed(Localizer.get(R.string.billing_unavailable))
            return
        }
        _phase.value = Phase.Restoring
        val purchases = activePurchases(c)
        if (purchases.isEmpty()) {
            _phase.value = Phase.Failed(Localizer.get(R.string.billing_restore_none))
            return
        }
        handlePurchases(purchases, restoring = true)
    }

    /** Silent variant of [restore] used right after connecting. */
    private suspend fun syncExistingPurchases() {
        val c = client ?: return
        val purchases = activePurchases(c)
        if (purchases.isEmpty()) return
        // Don't touch `phase` — this runs unprompted; a failure here must not
        // paint an error on a paywall the user just opened.
        purchases.forEach { verify(it.purchaseToken) }
    }

    private suspend fun activePurchases(c: BillingClient): List<Purchase> {
        val params = QueryPurchasesParams.newBuilder()
            .setProductType(BillingClient.ProductType.SUBS)
            .build()
        val result = c.queryPurchasesAsync(params)
        if (result.billingResult.responseCode != BillingClient.BillingResponseCode.OK) {
            return emptyList()
        }
        return result.purchasesList.filter {
            it.purchaseState == Purchase.PurchaseState.PURCHASED
        }
    }

    private suspend fun handlePurchases(purchases: List<Purchase>, restoring: Boolean) {
        val ok = purchases.any { verify(it.purchaseToken) }
        _phase.value = when {
            ok -> Phase.Success
            restoring -> Phase.Failed(Localizer.get(R.string.billing_restore_failed))
            else -> Phase.Failed(Localizer.get(R.string.billing_verify_failed))
        }
        if (ok) {
            PickStatusStore.load()
            AuthManager.refreshCurrentUser()
        }
    }

    @Serializable
    private data class VerifyBody(val purchaseToken: String)

    @Serializable
    private data class VerifyResponse(
        val isSubscribed: Boolean = false,
        val subscriptionStatus: String? = null,
        val currentPeriodEnd: String? = null,
    )

    /** POSTs the token to the backend, which is the authority on entitlement. */
    private suspend fun verify(purchaseToken: String): Boolean = try {
        ApiClient.post<VerifyBody, VerifyResponse>(
            "/api/iap/verify-play",
            VerifyBody(purchaseToken),
        ).isSubscribed
    } catch (_: Exception) {
        false
    }

    /** Clears transient UI state so a reopened paywall starts clean. */
    fun resetPhase() {
        if (_phase.value is Phase.Failed || _phase.value is Phase.Success) {
            _phase.value = Phase.Idle
        }
    }
}
