package com.vectorialdata.app.feature.portfolio

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.SwapVert
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.SegmentedButton
import androidx.compose.material3.SegmentedButtonDefaults
import androidx.compose.material3.SingleChoiceSegmentedButtonRow
import androidx.compose.material3.Text
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
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
import androidx.compose.ui.res.pluralStringResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.vectorialdata.app.R
import com.vectorialdata.app.core.i18n.Localizer
import com.vectorialdata.app.core.model.AllocationBucket
import com.vectorialdata.app.core.model.PortfolioPositions
import com.vectorialdata.app.core.model.PortfolioViewMode
import com.vectorialdata.app.core.model.Position
import com.vectorialdata.app.core.net.ApiClient
import com.vectorialdata.app.core.store.DividendStore
import com.vectorialdata.app.core.store.PickStatusStore
import com.vectorialdata.app.core.util.Formatters
import com.vectorialdata.app.feature.common.VDCard
import com.vectorialdata.app.ui.theme.BrandEmerald
import com.vectorialdata.app.ui.theme.BrandIndigo
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.launch
import java.util.Locale
import kotlin.math.abs

/** Mirror of iOS `SortMode` (toolbar sort menu). */
private enum class SortMode(val labelRes: Int) {
    TOP(R.string.sort_top),
    WORST(R.string.sort_worst),
    NEWEST(R.string.sort_newest),
}

/**
 * Portfolio state — outlives tab switches (iOS keeps its @StateObject alive
 * inside TabView). Two per-view caches, lazily fetched; decisions invalidate
 * only the personal side (the model portfolio is user-independent).
 */
private object PortfolioState {
    val modelResponse = MutableStateFlow<PortfolioPositions?>(null)
    val personalResponse = MutableStateFlow<PortfolioPositions?>(null)
    val selectedView = MutableStateFlow(PortfolioViewMode.MODEL)
    val isLoading = MutableStateFlow(false)
    val errorMessage = MutableStateFlow<String?>(null)

    /** Last PickStatusStore.lastDecisionAt this screen reacted to. */
    var lastSeenDecisionAt: Long? = null

    fun current(): PortfolioPositions? = when (selectedView.value) {
        PortfolioViewMode.MODEL -> modelResponse.value
        PortfolioViewMode.PERSONAL -> personalResponse.value
    }

    suspend fun load() {
        if (isLoading.value) return
        isLoading.value = true
        val view = selectedView.value
        try {
            val path = when (view) {
                PortfolioViewMode.MODEL -> "/api/portfolio/positions"
                PortfolioViewMode.PERSONAL -> "/api/portfolio/positions?view=personal"
            }
            val resp = ApiClient.get<PortfolioPositions>(path)
            when (view) {
                PortfolioViewMode.MODEL -> modelResponse.value = resp
                PortfolioViewMode.PERSONAL -> personalResponse.value = resp
            }
            errorMessage.value = null
        } catch (e: Exception) {
            errorMessage.value = e.message ?: Localizer.get(R.string.portfolio_error)
        } finally {
            isLoading.value = false
        }
    }

    /** Lazy per-view fetch: switching only loads if that side is empty. */
    suspend fun switchTo(mode: PortfolioViewMode) {
        if (selectedView.value == mode) return
        selectedView.value = mode
        if (current() == null) load()
    }

    fun invalidatePersonal() {
        personalResponse.value = null
    }

    fun reset() {
        modelResponse.value = null
        personalResponse.value = null
        selectedView.value = PortfolioViewMode.MODEL
        errorMessage.value = null
        isLoading.value = false
        lastSeenDecisionAt = null
    }
}

/** Called from AuthManager on sign-out. */
fun resetPortfolioCache() = PortfolioState.reset()

