package com.vectorialdata.app.core.model

import kotlinx.serialization.Serializable

/**
 * One aggregated position from `GET /api/portfolio/positions`. Mirror of
 * iOS `Position` (identity = ticker).
 *
 * `totalInvested` / `avgPrice` / `currentPrice` are decoded for parity but
 * MUST NEVER be rendered — dollar amounts of the model are never shown in
 * UI; only percentages. `priorCount`/`hasPrior` only populate in the
 * personal view.
 */
@Serializable
data class Position(
    val ticker: String,
    val name: String,
    val buys: Int,
    val priorCount: Int? = null,
    val hasPrior: Boolean? = null,
    val totalInvested: Double,
    val totalShares: Double,
    val avgPrice: Double,
    val currentPrice: Double,
    val returnPct: Double,
    val firstBought: String,
    val lastBought: String,
    val daysHeld: Int,
    val sector: String? = null,
    val region: String? = null,
    val country: String? = null,
    val dividendYield: Double? = null,
)

/** Sector/region allocation bucket (identity = name). */
@Serializable
data class AllocationBucket(
    val name: String,
    val count: Int,
    val pct: Double,
)

/** Envelope of `GET /api/portfolio/positions[?view=personal]`. */
@Serializable
data class PortfolioPositions(
    val view: String? = null,
    val positions: List<Position> = emptyList(),
    val totalReturnPct: Double,
    val totalPositions: Int,
    val avgDividendYield: Double? = null,
    val sectorAllocation: List<AllocationBucket>? = null,
    val regionAllocation: List<AllocationBucket>? = null,
    val since: String? = null,
)

/** Mirror of iOS `PortfolioViewMode` — segmented control on the Portfolio tab. */
enum class PortfolioViewMode(val label: String) {
    MODEL("Model"),
    PERSONAL("Mío"),
}
