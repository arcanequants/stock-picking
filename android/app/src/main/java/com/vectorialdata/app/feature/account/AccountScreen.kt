package com.vectorialdata.app.feature.account

import android.Manifest
import android.content.Intent
import android.os.Build
import android.provider.Settings
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.LifecycleResumeEffect
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.vectorialdata.app.R
import com.vectorialdata.app.core.auth.AuthManager
import com.vectorialdata.app.core.notifications.NotificationsManager
import com.vectorialdata.app.core.util.Formatters
import com.vectorialdata.app.ui.theme.BrandEmerald
import kotlinx.coroutines.launch

/** Account tab. M1: identity + subscription status + sign out. */
@Composable
fun AccountScreen(modifier: Modifier = Modifier) {
    val scope = rememberCoroutineScope()
    val user by AuthManager.currentUser.collectAsStateWithLifecycle()

    var showDeleteConfirm by remember { mutableStateOf(false) }
    var isDeleting by remember { mutableStateOf(false) }
    var deleteError by remember { mutableStateOf<String?>(null) }

    val deleteErrorText = stringResource(R.string.account_delete_error_body)

    Column(
        modifier = modifier.fillMaxSize().padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        Text(stringResource(R.string.account_title), fontSize = 28.sp, fontWeight = FontWeight.SemiBold,
            color = MaterialTheme.colorScheme.onBackground)

        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 8.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp),
        ) {
            Text(user?.email ?: "—", color = MaterialTheme.colorScheme.onBackground, fontSize = 16.sp)
            val subLabel = when {
                user?.subscriptionStatus == "trialing" ->
                    user?.currentPeriodEnd?.let {
                        stringResource(R.string.account_status_trial_until, Formatters.longSpanishDate(it))
                    } ?: stringResource(R.string.account_status_trial)
                user?.isSubscribed == true -> stringResource(R.string.account_premium)
                else -> stringResource(R.string.account_free)
            }
            Text(subLabel, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }

        NotificationsSection()

        Spacer(Modifier.height(8.dp))

        OutlinedButton(
            onClick = { scope.launch { AuthManager.signOut() } },
            enabled = !isDeleting,
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp),
        ) {
            Text(stringResource(R.string.account_sign_out))
        }

        Button(
            onClick = { showDeleteConfirm = true },
            enabled = !isDeleting,
            colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error),
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp),
        ) {
            if (isDeleting) {
                CircularProgressIndicator(
                    color = MaterialTheme.colorScheme.onError,
                    strokeWidth = 2.dp,
                    modifier = Modifier.height(20.dp),
                )
            } else {
                Text(stringResource(R.string.account_delete))
            }
        }
        Text(
            stringResource(R.string.account_delete_footer),
            fontSize = 12.sp,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
    }

    if (showDeleteConfirm) {
        AlertDialog(
            onDismissRequest = { showDeleteConfirm = false },
            title = { Text(stringResource(R.string.account_delete_confirm_title)) },
            text = { Text(stringResource(R.string.account_delete_confirm_body)) },
            confirmButton = {
                TextButton(
                    onClick = {
                        showDeleteConfirm = false
                        isDeleting = true
                        scope.launch {
                            try {
                                AuthManager.deleteAccount()
                            } catch (e: Exception) {
                                deleteError = deleteErrorText
                            } finally {
                                isDeleting = false
                            }
                        }
                    },
                ) {
                    Text(stringResource(R.string.account_delete), color = MaterialTheme.colorScheme.error)
                }
            },
            dismissButton = {
                TextButton(onClick = { showDeleteConfirm = false }) { Text(stringResource(R.string.cancel)) }
            },
        )
    }

    deleteError?.let { message ->
        AlertDialog(
            onDismissRequest = { deleteError = null },
            title = { Text(stringResource(R.string.account_delete_error_title)) },
            text = { Text(message) },
            confirmButton = {
                TextButton(onClick = { deleteError = null }) { Text(stringResource(R.string.ok)) }
            },
        )
    }
}

/**
 * Push-permission row — mirror of iOS `NotificationsRow`. On Android 13+ the
 * enable button triggers the POST_NOTIFICATIONS system dialog; if the user
 * already denied it (or on older Androids, where notifications can only be
 * flipped in Settings) it deep-links to the app's notification settings.
 * Re-checks status on every resume so returning from Settings updates the row
 * and registers the token.
 */
@Composable
private fun NotificationsSection() {
    val scope = rememberCoroutineScope()
    val context = LocalContext.current
    val enabled by NotificationsManager.enabled.collectAsStateWithLifecycle()

    LifecycleResumeEffect(Unit) {
        NotificationsManager.refreshStatus()
        scope.launch { NotificationsManager.refreshRegistrationIfEnabled() }
        onPauseOrDispose { }
    }

    fun openNotificationSettings() {
        context.startActivity(
            Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS)
                .putExtra(Settings.EXTRA_APP_PACKAGE, context.packageName)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK),
        )
    }

    val permissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission(),
    ) { granted ->
        NotificationsManager.refreshStatus()
        if (granted) {
            scope.launch { NotificationsManager.refreshRegistrationIfEnabled() }
        } else {
            // Permanently denied — the system dialog won't show again.
            openNotificationSettings()
        }
    }

    Column(Modifier.fillMaxWidth().padding(top = 8.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
        Text(
            stringResource(R.string.account_notifications_header),
            fontSize = 12.sp,
            fontWeight = FontWeight.SemiBold,
            letterSpacing = 1.1.sp,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        Row(verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                Text(
                    stringResource(
                        if (enabled) R.string.account_notifications_enabled
                        else R.string.account_notifications_disabled
                    ),
                    fontSize = 15.sp,
                    color = MaterialTheme.colorScheme.onBackground,
                )
                Text(
                    stringResource(R.string.account_notifications_body),
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            if (!enabled) {
                TextButton(onClick = {
                    if (Build.VERSION.SDK_INT >= 33) {
                        permissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
                    } else {
                        openNotificationSettings()
                    }
                }) {
                    Text(
                        stringResource(R.string.account_notifications_enable),
                        color = BrandEmerald,
                        fontWeight = FontWeight.SemiBold,
                    )
                }
            }
        }
    }
}