/** Portfolio tab — mirror of iOS `PortfolioView`. */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PortfolioScreen(modifier: Modifier = Modifier) {
    val modelResponse by PortfolioState.modelResponse.collectAsStateWithLifecycle()
    val personalResponse by PortfolioState.personalResponse.collectAsStateWithLifecycle()
    val selectedView by PortfolioState.selectedView.collectAsStateWithLifecycle()
    val isLoading by PortfolioState.isLoading.collectAsStateWithLifecycle()
    val errorMessage by PortfolioState.errorMessage.collectAsStateWithLifecycle()
    val dividends by DividendStore.summary.collectAsStateWithLifecycle()
    val lastDecisionAt by PickStatusStore.lastDecisionAt.collectAsStateWithLifecycle()
    val scope = rememberCoroutineScope()

    var sortMode by rememberSaveable { mutableStateOf(SortMode.TOP) }
    var openTicker by rememberSaveable { mutableStateOf("") }

    LaunchedEffect(Unit) {
        if (PortfolioState.current() == null) PortfolioState.load()
        if (DividendStore.events.value.isEmpty()) DividendStore.load()
    }

    // Any decision invalidates the personal cache; refetch now only if the
    // personal view is active (mirror of iOS onChange(lastDecisionAt)).
    LaunchedEffect(lastDecisionAt) {
        val at = lastDecisionAt ?: return@LaunchedEffect
        if (at != PortfolioState.lastSeenDecisionAt) {
            PortfolioState.lastSeenDecisionAt = at
            PortfolioState.invalidatePersonal()
            if (PortfolioState.selectedView.value == PortfolioViewMode.PERSONAL) {
                PortfolioState.load()
            }
        }
    }

    if (openTicker.isNotEmpty()) {
        val response = if (selectedView == PortfolioViewMode.PERSONAL) personalResponse else modelResponse
        val position = response?.positions?.firstOrNull { it.ticker == openTicker }
        if (position != null) {
            BackHandler { openTicker = "" }
            PositionDetailScreen(position = position, onBack = { openTicker = "" }, modifier = modifier)
            return
        }
        openTicker = ""
    }

    val response = if (selectedView == PortfolioViewMode.PERSONAL) personalResponse else modelResponse
    val displayed = remember(response, sortMode) {
        val positions = response?.positions.orEmpty()
        when (sortMode) {
            SortMode.WORST -> positions.sortedBy { it.returnPct }
            SortMode.NEWEST -> positions.sortedByDescending { it.lastBought }
            SortMode.TOP -> positions.sortedByDescending { it.returnPct }
        }
    }

    PullToRefreshBox(
        isRefreshing = isLoading && response != null,
        onRefresh = { scope.launch { PortfolioState.load(); DividendStore.load() } },
        modifier = modifier.fillMaxSize(),
    ) {
        LazyColumn(
            Modifier.fillMaxSize(),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            item {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        stringResource(R.string.portfolio_title),
                        fontSize = 28.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = MaterialTheme.colorScheme.onBackground,
                    )
                    Spacer(Modifier.weight(1f))
                    SortMenu(sortMode) { sortMode = it }
                }
            }

            item {
                SingleChoiceSegmentedButtonRow(Modifier.fillMaxWidth()) {
                    PortfolioViewMode.entries.forEachIndexed { i, mode ->
                        SegmentedButton(
                            selected = selectedView == mode,
                            onClick = { scope.launch { PortfolioState.switchTo(mode) } },
                            shape = SegmentedButtonDefaults.itemShape(index = i, count = PortfolioViewMode.entries.size),
                            colors = SegmentedButtonDefaults.colors(
                                activeContainerColor = BrandEmerald.copy(alpha = 0.2f),
                                activeContentColor = BrandEmerald,
                                inactiveContainerColor = MaterialTheme.colorScheme.surface,
                                inactiveContentColor = MaterialTheme.colorScheme.onSurfaceVariant,
                            ),
                        ) { Text(stringResource(mode.labelRes)) }
                    }
                }
            }

            val summary = dividends
            if (selectedView == PortfolioViewMode.PERSONAL && summary != null && summary.count > 0) {
                item { DividendsYTDCard(summary.ytdTotal, summary.count, summary.companies) }
            }

            when {
                response != null && response.positions.isNotEmpty() -> {
                    item { TotalsRow(response) }
                    response.sectorAllocation?.takeIf { it.isNotEmpty() }?.let { buckets ->
                        item { AllocationSection(stringResource(R.string.portfolio_sector_mix), buckets) }
                    }
                    response.regionAllocation?.takeIf { it.isNotEmpty() }?.let { buckets ->
                        item { AllocationSection(stringResource(R.string.portfolio_region_mix), buckets) }
                    }
                    item {
                        Text(
                            stringResource(R.string.portfolio_positions_header),
                            fontSize = 12.sp,
                            fontWeight = FontWeight.SemiBold,
                            letterSpacing = 1.1.sp,
                            color = Color.White.copy(alpha = 0.55f),
                            modifier = Modifier.padding(top = 4.dp),
                        )
                    }
                    items(displayed.size, key = { displayed[it].ticker }) { i ->
                        PositionRow(displayed[i]) { openTicker = displayed[i].ticker }
                    }
                }

                isLoading -> item {
                    Box(Modifier.fillMaxWidth().padding(top = 40.dp), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator(color = BrandEmerald)
                    }
                }

                selectedView == PortfolioViewMode.PERSONAL -> item { PersonalEmptyState() }

                errorMessage != null -> item {
                    Text(
                        errorMessage.orEmpty(),
                        fontSize = 13.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.padding(top = 40.dp),
                    )
                }

                else -> Unit
            }

            item { Spacer(Modifier.height(16.dp)) }
        }
    }
}

