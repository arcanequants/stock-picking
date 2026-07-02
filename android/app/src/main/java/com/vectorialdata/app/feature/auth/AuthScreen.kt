package com.vectorialdata.app.feature.auth

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.vectorialdata.app.core.auth.AuthManager
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.util.Locale

/**
 * Magic-link entry screen. Email -> POST /api/auth/magic-link -> "check your
 * email". A `vectorialdata://auth` deep link (or the OTP code) completes
 * sign-in. Faithful port of iOS `AuthView`.
 */
@Composable
fun AuthScreen() {
    val scope = rememberCoroutineScope()
    val authError by AuthManager.lastAuthError.collectAsStateWithLifecycle()

    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var otp by remember { mutableStateOf("") }
    var sent by remember { mutableStateOf(false) }
    var isSending by remember { mutableStateOf(false) }
    var isVerifying by remember { mutableStateOf(false) }
    var localError by remember { mutableStateOf<String?>(null) }
    var cooldown by remember { mutableIntStateOf(0) }

    LaunchedEffect(cooldown) {
        if (cooldown > 0) {
            delay(1000)
            cooldown -= 1
        }
    }

    fun startCooldown() { cooldown = 30 }

    fun send() {
        val trimmed = email.trim().lowercase(Locale.getDefault())
        if (!trimmed.contains("@") || !trimmed.contains(".")) {
            localError = "Enter a valid email"; return
        }
        localError = null
        isSending = true
        scope.launch {
            try {
                if (password.isNotEmpty()) {
                    AuthManager.demoLogin(trimmed, password)
                } else {
                    AuthManager.requestMagicLink(trimmed, Locale.getDefault().toLanguageTag())
                    sent = true
                    startCooldown()
                }
            } catch (e: Exception) {
                localError = AuthManager.lastAuthError.value ?: e.message ?: "Something went wrong"
            } finally {
                isSending = false
            }
        }
    }

    fun resend() {
        if (cooldown > 0 || isSending) return
        isSending = true
        scope.launch {
            try {
                AuthManager.requestMagicLink(email.trim(), Locale.getDefault().toLanguageTag())
                startCooldown()
            } catch (e: Exception) {
                localError = e.message
            } finally {
                isSending = false
            }
        }
    }

    fun verify() {
        val code = otp.trim()
        if (code.length < 6) { localError = "Enter the code from your email."; return }
        localError = null
        isVerifying = true
        scope.launch {
            try {
                AuthManager.verifyOTP(email.trim(), code)
            } catch (_: Exception) {
                // AuthManager sets lastAuthError
            } finally {
                isVerifying = false
            }
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .padding(24.dp),
        contentAlignment = Alignment.Center,
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(20.dp),
            modifier = Modifier.fillMaxWidth(),
        ) {
            Spacer(Modifier.weight(1f))

            Text(
                "Vectorial Data",
                fontSize = 34.sp,
                color = MaterialTheme.colorScheme.onBackground,
            )
            Text(
                "One stock pick a day. Every day.",
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center,
            )

            if (sent) {
                ConfirmationCard(
                    email = email,
                    otp = otp,
                    onOtpChange = { otp = it.filter(Char::isDigit).take(8) },
                    isResending = isSending,
                    isVerifying = isVerifying,
                    cooldown = cooldown,
                    error = localError ?: authError,
                    onVerify = ::verify,
                    onResend = ::resend,
                    onUseDifferentEmail = {
                        sent = false; otp = ""; cooldown = 0; localError = null
                        AuthManager.clearAuthError()
                    },
                )
            } else {
                SignInCard(
                    email = email, onEmailChange = { email = it },
                    password = password, onPasswordChange = { password = it },
                    isSending = isSending,
                    error = localError ?: authError,
                    onSend = ::send,
                )
            }

            Spacer(Modifier.weight(1f))

            Text(
                "By continuing you agree to the Terms and Privacy Policy.",
                fontSize = 12.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.6f),
                textAlign = TextAlign.Center,
            )
        }
    }
}

