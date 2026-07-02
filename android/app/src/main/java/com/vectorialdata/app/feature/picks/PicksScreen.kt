package com.vectorialdata.app.feature.picks

import androidx.activity.compose.BackHandler
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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Cancel
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.HourglassEmpty
import androidx.compose.material.icons.outlined.Circle
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.vectorialdata.app.core.model.Pick
import com.vectorialdata.app.core.model.PickStatus
import com.vectorialdata.app.core.store.PickStatusStore
import com.vectorialdata.app.core.util.Formatters
import com.vectorialdata.app.feature.common.VDCard
import com.vectorialdata.app.ui.theme.BrandEmerald
import com.vectorialdata.app.ui.theme.BrandIndigo
import kotlinx.coroutines.launch

/** Picks tab — mirror of iOS `PicksView` (feed + detail + decisions). */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PicksScreen(modifier: Modifier = Modifier) {
    val picks by PickStatusStore.picks.collectAsStateWithLifecycle()
    val isSubscribed by PickStatusStore.isSubscribed.collectAsStateWithLifecycle()
    val isLoading by PickStatusStore.isLoading.collectAsStateWithLifecycle()
    val errorMessage by PickStatusStore.errorMessage.collectAsStateWithLifecycle()
    val scope = rememberCoroutineScope()

    // 0 = list; otherwise the open pick's number (mirror of NavigationStack push).
    var openPickNumber by rememberSaveable { mutableIntStateOf(0) }

    LaunchedEffect(Unit) {
        if (PickStatusStore.picks.value.isEmpty()) PickStatusStore.load()
    }

    if (openPickNumber != 0) {
        BackHandler { openPickNumber = 0 }
        PickDetailScreen(
            pickNumber = openPickNumber,
            onBack = { openPickNumber = 0 },
            modifier = modifier,
        )
        return
    }

    val pending = PickStatusStore.pending(picks).sortedByDescending { it.pickNumber }
    val historial = PickStatusStore.historial(picks)

    PullToRefreshBox(
        isRefreshing = isLoading && picks.isNotEmpty(),
        onRefresh = { scope.launch { PickStatusStore.load() } },
        modifier = modifier.fillMaxSize(),
    ) {
        when {
            isLoading && picks.isEmpty() -> Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = BrandEmerald)
            }

            errorMessage != null && picks.isEmpty() -> Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Text(
                    errorMessage.orEmpty(),
                    fontSize = 13.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.padding(32.dp),
                )
            }

            picks.isEmpty() -> Column(
                Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp),
            ) {
                ScreenTitle()
                if (!isSubscribed) UpsellBanner()
                CountdownEmptyCard()
            }

            else -> LazyColumn(
                Modifier.fillMaxSize(),
                contentPadding = androidx.compose.foundation.layout.PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                item { ScreenTitle() }
                if (!isSubscribed) item { UpsellBanner() }
                if (pending.isNotEmpty()) {
                    item { SectionHeader("PENDIENTES", pending.size) }
                    items(pending.size, key = { "p${pending[it].pickNumber}" }) { i ->
                        PendingPickRow(pending[i]) { openPickNumber = pending[i].pickNumber }
                    }
                }
                if (historial.isNotEmpty()) {
                    item { SectionHeader("HISTORIAL", historial.size) }
                    items(historial.size, key = { "h${historial[it].pickNumber}" }) { i ->
                        HistoryPickRow(historial[i]) { openPickNumber = historial[i].pickNumber }
                    }
                }
                item { Spacer(Modifier.height(16.dp)) }
            }
        }
    }
}

@Composable
private fun ScreenTitle() {
    Text(
        "Picks de Vectorial",
        fontSize = 28.sp,
        fontWeight = FontWeight.SemiBold,
        color = MaterialTheme.colorScheme.onBackground,
    )
}

@Composable
private fun SectionHeader(title: String, count: Int) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        modifier = Modifier.padding(top = 8.dp),
    ) {
        Text(
            title,
            fontSize = 12.sp,
            fontWeight = FontWeight.SemiBold,
            letterSpacing = 1.1.sp,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        Text(
            "$count",
            fontSize = 11.sp,
            fontWeight = FontWeight.SemiBold,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier
                .clip(RoundedCornerShape(50))
                .background(Color.White.copy(alpha = 0.08f))
                .padding(horizontal = 8.dp, vertical = 2.dp),
        )
    }
}