@Composable
private fun SortMenu(current: SortMode, onSelect: (SortMode) -> Unit) {
    var expanded by remember { mutableStateOf(false) }
    Box {
        IconButton(onClick = { expanded = true }) {
            Icon(
                Icons.Filled.SwapVert,
                contentDescription = stringResource(R.string.portfolio_sort),
                tint = MaterialTheme.colorScheme.onBackground,
            )
        }
        DropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
            SortMode.entries.forEach { mode ->
                DropdownMenuItem(
                    text = {
                        Text(
                            stringResource(mode.labelRes),
                            color = if (mode == current) BrandEmerald else MaterialTheme.colorScheme.onBackground,
                        )
                    },
                    onClick = {
                        onSelect(mode)
                        expanded = false
                    },
                )
            }
        }
    }
}

/** "💸 COBRADO EN DIVIDENDOS" — the user's own dividend money ($ allowed). */
@Composable
private fun DividendsYTDCard(ytd: Double, count: Int, companies: Int) {
    Row(
        Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(
                Brush.linearGradient(
                    listOf(BrandEmerald.copy(alpha = 0.18f), MaterialTheme.colorScheme.surface),
                ),
            )
            .padding(16.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Text("💸", fontSize = 34.sp)
        Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
            Text(
                stringResource(R.string.portfolio_dividends_header),
                fontSize = 11.sp,
                fontWeight = FontWeight.SemiBold,
                letterSpacing = 1.1.sp,
                color = Color.White.copy(alpha = 0.55f),
            )
            Text(
                "$${Formatters.money2(ytd)}",
                fontSize = 24.sp,
                fontWeight = FontWeight.Bold,
                color = BrandEmerald,
            )
            val paymentsStr = pluralStringResource(R.plurals.dividend_payments, count, count)
            val companiesStr = pluralStringResource(R.plurals.dividend_companies, companies, companies)
            Text(
                stringResource(R.string.portfolio_dividends_meta, paymentsStr, companiesStr),
                fontSize = 12.sp,
                color = Color.White.copy(alpha = 0.55f),
            )
        }
    }
}

/** Total return · Positions · Avg dividend — mirror of iOS `TotalsRow`. */
@Composable
private fun TotalsRow(response: PortfolioPositions) {
    VDCard {
        Row(Modifier.fillMaxWidth()) {
            Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text(stringResource(R.string.portfolio_total_return), fontSize = 11.sp, color = Color.White.copy(alpha = 0.6f))
                Text(
                    Formatters.pct(response.totalReturnPct),
                    fontSize = 18.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = if (response.totalReturnPct >= 0) BrandEmerald else MaterialTheme.colorScheme.error,
                )
            }
            Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text(stringResource(R.string.home_positions), fontSize = 11.sp, color = Color.White.copy(alpha = 0.6f))
                Text(
                    "${response.totalPositions}",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = MaterialTheme.colorScheme.onBackground,
                )
            }
            val dy = response.avgDividendYield
            if (dy != null && dy > 0) {
                Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text(stringResource(R.string.portfolio_avg_dividend), fontSize = 11.sp, color = Color.White.copy(alpha = 0.6f))
                    Text(
                        String.format(Locale.US, "%.2f%%", dy),
                        fontSize = 18.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = MaterialTheme.colorScheme.onBackground,
                    )
                }
            }
        }
    }
}

