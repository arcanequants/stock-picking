package com.vectorialdata.app.core.auth

import com.vectorialdata.app.R
import com.vectorialdata.app.core.config.AppConfig
import com.vectorialdata.app.core.i18n.Localizer
import com.vectorialdata.app.core.model.UserProfile
import com.vectorialdata.app.core.net.ApiClient
import com.vectorialdata.app.core.net.ApiError
import com.vectorialdata.app.core.net.EmptyResponse
import com.vectorialdata.app.core.notifications.NotificationsManager
import com.vectorialdata.app.core.store.DividendStore
import com.vectorialdata.app.core.store.NewsStore
import com.vectorialdata.app.core.store.PickStatusStore
import com.vectorialdata.app.feature.home.resetHomeCaches
import com.vectorialdata.app.feature.portfolio.resetPortfolioCache
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.serialization.Serializable

/**
 * Observable auth state + magic-link flow coordinator. Direct port of the iOS
 * `AuthManager`.
 *
 * Auth flow (Android):
 *   1. User types email -> [requestMagicLink] with `client = "android"`.
 *   2. Backend emails a `vectorialdata://auth?token_hash=X&type=Y` link.
 *   3. [handleDeepLink] exchanges token_hash for a JWT via
 *      `/api/auth/ios-exchange`, stores it in [SecureStore], loads the profile.
 *   (OTP and demo-login are alternative entry points, same as iOS.)
 */
object AuthManager {
    enum class AuthState { UNKNOWN, SIGNED_OUT, SIGNED_IN }