/** "#N TICKER [RECOMPRA]  Decidir →" — mirror of iOS `PendingPickRow`. */
@Composable
private fun PendingPickRow(pick: Pick, onClick: () -> Unit) {
    VDCard(onClick = onClick, innerSpacing = 4.dp) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Text("#${pick.pickNumber}", fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
            Text(
                pick.ticker,
                fontSize = 17.sp,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onBackground,
            )
            if (pick.type == "rebuy") RebuyBadge()
            Spacer(Modifier.weight(1f))
            Text("Decidir →", fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = BrandEmerald)
        }
        Text(pick.name, fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Text(
            buildAnnotatedString {
                append("${Formatters.daysSinceLabel(pick.date)} · va ")
                withStyle(SpanStyle(color = if (pick.returnPct >= 0) BrandEmerald else MaterialTheme.colorScheme.error)) {
                    append(Formatters.pct(pick.returnPct))
                }
            },
            fontSize = 12.sp,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
    }
}

@Composable
private fun RebuyBadge() {
    Text(
        "RECOMPRA",
        fontSize = 9.sp,
        fontWeight = FontWeight.Bold,
        letterSpacing = 0.8.sp,
        color = BrandIndigo,
        modifier = Modifier
            .clip(RoundedCornerShape(6.dp))
            .background(BrandIndigo.copy(alpha = 0.15f))
            .padding(horizontal = 6.dp, vertical = 2.dp),
    )
}

/** Decided (or older) pick row — mirror of iOS `HistoryPickRow`. */
@Composable
private fun HistoryPickRow(pick: Pick, onClick: () -> Unit) {
    VDCard(onClick = onClick, innerSpacing = 0.dp) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            val (icon, tint) = when (pick.status) {
                PickStatus.BOUGHT -> Icons.Filled.CheckCircle to BrandEmerald
                PickStatus.SKIPPED -> Icons.Filled.Cancel to Color.Gray
                PickStatus.PENDING -> Icons.Outlined.Circle to Color.Gray
            }
            Icon(icon, contentDescription = null, tint = tint, modifier = Modifier.size(22.dp))

            Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalAlignment = Alignment.CenterVertically) {
                    Text("#${pick.pickNumber}", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Text(
                        pick.ticker,
                        fontSize = 15.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = MaterialTheme.colorScheme.onBackground,
                    )
                }
                Text(pick.name, fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                val subline = when (pick.status) {
                    PickStatus.BOUGHT -> pick.buyPrice?.let { "comprado a $${Formatters.money2(it)}" } ?: "comprado"
                    PickStatus.SKIPPED -> "skip · ${pick.date}"
                    PickStatus.PENDING -> pick.date
                }
                Text(subline, fontSize = 11.sp, color = Color.White.copy(alpha = 0.45f))
            }

            Text(
                Formatters.pct(pick.returnPct),
                fontSize = 14.sp,
                fontWeight = FontWeight.SemiBold,
                color = if (pick.returnPct >= 0) BrandEmerald else MaterialTheme.colorScheme.error,
            )
        }
    }
}

/** Free-tier banner — copy mirrors iOS `UpsellBanner` (English, deliberate). */
@Composable
private fun UpsellBanner() {
    val uriHandler = LocalUriHandler.current
    VDCard(innerSpacing = 8.dp) {
        Text(
            "Showing latest 3 picks",
            fontSize = 15.sp,
            fontWeight = FontWeight.SemiBold,
            color = MaterialTheme.colorScheme.onBackground,
        )
        Text(
            "Subscribe to unlock the full history and every new pick the moment it drops.",
            fontSize = 12.sp,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        // M6 (Play Billing) replaces this with the native paywall.
        Button(
            onClick = { uriHandler.openUri("https://vectorialdata.com") },
            colors = ButtonDefaults.buttonColors(containerColor = BrandEmerald, contentColor = Color(0xFF05080A)),
            shape = RoundedCornerShape(10.dp),
        ) {
            Text("Suscríbete", fontWeight = FontWeight.SemiBold)
        }
    }
}

/** Empty state — mirror of iOS `CountdownEmptyCard`. */
@Composable
private fun CountdownEmptyCard() {
    VDCard(innerSpacing = 8.dp) {
        Column(
            Modifier.fillMaxWidth().padding(vertical = 16.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Icon(
                Icons.Filled.HourglassEmpty,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.size(28.dp),
            )
            Text(
                "Aún no hay picks nuevos",
                fontSize = 15.sp,
                fontWeight = FontWeight.SemiBold,
                color = MaterialTheme.colorScheme.onBackground,
            )
            Text(
                "Los picks llegan al ritmo de mercado, no del calendario. Te avisamos al instante cuando salga el siguiente.",
                fontSize = 12.sp,
                textAlign = TextAlign.Center,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}
