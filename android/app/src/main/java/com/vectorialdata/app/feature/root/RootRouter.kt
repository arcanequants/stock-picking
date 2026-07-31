package com.vectorialdata.app.feature.root

import androidx.activity.compose.BackHandler
import androidx.compose.animation.Crossfade
import androidx.compose.animation.core.tween
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.vectorialdata.app.core.auth.AuthManager
import com.vectorialdata.app.feature.auth.AuthScreen
import com.vectorialdata.app.feature.onboarding.CreateAccountScreen
import com.vectorialdata.app.feature.onboarding.OnboardingScreen

/**
 * Top-level router — mirror of iOS `RootView`:
 *   • signed-out → onboarding (new users) with a sign-in escape hatch
 *   • signed-in  → the main tab experience
 */
@Composable
fun RootRouter() {
    val state by AuthManager.state.collectAsStateWithLifecycle()

    // 0 = onboarding pager · 1 = sign-in (AuthScreen) · 2 = create account.
    var gate by rememberSaveable { mutableStateOf(0) }

    Crossfade(targetState = state, animationSpec = tween(200), label = "root") { s ->
        when (s) {
            AuthManager.AuthState.UNKNOWN -> Splash()
            AuthManager.AuthState.SIGNED_OUT -> when (gate) {
                1 -> {
                    BackHandler { gate = 0 }
                    AuthScreen()
                }
                2 -> CreateAccountScreen(onBack = { gate = 0 })
                else -> OnboardingScreen(
                    onSignIn = { gate = 1 },
                    onCreateAccount = { gate = 2 },
                )
            }
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
