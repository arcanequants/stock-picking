package com.vectorialdata.app.feature.picks

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
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.AttachMoney
import androidx.compose.material.icons.filled.Bolt
import androidx.compose.material.icons.filled.Business
import androidx.compose.material.icons.filled.Cancel
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Circle
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material.icons.filled.KeyboardArrowUp
import androidx.compose.material.icons.filled.Public
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material.icons.filled.TrendingDown
import androidx.compose.material.icons.filled.TrendingUp
import androidx.compose.material.icons.filled.Verified
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.vectorialdata.app.core.model.DividendEvent
import com.vectorialdata.app.core.model.Pick
import com.vectorialdata.app.core.model.PickStatus
import com.vectorialdata.app.core.model.StockResearch
import com.vectorialdata.app.core.model.WhatsImportantPill
import com.vectorialdata.app.core.net.ApiClient
import com.vectorialdata.app.core.store.DividendStore
import com.vectorialdata.app.core.store.PickStatusStore
import com.vectorialdata.app.core.util.Formatters
import com.vectorialdata.app.feature.common.VDCard
import com.vectorialdata.app.ui.theme.BrandEmerald
import com.vectorialdata.app.ui.theme.BrandIndigo
import kotlinx.coroutines.launch

private val PillYellow = Color(0xFFFFD60A)

/**
 * Pick detail — mirror of iOS `PickDetailView`. Reads the pick live from
 * [PickStatusStore] (not a stale copy) so status/buyPrice update in place.
 */
@Composable
fun PickDetailScreen(pickNumber: Int, onBack: () -> Unit, modifier: Modifier = Modifier) {
    val picks by PickStatusStore.picks.collectAsStateWithLifecycle()
    val dividendEvents by DividendStore.events.collectAsStateWithLifecycle()
    val scope = rememberCoroutineScope()

    val current = picks.firstOrNull { it.pickNumber == pickNumber }

    var research by remember { mutableStateOf<StockResearch?>(null) }
    var isLoadingResearch by remember { mutableStateOf(true) }
    var researchError by remember { mutableStateOf<String?>(null) }
    var showBuySheet by remember { mutableStateOf(false) }

    LaunchedEffect(current?.ticker) {
        val ticker = current?.ticker ?: return@LaunchedEffect
        isLoadingResearch = true
        researchError = null
        try {
            research = ApiClient.get<StockResearch>("/api/picks/research/$ticker")
        } catch (e: Exception) {
            researchError = e.message ?: "No pudimos cargar el análisis."
        } finally {
            isLoadingResearch = false
        }
    }

    LaunchedEffect(Unit) {
        if (DividendStore.events.value.isEmpty()) DividendStore.load()
    }

    if (current == null) {
        Box(modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            CircularProgressIndicator(color = BrandEmerald)
        }
        return
    }

    Column(modifier.fillMaxSize()) {
        IconButton(onClick = onBack) {
            Icon(
                Icons.AutoMirrored.Filled.ArrowBack,
                contentDescription = "Atrás",
                tint = MaterialTheme.colorScheme.onBackground,
            )
        }

        Column(
            Modifier
                .weight(1f)
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            HeaderCard(current)
            DecisionBanner(current, onEdit = { showBuySheet = true })
            DividendSection(current, DividendStore.eventsForPick(pickNumber))

            val res = research
            when {
                isLoadingResearch -> Box(Modifier.fillMaxWidth().padding(24.dp), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = BrandEmerald)
                }
                researchError != null -> Text(
                    researchError.orEmpty(),
                    fontSize = 13.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                res != null && res.locked -> {
                    TldrCard(res.oneLiner ?: res.summaryShort)
                    PaywallCard()
                }
                res != null -> {
                    TldrCard(res.oneLiner ?: res.summaryShort)
                    res.whatsImportant?.takeIf { it.isNotEmpty() }?.let { WhatsImportantCard(it) }
                    res.whyShort?.takeIf { it.isNotEmpty() }?.let { AccordionSection("Por qué la pickeamos", it) }
                    res.riskShort?.takeIf { it.isNotEmpty() }?.let { AccordionSection("Riesgo principal", it) }
                    ProResearchCTA(res.ticker)
                }
            }

            Text(
                "Informational only. Not personalized investment advice. Past performance does not guarantee future results.",
                fontSize = 10.sp,
                color = Color.White.copy(alpha = 0.35f),
            )
            Spacer(Modifier.size(8.dp))
        }

        DecisionBar(
            pick = current,
            onBuy = { showBuySheet = true },
            onSkip = { scope.launch { PickStatusStore.markSkipped(pickNumber) } },
            onPending = { scope.launch { PickStatusStore.markPending(pickNumber) } },
        )
    }

    if (showBuySheet) {
        PickBuySheet(
            pick = current,
            onDismiss = { showBuySheet = false },
            onSuccess = {
                showBuySheet = false
                onBack()
            },
        )
    }
}

