package com.vectorialdata.app.core.model

import kotlinx.serialization.Serializable
import java.time.Instant
import java.time.OffsetDateTime

/** One tappable "palabras claras" glossary entry. */
@Serializable
data class GlossaryTerm(val term: String, val def: String)

/**
 * One curated app-only news item. Matches `GET /api/news → news[]` —
 * mirror of iOS `NewsItem`. The website intentionally has no equivalent.
 */
@Serializable
data class NewsItem(
    val id: String,
    val headline: String,
    val body: String,
    val linkUrl: String? = null,
    /** "all" | "premium" — server already filters what this user can see. */
    val audience: String = "all",
    val publishedAt: String,

    // --- "explainer de 60 segundos" enrichment (server-side at ingest) ---
    /** "picks" | "companies" | "economy" | "politics" | "markets" */
    val topic: String? = null,
    /** e.g. ["us","global"] — drives the flag chips. */
    val regions: List<String>? = null,
    /** Tickers this news materially affects (for the "afecta a X" hint). */
    val tickers: List<String>? = null,
    /** The 4 explainer blocks. Null on legacy rows → falls back to [body]. */
    val blockWhat: String? = null,
    val blockWhy: String? = null,
    val blockYou: String? = null,
    val blockTell: String? = null,
    val glossary: List<GlossaryTerm>? = null,
) {
    /** True when the server produced the 4-block explainer for this item. */
    val hasExplainer: Boolean
        get() = listOf(blockWhat, blockWhy, blockYou, blockTell).all { !it.isNullOrEmpty() }

    /**
     * True for items published after the device-local read cursor —
     * drives the unread dot + the Home card badge (mirror of iOS).
     */
    fun isUnread(lastReadAtEpochMs: Long?): Boolean {
        if (lastReadAtEpochMs == null || lastReadAtEpochMs <= 0L) return true
        val published = parseISO(publishedAt) ?: return false
        return published.toEpochMilli() > lastReadAtEpochMs
    }

    companion object {
        /** Supabase timestamps come with offset (and sometimes fraction). */
        fun parseISO(s: String): Instant? =
            runCatching { OffsetDateTime.parse(s).toInstant() }.getOrNull()
                ?: runCatching { Instant.parse(s) }.getOrNull()
    }
}

/** Envelope of `GET /api/news`. */
@Serializable
data class NewsListResponse(
    val news: List<NewsItem> = emptyList(),
    /** Whether the per-news AI chat is available to this user (premium/trial). */
    val chatEnabled: Boolean? = null,
)

/**
 * Topic + region display metadata: emoji, string res, accent color key —
 * mirror of iOS `NewsTaxonomy`. Order defines the filter-chip order.
 */
object NewsTaxonomy {
    data class Topic(val id: String, val emoji: String, val labelRes: Int)

    val topics = listOf(
        Topic("picks", "📈", com.vectorialdata.app.R.string.news_topic_picks),
        Topic("companies", "🏢", com.vectorialdata.app.R.string.news_topic_companies),
        Topic("economy", "🌍", com.vectorialdata.app.R.string.news_topic_economy),
        Topic("politics", "🏛️", com.vectorialdata.app.R.string.news_topic_politics),
        Topic("markets", "💱", com.vectorialdata.app.R.string.news_topic_markets),
    )

    private val regionFlags = mapOf(
        "global" to "🌍", "us" to "🇺🇸", "mx" to "🇲🇽", "br" to "🇧🇷",
        "in" to "🇮🇳", "eu" to "🇪🇺", "asia" to "🌏",
    )

    fun topicLabelRes(id: String?): Int =
        topics.firstOrNull { it.id == id }?.labelRes
            ?: com.vectorialdata.app.R.string.news_topic_markets

    fun topicEmoji(id: String?): String =
        topics.firstOrNull { it.id == id }?.emoji ?: "💱"

    fun regionFlag(id: String): String = regionFlags[id] ?: "🌍"
}
