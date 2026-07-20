package com.vectorialdata.app.core.notifications

import android.app.PendingIntent
import android.content.Intent
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.vectorialdata.app.MainActivity
import com.vectorialdata.app.R
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

/**
 * FCM entry points. Token rotations flow into [NotificationsManager]; messages
 * received while the app is foregrounded are rendered manually (FCM only
 * auto-displays notification messages when the app is backgrounded — iOS shows
 * banners in the foreground, so we mirror that).
 */
class PushMessagingService : FirebaseMessagingService() {

    override fun onNewToken(token: String) {
        NotificationsManager.didReceiveToken(token)
    }

    override fun onMessageReceived(message: RemoteMessage) {
        val title = message.notification?.title ?: message.data["title"] ?: return
        val body = message.notification?.body ?: message.data["body"]

        if (!NotificationManagerCompat.from(this).areNotificationsEnabled()) return

        // Tapping the notification must route exactly like a system-tray tap
        // (background FCM taps deliver the data payload as launcher-intent
        // extras) — so we attach the same extras here.
        val intent = Intent(this, MainActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
            message.data.forEach { (k, v) -> putExtra(k, v) }
        }
        val contentIntent = PendingIntent.getActivity(
            this,
            (System.currentTimeMillis() and 0xFFFFFF).toInt(),
            intent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
        )

        val notification = NotificationCompat.Builder(this, NotificationsManager.CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_stat_notify)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .setAutoCancel(true)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setContentIntent(contentIntent)
            .build()

        try {
            NotificationManagerCompat.from(this).notify(
                (System.currentTimeMillis() and 0xFFFFFF).toInt(),
                notification,
            )
        } catch (_: SecurityException) {
            // Permission revoked between the check and the notify — drop it.
        }
    }
}
