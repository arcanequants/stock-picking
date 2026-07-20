package com.vectorialdata.app.core.notifications

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.os.Build
import androidx.core.app.NotificationManagerCompat
import com.vectorialdata.app.BuildConfig
import com.vectorialdata.app.R
import com.vectorialdata.app.core.auth.AuthManager
import com.vectorialdata.app.core.auth.SecureStore
import com.vectorialdata.app.core.net.ApiClient
import com.vectorialdata.app.core.net.EmptyResponse
import com.google.firebase.messaging.FirebaseMessaging
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.serialization.Serializable
import kotlin.coroutines.resume

/**
 * Owns the push notification lifecycle — direct port of the iOS
 * `NotificationsManager`.
 *
 * Flow:
 *   1. Account screen requests POST_NOTIFICATIONS (Android 13+); once granted,
 *      [refreshRegistrationIfEnabled] fetches the FCM token and POSTs it to
 *      `/api/notifications/register-device` (platform "android").
 *   2. [PushMessagingService] forwards token rotations via [didReceiveToken].
 *   3. On sign-out `AuthManager` calls [unregister], which DELETEs the token.
 *
 * Tapping a notification lands in `MainActivity`, which parses the payload
 * into the `pending*` flows below; the tab scaffold and screens consume them
 * (same contract as the iOS `@Published pending*` properties).
 */
object NotificationsManager {
    /** Channel id referenced by the backend sender (`push.ts`). */
    const val CHANNEL_ID = "vd_default"

    /**
     * The FCM token persists so [unregister] can DELETE it on sign-out even
     * after a cold start. Lives in the already-initialized encrypted prefs
     * (iOS keeps it in UserDefaults — it's a device token, not a secret, but
     * SecureStore is the store we already have).
     */
    private const val TOKEN_KEY = "push.fcmToken"

    private lateinit var appContext: Context
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)

    private val _enabled = MutableStateFlow(false)
    /** Whether notifications are currently allowed for the app. */
    val enabled: StateFlow<Boolean> = _enabled.asStateFlow()

    /** Set when the user taps a "new pick"/"dividend" push; Picks tab consumes it. */
    val pendingPickNumber = MutableStateFlow<Int?>(null)

    /** Set when the user taps the Friday-digest push; Picks tab consumes it. */
    val pendingWeeklyDigest = MutableStateFlow(false)

    /** Set when the user taps a curated-news push; Home consumes it. */
    val pendingNewsId = MutableStateFlow<String?>(null)

    /** Called once from [com.vectorialdata.app.VectorialDataApp]. */
    fun init(context: Context) {
        appContext = context.applicationContext
        createChannel()
        refreshStatus()
    }

    fun refreshStatus() {
        _enabled.value = NotificationManagerCompat.from(appContext).areNotificationsEnabled()
    }

    /** Called by [PushMessagingService] when FCM mints or rotates the token. */
    fun didReceiveToken(token: String) {
        SecureStore.set(token, TOKEN_KEY)
        scope.launch { register(token) }
    }

    /**
     * Re-attach this device's token to the signed-in user. Called after a
     * successful profile load so a token minted while signed out (or under
     * the previous user) gets bound to the current account.
     */
    suspend fun refreshRegistrationIfEnabled() {
        refreshStatus()
        if (!_enabled.value) return
        val token = currentToken() ?: SecureStore.get(TOKEN_KEY) ?: return
        SecureStore.set(token, TOKEN_KEY)
        register(token)
    }

    /**
     * Call on sign-out (while the bearer is still valid) to stop receiving
     * the signed-out user's notifications on this device. Never throws — a
     * failed unregister must not block the sign-out.
     */
    suspend fun unregister() {
        val token = SecureStore.get(TOKEN_KEY) ?: return
        try {
            ApiClient.delete<UnregisterBody, EmptyResponse>(
                "/api/notifications/register-device",
                UnregisterBody(token),
            )
        } catch (_: Exception) {
            // Best effort; dead tokens also get pruned server-side on send.
        }
        SecureStore.delete(TOKEN_KEY)
    }

    /**
     * Clears pending deep-link payloads. Called on sign-out so a tapped push
     * from the previous session doesn't route the next user.
     */
    fun clearPending() {
        pendingPickNumber.value = null
        pendingWeeklyDigest.value = false
        pendingNewsId.value = null
    }

    /**
     * Routes a tapped notification's data payload (all values arrive as
     * strings from FCM) into the pending flows.
     */
    fun handlePushTap(kind: String?, pickNumber: Int?, newsId: String?) {
        when (kind) {
            // dividend_paid reuses the pick deep link, same as iOS: the pick
            // detail already shows the DIVIDENDOS section.
            "new_pick", "dividend_paid" -> pickNumber?.let { pendingPickNumber.value = it }
            "weekly_digest" -> pendingWeeklyDigest.value = true
            "news" -> newsId?.let { pendingNewsId.value = it }
        }
    }

    // ---- Internals ------------------------------------------------------------

    @Serializable
    private data class RegisterBody(val token: String, val platform: String, val appVersion: String?)

    @Serializable
    private data class UnregisterBody(val token: String)

    private suspend fun register(token: String) {
        // Only bind the token to a user once we actually have a session;
        // otherwise the unauthenticated POST 401s and the token is dropped.
        if (AuthManager.state.value != AuthManager.AuthState.SIGNED_IN) return
        try {
            ApiClient.post<RegisterBody, EmptyResponse>(
                "/api/notifications/register-device",
                RegisterBody(token, platform = "android", appVersion = BuildConfig.VERSION_NAME),
            )
        } catch (_: Exception) {
            // Non-fatal: the next profile load retries via refreshRegistrationIfEnabled.
        }
    }

    private suspend fun currentToken(): String? = suspendCancellableCoroutine { cont ->
        FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
            cont.resume(if (task.isSuccessful) task.result else null)
        }
    }

    private fun createChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val channel = NotificationChannel(
            CHANNEL_ID,
            appContext.getString(R.string.notif_channel_name),
            NotificationManager.IMPORTANCE_HIGH,
        )
        val manager = appContext.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        manager.createNotificationChannel(channel)
    }
}
