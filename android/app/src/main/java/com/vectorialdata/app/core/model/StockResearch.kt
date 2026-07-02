package com.vectorialdata.app.core.model

import kotlinx.serialization.Serializable

/**
 * "Lo importante" pill. `icon` is an SF Symbol name on the wire — Android
 * maps it to a Material icon (with a neutral fallback). `tint` is one of
 * emerald / red / yellow; anything else renders white.
 */
@Serializable
data class WhatsImportantPill(
    val icon: String,
    val tint: String,
    val text: String,
)

/**
 * `GET /api/picks/research/{ticker}`. Mirror of iOS `StockResearch`.
 * When `locked == true` only the base fields + [summaryShort] carry data.
 * `oneLiner`/`whyShort`/`riskShort` are the server-side mom-overrides and
 * must render verbatim (no client compaction).
 */
@Serializable
data class StockResearch(
    val ticker: String,
    val name: String,
    val sector: String,
    val industry: String,
    val country: String,
    val region: String,
    val currency: String,
    val summaryShort: String,
    val oneLiner: String? = null,
    val pickNumber: Int? = null,
    val pickDate: String? = null,
    val isSubscribed: Boolean = false,
    val locked: Boolean = false,
    val summaryWhat: String? = null,
    val summaryWhy: String? = null,
    val summaryRisk: String? = null,
    val whyShort: String? = null,
    val riskShort: String? = null,
    val whatsImportant: List<WhatsImportantPill>? = null,
    // Decoded for parity with iOS but no longer displayed — the UI shows
    // the whats_important pills instead.
    val peRatio: Double? = null,
    val peForward: Double? = null,
    val dividendYield: Double? = null,
    val marketCapB: Double? = null,
    val analystConsensus: String? = null,
    val analystTarget: Double? = null,
    val analystUpside: Double? = null,
    val waMessage: String? = null,
)
