package com.vectorialdata.app.feature.paywall

import android.app.Activity
import android.content.ContextWrapper
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.vectorialdata.app.R
import com.vectorialdata.app.core.billing.BillingManager
import com.vectorialdata.app.ui.theme.AppBackground
import com.vectorialdata.app.ui.theme.BrandEmerald
import com.vectorialdata.app.ui.theme.BrandIndigo
import kotlinx.coroutines.launch
import java.util.Locale

/**
 * Subscription sheet — Android mirror of the iOS `PaywallView`. Sells the one
 * monthly plan through Google Play Billing.
 *
 * Only shown when [BillingManager.available] is true; every caller uses
 * [rememberPaywallLauncher], which falls back to the web checkout when Play
 * can't serve the product (no Play Store on the device, listing not published
 * yet). Dismisses itself once the backend confirms the purchase.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PaywallSheet(onDismiss: () -> Unit) {
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    val scope = rememberCoroutineScope()
    val uriHandler = LocalUriHandler.current
    val activity = LocalContext.current.findActivity()

    val phase by BillingManager.phase.collectAsStateWithLifecycle()
    val offer by BillingManager.offer.collectAsStateWithLifecycle()

    LaunchedEffect(Unit) { BillingManager.start() }
    DisposableEffect(Unit) { onDispose { BillingManager.resetPhase() } }
    LaunchedEffect(phase) {
        if (phase is BillingManager.Phase.Success) onDismiss()
    }

    val lang = Locale.getDefault().language.take(2).ifEmpty { "es" }
    val trialDays = offer?.trialDays
    val price = offer?.formattedPrice
    val busy = phase is BillingManager.Phase.Purchasing || phase is BillingManager.Phase.Restoring

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
        containerColor = AppBackground,
    ) {
        Column(
            Modifier
                .fillMaxWidth()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 20.dp)
                .padding(bottom = 24.dp),
            verticalArrangement = Arrangement.spacedBy(20.dp),
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(
                    stringResource(R.string.paywall_title),
                    fontSize = 22.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White,
                )
                if (trialDays != null && price != null) {
                    Text(
                        stringResource(R.string.paywall_trial_headline, trialDays, price),
                        fontSize = 14.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = BrandEmerald,
                    )
                }
                Text(
                    stringResource(R.string.paywall_subtitle),
                    fontSize = 14.sp,
                    color = Color.White.copy(alpha = 0.7f),
                )
            }

            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                listOf(
                    R.string.paywall_benefit_picks,
                    R.string.paywall_benefit_thesis,
                    R.string.paywall_benefit_risk,
                    R.string.paywall_benefit_valuation,
                ).forEach { benefit ->
                    Row(
                        Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp),
                    ) {
                        Text("✓", fontSize = 14.sp, color = BrandEmerald, fontWeight = FontWeight.Bold)
                        Text(
                            stringResource(benefit),
                            fontSize = 14.sp,
                            color = Color.White.copy(alpha = 0.9f),
                        )
                    }
                }
            }

            (phase as? BillingManager.Phase.Failed)?.let {
                Text(
                    it.message,
                    fontSize = 12.sp,
                    color = Color(0xFFE5484D),
                    textAlign = TextAlign.Center,
                    modifier = Modifier.fillMaxWidth(),
                )
            }

            Button(
                onClick = { activity?.let { BillingManager.purchase(it) } },
                enabled = !busy && activity != null,
                shape = RoundedCornerShape(14.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = Color.Transparent,
                    disabledContainerColor = Color.Transparent,
                ),
                contentPadding = PaddingValues(0.dp),
                modifier = Modifier.fillMaxWidth(),
            ) {
                Row(
                    Modifier
                        .fillMaxWidth()
                        .background(
                            Brush.horizontalGradient(listOf(BrandIndigo, BrandEmerald)),
                            RoundedCornerShape(14.dp),
                        )
                        .padding(vertical = 15.dp),
                    horizontalArrangement = Arrangement.Center,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    if (phase is BillingManager.Phase.Purchasing) {
                        CircularProgressIndicator(
                            color = Color.White,
                            strokeWidth = 2.dp,
                            modifier = Modifier.size(20.dp),
                        )
                    } else {
                        Text(
                            subscribeLabel(trialDays, price),
                            fontSize = 16.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = Color.White,
                        )
                    }
                }
            }

            TextButton(
                onClick = { scope.launch { BillingManager.restore() } },
                enabled = !busy,
                modifier = Modifier.fillMaxWidth(),
            ) {
                Text(
                    stringResource(R.string.paywall_restore),
                    fontSize = 14.sp,
                    color = Color.White.copy(alpha = 0.7f),
                )
            }

            Column(
                verticalArrangement = Arrangement.spacedBy(4.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier.fillMaxWidth(),
            ) {
                Text(
                    if (trialDays != null && price != null) {
                        stringResource(R.string.paywall_trial_auto_renew, trialDays, price)
                    } else {
                        stringResource(R.string.paywall_auto_renew)
                    },
                    fontSize = 10.sp,
                    color = Color.White.copy(alpha = 0.5f),
                    textAlign = TextAlign.Center,
                )
                Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                    TextButton(onClick = {
                        uriHandler.openUri("https://vectorialdata.com/$lang/terms")
                    }) {
                        Text(
                            stringResource(R.string.paywall_terms),
                            fontSize = 11.sp,
                            color = Color.White.copy(alpha = 0.5f),
                        )
                    }
                    TextButton(onClick = {
                        uriHandler.openUri("https://vectorialdata.com/$lang/privacy")
                    }) {
                        Text(
                            stringResource(R.string.paywall_privacy),
                            fontSize = 11.sp,
                            color = Color.White.copy(alpha = 0.5f),
                        )
                    }
                }
            }

            Spacer(Modifier.size(4.dp))
        }
    }
}

/**
 * One-liner every paywall card uses: returns a lambda that opens the native
 * Play sheet when billing is live, and the web checkout when it isn't. Hosts
 * the sheet itself, so callers only wire the click.
 */
@Composable
fun rememberPaywallLauncher(): () -> Unit {
    var show by remember { mutableStateOf(false) }
    val available by BillingManager.available.collectAsStateWithLifecycle()
    val uriHandler = LocalUriHandler.current

    LaunchedEffect(Unit) { BillingManager.start() }

    if (show) {
        PaywallSheet(onDismiss = { show = false })
    }

    return {
        if (available) show = true else uriHandler.openUri(WEB_CHECKOUT_URL)
    }
}

/** Web fallback — the 14-day trial flow on vectorialdata.com. */
const val WEB_CHECKOUT_URL = "https://vectorialdata.com/join"

@Composable
private fun subscribeLabel(trialDays: Int?, price: String?): String = when {
    trialDays != null -> stringResource(R.string.paywall_cta_trial, trialDays)
    price != null -> stringResource(R.string.paywall_cta_subscribe_price, price)
    else -> stringResource(R.string.paywall_cta_subscribe)
}

/** Compose's LocalContext is a ContextWrapper chain; Play needs the Activity. */
private fun android.content.Context.findActivity(): Activity? {
    var ctx = this
    while (ctx is ContextWrapper) {
        if (ctx is Activity) return ctx
        ctx = ctx.baseContext
    }
    return null
}
