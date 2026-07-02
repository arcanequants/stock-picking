package com.vectorialdata.app.feature.root

import androidx.compose.animation.Crossfade
import androidx.compose.animation.core.tween
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.vectorialdata.app.core.auth.AuthManager
import com.vectorialdata.app.feature.auth.AuthScreen

/**
 * Top-level router — switches between the auth gate, a loading splash, and the
 * main tab experience based on [AuthManager.state]. Mirror of iOS `RootView`.
 */
@Composable
fun RootRouter() {
    val state by AuthManager.state.collectAsStateWithLifecycle()

    Crossfade(targetState = state, animationSpec = tween(200), label = "root") { s ->
        when (s) {
            AuthManager.AuthState.UNKNOWN -> Splash()
            AuthManager.AuthState.SIGNED_OUT -> AuthScreen()
            AuthManager.AuthState.SIGNED_IN -> MainTabScaffold()
        }
    }
}

@Composable
private fun Splash() {
    Box(
        modifier = Modifier
            .fillMaxSize(),
        contentAlignment = Alignment.Center,
    ) {
        CircularProgressIndicator(color = MaterialTheme.colorScheme.onBackground)
    }
}