// ---- Header -----------------------------------------------------------------

@Composable
private fun HeaderCard(pick: Pick) {
    VDCard(innerSpacing = 6.dp) {
        Text(
            "Análisis del ${Formatters.longSpanishDate(pick.date)}",
            fontSize = 12.sp,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        Text("Pick #${pick.pickNumber}", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(
                pick.ticker,
                fontSize = 34.sp,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onBackground,
            )
            Spacer(Modifier.weight(1f))
            Text(
                Formatters.pct(pick.returnPct),
                fontSize = 20.sp,
                fontWeight = FontWeight.SemiBold,
                color = if (pick.returnPct >= 0) BrandEmerald else MaterialTheme.colorScheme.error,
            )
        }
        Text(pick.name, fontSize = 15.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            TagPill(pick.sector)
            TagPill(pick.region)
            TagPill(pick.country)
        }
    }
}

@Composable
private fun TagPill(text: String) {
    Text(
        text,
        fontSize = 10.sp,
        color = MaterialTheme.colorScheme.onSurfaceVariant,
        modifier = Modifier
            .clip(RoundedCornerShape(50))
            .background(Color.White.copy(alpha = 0.08f))
            .padding(horizontal = 8.dp, vertical = 3.dp),
    )
}

// ---- Decision banner + bar ----------------------------------------------------

@Composable
private fun DecisionBanner(pick: Pick, onEdit: () -> Unit) {
    when (pick.status) {
        PickStatus.BOUGHT -> VDCard(onClick = onEdit, innerSpacing = 2.dp) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                Icon(Icons.Filled.CheckCircle, contentDescription = null, tint = BrandEmerald, modifier = Modifier.size(22.dp))
                Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                    Text(
                        "Lo compraste",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = MaterialTheme.colorScheme.onBackground,
                    )
                    val price = pick.buyPrice
                    val amount = pick.amountInvested
                    if (price != null && amount != null) {
                        Text(
                            "$${Formatters.money2(price)} · invertiste $${Formatters.money2(amount)} · toca para editar",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                }
                Icon(Icons.Filled.Edit, contentDescription = "Editar", tint = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.size(16.dp))
            }
        }

        PickStatus.SKIPPED -> VDCard(innerSpacing = 0.dp) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                Icon(Icons.Filled.Cancel, contentDescription = null, tint = Color.Gray, modifier = Modifier.size(22.dp))
                Text("Lo skippeaste", fontSize = 14.sp, color = MaterialTheme.colorScheme.onBackground)
            }
        }

        PickStatus.PENDING -> Unit
    }
}

