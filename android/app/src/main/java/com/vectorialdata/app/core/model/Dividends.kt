package com.vectorialdata.app.core.model

import kotlinx.serialization.Serializable

/** One collected dividend event. Mirror of iOS `DividendEvent`. */
@Serializable
data class DividendEvent(
    val id: String,
    val ticker: String,
    val pickNumber: Int,
    val exDate: String,
    val payDate: String? = null,
    val amountPerShare: Double,
    val sharesHeld: Double,
    val totalAmount: Double,
)

/** `GET /api/portfolio/dividends`. Mirror of iOS `DividendsResponse`. */
@Serializable
data class DividendsResponse(
    val ytdTotal: Double = 0.0,
    val allTimeTotal: Double = 0.0,
    val count: Int = 0,
    val companies: Int = 0,
    val byTicker: Map<String, Double> = emptyMap(),
    val events: List<DividendEvent> = emptyList(),
)