// Stable 8-color palette; deterministic index from the bucket name
// (String.hashCode is stable on the JVM, unlike Swift's hashValue).
private val AllocationPalette = listOf(
    Color(0.36f, 0.83f, 0.64f), // emerald
    Color(0.47f, 0.53f, 0.96f), // indigo
    Color(0.67f, 0.51f, 0.95f), // violet
    Color(0.94f, 0.52f, 0.49f), // coral
    Color(0.98f, 0.75f, 0.36f), // amber
    Color(0.40f, 0.78f, 0.85f), // cyan
    Color(0.96f, 0.48f, 0.68f), // pink
    Color(0.55f, 0.85f, 0.42f), // lime
)

/** "SECTOR MIX" / "REGION MIX" capsule bars — mirror of iOS `AllocationSection`. */
@Composable
private fun AllocationSection(title: String, buckets: List<AllocationBucket>) {
    VDCard(innerSpacing = 10.dp) {
        Text(
            title.uppercase(),
            fontSize = 12.sp,
            fontWeight = FontWeight.SemiBold,
            letterSpacing = 1.1.sp,
            color = Color.White.copy(alpha = 0.55f),
        )
        buckets.forEach { bucket ->
            val color = AllocationPalette[abs(bucket.name.hashCode()) % AllocationPalette.size]
            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        bucket.name,
                        fontSize = 13.sp,
                        color = Color.White.copy(alpha = 0.85f),
                        maxLines = 1,
                        modifier = Modifier.weight(1f),
                    )
                    Text(
                        stringResource(R.string.portfolio_alloc_meta, bucket.pct.toInt(), bucket.count),
                        fontSize = 12.sp,
                        color = Color.White.copy(alpha = 0.55f),
                    )
                }
                Box(
                    Modifier
                        .fillMaxWidth()
                        .height(6.dp)
                        .clip(CircleShape)
                        .background(Color.White.copy(alpha = 0.06f)),
                ) {
                    Box(
                        Modifier
                            .fillMaxWidth(fraction = (bucket.pct / 100.0).toFloat().coerceIn(0f, 1f))
                            .height(6.dp)
                            .clip(CircleShape)
                            .background(color),
                    )
                }
            }
        }
    }
}

/** One position row — mirror of iOS `PositionRow`. */
@Composable
private fun PositionRow(position: Position, onClick: () -> Unit) {
    VDCard(onClick = onClick, innerSpacing = 2.dp) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text(
                        position.ticker,
                        fontSize = 16.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = MaterialTheme.colorScheme.onBackground,
                    )
                    if (position.hasPrior == true) PriorPill(position.priorCount ?: 1)
                }
                Text(
                    position.name,
                    fontSize = 12.sp,
                    color = Color.White.copy(alpha = 0.6f),
                    maxLines = 1,
                )
                val buysStr = pluralStringResource(R.plurals.buys_count, position.buys, position.buys)
                Text(
                    stringResource(R.string.position_row_meta, buysStr, position.daysHeld),
                    fontSize = 11.sp,
                    color = Color.White.copy(alpha = 0.45f),
                )
            }
            Text(
                Formatters.pct(position.returnPct),
                fontSize = 16.sp,
                fontWeight = FontWeight.SemiBold,
                color = if (position.returnPct >= 0) BrandEmerald else MaterialTheme.colorScheme.error,
            )
        }
    }
}

/** "PREVIA" / "PREVIAS · N" indigo capsule — prior holdings marker. */
@Composable
internal fun PriorPill(count: Int) {
    Text(
        if (count > 1) stringResource(R.string.prior_pill_many, count) else stringResource(R.string.prior_pill_one),
        fontSize = 9.sp,
        fontWeight = FontWeight.Bold,
        letterSpacing = 0.6.sp,
        color = BrandIndigo,
        modifier = Modifier
            .clip(RoundedCornerShape(50))
            .background(BrandIndigo.copy(alpha = 0.18f))
            .padding(horizontal = 7.dp, vertical = 2.dp),
    )
}

@Composable
private fun PersonalEmptyState() {
    VDCard(innerSpacing = 6.dp) {
        Column(Modifier.padding(vertical = 14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Text(
                stringResource(R.string.portfolio_personal_empty_title),
                fontSize = 15.sp,
                fontWeight = FontWeight.SemiBold,
                color = MaterialTheme.colorScheme.onBackground,
            )
            Text(
                stringResource(R.string.portfolio_personal_empty_body),
                fontSize = 13.sp,
                color = Color.White.copy(alpha = 0.7f),
            )
        }
    }
}