/** Sticky bottom decision bar — reshapes by status, mirror of iOS `decisionBar`. */
@Composable
private fun DecisionBar(pick: Pick, onBuy: () -> Unit, onSkip: () -> Unit, onPending: () -> Unit) {
    Row(
        Modifier
            .fillMaxWidth()
            .background(MaterialTheme.colorScheme.surface)
            .padding(horizontal = 16.dp, vertical = 12.dp),
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        val buyColors = ButtonDefaults.buttonColors(containerColor = BrandEmerald, contentColor = Color(0xFF05080A))
        when (pick.status) {
            PickStatus.PENDING -> {
                OutlinedButton(onClick = onSkip, modifier = Modifier.weight(1f), shape = RoundedCornerShape(12.dp)) {
                    Text("⏰ Después")
                }
                Button(onClick = onBuy, modifier = Modifier.weight(1f), shape = RoundedCornerShape(12.dp), colors = buyColors) {
                    Text("✅ Lo compré", fontWeight = FontWeight.SemiBold)
                }
            }
            PickStatus.BOUGHT -> {
                OutlinedButton(onClick = onPending, modifier = Modifier.weight(1f), shape = RoundedCornerShape(12.dp)) {
                    Text("Cambiar a pendiente")
                }
            }
            PickStatus.SKIPPED -> {
                OutlinedButton(onClick = onPending, modifier = Modifier.weight(1f), shape = RoundedCornerShape(12.dp)) {
                    Text("Volver a pendiente")
                }
                Button(onClick = onBuy, modifier = Modifier.weight(1f), shape = RoundedCornerShape(12.dp), colors = buyColors) {
                    Text("✅ Sí lo compré", fontWeight = FontWeight.SemiBold)
                }
            }
        }
    }
}

// ---- Dividends ---------------------------------------------------------------

