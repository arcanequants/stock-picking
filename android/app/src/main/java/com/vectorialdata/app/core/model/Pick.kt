package com.vectorialdata.app.core.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

/** Mirror of iOS `PickStatus`. */
@Serializable
enum class PickStatus {
    @SerialName("pending") PENDING,
    @SerialName("bought") BOUGHT,
    @SerialName("skipped") SKIPPED,
}

/**
 * One pick from `GET /api/picks`. Mirror of iOS `Pick` — identity is
 * `pickNumber` (iOS hashes/compares by pickNumber only), and `status`
 * defaults to pending when the wire field is absent.
 */
@Serializable
data class Pick(
    val pickNumber: Int,
    val ticker: String,
    val name: String,
    val sector: String,
    val region: String,
    val country: String,
    val priceAtPick: Double,
    val currentPrice: Double,
    val returnPct: Double,
    val date: String,
    val type: String,
    val cycleNumber: Int? = null,
    val researchUrl: String? = null,
    val status: PickStatus = PickStatus.PENDING,
    val buyPrice: Double? = null,
    val amountInvested: Double? = null,
    val decidedAt: String? = null,
)

/** Envelope of `GET /api/picks`. Mirror of iOS `PicksResponse`. */
@Serializable
data class PicksResponse(
    val picks: List<Pick> = emptyList(),
    val isSubscribed: Boolean = false,
    val defaultInvestment: Double? = null,
    /** Picks dated before this don't surface in the main feed. */
    val accessStartedAt: String? = null,
)

/** Response of POST/DELETE `/api/picks/{n}/decision`. */
@Serializable
data class DecisionResponse(
    val ok: Boolean? = null,
    val pickNumber: Int,
    val status: String,
    val buyPrice: Double? = null,
    val amountInvested: Double? = null,
    val defaultInvestment: Double? = null,
)
