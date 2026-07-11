package com.vectorialdata.app.feature.home

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.drawText
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.rememberTextMeasurer
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.vectorialdata.app.R
import com.vectorialdata.app.core.model.PortfolioHistoryPoint
import com.vectorialdata.app.core.net.ApiClient
import com.vectorialdata.app.core.util.Formatters
import com.vectorialdata.app.feature.common.VDCard
import com.vectorialdata.app.ui.theme.BrandEmerald
import kotlinx.coroutines.flow.MutableStateFlow
import java.util.Locale

/** Public "Vectorial model" history — cached across tab switches. */
private object ChartState {
    val points = MutableStateFlow<List<PortfolioHistoryPoint>>(emptyList())
    val isLoading = MutableStateFlow(false)

    suspend fun load() {
        if (isLoading.value) return
        isLoading.value = true
        try {
            points.value = ApiClient.get<List<PortfolioHistoryPoint>>("/api/portfolio/history")
        } catch (_: Exception) {
            // Chart quietly keeps its previous data on failure (iOS shows "No data yet").
        } finally {
            isLoading.value = false
        }
    }

    fun reset() {
        points.value = emptyList()
        isLoading.value = false
    }
}

internal fun resetPerformanceChartCache() = ChartState.reset()

/**
 * Mirror of iOS `PerformanceChart`: Vectorial (emerald, solid) vs
 * S&P 500 (white, dashed) cumulative return lines with a zero rule.
 */
@Composable
fun PerformanceChart() {
    val points by ChartState.points.collectAsStateWithLifecycle()
    val isLoading by ChartState.isLoading.collectAsStateWithLifecycle()

    LaunchedEffect(Unit) { ChartState.load() }

    VDCard(innerSpacing = 12.dp) {
        // Header: VD badge + model label
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            Box(
                Modifier
                    .clip(RoundedCornerShape(6.dp))
                    .background(BrandEmerald)
                    .size(26.dp),
                contentAlignment = Alignment.Center,
            ) {
                Text("VD", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color(0xFF05080A))
            }
            Column {
                Text(
                    stringResource(R.string.chart_model_label),
                    fontSize = 13.sp,
                    fontWeight = FontWeight.SemiBold,
                    letterSpacing = 1.2.sp,
                    color = MaterialTheme.colorScheme.onBackground,
                )
                Text(
                    stringResource(R.string.chart_model_subtitle),
                    fontSize = 11.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }

        val latestVectorial = points.lastOrNull()?.returnPct
        val latestSpy = points.lastOrNull { it.spyReturnPct != null }?.spyReturnPct

        if (latestVectorial != null) {
            Row(horizontalArrangement = Arrangement.spacedBy(16.dp), verticalAlignment = Alignment.CenterVertically) {
                LegendDot(BrandEmerald, stringResource(R.string.chart_legend_vectorial, Formatters.pct(latestVectorial)))
                latestSpy?.let { LegendDot(Color.White.copy(alpha = 0.5f), stringResource(R.string.chart_legend_spy, Formatters.pct(it))) }
            }
        }

        when {
            points.isEmpty() && isLoading -> Box(
                Modifier.fillMaxWidth().height(200.dp),
                contentAlignment = Alignment.Center,
            ) { CircularProgressIndicator(color = BrandEmerald) }

            points.isEmpty() -> Box(
                Modifier.fillMaxWidth().height(200.dp),
                contentAlignment = Alignment.Center,
            ) { Text(stringResource(R.string.chart_no_data), color = MaterialTheme.colorScheme.onSurfaceVariant) }

            else -> {
                ChartCanvas(points, Modifier.fillMaxWidth().height(200.dp))
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    val axisPoints = listOf(
                        points.first(),
                        points[points.size / 2],
                        points.last(),
                    )
                    axisPoints.forEach {
                        Text(
                            Formatters.shortDate(it.date),
                            fontSize = 10.sp,
                            color = Color.White.copy(alpha = 0.4f),
                        )
                    }
                }
            }
        }

        if (latestVectorial != null && latestSpy != null) {
            val diff = latestVectorial - latestSpy
            val sign = if (diff >= 0) "+" else ""
            Text(
                stringResource(R.string.chart_vs_spy, "$sign${String.format(Locale.US, "%.2f", diff)}%"),
                fontSize = 12.sp,
                fontWeight = FontWeight.Medium,
                color = if (diff >= 0) BrandEmerald else MaterialTheme.colorScheme.error,
            )
        }

        Text(
            stringResource(R.string.chart_disclaimer),
            fontSize = 10.sp,
            color = Color.White.copy(alpha = 0.35f),
        )
    }
}