    private const val ACCESS_TOKEN_KEY = "access_token"
    private const val REFRESH_TOKEN_KEY = "refresh_token"

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)

    private val _state = MutableStateFlow(AuthState.UNKNOWN)
    val state: StateFlow<AuthState> = _state.asStateFlow()

    private val _currentUser = MutableStateFlow<UserProfile?>(null)
    val currentUser: StateFlow<UserProfile?> = _currentUser.asStateFlow()

    /** Set when a magic-link exchange or OTP verify fails. */
    private val _lastAuthError = MutableStateFlow<String?>(null)
    val lastAuthError: StateFlow<String?> = _lastAuthError.asStateFlow()

    fun clearAuthError() { _lastAuthError.value = null }

    init {
        // APIClient calls back here on any 401: trade the refresh_token for a
        // fresh access_token and let the original request retry.
        ApiClient.setRefreshHandler { refreshAccessToken() }
    }

    suspend fun restoreSession() {
        val token = SecureStore.get(ACCESS_TOKEN_KEY)
        if (token != null) {
            ApiClient.setBearer(token)
            refreshProfile()
        } else {
            _state.value = AuthState.SIGNED_OUT
        }
    }

    // ---- Sign-in entry points -------------------------------------------------

    @Serializable
    private data class MagicLinkBody(val email: String, val locale: String, val client: String)
    @Serializable
    private data class MagicLinkResponse(val ok: Boolean? = null, val devLink: String? = null)

    /** Sends a magic-link email. UI then shows "check your email". */
    suspend fun requestMagicLink(email: String, locale: String) {
        _lastAuthError.value = null
        ApiClient.post<MagicLinkBody, MagicLinkResponse>(
            "/api/auth/magic-link",
            MagicLinkBody(email = email, locale = locale, client = "android"),
        )
    }

    @Serializable
    private data class SessionResponse(
        val accessToken: String,
        val refreshToken: String,
        val expiresAt: Long? = null,
        val email: String? = null,
    )

    @Serializable
    private data class DemoBody(val email: String, val password: String)

    /** Demo credentials sign-in (store-review bypass). */
    suspend fun demoLogin(email: String, password: String) {
        _lastAuthError.value = null
        try {
            val resp = ApiClient.post<DemoBody, SessionResponse>(
                "/api/auth/demo-login",
                DemoBody(email, password),
            )
            persistAndLoad(resp)
        } catch (e: Exception) {
            _lastAuthError.value = Localizer.get(R.string.auth_err_invalid_credentials)
            throw e
        }
    }

    @Serializable
    private data class OtpBody(val email: String, val otp: String)

    /** Verifies the numeric OTP code from the sign-in email. */
    suspend fun verifyOTP(email: String, otp: String) {
        _lastAuthError.value = null
        try {
            val resp = ApiClient.post<OtpBody, SessionResponse>(
                "/api/auth/ios-otp-verify",
                OtpBody(email, otp),
            )
            persistAndLoad(resp)
        } catch (e: Exception) {
            _lastAuthError.value = Localizer.get(R.string.auth_err_bad_code)
            throw e
        }
    }

    @Serializable
    private data class ExchangeBody(val tokenHash: String, val type: String)

    /** Called by MainActivity when a `vectorialdata://auth?...` URL is opened. */
    fun handleDeepLink(scheme: String?, host: String?, tokenHash: String?, type: String?) {
        if (scheme != AppConfig.URL_SCHEME || host != "auth") return
        val hash = tokenHash ?: return
        scope.launch { exchange(hash, type ?: "magiclink") }
    }

    private suspend fun exchange(tokenHash: String, type: String) {
        try {
            val resp = ApiClient.post<ExchangeBody, SessionResponse>(
                "/api/auth/ios-exchange",
                ExchangeBody(tokenHash, type),
            )
            persistAndLoad(resp)
        } catch (e: Exception) {
            _lastAuthError.value = Localizer.get(R.string.auth_err_link_expired)
            clearSession()
        }
    }

    // ---- Token refresh --------------------------------------------------------

    @Serializable
    private data class RefreshBody(val refreshToken: String)

    /** Trades the stored refresh_token for a fresh access_token. Returns true on success. */
    suspend fun refreshAccessToken(): Boolean {
        val refreshToken = SecureStore.get(REFRESH_TOKEN_KEY) ?: return false
        return try {
            val resp = ApiClient.post<RefreshBody, SessionResponse>(
                "/api/auth/ios-refresh",
                RefreshBody(refreshToken),
            )
            SecureStore.set(resp.accessToken, ACCESS_TOKEN_KEY)
            SecureStore.set(resp.refreshToken, REFRESH_TOKEN_KEY)
            ApiClient.setBearer(resp.accessToken)
            true
        } catch (e: Exception) {
            false
        }
    }

    suspend fun refreshCurrentUser() = refreshProfile()

    // ---- Sign-out / delete ----------------------------------------------------

    suspend fun signOut() {
        // Unregister the push token while we still hold a valid bearer, so
        // this device stops receiving the signed-out user's notifications.
        NotificationsManager.unregister()
        clearSession()
    }

    /** Permanently deletes the account on the server, then wipes local session. */
    suspend fun deleteAccount() {
        // Same as sign-out: drop the token before the account disappears.
        NotificationsManager.unregister()
        ApiClient.post<Unit, EmptyResponse>("/api/account/delete", Unit)
        clearSession()
    }

    // ---- Internals ------------------------------------------------------------

    private fun persistAndLoadSync(resp: SessionResponse) {
        SecureStore.set(resp.accessToken, ACCESS_TOKEN_KEY)
        SecureStore.set(resp.refreshToken, REFRESH_TOKEN_KEY)
        ApiClient.setBearer(resp.accessToken)
    }

    private suspend fun persistAndLoad(resp: SessionResponse) {
        persistAndLoadSync(resp)
        _lastAuthError.value = null
        refreshProfile()
    }

    private fun clearSession() {
        SecureStore.delete(ACCESS_TOKEN_KEY)
        SecureStore.delete(REFRESH_TOKEN_KEY)
        ApiClient.clearBearer()
        _currentUser.value = null
        _state.value = AuthState.SIGNED_OUT
        // Wipe cached stores so the next user never sees stale data.
        PickStatusStore.reset()
        DividendStore.reset()
        NewsStore.reset()
        resetHomeCaches()
        resetPortfolioCache()
        // A tapped push from the previous session must not route the next user.
        NotificationsManager.clearPending()
    }

    private suspend fun refreshProfile() {
        try {
            val me = ApiClient.get<UserProfile>("/api/me")
            _currentUser.value = me
            _state.value = AuthState.SIGNED_IN
            // Re-attach this device's push token to the now-signed-in user.
            NotificationsManager.refreshRegistrationIfEnabled()
        } catch (e: ApiError.Unauthorized) {
            // The token is truly dead (ApiClient already tried a refresh-and-
            // replay before surfacing this) — only now is a sign-out correct.
            clearSession()
        } catch (e: Exception) {
            // Transient failure (network timeout, 5xx). Don't bounce the user to
            // the login screen — we still hold a valid-looking token. Stay signed
            // in; individual screens surface their own load errors and retry.
            _state.value = AuthState.SIGNED_IN
        }
    }
}
