package com.vectorialdata.app.feature.home

import androidx.compose.foundation.background
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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Newspaper
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.vectorialdata.app.core.model.LatestPick
import com.vectorialdata.app.core.model.MarketStatus
import com.vectorialdata.app.core.model.PortfolioSnapshot
import com.vectorialdata.app.core.net.ApiClient
import com.vectorialdata.app.core.store.NewsStore
import com.vectorialdata.app.core.util.Formatters
import com.vectorialdata.app.feature.news.NewsListScreen
import com.vectorialdata.app.feature.common.VDCard
import com.vectorialdata.app.ui.theme.BrandEmerald
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.launch

private val MarketYellow = Color(0xFFFFD60A)

/**
 * Snapshot state outlives tab switches (iOS keeps its @StateObject alive
 * inside TabView; Compose disposes the tab's composition, so the cache
 * lives here instead).
 */
private object HomeState {
    val snapshot = MutableStateFlow<PortfolioSnapshot?>(null)
    val isLoading = MutableStateFlow(false)
    val errorMessage = MutableStateFlow<String?>(null)

    suspend fun load() {
        if (isLoading.value) return
        isLoading.value = true
        try {
            snapshot.value = ApiClient.get<PortfolioSnapshot>("/api/portfolio/snapshot")
            errorMessage.value = null
        } catch (e: Exception) {
            errorMessage.value = e.message ?: "No pudimos cargar tu resumen."
        } finally {
            isLoading.value = false
        }
    }

    fun reset() {
        snapshot.value = null
        errorMessage.value = null
        isLoading.value = false
    }
}

/** Called from AuthManager on sign-out. */
fun resetHomeCaches() {
    HomeState.reset()
    resetPerformanceChartCache()
    resetPersonalPerformanceCache()
}

/** Home tab — mirror of iOS `HomeView`. */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(modifier: Modifier = Modifier) {
    val snapshot by HomeState.snapshot.collectAsStateWithLifecycle()
    val isLoading by HomeState.isLoading.collectAsStateWithLifecycle()
    val errorMessage by HomeState.errorMessage.collectAsStateWithLifecycle()
    val scope = rememberCoroutineScope()

    var showNews by rememberSaveable { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        HomeState.load()
        if (NewsStore.items.value.isEmpty()) NewsStore.load()
    }

    if (showNews) {
        NewsListScreen(onBack = { showNews = false }, modifier = modifier)
        return
    }

    PullToRefreshBox(
        isRefreshing = isLoading && snapshot != null,
        onRefresh = { scope.launch { HomeState.load() } },
        modifier = modifier.fillMaxSize(),
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            Text(
                "Vectorial Data",
                fontSize = 28.sp,
                fontWeight = FontWeight.SemiBold,
                color = MaterialTheme.colorScheme.onBackground,
                modifier = Modifier.padding(top = 16.dp),
            )

            PerformanceChart()
            PersonalPerformanceCard()

            val snap = snapshot
            when {
                snap != null -> {
                    QuickStatsCard(snap)
                    snap.latestPick?.let { LatestPickCard(it) }
                    NewsCard(onOpen = { showNews = true })
                    MarketStatusRow(snap.marketStatus)
                }
                isLoading -> Box(Modifier.fillMaxWidth().padding(24.dp), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = BrandEmerald)
                }
                errorMessage != null -> Text(
                    errorMessage.orEmpty(),
                    fontSize = 13.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }

            Spacer(Modifier.height(24.dp))
        }
    }
}

/** Positions / Best / Worst — mirror of iOS `QuickStatsCard`. */
@Composable
private fun QuickStatsCard(snapshot: PortfolioSnapshot) {
    VDCard {
        Row(Modifier.fillMaxWidth()) {
            StatColumn("Positions", "${snapshot.totalPositions}", Color.White, Modifier.weight(1f))
            snapshot.best?.let {
                StatColumn("Best", "${it.ticker} ${Formatters.pct(it.returnPct)}", BrandEmerald, Modifier.weight(1f))
            }
            snapshot.worst?.let {
                val color = if (it.returnPct >= 0) BrandEmerald else MaterialTheme.colorScheme.error
                StatColumn("Worst", "${it.ticker} ${Formatters.pct(it.returnPct)}", color, Modifier.weight(1f))
            }
        }
    }
}

