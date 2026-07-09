package com.vectorialdata.app.core.store

import com.vectorialdata.app.core.auth.SecureStore
import com.vectorialdata.app.core.model.NewsItem
import com.vectorialdata.app.core.model.NewsListResponse
import com.vectorialdata.app.core.net.ApiClient
import com.vectorialdata.app.core.net.ApiError
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

/**
 * Single source of truth for the news feed — backs the Home card, the full
 * list and (M5) the push deep link. Direct port of iOS `NewsStore`.
 *
 * The unread cursor is device-local (iOS uses @AppStorage; here the
 * encrypted prefs file already initialized by the app) — a deliberate v1
 * simplification: no server-side read state.
 */
object NewsStore {
    private const val LAST_READ_KEY = "news.lastReadAt"

    private val _items = MutableStateFlow<List<NewsItem>>(emptyList())
    val items: StateFlow<List<NewsItem>> = _items.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _errorMessage = MutableStateFlow<String?>(null)
    val errorMessage: StateFlow<String?> = _errorMessage.asStateFlow()

    /** Epoch millis of the last time the user opened the list; 0 = never. */
    private val _lastReadAt = MutableStateFlow(
        SecureStore.get(LAST_READ_KEY)?.toLongOrNull() ?: 0L
    )
    val lastReadAt: StateFlow<Long> = _lastReadAt.asStateFlow()

    /** Clears cached state on sign-out so the next user starts fresh. */
    fun reset() {
        _items.value = emptyList()
        _errorMessage.value = null
        _isLoading.value = false
        _lastReadAt.value = 0L
        SecureStore.delete(LAST_READ_KEY)
    }

    suspend fun load() {
        if (_isLoading.value) return
        _isLoading.value = true
        try {
            val resp: NewsListResponse = ApiClient.get("/api/news")
            _items.value = resp.news
            _errorMessage.value = null
        } catch (e: ApiError.Unauthorized) {
            _errorMessage.value = "Inicia sesión otra vez."
        } catch (e: Exception) {
            _errorMessage.value = e.message ?: "No pudimos cargar las noticias."
        } finally {
            _isLoading.value = false
        }
    }

    /** Stamp the read cursor when the user actually opens the list. */
    fun markAllAsRead() {
        val now = System.currentTimeMillis()
        _lastReadAt.value = now
        SecureStore.set(now.toString(), LAST_READ_KEY)
    }

    fun unreadCount(items: List<NewsItem>, lastReadAt: Long): Int =
        items.count { it.isUnread(lastReadAt) }

    fun mostRecentUnread(items: List<NewsItem>, lastReadAt: Long): NewsItem? =
        items.firstOrNull { it.isUnread(lastReadAt) }
}
