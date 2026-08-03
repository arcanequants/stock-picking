package com.vectorialdata.app.feature.onboarding

import android.Manifest
import android.app.Activity
import android.content.ContextWrapper
import android.os.Build
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.vectorialdata.app.R
import com.vectorialdata.app.core.auth.SecureStore
import com.vectorialdata.app.core.billing.BillingManager
import com.vectorialdata.app.core.notifications.LocalReminders
import com.vectorialdata.app.core.notifications.NotificationsManager
import com.vectorialdata.app.core.store.PickStatusStore
import com.vectorialdata.app.ui.theme.BrandEmerald
import kotlinx.coroutines.launch

/**
 * One-time post-signin setup — mirror of iOS `FirstRunSetupView`:
 * trial activation → notification priming → consistent-amount setup.
 * Skipping any step is always possible.
 */
@Composable
fun FirstRunSetupFlow(onComplete: () -> Unit) {
    var step by rememberSaveable { mutableStateOf(0) }
    val isSubscribed by PickStatusStore.isSubscribed.collectAsStateWithLifecycle()
    val billingAvailable by BillingManager.available.collectAsStateWithLifecycle()

    Box(
        Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .statusBarsPadding(),
    ) {
        when (step) {
            0 -> {
                // Already-subscribed accounts (the free-register server trial,
                // web Stripe, or a restored Play sub) skip straight to
                // notifications — as does a build where Play can't sell.
                if (isSubscribed || !billingAvailable) {
                    LaunchedEffect(Unit) { step = 1 }
                } else {
                    TrialActivationScreen { step = 1 }
                }
            }
            1 -> NotificationPrimingScreen { step = 2 }
            else -> InvestmentAmountScreen(onDone = onComplete)
        }
    }
}

/** Per-device first-run flags (iOS @AppStorage "vd.didFirstRunSetup" etc.). */
object FirstRunFlags {
    private const val SETUP_KEY = "vd.didFirstRunSetup"
    private const val TOUR_KEY = "vd.didCoachTour"

    var didFirstRunSetup: Boolean
        get() = SecureStore.get(SETUP_KEY) == "true"
        set(value) = SecureStore.set(value.toString(), SETUP_KEY)

    var didCoachTour: Boolean
        get() = SecureStore.get(TOUR_KEY) == "true"
        set(value) = SecureStore.set(value.toString(), TOUR_KEY)

    /** "Ver tutorial" in Cuenta sets this; the scaffold replays the tour. */
    val tourReplayRequested = kotlinx.coroutines.flow.MutableStateFlow(false)
}

// ---- Step 0: Play-billed trial activation -----------------------------------

/**
 * Start the 14-day free trial through Google Play (introductory offer on the
 * monthly subscription) — mirror of iOS `TrialActivationView`. Only reachable
 * when Play billing is live AND the account isn't already subscribed.
 */