@Composable
private fun StatColumn(label: String, value: String, valueColor: Color, modifier: Modifier = Modifier) {
    Column(modifier, verticalArrangement = Arrangement.spacedBy(4.dp)) {
        Text(label, fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Text(value, fontSize = 15.sp, fontWeight = FontWeight.SemiBold, color = valueColor)
    }
}

/** Mirror of iOS `LatestPickCard` — the snapshot's single latest pick. */
@Composable
private fun LatestPickCard(pick: LatestPick) {
    VDCard {
        Text(
            "Análisis del ${Formatters.longSpanishDate(pick.date)}",
            fontSize = 12.sp,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            Text(
                pick.ticker,
                fontSize = 22.sp,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onBackground,
            )
            Spacer(Modifier.weight(1f))
            Text(
                Formatters.pct(pick.returnPct),
                fontSize = 17.sp,
                fontWeight = FontWeight.SemiBold,
                color = if (pick.returnPct >= 0) BrandEmerald else MaterialTheme.colorScheme.error,
            )
        }
        Text(pick.name, fontSize = 14.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}

/** "NOTICIAS" entry card with unread badge + latest headline — iOS `NewsCard`. */
@Composable
private fun NewsCard(onOpen: () -> Unit) {
    val items by NewsStore.items.collectAsStateWithLifecycle()
    val lastReadAt by NewsStore.lastReadAt.collectAsStateWithLifecycle()
    val unread = NewsStore.unreadCount(items, lastReadAt)

    VDCard(onClick = onOpen, innerSpacing = 6.dp) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            Icon(
                Icons.Outlined.Newspaper,
                contentDescription = null,
                tint = BrandEmerald,
                modifier = Modifier.size(16.dp),
            )
            Text(
                "NOTICIAS",
                fontSize = 12.sp,
                fontWeight = FontWeight.SemiBold,
                letterSpacing = 1.1.sp,
                color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.85f),
            )
            if (unread > 0) {
                Text(
                    "● $unread ${if (unread == 1) "nueva" else "nuevas"}",
                    fontSize = 11.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = BrandEmerald,
                )
            }
            Spacer(Modifier.weight(1f))
            Text("›", fontSize = 15.sp, color = Color.White.copy(alpha = 0.5f))
        }
        Text(
            "Lo último que cambia tu tesis",
            fontSize = 12.sp,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        val preview = NewsStore.mostRecentUnread(items, lastReadAt) ?: items.firstOrNull()
        preview?.let {
            HorizontalDivider(color = Color.White.copy(alpha = 0.1f))
            Text(
                it.headline,
                fontSize = 14.sp,
                fontWeight = FontWeight.SemiBold,
                color = MaterialTheme.colorScheme.onBackground,
                maxLines = 2,
            )
        }
    }
}

/** Colored dot + label — mirror of iOS `MarketStatusRow` (labels in English). */
@Composable
private fun MarketStatusRow(status: MarketStatus) {
    val (color, label) = when (status) {
        MarketStatus.OPEN -> BrandEmerald to "Market open"
        MarketStatus.PRE -> MarketYellow to "Pre-market"
        MarketStatus.POST -> MarketYellow to "After hours"
        MarketStatus.CLOSED -> Color.Gray to "Market closed"
        MarketStatus.WEEKEND -> Color.Gray to "Weekend — market closed"
        MarketStatus.HOLIDAY -> Color.Gray to "Holiday — market closed"
    }
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        Box(Modifier.size(8.dp).clip(CircleShape).background(color))
        Text(label, fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}