@Composable
private fun LegendDot(color: Color, label: String) {
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
        Box(Modifier.size(7.dp).clip(CircleShape).background(color))
        Text(label, fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}

@Composable
private fun ChartCanvas(points: List<PortfolioHistoryPoint>, modifier: Modifier = Modifier) {
    val textMeasurer = rememberTextMeasurer()
    val labelStyle = TextStyle(color = Color.White.copy(alpha = 0.4f), fontSize = 10.sp)

    Canvas(modifier) {
        val dated = points.mapNotNull { p ->
            Formatters.parseDate(p.date)?.toEpochDay()?.let { day -> Triple(day, p.returnPct, p.spyReturnPct) }
        }
        if (dated.size < 2) return@Canvas

        val minDay = dated.minOf { it.first }
        val maxDay = dated.maxOf { it.first }
        if (maxDay == minDay) return@Canvas

        val allValues = dated.map { it.second } + dated.mapNotNull { it.third } + listOf(0.0)
        var minV = allValues.min()
        var maxV = allValues.max()
        val padV = (maxV - minV).coerceAtLeast(1.0) * 0.08
        minV -= padV
        maxV += padV

        val rightPad = 38.dp.toPx()
        val w = size.width - rightPad
        val h = size.height

        fun xOf(day: Long): Float = (day - minDay).toFloat() / (maxDay - minDay).toFloat() * w
        fun yOf(v: Double): Float = ((maxV - v) / (maxV - minV)).toFloat() * h

        // Zero rule
        val zeroY = yOf(0.0)
        drawLine(
            color = Color.White.copy(alpha = 0.15f),
            start = Offset(0f, zeroY),
            end = Offset(w, zeroY),
            strokeWidth = 1.dp.toPx(),
        )

        // S&P 500 — dashed white
        val spyPath = Path()
        var spyStarted = false
        dated.forEach { (day, _, spy) ->
            if (spy != null) {
                val o = Offset(xOf(day), yOf(spy))
                if (!spyStarted) { spyPath.moveTo(o.x, o.y); spyStarted = true } else spyPath.lineTo(o.x, o.y)
            }
        }
        if (spyStarted) {
            drawPath(
                spyPath,
                color = Color.White.copy(alpha = 0.5f),
                style = Stroke(
                    width = 1.5.dp.toPx(),
                    pathEffect = PathEffect.dashPathEffect(floatArrayOf(4.dp.toPx(), 3.dp.toPx())),
                ),
            )
        }

        // Vectorial — solid emerald
        val vPath = Path()
        dated.forEachIndexed { i, (day, v, _) ->
            val o = Offset(xOf(day), yOf(v))
            if (i == 0) vPath.moveTo(o.x, o.y) else vPath.lineTo(o.x, o.y)
        }
        drawPath(
            vPath,
            color = BrandEmerald,
            style = Stroke(width = 2.2.dp.toPx(), cap = StrokeCap.Round, join = StrokeJoin.Round),
        )

        // Y-axis labels (trailing edge, like Swift Charts' default)
        fun label(v: Double, atY: Float) {
            val layout = textMeasurer.measure("${v.toInt()}%", labelStyle)
            drawText(
                textMeasurer,
                "${v.toInt()}%",
                topLeft = Offset(w + 6.dp.toPx(), (atY - layout.size.height / 2f).coerceIn(0f, h - layout.size.height)),
                style = labelStyle,
            )
        }
        label(maxV, yOf(maxV))
        label(0.0, zeroY)
        label(minV, yOf(minV))
    }
}
