package com.vectorialdata.app.core.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

/**
 * Mirror of iOS `MarketStatus`. Unknown wire values fall back to CLOSED
 * (the shared Json has `coerceInputValues = true` and the snapshot property
 * declares a CLOSED default).
 */
@Serializable
enum class MarketStatus {
    @SerialName("open") OPEN,
    @SerialName("pre") PRE,
    @SerialName("post") POST,
    @SerialName("closed") CLOSED,
    @SerialName("weekend") WEEKEND,
    @SerialName("holiday") HOLIDAY,
}

@Serializable
data class SnapshotPosition(
    val ticker: String,
    val returnPct: Double,
)

@Serializable
data class LatestPick(
    val pickNumber: Int,
    val ticker: String,
    val name: String,
    val date: String,
    val returnPct: Double,
)

/** `GET /api/portfolio/snapshot`. Mirror of iOS `PortfolioSnapshot`. */
@Serializable
data class PortfolioSnapshot(
    val totalReturnPct: Double,
    val totalPositions: Int,
    val since: String? = null,
    val best: SnapshotPosition? = null,
    val worst: SnapshotPosition? = null,
    val latestPick: LatestPick? = null,
    val marketStatus: MarketStatus = MarketStatus.CLOSED,
    val asOf: String? = null,
)

/**
 * One point of `GET /api/portfolio/history` (identity = date, YYYY-MM-DD).
 * `personalReturnPct` only arrives with `?view=personal` and only for dates
 * the user was already invested.
 */
@Serializable
data class PortfolioHistoryPoint(
    val date: String,
    val returnPct: Double,
    val spyReturnPct: Double? = null,
    val personalReturnPct: Double? = null,
)
