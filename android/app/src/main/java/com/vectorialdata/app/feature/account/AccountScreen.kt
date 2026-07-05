package com.vectorialdata.app.feature.account

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
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
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.vectorialdata.app.core.auth.AuthManager
import com.vectorialdata.app.core.util.Formatters
import kotlinx.coroutines.launch

/** Account tab. M1: identity + subscription status + sign out. */
@Composable
fun AccountScreen(modifier: Modifier = Modifier) {
    val scope = rememberCoroutineScope()
    val user by AuthManager.currentUser.collectAsStateWithLifecycle()

    var showDeleteConfirm by remember { mutableStateOf(false) }
    var isDeleting by remember { mutableStateOf(false) }
    var deleteError by remember { mutableStateOf<String?>(null) }

    Column(
        modifier = modifier.fillMaxSize().padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        Text("Account", fontSize = 28.sp, fontWeight = FontWeight.SemiBold,
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
                    user?.currentPeriodEnd?.let { "Trial gratis · termina el ${Formatters.longSpanishDate(it)}" }
                        ?: "Trial gratis"
                user?.isSubscribed == true -> "Premium"
                else -> "Free"
            }
            Text(subLabel, color = MaterialTheme.colorScheme.onSurfaceVariant)
        }

        Spacer(Modifier.height(8.dp))

        OutlinedButton(
            onClick = { scope.launch { AuthManager.signOut() } },
            enabled = !isDeleting,
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp),
        ) {
            Text("Sign out")
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
                Text("Delete account")
            }
        }
        Text(
            "Permanently deletes your account and all your data. This cannot be undone. " +
                "If you have an active subscription, cancel it separately.",
            fontSize = 12.sp,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
    }

    if (showDeleteConfirm) {
        AlertDialog(
            onDismissRequest = { showDeleteConfirm = false },
            title = { Text("Delete your account?") },
            text = {
                Text(
                    "This permanently deletes your account, your portfolio and all " +
                        "your data. It cannot be undone."
                )
            },
            confirmButton = {
                TextButton(
                    onClick = {
                        showDeleteConfirm = false
                        isDeleting = true
                        scope.launch {
                            try {
                                AuthManager.deleteAccount()
                            } catch (e: Exception) {
                                deleteError = "We couldn't delete your account. Please try again."
                            } finally {
                                isDeleting = false
                            }
                        }
                    },
                ) {
                    Text("Delete account", color = MaterialTheme.colorScheme.error)
                }
            },
            dismissButton = {
                TextButton(onClick = { showDeleteConfirm = false }) { Text("Cancel") }
            },
        )
    }

    deleteError?.let { message ->
        AlertDialog(
            onDismissRequest = { deleteError = null },
            title = { Text("Couldn't delete") },
            text = { Text(message) },
            confirmButton = {
                TextButton(onClick = { deleteError = null }) { Text("OK") }
            },
        )
    }
}
