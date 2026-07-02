package com.vectorialdata.app.core.store

import com.vectorialdata.app.core.model.DecisionResponse
import com.vectorialdata.app.core.model.Pick
import com.vectorialdata.app.core.model.PickStatus
import com.vectorialdata.app.core.model.PicksResponse
import com.vectorialdata.app.core.net.ApiClient
import com.vectorialdata.app.core.net.ApiError
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.serialization.Serializable
import java.time.Instant

/**
 * Single source of truth for picks + per-user decisions. Direct port of the
 * iOS `PickStatusStore` singleton: PicksScreen, PickDetailScreen and the
 * weekly digest all render from [picks]; decisions round-trip through the
 * backend and patch the local copy on success.
 */
object PickStatusStore {
    private val _picks = MutableStateFlow<List<Pick>>(emptyList())
    val picks: StateFlow<List<Pick>> = _picks.asStateFlow()

    private val _defaultInvestment = MutableStateFlow<Double?>(null)
    val defaultInvestment: StateFlow<Double?> = _defaultInvestment.asStateFlow()

    private val _isSubscribed = MutableStateFlow(false)
    val isSubscribed: StateFlow<Boolean> = _isSubscribed.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _errorMessage = MutableStateFlow<String?>(null)
    val errorMessage: StateFlow<String?> = _errorMessage.asStateFlow()

    /** Picks dated before this don't surface in the main feed. */
    private val _accessStartedAt = MutableStateFlow<String?>(null)
    val accessStartedAt: StateFlow<String?> = _accessStartedAt.asStateFlow()

    /** Bumped on every decision; the portfolio view (M3) refetches on change. */
    private val _lastDecisionAt = MutableStateFlow<Long?>(null)
    val lastDecisionAt: StateFlow<Long?> = _lastDecisionAt.asStateFlow()

    /** Clears all cached state on sign-out so the next user sees nothing stale. */
    fun reset() {
        _picks.value = emptyList()
        _defaultInvestment.value = null
        _isSubscribed.value = false
        _accessStartedAt.value = null
        _lastDecisionAt.value = null
        _errorMessage.value = null
        _isLoading.value = false
    }

    suspend fun load() {
        if (_isLoading.value) return
        _isLoading.value = true
        try {
            val resp: PicksResponse = ApiClient.get("/api/picks")
            _picks.value = resp.picks
            _defaultInvestment.value = resp.defaultInvestment
            _isSubscribed.value = resp.isSubscribed
            _accessStartedAt.value = resp.accessStartedAt
            _errorMessage.value = null
        } catch (e: ApiError.Unauthorized) {
            _errorMessage.value = "Please sign in again"
        } catch (e: Exception) {
            _errorMessage.value = e.message ?: "No pudimos cargar los picks."
        } finally {
            _isLoading.value = false
        }
    }

    @Serializable
    private data class BoughtBody(
        val status: String,
        val buyPrice: Double,
        val amountInvested: Double,
        val saveAsDefault: Boolean,
    )

    @Serializable
    private data class SkippedBody(val status: String)

    @Serializable
    private object EmptyBody

    /**
     * Mark a pick as bought. If [saveAsDefault] is true, the amount is
     * persisted as the user's `default_investment` on the subscribers row.
     */
    suspend fun markBought(
        pickNumber: Int,
        buyPrice: Double,
        amount: Double,
        saveAsDefault: Boolean,
    ): Boolean = postDecision(
        pickNumber,
        BoughtBody("bought", buyPrice, amount, saveAsDefault),
    )

    suspend fun markSkipped(pickNumber: Int): Boolean =
        postDecision(pickNumber, SkippedBody("skipped"))

    suspend fun markPending(pickNumber: Int): Boolean {
        return try {
            ApiClient.delete<EmptyBody, DecisionResponse>(
                "/api/picks/$pickNumber/decision", EmptyBody,
            )
            updateLocal(pickNumber, PickStatus.PENDING, buyPrice = null, amount = null)
            _lastDecisionAt.value = System.currentTimeMillis()
            true
        } catch (e: Exception) {
            _errorMessage.value = e.message
            false
        }
    }

    /** Set or clear the user's default "monto por pick" (null clears). */
    @Serializable
    private data class DefaultInvestmentBody(val amount: Double?)

    @Serializable
    private data class DefaultInvestmentResponse(
        val ok: Boolean? = null,
        val defaultInvestment: Double? = null,
    )

    suspend fun updateDefaultInvestment(amount: Double?): Boolean {
        return try {
            val resp: DefaultInvestmentResponse = ApiClient.post(
                "/api/me/default-investment", DefaultInvestmentBody(amount),
            )
            _defaultInvestment.value = resp.defaultInvestment
            true
        } catch (e: Exception) {
            _errorMessage.value = e.message
            false
        }
    }

    private suspend inline fun <reified B> postDecision(pickNumber: Int, body: B): Boolean {
        return try {
            val resp: DecisionResponse = ApiClient.post(
                "/api/picks/$pickNumber/decision", body,
            )
            val status = when (resp.status) {
                "bought" -> PickStatus.BOUGHT
                "skipped" -> PickStatus.SKIPPED
                else -> PickStatus.PENDING
            }
            updateLocal(pickNumber, status, resp.buyPrice, resp.amountInvested)
            resp.defaultInvestment?.let { _defaultInvestment.value = it }
            _lastDecisionAt.value = System.currentTimeMillis()
            true
        } catch (e: Exception) {
            _errorMessage.value = e.message
            false
        }
    }

    private fun updateLocal(
        pickNumber: Int,
        status: PickStatus,
        buyPrice: Double?,
        amount: Double?,
    ) {
        _picks.value = _picks.value.map { pick ->
            if (pick.pickNumber == pickNumber) {
                pick.copy(
                    status = status,
                    buyPrice = buyPrice,
                    amountInvested = amount,
                    decidedAt = Instant.now().toString(),
                )
            } else pick
        }
    }

    // ---- Derived collections (mirror of the iOS computed vars) --------------

    fun pending(picks: List<Pick>): List<Pick> =
        picks.filter { it.status == PickStatus.PENDING }

    fun bought(picks: List<Pick>): List<Pick> =
        picks.filter { it.status == PickStatus.BOUGHT }

    /** Newest-decided-first list for the "HISTORIAL" section. */
    fun historial(picks: List<Pick>): List<Pick> =
        picks.filter { it.status != PickStatus.PENDING }
            .sortedByDescending { it.decidedAt ?: "" }
}
