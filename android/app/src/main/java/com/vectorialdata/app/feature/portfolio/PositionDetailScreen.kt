package com.vectorialdata.app.feature.portfolio

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.vectorialdata.app.core.model.Pick
import com.vectorialdata.app.core.model.PickStatus
import com.vectorialdata.app.core.model.Position
import com.vectorialdata.app.core.model.StockResearch
import com.vectorialdata.app.core.net.ApiClient
import com.vectorialdata.app.core.store.PickStatusStore
import com.vectorialdata.app.core.util.Formatters
import com.vectorialdata.app.feature.common.VDCard
import com.vectorialdata.app.feature.picks.PickBuySheet
import com.vectorialdata.app.ui.theme.BrandEmerald
import com.vectorialdata.app.ui.theme.BrandIndigo
import java.util.Locale

/**
 * Position detail — mirror of iOS `PositionDetailView`: header, "Our
 * position" facts, per-buy edit tiles (reuses [PickBuySheet]), and the
 * research "why" card (or trial paywall when locked).
 */
@Composable
fun PositionDetailScreen(position: Position, onBack: () -> Unit, modifier: Modifier = Modifier) {
    val picks by PickStatusStore.picks.collectAsStateWithLifecycle()
    val uriHandler = LocalUriHandler.current

    var research by remember { mutableStateOf<StockResearch?>(null) }
    var editingPick by remember { mutableStateOf<Pick?>(null) }

    LaunchedEffect(position.ticker) {
        research = runCatching {
            ApiClient.get<StockResearch>("/api/picks/research/${position.ticker}")
        }.getOrNull()
    }

    val editableBuys = remember(picks, position.ticker) {
        picks.filter { it.ticker == position.ticker && it.status == PickStatus.BOUGHT }
            .sortedByDescending { it.pickNumber }
    }

    Column(modifier.fillMaxSize()) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            IconButton(onClick = onBack) {
                Icon(
                    Icons.AutoMirrored.Filled.ArrowBack,
                    contentDescription = "Atrás",
                    tint = MaterialTheme.colorScheme.onBackground,
                )
            }
            Text(
                position.ticker,
                fontSize = 17.sp,
                fontWeight = FontWeight.SemiBold,
                color = MaterialTheme.colorScheme.onBackground,
            )
        }

        Column(
            Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            HeaderCard(position)
            PositionFactsCard(position)
            if (editableBuys.isNotEmpty()) {
                EditBuyCard(editableBuys) { editingPick = it }
            }

            val res = research
            when {
                res == null -> Unit
                res.locked -> PaywallCard { uriHandler.openUri("https://vectorialdata.com/join") }
                !res.summaryWhy.isNullOrEmpty() -> WhyCard(res.summaryWhy)
            }

            Text(
                "Informational only. Not personalized investment advice. Past performance does not guarantee future results.",
                fontSize = 10.sp,
                color = Color.White.copy(alpha = 0.4f),
            )
            Spacer(Modifier.size(16.dp))
        }
    }

    editingPick?.let { pick ->
        PickBuySheet(
            pick = pick,
            onDismiss = { editingPick = null },
            onSuccess = { editingPick = null },
        )
    }
}

@Composable
private fun HeaderCard(position: Position) {
    VDCard(innerSpacing = 6.dp) {
        Text(
            position.ticker,
            fontSize = 32.sp,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.onBackground,
        )
        Text(position.name, fontSize = 14.sp, color = Color.White.copy(alpha = 0.7f))
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(
                Formatters.pct(position.returnPct),
                fontSize = 22.sp,
                fontWeight = FontWeight.SemiBold,
                color = if (position.returnPct >= 0) BrandEmerald else MaterialTheme.colorScheme.error,
            )
            Spacer(Modifier.weight(1f))
            Text(
                "${position.daysHeld}d held",
                fontSize = 12.sp,
                color = Color.White.copy(alpha = 0.5f),
            )
        }
    }
}

