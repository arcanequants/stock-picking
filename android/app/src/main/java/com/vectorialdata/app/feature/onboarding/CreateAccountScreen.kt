package com.vectorialdata.app.feature.onboarding

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.CreditCard
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.Inbox
import androidx.compose.material.icons.filled.Key
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.vectorialdata.app.R
import com.vectorialdata.app.core.auth.AuthManager
import com.vectorialdata.app.core.i18n.Localizer
import com.vectorialdata.app.ui.theme.BrandEmerald
import kotlinx.coroutines.launch
import java.util.Locale

/**
 * Guided account creation for the "Empezar 14 días gratis" CTA — mirror of
 * iOS `CreateAccountView`.
 *
 * Flow: email → `free-register` (source "android": server starts the 14-day
 * no-card trial) → `magic-link` email with the 8-digit code → code entry →
 * signed in. RootRouter flips to the tabs the moment auth state changes.
 *
 * No password field here — passwordless is the product.
 */
@Composable
fun CreateAccountScreen(onBack: () -> Unit) {
    var step by rememberSaveable { mutableStateOf(0) } // 0 = email, 1 = code
    var email by rememberSaveable { mutableStateOf("") }
    var code by rememberSaveable { mutableStateOf("") }
    var busy by rememberSaveable { mutableStateOf(false) }
    var errorMessage by rememberSaveable { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()

    fun goBack() {
        if (step == 1) step = 0 else onBack()
    }
    BackHandler { goBack() }

    fun createAccount() {
        val trimmed = email.trim().lowercase()
        if (!trimmed.contains("@") || !trimmed.contains(".")) {
            errorMessage = Localizer.get(R.string.create_err_email)
            return
        }
        errorMessage = null
        busy = true
        scope.launch {
            try {
                // 1. Create the account + start the no-card trial (idempotent).
                AuthManager.startFreeTrial(trimmed)
                // 2. Send the sign-in code to that inbox.
                AuthManager.requestMagicLink(trimmed, Locale.getDefault().toLanguageTag())
                step = 1
            } catch (e: Exception) {
                errorMessage = Localizer.get(R.string.create_err_create)
            } finally {
                busy = false
            }
        }
    }

    fun verify() {
        errorMessage = null
        busy = true
        scope.launch {
            try {
                AuthManager.verifyOTP(email.trim().lowercase(), code)
                // Auth state flips to SIGNED_IN → RootRouter swaps to the tabs.
            } catch (e: Exception) {
                errorMessage = Localizer.get(R.string.create_err_code)
            } finally {
                busy = false
            }
        }
    }

    Column(Modifier.fillMaxSize().background(MaterialTheme.colorScheme.background)) {
        IconButton(onClick = ::goBack) {
            Icon(
                Icons.AutoMirrored.Filled.ArrowBack,
                contentDescription = stringResource(R.string.back),
                tint = Color.White.copy(alpha = 0.8f),
            )
        }

        Column(
            Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 22.dp)
                .padding(top = 8.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            if (step == 0) {
                OwlBadge(size = 56.dp)
                Text(
                    stringResource(R.string.create_title),
                    fontSize = 32.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White,
                )
                Text(
                    stringResource(R.string.create_subtitle),
                    fontSize = 16.sp,
                    color = Color.White.copy(alpha = 0.7f),
                )

                Row(
                    Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(13.dp))
                        .background(MaterialTheme.colorScheme.surface)
                        .border(1.dp, Color.White.copy(alpha = 0.12f), RoundedCornerShape(13.dp))
                        .padding(15.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                ) {
                    Icon(
                        Icons.Filled.Email,
                        contentDescription = null,
                        tint = Color.White.copy(alpha = 0.5f),
                        modifier = Modifier.size(18.dp),
                    )
                    Box(Modifier.weight(1f)) {
                        if (email.isEmpty()) {
                            Text(
                                stringResource(R.string.create_email_hint),
                                fontSize = 15.sp,
                                color = Color.White.copy(alpha = 0.4f),
                            )
                        }
                        BasicTextField(
                            value = email,
                            onValueChange = { email = it },
                            textStyle = TextStyle(color = Color.White, fontSize = 15.sp),
                            cursorBrush = SolidColor(BrandEmerald),
                            singleLine = true,
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                            modifier = Modifier.fillMaxWidth(),
                        )
                    }
                }

                errorMessage?.let {
                    Text(it, fontSize = 13.sp, color = MaterialTheme.colorScheme.error)
                }

                PrimaryCta(
                    stringResource(R.string.create_cta),
                    emerald = true,
                    busy = busy,
                    onClick = ::createAccount,
                )

                Column(verticalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.padding(top = 4.dp)) {
                    Perk(Icons.Filled.CheckCircle, stringResource(R.string.create_perk_trial))
                    Perk(Icons.Filled.CreditCard, stringResource(R.string.create_perk_billing))
                    Perk(Icons.Filled.Key, stringResource(R.string.create_perk_no_password))
                }

                Text(
                    stringResource(R.string.create_legal),
                    fontSize = 10.sp,
                    color = Color.White.copy(alpha = 0.4f),
                    modifier = Modifier.padding(top = 6.dp),
                )
            } else {
                Text(
                    stringResource(R.string.create_code_title),
                    fontSize = 32.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White,
                )
                Text(
                    buildAnnotatedString {
                        append(stringResource(R.string.create_code_body_1))
                        withStyle(SpanStyle(fontWeight = FontWeight.SemiBold, color = Color.White)) {
                            append(email.lowercase())
                        }
                        append(stringResource(R.string.create_code_body_2))
                    },
                    fontSize = 16.sp,
                    lineHeight = 24.sp,
                    color = Color.White.copy(alpha = 0.7f),
                )

                Box(
                    Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(13.dp))
                        .background(MaterialTheme.colorScheme.surface)
                        .border(1.dp, Color.White.copy(alpha = 0.14f), RoundedCornerShape(13.dp))
                        .padding(14.dp),
                    contentAlignment = Alignment.Center,
                ) {
                    if (code.isEmpty()) {
                        Text(
                            "00000000",
                            fontSize = 26.sp,
                            fontWeight = FontWeight.SemiBold,
                            fontFamily = FontFamily.Monospace,
                            color = Color.White.copy(alpha = 0.3f),
                        )
                    }
                    BasicTextField(
                        value = code,
                        onValueChange = { new -> code = new.filter { it.isDigit() }.take(8) },
                        textStyle = TextStyle(
                            color = Color.White,
                            fontSize = 26.sp,
                            fontWeight = FontWeight.SemiBold,
                            fontFamily = FontFamily.Monospace,
                            textAlign = TextAlign.Center,
                        ),
                        cursorBrush = SolidColor(BrandEmerald),
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.fillMaxWidth(),
                    )
                }

                errorMessage?.let {
                    Text(it, fontSize = 13.sp, color = MaterialTheme.colorScheme.error)
                }

                PrimaryCta(
                    stringResource(R.string.create_code_confirm),
                    emerald = true,
                    busy = busy,
                    enabled = code.length >= 6,
                    onClick = ::verify,
                )

                Text(
                    stringResource(R.string.create_code_resend),
                    fontSize = 14.sp,
                    color = Color.White.copy(alpha = 0.6f),
                    textAlign = TextAlign.Center,
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable(enabled = !busy) {
                            errorMessage = null
                            scope.launch {
                                runCatching {
                                    AuthManager.requestMagicLink(
                                        email.trim().lowercase(),
                                        Locale.getDefault().toLanguageTag(),
                                    )
                                }
                            }
                        }
                        .padding(vertical = 4.dp),
                )

                // Visible spam notice — the code lands in spam often enough
                // that this box is load-bearing for signup conversion.
                Row(
                    Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(12.dp))
                        .background(BrandEmerald.copy(alpha = 0.10f))
                        .border(1.dp, BrandEmerald.copy(alpha = 0.35f), RoundedCornerShape(12.dp))
                        .padding(12.dp),
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                ) {
                    Icon(
                        Icons.Filled.Inbox,
                        contentDescription = null,
                        tint = BrandEmerald,
                        modifier = Modifier.size(18.dp),
                    )
                    Text(
                        stringResource(R.string.create_spam_notice),
                        fontSize = 13.sp,
                        color = Color.White.copy(alpha = 0.85f),
                    )
                }
            }
        }
    }
}

@Composable
private fun Perk(icon: ImageVector, text: String) {
    Row(horizontalArrangement = Arrangement.spacedBy(9.dp)) {
        Icon(
            icon,
            contentDescription = null,
            tint = BrandEmerald,
            modifier = Modifier.size(16.dp).padding(top = 1.dp),
        )
        Text(text, fontSize = 13.sp, color = Color.White.copy(alpha = 0.65f))
    }
}
