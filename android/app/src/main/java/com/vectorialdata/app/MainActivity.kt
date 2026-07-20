package com.vectorialdata.app

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.lifecycle.lifecycleScope
import com.vectorialdata.app.core.auth.AuthManager
import com.vectorialdata.app.core.notifications.NotificationsManager
import com.vectorialdata.app.feature.root.RootRouter
import com.vectorialdata.app.ui.theme.VectorialDataTheme
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            VectorialDataTheme {
                RootRouter()
            }
        }
        // Restore any persisted session, then handle a cold-start deep link
        // or notification tap.
        lifecycleScope.launch { AuthManager.restoreSession() }
        handleDeepLink(intent)
        handlePushTap(intent)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        handleDeepLink(intent)
        handlePushTap(intent)
    }

    /** Routes `vectorialdata://auth?token_hash=...&type=...` into the AuthManager. */
    private fun handleDeepLink(intent: Intent?) {
        val uri: Uri = intent?.data ?: return
        AuthManager.handleDeepLink(
            scheme = uri.scheme,
            host = uri.host,
            tokenHash = uri.getQueryParameter("token_hash"),
            type = uri.getQueryParameter("type"),
        )
    }

    /**
     * Routes a tapped push notification. Background FCM taps launch this
     * activity with the message's data payload as string extras (foreground
     * notifications built by PushMessagingService attach the same extras).
     * The `kind` extra is consumed so a config change doesn't re-route.
     */
    private fun handlePushTap(intent: Intent?) {
        val kind = intent?.getStringExtra("kind") ?: return
        intent.removeExtra("kind")
        NotificationsManager.handlePushTap(
            kind = kind,
            pickNumber = intent.getStringExtra("pick_number")?.toIntOrNull(),
            newsId = intent.getStringExtra("news_id"),
        )
    }
}
