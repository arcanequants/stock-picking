package com.vectorialdata.app.core.model

import kotlinx.serialization.Serializable
import java.time.Instant
import java.time.OffsetDateTime

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
) {
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
data class NewsListResponse(val news: List<NewsItem> = emptyList())