@Composable
private fun PositionFactsCard(position: Position) {
    VDCard(innerSpacing = 8.dp) {
        Text(
            "Our position".uppercase(),
            fontSize = 12.sp,
            fontWeight = FontWeight.SemiBold,
            letterSpacing = 1.1.sp,
            color = Color.White.copy(alpha = 0.55f),
        )
        FactRow(if (position.buys == 1) "Buys" else "Buys (avg)", "${position.buys}")
        FactRow("First bought", position.firstBought)
        if (position.lastBought != position.firstBought) {
            FactRow("Last bought", position.lastBought)
        }
        position.sector?.takeIf { it.isNotEmpty() }?.let { FactRow("Sector", it) }
        position.region?.takeIf { it.isNotEmpty() }?.let { FactRow("Region", it) }
        position.dividendYield?.let { dy ->
            FactRow(
                "Dividend yield",
                if (dy > 0) String.format(Locale.US, "%.2f%%", dy) else "No dividend",
            )
        }
    }
}

@Composable
private fun FactRow(label: String, value: String) {
    Row(Modifier.fillMaxWidth()) {
        Text(label, fontSize = 13.sp, color = Color.White.copy(alpha = 0.6f))
        Spacer(Modifier.weight(1f))
        Text(
            value,
            fontSize = 13.sp,
            fontWeight = FontWeight.Medium,
            color = Color.White.copy(alpha = 0.9f),
        )
    }
}

/** "EDITAR TU COMPRA" — one tile per bought pick, opens the buy sheet. */
@Composable
private fun EditBuyCard(buys: List<Pick>, onEdit: (Pick) -> Unit) {
    VDCard(innerSpacing = 8.dp) {
        Text(
            "EDITAR TU COMPRA",
            fontSize = 12.sp,
            fontWeight = FontWeight.SemiBold,
            letterSpacing = 1.1.sp,
            color = Color.White.copy(alpha = 0.55f),
        )
        buys.forEach { pick ->
            Row(
                Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(12.dp))
                    .background(Color.White.copy(alpha = 0.04f))
                    .clickable { onEdit(pick) }
                    .padding(12.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                Icon(
                    Icons.Filled.Edit,
                    contentDescription = null,
                    tint = BrandEmerald,
                    modifier = Modifier.size(16.dp),
                )
                Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                    Text(
                        "Pick #${pick.pickNumber} · ${pick.date}",
                        fontSize = 13.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = Color.White,
                    )
                    val price = pick.buyPrice
                    val amount = pick.amountInvested
                    if (price != null && amount != null) {
                        Text(
                            "$${Formatters.money2(price)} · invertiste $${Formatters.money2(amount)}",
                            fontSize = 11.sp,
                            color = Color.White.copy(alpha = 0.6f),
                        )
                    }
                }
                Icon(
                    Icons.AutoMirrored.Filled.KeyboardArrowRight,
                    contentDescription = null,
                    tint = Color.White.copy(alpha = 0.4f),
                    modifier = Modifier.size(18.dp),
                )
            }
        }
    }
}

@Composable
private fun WhyCard(summary: String) {
    VDCard(innerSpacing = 8.dp) {
        Text(
            "WHY WE PICKED IT",
            fontSize = 12.sp,
            fontWeight = FontWeight.SemiBold,
            letterSpacing = 1.1.sp,
            color = Color.White.copy(alpha = 0.55f),
        )
        Text(summary, fontSize = 14.sp, color = Color.White.copy(alpha = 0.85f), lineHeight = 20.sp)
    }
}

/** Locked-research paywall — deep-links to the 14-day trial on web (M6 = Play Billing). */
@Composable
private fun PaywallCard(onOpen: () -> Unit) {
    Column(
        Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(
                Brush.horizontalGradient(
                    listOf(BrandIndigo.copy(alpha = 0.28f), BrandEmerald.copy(alpha = 0.28f)),
                ),
            )
            .border(1.dp, BrandEmerald.copy(alpha = 0.5f), RoundedCornerShape(16.dp))
            .clickable(onClick = onOpen)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(6.dp),
    ) {
        Text(
            "See why we picked this",
            fontSize = 15.sp,
            fontWeight = FontWeight.SemiBold,
            color = Color.White,
        )
        Text(
            "Subscribe to unlock our full thesis, the risk we're watching, and valuation on every position.",
            fontSize = 13.sp,
            color = Color.White.copy(alpha = 0.75f),
        )
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
            Text(
                "Suscríbete",
                fontSize = 14.sp,
                fontWeight = FontWeight.SemiBold,
                color = BrandEmerald,
            )
            Icon(
                Icons.AutoMirrored.Filled.KeyboardArrowRight,
                contentDescription = null,
                tint = BrandEmerald,
                modifier = Modifier.size(16.dp),
            )
        }
    }
}
