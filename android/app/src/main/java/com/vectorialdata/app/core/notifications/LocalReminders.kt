package com.vectorialdata.app.core.notifications

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.ExistingWorkPolicy
import androidx.work.WorkManager
import androidx.work.Worker
import androidx.work.WorkerParameters
import androidx.work.workDataOf
import com.vectorialdata.app.R
import java.util.concurrent.TimeUnit

/**
 * Local scheduled notifications — Android counterpart of the iOS
 * `TrialEndReminder` / `RaiseReminder` (UNTimeIntervalNotificationTrigger).
 * WorkManager one-shots survive process death and reboots; the worker posts
 * on the existing `vd_default` channel with the same data extras a push
 * carries, so MainActivity's tap routing handles both identically.
 */
object LocalReminders {
    private const val TRIAL_END_WORK = "vd.trialEndReminder"
    private const val RAISE_WORK = "vd.raiseAmountReminder"

    private lateinit var appContext: Context

    /** Called once from [com.vectorialdata.app.VectorialDataApp]. */
    fun init(context: Context) {
        appContext = context.applicationContext
    }

    /** Context-free variant for callers without one (AuthManager). */
    fun cancelTrialEndReminder() {
        if (::appContext.isInitialized) cancelTrialEndReminder(appContext)
    }

    private const val KEY_KIND = "kind"
    private const val KEY_TITLE = "title"
    private const val KEY_BODY = "body"
    private const val KEY_NOTIF_ID = "notif_id"

    /**
     * Day-12 heads-up so "Día 12: te recordamos" is a real promise. Scheduled
     * only after a successful Play-billed trial start; the server-side trial
     * (free-register) sends its own reminder, so no local one is needed there.
     */
    fun scheduleTrialEndReminder(context: Context) {
        val req = OneTimeWorkRequestBuilder<ReminderWorker>()
            .setInitialDelay(12, TimeUnit.DAYS)
            .setInputData(
                workDataOf(
                    KEY_KIND to "trial_end",
                    KEY_TITLE to context.getString(R.string.trial_reminder_title),
                    KEY_BODY to context.getString(R.string.trial_reminder_body),
                    KEY_NOTIF_ID to 903001,
                ),
            )
            .build()
        WorkManager.getInstance(context)
            .enqueueUniqueWork(TRIAL_END_WORK, ExistingWorkPolicy.REPLACE, req)
    }

    /**
     * Paid period started → the day-12 "your trial is ending" reminder is
     * wrong/noise; drop it if still pending.
     */
    fun cancelTrialEndReminder(context: Context) {
        WorkManager.getInstance(context).cancelUniqueWork(TRIAL_END_WORK)
    }

    /**
     * The next rung of the per-buy ladder + how long to wait, based on the
     * current amount. Above ~$50 we stop nudging. Mirror of iOS `nextRung`.
     */
    fun nextRung(amount: Double): Pair<Double, Long>? = when {
        amount < 5 -> 5.0 to 120L // ~4 meses en el escalón inicial
        amount < 50 -> 50.0 to 300L // ~10 meses en el escalón medio
        else -> null // ya está alto — no molestar
    }

    /** One-shot "raise your amount" nudge; rescheduled on every save. */
    fun scheduleRaiseReminder(context: Context, currentAmount: Double) {
        cancelRaiseReminder(context)
        val (next, days) = nextRung(currentAmount) ?: return
        val req = OneTimeWorkRequestBuilder<ReminderWorker>()
            .setInitialDelay(days, TimeUnit.DAYS)
            .setInputData(
                workDataOf(
                    KEY_KIND to "raise_amount",
                    KEY_TITLE to context.getString(R.string.raise_reminder_title),
                    KEY_BODY to context.getString(
                        R.string.raise_reminder_body,
                        money(currentAmount),
                        money(next),
                    ),
                    KEY_NOTIF_ID to 903002,
                ),
            )
            .build()
        WorkManager.getInstance(context)
            .enqueueUniqueWork(RAISE_WORK, ExistingWorkPolicy.REPLACE, req)
    }

    fun cancelRaiseReminder(context: Context) {
        WorkManager.getInstance(context).cancelUniqueWork(RAISE_WORK)
    }

    private fun money(v: Double): String =
        if (v % 1.0 == 0.0) "$${v.toInt()}" else "$%.2f".format(v)

    /** Posts the reminder when the delay elapses. */
    class ReminderWorker(
        context: Context,
        params: WorkerParameters,
    ) : Worker(context, params) {
        override fun doWork(): Result {
            val ctx = applicationContext
            if (ContextCompat.checkSelfPermission(ctx, Manifest.permission.POST_NOTIFICATIONS)
                != PackageManager.PERMISSION_GRANTED
            ) {
                return Result.success() // permission revoked — silently skip
            }
            val kind = inputData.getString(KEY_KIND) ?: return Result.success()
            val notification = NotificationCompat.Builder(ctx, NotificationsManager.CHANNEL_ID)
                .setSmallIcon(R.drawable.ic_stat_notify)
                .setContentTitle(inputData.getString(KEY_TITLE))
                .setContentText(inputData.getString(KEY_BODY))
                .setStyle(NotificationCompat.BigTextStyle().bigText(inputData.getString(KEY_BODY)))
                .setAutoCancel(true)
                .setContentIntent(
                    NotificationsManager.tapIntent(ctx, mapOf("kind" to kind)),
                )
                .build()
            NotificationManagerCompat.from(ctx)
                .notify(inputData.getInt(KEY_NOTIF_ID, kind.hashCode()), notification)
            return Result.success()
        }
    }
}
