package com.vectorialdata.app.feature.onboarding

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Apartment
import androidx.compose.material.icons.filled.BarChart
import androidx.compose.material.icons.filled.Link
import androidx.compose.material.icons.filled.NotificationsActive
import androidx.compose.material.icons.filled.AccountBalance
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.TrendingUp
import androidx.compose.material.icons.filled.MyLocation
import androidx.compose.material.icons.filled.WarningAmber
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
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
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.vectorialdata.app.R
import com.vectorialdata.app.core.model.PortfolioPositions
import com.vectorialdata.app.core.net.ApiClient
import com.vectorialdata.app.core.util.Formatters
import com.vectorialdata.app.ui.theme.BrandEmerald
import com.vectorialdata.app.ui.theme.BrandIndigo
import kotlinx.coroutines.launch
import kotlinx.serialization.Serializable

/** Deep emerald used as the left stop of the primary CTA gradient. */
private val EmeraldDeep = Color(0xFF0DA370)
private val LossColor = Color(0xFFE88A6B)

/**
 * New-user onboarding — mirror of iOS `OnboardingView`: the philosophy +
 * consistency education, the real (blockchain-attested) track record, and the
 * anatomy of a pick — then an invite to start the free trial or sign in.
 */
@Composable
fun OnboardingScreen(
    onSignIn: () -> Unit,
    onCreateAccount: () -> Unit,
) {
    val pagerState = rememberPagerState(pageCount = { PAGE_COUNT })
    val scope = rememberCoroutineScope()

    // Physical back walks pages backwards; on page 0 the default (exit) applies.
    androidx.activity.compose.BackHandler(enabled = pagerState.currentPage > 0) {
        scope.launch { pagerState.animateScrollToPage(pagerState.currentPage - 1) }
    }

    Column(
        Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            // Edge-to-edge: without this the top bar draws under the status
            // bar and "Iniciar sesión"/"Saltar" are untappable.
            .statusBarsPadding(),
    ) {
        // Top bar: sign-in escape hatch + skip.
        Row(
            Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(
                stringResource(R.string.onb_sign_in),
                fontSize = 14.sp,
                fontWeight = FontWeight.SemiBold,
                color = Color.White.copy(alpha = 0.85f),
                modifier = Modifier.clickable(onClick = onSignIn),
            )
            Spacer(Modifier.weight(1f))
            if (pagerState.currentPage < PAGE_COUNT - 1) {
                Text(
                    stringResource(R.string.onb_skip),
                    fontSize = 14.sp,
                    color = Color.White.copy(alpha = 0.5f),
                    modifier = Modifier.clickable {
                        scope.launch { pagerState.animateScrollToPage(PAGE_COUNT - 1) }
                    },
                )
            }
        }

        HorizontalPager(state = pagerState, modifier = Modifier.weight(1f)) { page ->
            OnboardingPage(page)
        }

        // Bottom bar: dots + CTA.
        Column(
            Modifier.fillMaxWidth().padding(horizontal = 20.dp).padding(bottom = 12.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            OnboardingDots(PAGE_COUNT, pagerState.currentPage)
            if (pagerState.currentPage < PAGE_COUNT - 1) {
                PrimaryCta(stringResource(R.string.onb_next)) {
                    scope.launch { pagerState.animateScrollToPage(pagerState.currentPage + 1) }
                }
            } else {
                PrimaryCta(stringResource(R.string.onb_start_trial), emerald = true, onClick = onCreateAccount)
                Text(
                    stringResource(R.string.onb_price_caption),
                    fontSize = 10.sp,
                    color = Color.White.copy(alpha = 0.5f),
                )
            }
        }
    }
}

private const val PAGE_COUNT = 5

/**
 * One education page by index — shared with the re-viewable "Filosofía"
 * section (iOS `PhilosophyView`).
 */
@Composable
fun OnboardingPage(page: Int) {
    when (page) {
        0 -> PhilosophyPage()
        1 -> ConsistencyPage()
        2 -> ProofPage()
        3 -> PickAnatomyPage()
        else -> HowItWorksPage()
    }
}

// ---- Pages ------------------------------------------------------------------

@Composable
private fun PhilosophyPage() {
    OnboardingScaffold {
        OwlBadge()
        OnboardingTitle(stringResource(R.string.onb_p1_title))
        Text(
            buildAnnotatedString {
                append(stringResource(R.string.onb_p1_body_1))
                withStyle(SpanStyle(fontWeight = FontWeight.SemiBold, color = Color.White)) {
                    append(stringResource(R.string.onb_p1_body_2))
                }
            },
            fontSize = 16.sp,
            lineHeight = 24.sp,
            color = Color.White.copy(alpha = 0.7f),
        )
    }
}

@Composable
private fun ConsistencyPage() {
    OnboardingScaffold {
        OwlBadge()
        OnboardingTitle(stringResource(R.string.onb_p2_title))
        Text(
            buildAnnotatedString {
                append(stringResource(R.string.onb_p2_body_1))
                withStyle(SpanStyle(fontWeight = FontWeight.SemiBold, color = Color.White)) {
                    append(stringResource(R.string.onb_p2_body_2))
                }
                append(stringResource(R.string.onb_p2_body_3))
                withStyle(SpanStyle(fontWeight = FontWeight.SemiBold, color = Color.White)) {
                    append(stringResource(R.string.onb_p2_body_4))
                }
                append(stringResource(R.string.onb_p2_body_5))
            },
            fontSize = 16.sp,
            lineHeight = 24.sp,
            color = Color.White.copy(alpha = 0.7f),
        )
        Text(
            stringResource(R.string.onb_p2_kicker),
            fontSize = 14.sp,
            fontWeight = FontWeight.SemiBold,
            color = BrandEmerald,
            modifier = Modifier.padding(top = 4.dp),
        )
    }
}

@Composable
private fun PickAnatomyPage() {
    val rows = listOf(
        Icons.Filled.Apartment to R.string.onb_p4_row_what,
        Icons.Filled.MyLocation to R.string.onb_p4_row_why,
        Icons.Filled.WarningAmber to R.string.onb_p4_row_risk,
        Icons.Filled.BarChart to R.string.onb_p4_row_valuation,
    )
    OnboardingScaffold {
        OwlBadge()
        OnboardingTitle(stringResource(R.string.onb_p4_title))
        Text(
            stringResource(R.string.onb_p4_body),
            fontSize = 16.sp,
            lineHeight = 24.sp,
            color = Color.White.copy(alpha = 0.7f),
        )
        Column(
            Modifier
                .fillMaxWidth()
                .padding(top = 6.dp)
                .clip(RoundedCornerShape(14.dp))
                .background(MaterialTheme.colorScheme.surface)
                .padding(horizontal = 16.dp),
        ) {
            rows.forEachIndexed { i, (icon, res) ->
                Row(
                    Modifier.padding(vertical = 13.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    Icon(icon, contentDescription = null, tint = BrandEmerald, modifier = Modifier.size(20.dp))
                    Text(
                        stringResource(res),
                        fontSize = 14.sp,
                        color = Color.White.copy(alpha = 0.92f),
                    )
                }
                if (i < rows.lastIndex) HorizontalDivider(color = Color.White.copy(alpha = 0.08f))
            }
        }
        Text(
            stringResource(R.string.onb_p4_footer),
            fontSize = 13.sp,
            color = Color.White.copy(alpha = 0.55f),
            textAlign = TextAlign.Center,
            modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
        )
    }
}

@Composable
private fun HowItWorksPage() {
    OnboardingScaffold {
        OwlBadge()
        OnboardingTitle(stringResource(R.string.onb_p5_title))
        Column(
            Modifier
                .fillMaxWidth()
                .padding(top = 4.dp)
                .clip(RoundedCornerShape(14.dp))
                .background(MaterialTheme.colorScheme.surface)
                .padding(horizontal = 14.dp),
        ) {
            HowItWorksStep(Icons.Filled.NotificationsActive, R.string.onb_p5_s1_title, R.string.onb_p5_s1_detail)
            HorizontalDivider(color = Color.White.copy(alpha = 0.08f))
            HowItWorksStep(Icons.Filled.AccountBalance, R.string.onb_p5_s2_title, R.string.onb_p5_s2_detail)
            HorizontalDivider(color = Color.White.copy(alpha = 0.08f))
            HowItWorksStep(Icons.Filled.TrendingUp, R.string.onb_p5_s3_title, R.string.onb_p5_s3_detail)
        }
        Row(
            Modifier.padding(top = 6.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Icon(
                Icons.Filled.Info,
                contentDescription = null,
                tint = Color.White.copy(alpha = 0.5f),
                modifier = Modifier.size(16.dp),
            )
            Text(
                stringResource(R.string.onb_p5_no_broker),
                fontSize = 13.sp,
                color = Color.White.copy(alpha = 0.5f),
            )
        }
    }
}

@Composable
private fun HowItWorksStep(icon: ImageVector, titleRes: Int, detailRes: Int) {
    Row(
        Modifier.padding(vertical = 13.dp),
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Box(
            Modifier
                .size(34.dp)
                .clip(RoundedCornerShape(9.dp))
                .background(BrandEmerald.copy(alpha = 0.12f)),
            contentAlignment = Alignment.Center,
        ) {
            Icon(icon, contentDescription = null, tint = BrandEmerald, modifier = Modifier.size(18.dp))
        }
        Column(verticalArrangement = Arrangement.spacedBy(3.dp)) {
            Text(
                stringResource(titleRes),
                fontSize = 14.sp,
                fontWeight = FontWeight.SemiBold,
                color = Color.White,
            )
            Text(
                stringResource(detailRes),
                fontSize = 12.sp,
                color = Color.White.copy(alpha = 0.6f),
            )
        }
    }
}

// ---- Proof (real data) — "El portafolio Vectorial" --------------------------

@Serializable
private data class HistoryPoint(val date: String, val returnPct: Double, val spyReturnPct: Double? = null)

@Composable
private fun ProofPage() {
    var positions by remember { mutableStateOf<PortfolioPositions?>(null) }
    var spark by remember { mutableStateOf<List<Double>>(emptyList()) }
    var loaded by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        positions = runCatching {
            ApiClient.get<PortfolioPositions>("/api/portfolio/positions")
        }.getOrNull()
        spark = runCatching {
            ApiClient.get<List<HistoryPoint>>("/api/portfolio/history").map { it.returnPct }
        }.getOrDefault(emptyList())
        loaded = true
    }

    OnboardingScaffold {
        OnboardingTitle(stringResource(R.string.onb_p3_title))
        Text(
            stringResource(R.string.onb_p3_subtitle),
            fontSize = 14.sp,
            color = Color.White.copy(alpha = 0.6f),
        )

        Column(
            Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(16.dp))
                .background(MaterialTheme.colorScheme.surface)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            val p = positions
            when {
                p != null -> {
                    val total = p.totalReturnPct
                    Text(
                        stringResource(R.string.onb_p3_total_label),
                        fontSize = 10.sp,
                        fontWeight = FontWeight.SemiBold,
                        letterSpacing = 1.sp,
                        color = Color.White.copy(alpha = 0.45f),
                    )
                    Text(
                        Formatters.pct(total),
                        fontSize = 34.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace,
                        color = if (total >= 0) BrandEmerald else LossColor,
                    )
                    if (spark.size > 1) Sparkline(spark)
                    HorizontalDivider(color = Color.White.copy(alpha = 0.08f))

                    // Header + top-3 + the worst open position (always show a
                    // loss — that's the whole point).
                    ProofHeaderRow()
                    val sorted = p.positions.sortedByDescending { it.returnPct }
                    val top = sorted.take(3).toMutableList()
                    sorted.lastOrNull()?.takeIf { it.returnPct < 0 && top.none { t -> t.ticker == it.ticker } }
                        ?.let { top.add(it) }
                    top.forEach { pos ->
                        Row {
                            Text(
                                pos.ticker,
                                fontSize = 14.sp,
                                fontFamily = FontFamily.Monospace,
                                color = Color.White.copy(alpha = 0.92f),
                                modifier = Modifier.weight(1f),
                            )
                            Text(
                                Formatters.pct(pos.returnPct),
                                fontSize = 14.sp,
                                fontFamily = FontFamily.Monospace,
                                color = if (pos.returnPct >= 0) BrandEmerald else LossColor,
                            )
                            Text(
                                "${pos.daysHeld}",
                                fontSize = 14.sp,
                                fontFamily = FontFamily.Monospace,
                                color = Color.White.copy(alpha = 0.6f),
                                textAlign = TextAlign.End,
                                modifier = Modifier.width44(),
                            )
                        }
                    }
                    Text(
                        stringResource(R.string.onb_p3_positions_since, p.totalPositions),
                        fontSize = 10.sp,
                        color = Color.White.copy(alpha = 0.4f),
                    )
                }
                loaded -> Text(
                    stringResource(R.string.onb_p3_fallback),
                    fontSize = 14.sp,
                    color = Color.White.copy(alpha = 0.75f),
                )
                else -> Box(
                    Modifier.fillMaxWidth().height(120.dp),
                    contentAlignment = Alignment.Center,
                ) {
                    CircularProgressIndicator(color = Color.White, strokeWidth = 2.dp, modifier = Modifier.size(24.dp))
                }
            }
        }

        Row(
            Modifier.padding(top = 4.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Icon(
                Icons.Filled.Link,
                contentDescription = null,
                tint = Color.White.copy(alpha = 0.55f),
                modifier = Modifier.size(16.dp),
            )
            Text(
                stringResource(R.string.onb_p3_blockchain),
                fontSize = 13.sp,
                color = Color.White.copy(alpha = 0.55f),
            )
        }
    }
}

@Composable
private fun ProofHeaderRow() {
    Row {
        Text(
            stringResource(R.string.onb_p3_col_pick),
            fontSize = 10.sp, letterSpacing = 0.5.sp,
            color = Color.White.copy(alpha = 0.4f),
            modifier = Modifier.weight(1f),
        )
        Text(
            stringResource(R.string.onb_p3_col_return),
            fontSize = 10.sp, letterSpacing = 0.5.sp,
            color = Color.White.copy(alpha = 0.4f),
        )
        Text(
            stringResource(R.string.onb_p3_col_days),
            fontSize = 10.sp, letterSpacing = 0.5.sp,
            color = Color.White.copy(alpha = 0.4f),
            textAlign = TextAlign.End,
            modifier = Modifier.width44(),
        )
    }
}

private fun Modifier.width44() = this.then(Modifier.widthIn(min = 44.dp))

@Composable
private fun Sparkline(values: List<Double>) {
    Canvas(Modifier.fillMaxWidth().height(44.dp).padding(vertical = 4.dp)) {
        val minV = values.min()
        val maxV = values.max()
        val range = maxOf(0.0001, maxV - minV)
        val path = Path()
        values.forEachIndexed { i, v ->
            val x = size.width * i / (values.size - 1)
            val y = size.height * (1f - ((v - minV) / range).toFloat())
            if (i == 0) path.moveTo(x, y) else path.lineTo(x, y)
        }
        drawPath(
            path,
            brush = Brush.horizontalGradient(listOf(Color(0xFF33D9E6), BrandEmerald)),
            style = Stroke(width = 2.dp.toPx(), cap = StrokeCap.Round, join = StrokeJoin.Round),
        )
    }
}

// ---- Shared building blocks -------------------------------------------------

@Composable
private fun OnboardingScaffold(content: @Composable () -> Unit) {
    Column(
        Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 20.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp, Alignment.CenterVertically),
    ) {
        Spacer(Modifier.height(6.dp))
        content()
        Spacer(Modifier.height(6.dp))
    }
}

/** Circular brand badge with an emerald glow — iOS `OwlBadge`. */
@Composable
fun OwlBadge(size: androidx.compose.ui.unit.Dp = 60.dp) {
    Box(Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
        Box(
            Modifier
                .size(size + 24.dp)
                .background(
                    Brush.radialGradient(
                        listOf(BrandEmerald.copy(alpha = 0.35f), Color.Transparent),
                    ),
                ),
            contentAlignment = Alignment.Center,
        ) {
            Image(
                painterResource(R.drawable.ic_launcher_foreground),
                contentDescription = null,
                modifier = Modifier
                    .size(size)
                    .clip(CircleShape)
                    .background(MaterialTheme.colorScheme.surface),
            )
        }
    }
}

@Composable
private fun OnboardingTitle(text: String) {
    Text(
        text,
        fontSize = 32.sp,
        lineHeight = 38.sp,
        fontWeight = FontWeight.Bold,
        color = Color.White,
    )
}

@Composable
fun OnboardingDots(count: Int, index: Int) {
    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
        repeat(count) { i ->
            Box(
                Modifier
                    .size(width = if (i == index) 18.dp else 6.dp, height = 6.dp)
                    .clip(CircleShape)
                    .background(if (i == index) BrandEmerald else Color.White.copy(alpha = 0.18f)),
            )
        }
    }
}

/** Full-width gradient CTA — iOS `primaryCTA()`. */
@Composable
fun PrimaryCta(
    label: String,
    emerald: Boolean = false,
    busy: Boolean = false,
    enabled: Boolean = true,
    onClick: () -> Unit,
) {
    Row(
        Modifier
            .fillMaxWidth()
            .height(52.dp)
            .clip(RoundedCornerShape(14.dp))
            .background(
                Brush.horizontalGradient(
                    if (emerald) listOf(EmeraldDeep, BrandEmerald)
                    else listOf(BrandIndigo, BrandEmerald),
                ),
            )
            .clickable(enabled = enabled && !busy, onClick = onClick),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.Center,
    ) {
        if (busy) {
            CircularProgressIndicator(
                color = if (emerald) Color.Black else Color.White,
                strokeWidth = 2.dp,
                modifier = Modifier.size(20.dp),
            )
        } else {
            Text(
                label,
                fontSize = 16.sp,
                fontWeight = FontWeight.SemiBold,
                color = if (emerald) Color.Black else Color.White,
            )
        }
    }
}