@Composable
private fun DividendSection(pick: Pick, events: List<DividendEvent>) {
    if (pick.status != PickStatus.BOUGHT || events.isEmpty()) return
    val total = events.sumOf { it.totalAmount }

    VDCard(innerSpacing = 8.dp) {
        Text(
            "💸 DIVIDENDOS COBRADOS",
            fontSize = 12.sp,
            fontWeight = FontWeight.SemiBold,
            letterSpacing = 1.1.sp,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
        events.forEach { e ->
            Row(Modifier.fillMaxWidth()) {
                Text(Formatters.shortDate(e.exDate), fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                Spacer(Modifier.weight(1f))
                Text("$${Formatters.money2(e.totalAmount)}", fontSize = 12.sp, color = MaterialTheme.colorScheme.onBackground)
            }
        }
        HorizontalDivider(color = Color.White.copy(alpha = 0.1f))
        Row(Modifier.fillMaxWidth()) {
            Text("Total cobrado", fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = MaterialTheme.colorScheme.onBackground)
            Spacer(Modifier.weight(1f))
            Text("$${Formatters.money2(total)}", fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = BrandEmerald)
        }
        val invested = pick.amountInvested
        if (invested != null && invested > 0) {
            Row(Modifier.fillMaxWidth()) {
                Text("Yield real", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                Spacer(Modifier.weight(1f))
                Text(
                    "${Formatters.money2(total / invested * 100)}%",
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }
    }
}

// ---- Research sections ---------------------------------------------------------

@Composable
private fun TldrCard(text: String) {
    VDCard(innerSpacing = 8.dp) {
        Text(
            "EN POCAS PALABRAS",
            fontSize = 12.sp,
            fontWeight = FontWeight.SemiBold,
            letterSpacing = 1.1.sp,
            color = Color.White.copy(alpha = 0.55f),
        )
        Text(text, fontSize = 15.sp, color = Color.White.copy(alpha = 0.9f), lineHeight = 21.sp)
    }
}

@Composable
private fun WhatsImportantCard(pills: List<WhatsImportantPill>) {
    VDCard(innerSpacing = 10.dp) {
        Text(
            "LO IMPORTANTE",
            fontSize = 12.sp,
            fontWeight = FontWeight.SemiBold,
            letterSpacing = 1.1.sp,
            color = Color.White.copy(alpha = 0.55f),
        )
        pills.forEach { pill ->
            Row(verticalAlignment = Alignment.Top, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                Icon(
                    iconFor(pill.icon),
                    contentDescription = null,
                    tint = tintFor(pill.tint),
                    modifier = Modifier.size(18.dp),
                )
                Text(pill.text, fontSize = 13.sp, color = Color.White.copy(alpha = 0.9f), lineHeight = 18.sp)
            }
        }
    }
}

private fun tintFor(tint: String): Color = when (tint) {
    "emerald" -> BrandEmerald
    "red" -> Color(0xFFFF6B6B)
    "yellow" -> PillYellow
    else -> Color.White
}

/** SF Symbol name (wire) → closest Material icon; neutral dot fallback. */
private fun iconFor(sfName: String): ImageVector = when {
    sfName.startsWith("chart.line.uptrend") -> Icons.Filled.TrendingUp
    sfName.startsWith("chart.line.downtrend") -> Icons.Filled.TrendingDown
    sfName.startsWith("dollarsign") || sfName.startsWith("banknote") -> Icons.Filled.AttachMoney
    sfName.startsWith("exclamationmark") -> Icons.Filled.Warning
    sfName.startsWith("checkmark.seal") -> Icons.Filled.Verified
    sfName.startsWith("building") -> Icons.Filled.Business
    sfName.startsWith("globe") -> Icons.Filled.Public
    sfName.startsWith("bolt") -> Icons.Filled.Bolt
    sfName.startsWith("shield") -> Icons.Filled.Shield
    else -> Icons.Filled.Circle
}

@Composable
private fun AccordionSection(title: String, body: String) {
    var expanded by remember { mutableStateOf(false) }
    VDCard(innerSpacing = 8.dp) {
        Row(
            Modifier.fillMaxWidth().clickable { expanded = !expanded },
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(
                title,
                fontSize = 14.sp,
                fontWeight = FontWeight.SemiBold,
                color = MaterialTheme.colorScheme.onBackground,
            )
            Spacer(Modifier.weight(1f))
            Icon(
                if (expanded) Icons.Filled.KeyboardArrowUp else Icons.Filled.KeyboardArrowDown,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
        if (expanded) {
            Text(body, fontSize = 13.sp, color = Color.White.copy(alpha = 0.85f), lineHeight = 19.sp)
        }
    }
}

@Composable
private fun ProResearchCTA(ticker: String) {
    val uriHandler = LocalUriHandler.current
    Row(
        Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .background(MaterialTheme.colorScheme.surface)
            .border(1.dp, BrandEmerald.copy(alpha = 0.25f), RoundedCornerShape(16.dp))
            .clickable { uriHandler.openUri("https://vectorialdata.com/stocks/${ticker.lowercase()}") }
            .padding(16.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Icon(Icons.Filled.TrendingUp, contentDescription = null, tint = BrandEmerald, modifier = Modifier.size(22.dp))
        Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
            Text(
                "¿Quieres más detalle?",
                fontSize = 13.sp,
                fontWeight = FontWeight.SemiBold,
                color = Color.White,
            )
            Text(
                "Lee el análisis completo en vectorialdata.com",
                fontSize = 11.sp,
                color = Color.White.copy(alpha = 0.6f),
            )
        }
        Text("↗", fontSize = 13.sp, color = Color.White.copy(alpha = 0.5f))
    }
}

/** Locked-research card. M6 (Play Billing) replaces the web handoff. */
@Composable
private fun PaywallCard() {
    val uriHandler = LocalUriHandler.current
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
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Text(
            "Unlock the full thesis",
            fontSize = 16.sp,
            fontWeight = FontWeight.SemiBold,
            color = Color.White,
        )
        Text(
            "Get our complete research: what the company does, why we picked it, the key risk, valuation and analyst consensus.",
            fontSize = 12.sp,
            color = Color.White.copy(alpha = 0.8f),
        )
        Button(
            onClick = { uriHandler.openUri("https://vectorialdata.com") },
            colors = ButtonDefaults.buttonColors(containerColor = BrandEmerald, contentColor = Color(0xFF05080A)),
            shape = RoundedCornerShape(10.dp),
        ) {
            Text("Suscríbete", fontWeight = FontWeight.SemiBold)
        }
    }
}