@Composable
fun TrialActivationScreen(onDone: () -> Unit) {
    val phase by BillingManager.phase.collectAsStateWithLifecycle()
    val offer by BillingManager.offer.collectAsStateWithLifecycle()
    val context = LocalContext.current
    val activity = remember(context) { context.findActivity() }
    val purchasing = phase is BillingManager.Phase.Purchasing

    LaunchedEffect(Unit) { BillingManager.start() }
    // A successful purchase → schedule the day-12 reminder and move on.
    LaunchedEffect(phase) {
        if (phase is BillingManager.Phase.Success) {
            LocalReminders.scheduleTrialEndReminder(context)
            onDone()
        }
    }

    Column(
        Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 24.dp)
            .padding(bottom = 18.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp, Alignment.CenterVertically),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        OwlBadge()
        Text(
            stringResource(R.string.trial_act_title),
            fontSize = 32.sp,
            lineHeight = 38.sp,
            fontWeight = FontWeight.Bold,
            color = Color.White,
            textAlign = TextAlign.Center,
        )

        Column(verticalArrangement = Arrangement.spacedBy(7.dp), modifier = Modifier.fillMaxWidth()) {
            TrialCheck(stringResource(R.string.trial_act_perk_picks))
            TrialCheck(stringResource(R.string.trial_act_perk_thesis))
            TrialCheck(stringResource(R.string.trial_act_perk_portfolio))
            TrialCheck(stringResource(R.string.trial_act_perk_cancel))
        }

        // Timeline: hoy / día 12 / día 14.
        Column(
            Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(13.dp))
                .background(MaterialTheme.colorScheme.surface)
                .padding(horizontal = 14.dp),
        ) {
            TimelineRow(stringResource(R.string.trial_act_today), stringResource(R.string.trial_act_today_what))
            HorizontalDivider(color = Color.White.copy(alpha = 0.08f))
            TimelineRow(stringResource(R.string.trial_act_day12), stringResource(R.string.trial_act_day12_what))
            HorizontalDivider(color = Color.White.copy(alpha = 0.08f))
            TimelineRow(
                stringResource(R.string.trial_act_day14),
                stringResource(R.string.trial_act_day14_what, offer?.formattedPrice ?: "$0.99"),
            )
        }

        (phase as? BillingManager.Phase.Failed)?.let {
            Text(it.message, fontSize = 12.sp, color = MaterialTheme.colorScheme.error, textAlign = TextAlign.Center)
        }

        PrimaryCta(
            stringResource(R.string.trial_act_cta),
            emerald = true,
            busy = purchasing,
            onClick = { activity?.let { BillingManager.purchase(it) } },
        )
        Text(
            stringResource(R.string.trial_act_not_now),
            fontSize = 14.sp,
            color = Color.White.copy(alpha = 0.6f),
            modifier = Modifier.clickable(enabled = !purchasing, onClick = onDone),
        )
        Text(
            stringResource(R.string.trial_act_disclosure),
            fontSize = 10.sp,
            color = Color.White.copy(alpha = 0.4f),
            textAlign = TextAlign.Center,
        )
    }
}

@Composable
private fun TrialCheck(text: String) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(9.dp),
    ) {
        Icon(Icons.Filled.CheckCircle, contentDescription = null, tint = BrandEmerald, modifier = Modifier.size(15.dp))
        Text(text, fontSize = 13.sp, color = Color.White.copy(alpha = 0.8f))
    }
}

@Composable
private fun TimelineRow(whenLabel: String, what: String) {
    Row(Modifier.padding(vertical = 11.dp), verticalAlignment = Alignment.CenterVertically) {
        Text(
            whenLabel,
            fontSize = 14.sp,
            fontWeight = FontWeight.SemiBold,
            fontFamily = FontFamily.Monospace,
            color = BrandEmerald,
            modifier = Modifier.padding(end = 10.dp),
        )
        Text(what, fontSize = 13.sp, color = Color.White.copy(alpha = 0.75f))
    }
}

// ---- Step 1: notification priming -------------------------------------------

/**
 * Soft-ask before the system notification prompt — mirror of iOS
 * `NotificationPrimingView`. Priming first (explaining the value) raises the
 * opt-in rate vs a cold prompt. On Android <13 there is no runtime prompt,
 * so the CTA just refreshes registration and moves on.
 */
@Composable
fun NotificationPrimingScreen(onDone: () -> Unit) {
    val scope = rememberCoroutineScope()

    val permissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission(),
    ) { _ ->
        NotificationsManager.refreshStatus()
        scope.launch { NotificationsManager.refreshRegistrationIfEnabled() }
        onDone()
    }

    Column(
        Modifier
            .fillMaxSize()
            .padding(horizontal = 24.dp)
            .padding(bottom = 24.dp),
        verticalArrangement = Arrangement.spacedBy(18.dp, Alignment.CenterVertically),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        OwlBadge(size = 68.dp)
        Text(
            stringResource(R.string.priming_title),
            fontSize = 32.sp,
            lineHeight = 38.sp,
            fontWeight = FontWeight.Bold,
            color = Color.White,
            textAlign = TextAlign.Center,
        )
        Text(
            stringResource(R.string.priming_body),
            fontSize = 16.sp,
            lineHeight = 24.sp,
            color = Color.White.copy(alpha = 0.7f),
            textAlign = TextAlign.Center,
            modifier = Modifier.padding(horizontal = 12.dp),
        )
        Spacer(Modifier.height(8.dp))
        PrimaryCta(stringResource(R.string.priming_cta), emerald = true) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                permissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
            } else {
                scope.launch { NotificationsManager.refreshRegistrationIfEnabled() }
                onDone()
            }
        }
        Text(
            stringResource(R.string.trial_act_not_now),
            fontSize = 14.sp,
            color = Color.White.copy(alpha = 0.6f),
            modifier = Modifier.clickable(onClick = onDone),
        )
    }
}

