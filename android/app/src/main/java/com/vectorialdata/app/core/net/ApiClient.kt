package com.vectorialdata.app.core.net

import com.vectorialdata.app.R
import com.vectorialdata.app.core.config.AppConfig
import com.vectorialdata.app.core.i18n.Localizer
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext
import kotlinx.serialization.DeserializationStrategy
import kotlinx.serialization.ExperimentalSerializationApi
import kotlinx.serialization.KSerializer
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonNamingStrategy
import kotlinx.serialization.serializer
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.util.Locale
import java.util.concurrent.TimeUnit

/**
 * Thrown by [ApiClient]; mirrors the Swift `APIError` cases. Messages are
 * localized lazily (getter, not constructor arg) so they resolve in the
 * device locale at display time — stores surface `e.message` to the UI.
 */
sealed class ApiError : Exception() {
    data object Unauthorized : ApiError() {
        override val message get() = Localizer.get(R.string.err_unauthorized)
    }
    data object RateLimited : ApiError() {
        override val message get() = Localizer.get(R.string.err_rate_limited)
    }
    data class Server(val status: Int, val payload: String) : ApiError() {
        override val message get() = Localizer.get(R.string.err_server, status)
    }
    data class Decoding(val reason: Throwable) : ApiError() {
        override val message get() = Localizer.get(R.string.err_decoding)
    }
}

/** Marker for endpoints that return an empty 2xx body (mirror of Swift `EmptyResponse`). */
@kotlinx.serialization.Serializable
object EmptyResponse

/**
 * Minimal coroutine HTTP client for the Vectorial Data backend. Mirrors the
 * iOS `APIClient` actor: JSON (snake_case) encode/decode, bearer auth, and a
 * single automatic refresh-and-replay on 401.
 */
object ApiClient {
    @OptIn(ExperimentalSerializationApi::class)
    val json = Json {
        ignoreUnknownKeys = true
        explicitNulls = false
        namingStrategy = JsonNamingStrategy.SnakeCase
        encodeDefaults = true
        // Unknown enum values (e.g. a new market_status) fall back to the
        // property default instead of throwing — mirrors the iOS decoders.
        coerceInputValues = true
    }

    private val client = OkHttpClient.Builder()
        .connectTimeout(20, TimeUnit.SECONDS)
        .readTimeout(20, TimeUnit.SECONDS)
        .build()

    private val jsonMedia = "application/json; charset=utf-8".toMediaType()
    private val emptySerialName = EmptyResponse.serializer().descriptor.serialName

    private val refreshMutex = Mutex()
    @Volatile private var bearerToken: String? = null
    private var refreshHandler: (suspend () -> Boolean)? = null

    fun setBearer(token: String) { bearerToken = token }
    fun clearBearer() { bearerToken = null }

    /** Installed once by `AuthManager`; returns true if a refresh succeeded. */
    fun setRefreshHandler(handler: suspend () -> Boolean) { refreshHandler = handler }

    suspend inline fun <reified T> get(path: String): T =
        execute(path, "GET", null, serializer())

    suspend inline fun <reified B, reified T> post(path: String, body: B): T =
        execute(path, "POST", json.encodeToString(serializer<B>(), body), serializer())

    suspend inline fun <reified B, reified T> delete(path: String, body: B): T =
        execute(path, "DELETE", json.encodeToString(serializer<B>(), body), serializer())

    @PublishedApi
    internal suspend fun <T> execute(
        path: String,
        method: String,
        body: String?,
        deserializer: KSerializer<T>,
        allowRefresh: Boolean = true,
    ): T = withContext(Dispatchers.IO) {
        val url = AppConfig.apiBaseUrl + path
        val langTag = Locale.getDefault().language.take(2).ifEmpty { "es" }

        val builder = Request.Builder()
            .url(url)
            .header("Accept", "application/json")
            .header("Accept-Language", langTag)

        bearerToken?.let { builder.header("Authorization", "Bearer $it") }

        val reqBody = body?.toRequestBody(jsonMedia)
        when (method) {
            "GET" -> builder.get()
            "POST" -> builder.post(reqBody ?: "".toRequestBody(jsonMedia))
            "DELETE" -> builder.delete(reqBody)
            else -> builder.method(method, reqBody)
        }

        val response = client.newCall(builder.build()).execute()
        val code = response.code
        val payload = response.use { it.body?.string().orEmpty() }

        when (code) {
            in 200..299 -> {
                if (deserializer.descriptor.serialName == emptySerialName) {
                    @Suppress("UNCHECKED_CAST")
                    return@withContext EmptyResponse as T
                }
                try {
                    json.decodeFromString(deserializer, payload.ifEmpty { "{}" })
                } catch (e: Exception) {
                    throw ApiError.Decoding(e)
                }
            }
            401 -> {
                val handler = refreshHandler
                if (allowRefresh && handler != null) {
                    val didRefresh = refreshMutex.withLock { handler.invoke() }
                    if (didRefresh) {
                        return@withContext execute(path, method, body, deserializer, allowRefresh = false)
                    }
                }
                throw ApiError.Unauthorized
            }
            429 -> throw ApiError.RateLimited
            else -> throw ApiError.Server(code, payload)
        }
    }
}
