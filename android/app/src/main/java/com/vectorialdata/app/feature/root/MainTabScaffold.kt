package com.vectorialdata.app.feature.root

import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ListAlt
import androidx.compose.material.icons.filled.AccountCircle
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.PieChart
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.layout.positionInRoot
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.res.stringResource
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.vectorialdata.app.R
import com.vectorialdata.app.core.billing.BillingManager
import com.vectorialdata.app.core.notifications.NotificationsManager
import com.vectorialdata.app.core.store.PickStatusStore
import androidx.compose.runtime.saveable.rememberSaveable
import com.vectorialdata.app.feature.account.AccountScreen
import com.vectorialdata.app.feature.home.HomeScreen
import com.vectorialdata.app.feature.onboarding.CoachTourOverlay
import com.vectorialdata.app.feature.onboarding.FirstRunFlags
import com.vectorialdata.app.feature.onboarding.FirstRunSetupFlow
import com.vectorialdata.app.feature.onboarding.InvestmentAmountScreen
import com.vectorialdata.app.feature.picks.PicksScreen
import com.vectorialdata.app.feature.portfolio.PortfolioScreen

private enum class AppTab(val labelRes: Int, val icon: ImageVector) {
    HOME(R.string.tab_home, Icons.Filled.Home),
    PORTFOLIO(R.string.tab_portfolio, Icons.Filled.PieChart),
    PICKS(R.string.tab_picks, Icons.AutoMirrored.Filled.ListAlt),
    ACCOUNT(R.string.tab_account, Icons.Filled.AccountCircle),
}

/** Four-tab shell mirroring iOS `MainTabView`. */
@Composable
fun MainTabScaffold() {
    var selected by remember { mutableStateOf(AppTab.HOME) }

    // Push-tap routing — mirror of iOS `routeToPendingTab()`: jump to the tab
    // that consumes the pending payload (the screen itself clears the flow).
    val pendingPick by NotificationsManager.pendingPickNumber.collectAsStateWithLifecycle()
    val pendingDigest by NotificationsManager.pendingWeeklyDigest.collectAsStateWithLifecycle()
    val pendingNews by NotificationsManager.pendingNewsId.collectAsStateWithLifecycle()
    val pendingAccount by NotificationsManager.pendingOpenAccount.collectAsStateWithLifecycle()
    LaunchedEffect(pendingPick, pendingDigest, pendingNews, pendingAccount) {
        when {
            pendingNews != null -> selected = AppTab.HOME
            pendingPick != null || pendingDigest -> selected = AppTab.PICKS
            pendingAccount -> {
                // Day-12 trial reminder: subscription management lives in Account.
                selected = AppTab.ACCOUNT
                NotificationsManager.pendingOpenAccount.value = false
            }
        }
    }

    // Resolve the subscription state at launch: nothing else loads
    // PickStatusStore until the Picks tab is visited, so upsell banners
    // keyed on `!isSubscribed` fired for premium users on cold start.
    // Then self-heal IAP: if this Play account holds an entitlement the
    // backend doesn't know about (purchase-time verify failed), connecting
    // re-posts it (BillingManager.syncExistingPurchases on connect).
    LaunchedEffect(Unit) {
        if (!PickStatusStore.hasLoaded.value) PickStatusStore.load()
        if (!PickStatusStore.isSubscribed.value) BillingManager.start()
    }

    // First run on this device: trial (when Play can sell) → notification
    // priming → consistent per-buy amount. All skippable, shown once.
    var showFirstRun by rememberSaveable { mutableStateOf(!FirstRunFlags.didFirstRunSetup) }
    if (showFirstRun) {
        FirstRunSetupFlow {
            FirstRunFlags.didFirstRunSetup = true
            showFirstRun = false
        }
        return
    }

    // Tapping the scheduled "raise your amount" reminder opens the editor.
    val pendingAmount by NotificationsManager.pendingOpenAmount.collectAsStateWithLifecycle()
    var showAmountEditor by rememberSaveable { mutableStateOf(false) }
    LaunchedEffect(pendingAmount) {
        if (pendingAmount) {
            showAmountEditor = true
            NotificationsManager.pendingOpenAmount.value = false
        }
    }
    if (showAmountEditor) {
        AmountEditorSheet(onDismiss = { showAmountEditor = false })
    }

    // Coach-marks tour: once, right after first-run setup finishes. "Ver
    // tutorial" in Cuenta flips the flag back to replay it.
    var showTour by rememberSaveable { mutableStateOf(!FirstRunFlags.didCoachTour) }
    val replayRequested by FirstRunFlags.tourReplayRequested.collectAsStateWithLifecycle()
    LaunchedEffect(replayRequested) {
        if (replayRequested) {
            showTour = true
            FirstRunFlags.tourReplayRequested.value = false
        }
    }
    var tabBarBounds by remember { mutableStateOf<androidx.compose.ui.geometry.Rect?>(null) }

    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        bottomBar = {
            NavigationBar(
                containerColor = MaterialTheme.colorScheme.surface,
                modifier = Modifier.onGloballyPositioned { coords ->
                    val pos = coords.positionInRoot()
                    tabBarBounds = androidx.compose.ui.geometry.Rect(
                        pos,
                        androidx.compose.ui.geometry.Size(
                            coords.size.width.toFloat(),
                            coords.size.height.toFloat(),
                        ),
                    )
                },
            ) {
                AppTab.entries.forEach { tab ->
                    NavigationBarItem(
                        selected = selected == tab,
                        onClick = { selected = tab },
                        icon = { Icon(tab.icon, contentDescription = stringResource(tab.labelRes)) },
                        label = { Text(stringResource(tab.labelRes)) },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = MaterialTheme.colorScheme.primary,
                            selectedTextColor = MaterialTheme.colorScheme.primary,
                            indicatorColor = MaterialTheme.colorScheme.surfaceVariant,
                        ),
                    )
                }
            }
        },
    ) { padding ->
        val content = Modifier.fillMaxSize().padding(padding)
        when (selected) {
            AppTab.HOME -> HomeScreen(content)
            AppTab.PORTFOLIO -> PortfolioScreen(content)
            AppTab.PICKS -> PicksScreen(content)
            AppTab.ACCOUNT -> AccountScreen(content)
        }
    }

    if (showTour) {
        CoachTourOverlay(
            tabBarBounds = tabBarBounds,
            onSelectTab = { selected = AppTab.entries[it] },
            onFinished = {
                FirstRunFlags.didCoachTour = true
                showTour = false
            },
        )
    }
}


/** The per-buy amount editor as a bottom sheet (raise-reminder tap / Account). */
@OptIn(androidx.compose.material3.ExperimentalMaterial3Api::class)
@Composable
fun AmountEditorSheet(onDismiss: () -> Unit) {
    androidx.compose.material3.ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = androidx.compose.material3.rememberModalBottomSheetState(skipPartiallyExpanded = true),
        containerColor = MaterialTheme.colorScheme.background,
    ) {
        androidx.compose.foundation.layout.Box(
            Modifier
                .fillMaxWidth()
                .fillMaxHeight(0.92f),
        ) {
            InvestmentAmountScreen(onDismiss = onDismiss)
        }
    }
}