// ---- Step 2: consistent per-buy amount --------------------------------------

/**
 * Set the consistent per-buy amount — mirror of iOS `InvestmentAmountView`.
 * The whole philosophy: the SAME amount every time, starting with what you
 * won't feel, raised in steps over time. Used both as a first-run step (pass
 * [onDone]) and as a sheet from Account / the raise-reminder push.
 */
@Composable
fun InvestmentAmountScreen(onDone: (() -> Unit)? = null, onDismiss: (() -> Unit)? = null) {
    val defaultInvestment by PickStatusStore.defaultInvestment.collectAsStateWithLifecycle()
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    var amount by rememberSaveable { mutableStateOf(2.0) }
    var customText by rememberSaveable { mutableStateOf("") }
    var saving by remember { mutableStateOf(false) }
    var remindToRaise by rememberSaveable {
        mutableStateOf(SecureStore.get(REMIND_RAISE_KEY) != "false")
    }
    LaunchedEffect(defaultInvestment) { defaultInvestment?.let { amount = it } }

    val quickAmounts = listOf(1.0, 2.0, 5.0, 20.0)

    Column(Modifier.fillMaxSize()) {
        Column(
            Modifier
                .weight(1f)
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 20.dp)
                .padding(top = 12.dp, bottom = 24.dp),
            verticalArrangement = Arrangement.spacedBy(20.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(6.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                Text(
                    stringResource(R.string.amount_title),
                    fontSize = 22.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White,
                    textAlign = TextAlign.Center,
                )
                Text(
                    stringResource(R.string.amount_subtitle),
                    fontSize = 14.sp,
                    color = Color.White.copy(alpha = 0.65f),
                    textAlign = TextAlign.Center,
                )
            }

            Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(2.dp)) {
                Text(
                    money(amount),
                    fontSize = 52.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Monospace,
                    color = BrandEmerald,
                )
                Text(
                    stringResource(R.string.amount_per_pick),
                    fontSize = 12.sp,
                    color = Color.White.copy(alpha = 0.5f),
                )
            }

            // Quick chips.
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                quickAmounts.forEach { a ->
                    val selected = customText.isEmpty() && amount == a
                    Box(
                        Modifier
                            .weight(1f)
                            .height(44.dp)
                            .clip(RoundedCornerShape(11.dp))
                            .background(
                                if (selected) BrandEmerald.copy(alpha = 0.12f)
                                else MaterialTheme.colorScheme.surface,
                            )
                            .border(
                                1.dp,
                                if (selected) BrandEmerald else Color.White.copy(alpha = 0.08f),
                                RoundedCornerShape(11.dp),
                            )
                            .clickable {
                                amount = a
                                customText = ""
                            },
                        contentAlignment = Alignment.Center,
                    ) {
                        Text(
                            money(a),
                            fontSize = 14.sp,
                            fontWeight = FontWeight.SemiBold,
                            fontFamily = FontFamily.Monospace,
                            color = if (selected) BrandEmerald else Color.White.copy(alpha = 0.8f),
                        )
                    }
                }
            }

            // Custom amount.
            Row(
                Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(12.dp))
                    .background(MaterialTheme.colorScheme.surface)
                    .border(
                        1.dp,
                        if (customText.isNotEmpty()) BrandEmerald else Color.White.copy(alpha = 0.08f),
                        RoundedCornerShape(12.dp),
                    )
                    .padding(14.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    stringResource(R.string.amount_custom),
                    fontSize = 14.sp,
                    color = Color.White.copy(alpha = 0.7f),
                )
                Spacer(Modifier.weight(1f))
                Text(
                    "$",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = Color.White.copy(alpha = 0.5f),
                )
                BasicTextField(
                    value = customText,
                    onValueChange = { new ->
                        customText = new
                        new.replace(",", ".").toDoubleOrNull()?.takeIf { it > 0 }?.let { amount = it }
                    },
                    textStyle = TextStyle(
                        color = BrandEmerald,
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace,
                        textAlign = TextAlign.End,
                    ),
                    cursorBrush = SolidColor(BrandEmerald),
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                    modifier = Modifier.size(width = 90.dp, height = 24.dp),
                )
            }

            // Ladder: the idea is to raise it over time.
            Column(
                Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(14.dp))
                    .background(MaterialTheme.colorScheme.surface)
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                Text(
                    stringResource(R.string.amount_ladder_title),
                    fontSize = 12.sp,
                    color = Color.White.copy(alpha = 0.5f),
                    textAlign = TextAlign.Center,
                    modifier = Modifier.fillMaxWidth(),
                )
                Row(
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    verticalAlignment = Alignment.Bottom,
                ) {
                    LadderBar("$2", stringResource(R.string.amount_ladder_1), 0.30f, Modifier.weight(1f))
                    LadderBar("$5", stringResource(R.string.amount_ladder_2), 0.55f, Modifier.weight(1f))
                    LadderBar("$50", stringResource(R.string.amount_ladder_3), 1.0f, Modifier.weight(1f))
                }
            }

            // Reminder toggle.
            Row(
                Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(14.dp))
                    .background(MaterialTheme.colorScheme.surface)
                    .padding(14.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                    Text(
                        stringResource(R.string.amount_remind_title),
                        fontSize = 14.sp,
                        color = Color.White,
                    )
                    Text(
                        stringResource(R.string.amount_remind_sub),
                        fontSize = 10.sp,
                        color = Color.White.copy(alpha = 0.5f),
                    )
                }
                Switch(
                    checked = remindToRaise,
                    onCheckedChange = {
                        remindToRaise = it
                        SecureStore.set(it.toString(), REMIND_RAISE_KEY)
                    },
                    colors = SwitchDefaults.colors(
                        checkedTrackColor = BrandEmerald,
                        checkedThumbColor = Color.White,
                    ),
                )
            }
        }

        // Save bar.
        Column(
            Modifier
                .fillMaxWidth()
                .background(MaterialTheme.colorScheme.surface)
                .padding(horizontal = 20.dp)
                .padding(top = 10.dp, bottom = 8.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            PrimaryCta(
                stringResource(if (onDone == null) R.string.amount_save else R.string.amount_save_first_run),
                emerald = true,
                busy = saving,
            ) {
                saving = true
                scope.launch {
                    PickStatusStore.updateDefaultInvestment(amount)
                    if (remindToRaise) {
                        LocalReminders.scheduleRaiseReminder(context, amount)
                    } else {
                        LocalReminders.cancelRaiseReminder(context)
                    }
                    saving = false
                    onDone?.invoke() ?: onDismiss?.invoke()
                }
            }
            Text(
                stringResource(R.string.amount_change_later),
                fontSize = 10.sp,
                color = Color.White.copy(alpha = 0.45f),
            )
        }
    }
}

private const val REMIND_RAISE_KEY = "vd.remindRaiseAmount"

@Composable
private fun LadderBar(amt: String, whenLabel: String, h: Float, modifier: Modifier = Modifier) {
    Column(modifier, horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(6.dp)) {
        Text(
            amt,
            fontSize = 12.sp,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Monospace,
            color = BrandEmerald,
        )
        Box(
            Modifier
                .fillMaxWidth()
                .height((14 + 78 * h).dp)
                .clip(RoundedCornerShape(6.dp))
                .background(
                    Brush.verticalGradient(
                        listOf(BrandEmerald.copy(alpha = 0.35f), Color(0xFF0DA370)),
                    ),
                ),
        )
        Text(whenLabel, fontSize = 9.sp, color = Color.White.copy(alpha = 0.4f))
    }
}

private fun money(v: Double): String =
    if (v % 1.0 == 0.0) "$${v.toInt()}" else "$%.2f".format(v)

/** Compose's LocalContext is a ContextWrapper chain; Play needs the Activity. */
private fun android.content.Context.findActivity(): Activity? {
    var ctx = this
    while (ctx is ContextWrapper) {
        if (ctx is Activity) return ctx
        ctx = ctx.baseContext
    }
    return null
}
