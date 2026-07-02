package com.vectorialdata.app.core.store

import com.vectorialdata.app.core.model.DividendEvent
import com.vectorialdata.app.core.model.DividendsResponse
import com.vectorialdata.app.core.net.ApiClient
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

/**
 * Collected dividends, keyed per pick. Direct port of the iOS
 * `DividendStore` singleton (pick detail's "💸 DIVIDENDOS COBRADOS").
 */
object DividendStore {
    private val _summary = MutableStateFlow<DividendsResponse?>(null)
    val summary: StateFlow<DividendsResponse?> = _summary.asStateFlow()

    private val _events = MutableStateFlow<List<DividendEvent>>(emptyList())
    val events: StateFlow<List<DividendEvent>> = _events.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    fun reset() {
        _summary.value = null
        _events.value = emptyList()
        _isLoading.value = false
    }

    suspend fun load() {
        if (_isLoading.value) return
        _isLoading.value = true
        try {
            val resp: DividendsResponse = ApiClient.get("/api/portfolio/dividends")
            _summary.value = resp
            _events.value = resp.events
        } catch (_: Exception) {
            // Dividends are additive UI — a failed load just hides the section.
        } finally {
            _isLoading.value = false
        }
    }

    fun eventsForPick(pickNumber: Int): List<DividendEvent> =
        _events.value.filter { it.pickNumber == pickNumber }
}