@Composable
private fun SignInCard(
    email: String, onEmailChange: (String) -> Unit,
    password: String, onPasswordChange: (String) -> Unit,
    isSending: Boolean, error: String?, onSend: () -> Unit,
) {
    Column(verticalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.fillMaxWidth()) {
        OutlinedTextField(
            value = email,
            onValueChange = onEmailChange,
            placeholder = { Text("you@example.com") },
            singleLine = true,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
            colors = fieldColors(),
            modifier = Modifier.fillMaxWidth(),
        )
        OutlinedTextField(
            value = password,
            onValueChange = onPasswordChange,
            placeholder = { Text("Password (optional)") },
            singleLine = true,
            visualTransformation = PasswordVisualTransformation(),
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
            colors = fieldColors(),
            modifier = Modifier.fillMaxWidth(),
        )
        Button(
            onClick = onSend,
            enabled = !isSending && email.isNotEmpty(),
            colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
            shape = RoundedCornerShape(12.dp),
            modifier = Modifier.fillMaxWidth().height(50.dp),
        ) {
            if (isSending) {
                CircularProgressIndicator(
                    color = MaterialTheme.colorScheme.onPrimary,
                    strokeWidth = 2.dp,
                    modifier = Modifier.height(20.dp),
                )
            } else {
                Text(if (password.isEmpty()) "Send magic link" else "Sign in")
            }
        }
        error?.let {
            Text(it, color = MaterialTheme.colorScheme.error, fontSize = 13.sp)
        }
    }
}

@Composable
private fun ConfirmationCard(
    email: String,
    otp: String, onOtpChange: (String) -> Unit,
    isResending: Boolean, isVerifying: Boolean, cooldown: Int,
    error: String?,
    onVerify: () -> Unit, onResend: () -> Unit, onUseDifferentEmail: () -> Unit,
) {
    Column(
        verticalArrangement = Arrangement.spacedBy(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier
            .fillMaxWidth()
            .background(MaterialTheme.colorScheme.surface, RoundedCornerShape(16.dp))
            .border(1.dp, MaterialTheme.colorScheme.onSurface.copy(alpha = 0.1f), RoundedCornerShape(16.dp))
            .padding(24.dp),
    ) {
        Text("Check your email", fontSize = 22.sp, color = MaterialTheme.colorScheme.onSurface)
        Text(
            "We sent a sign-in link to $email. Tap it on this device to continue.",
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center,
        )
        Text(
            "Or enter the code from your email",
            fontSize = 12.sp,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        OutlinedTextField(
            value = otp,
            onValueChange = onOtpChange,
            placeholder = { Text("00000000") },
            singleLine = true,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.NumberPassword),
            colors = fieldColors(),
            modifier = Modifier.fillMaxWidth(),
        )
        Button(
            onClick = onVerify,
            enabled = otp.length >= 6 && !isVerifying,
            colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
            shape = RoundedCornerShape(10.dp),
            modifier = Modifier.fillMaxWidth().height(48.dp),
        ) {
            if (isVerifying) {
                CircularProgressIndicator(
                    color = MaterialTheme.colorScheme.onPrimary,
                    strokeWidth = 2.dp,
                    modifier = Modifier.height(20.dp),
                )
            } else {
                Text("Verify")
            }
        }
        error?.let { Text(it, color = MaterialTheme.colorScheme.error, fontSize = 13.sp, textAlign = TextAlign.Center) }

        OutlinedButton(
            onClick = onResend,
            enabled = cooldown == 0 && !isResending,
            modifier = Modifier.fillMaxWidth(),
        ) {
            Text(
                when {
                    isResending -> "Resending…"
                    cooldown > 0 -> "Resend in ${cooldown}s"
                    else -> "Resend email"
                }
            )
        }
        TextButton(onClick = onUseDifferentEmail, modifier = Modifier.fillMaxWidth()) {
            Text("Use a different email", color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}

@Composable
private fun fieldColors() = OutlinedTextFieldDefaults.colors(
    focusedTextColor = MaterialTheme.colorScheme.onSurface,
    unfocusedTextColor = MaterialTheme.colorScheme.onSurface,
    focusedContainerColor = MaterialTheme.colorScheme.surface,
    unfocusedContainerColor = MaterialTheme.colorScheme.surface,
    focusedBorderColor = MaterialTheme.colorScheme.primary,
    unfocusedBorderColor = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.12f),
)
