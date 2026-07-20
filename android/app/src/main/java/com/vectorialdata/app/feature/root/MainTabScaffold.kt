package com.vectorialdata.app.feature.root

import androidx.compose.foundation.layout.fillMaxSize
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
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.res.stringResource
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.vectorialdata.app.R
import com.vectorialdata.app.core.notifications.NotificationsManager
import com.vectorialdata.app.feature.account.AccountScreen
import com.vectorialdata.app.feature.home.HomeScreen
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
    LaunchedEffect(pendingPick, pendingDigest, pendingNews) {
        when {
            pendingNews != null -> selected = AppTab.HOME
            pendingPick != null || pendingDigest -> selected = AppTab.PICKS
        }
    }

    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        bottomBar = {
            NavigationBar(containerColor = MaterialTheme.colorScheme.surface) {
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
}
