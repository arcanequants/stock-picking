package com.vectorialdata.app.feature.home

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
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
import com.vectorialdata.app.core.auth.AuthManager
import com.vectorialdata.app.core.model.PortfolioHistoryPoint
import com.vectorialdata.app.core.net.ApiClient
import com.vectorialdata.app.core.util.Formatters
import com.vectorialdata.app.feature.common.VDCard
import com.vectorialdata.app.ui.theme.BrandEmerald
import kotlinx.coroutines.flow.MutableStateFlow
import java.time.LocalDate
import java.time.temporal.ChronoUnit

/** Range pills — mirror of iOS `PersonalRange`. */
private enum class PersonalRange(val label: String) {
    ITD("ITD"), YTD("YTD"), MOM("1M"), YOY("1A");

    fun cutoff(today: LocalDate): LocalDate? = when (this) {
        ITD -> null
        YTD -> today.withDayOfYear(1)
        MOM -> today.minusDays(30)
        YOY -> today.minusMonths(12)
    }
}

/** Personal history — cached across tab switches, reloaded when the user changes. */
private object PersonalState {
    val points = MutableStateFlow<List<PortfolioHistoryPoint>>(emptyList())
    val isLoading = MutableStateFlow(true) // starts true so first mount shows the loading row
    val errorMessage = MutableStateFlow<String?>(null)
    var loadedEmail: String? = null

    suspend fun load() {
        isLoading.value = true
        errorMessage.value = null
        try {
            val pts = ApiClient.get<List<PortfolioHistoryPoint>>("/api/portfolio/history?view=personal")
            points.value = pts.filter { it.personalReturnPct != null }
        } catch (e: Exception) {
            errorMessage.value = e.message ?: "No pudimos cargar tu performance."
        } finally {
            isLoading.value = false
        }
    }

    fun reset() {
        points.value = emptyList()
        errorMessage.value = null
        isLoading.value = true
        loadedEmail = null
    }
}

internal fun resetPersonalPerformanceCache() = PersonalState.reset()

/**
 * "TU PORTAFOLIO" — the user's real-money performance over the picks they
 * actually bought. Mirror of iOS `PersonalPerformanceCard`.
 */
@Composable
fun PersonalPerformanceCard() {
    val user by AuthManager.currentUser.collectAsStateWithLifecycle()
    val points by PersonalState.points.collectAsStateWithLifecycle()
    val isLoading by PersonalState.isLoading.collectAsStateWithLifecycle()
    val errorMessage by PersonalState.errorMessage.collectAsStateWithLifecycle()
    var range by rememberSaveable { mutableStateOf(PersonalRange.ITD) }

    val email = user?.email
    LaunchedEffect(email) {
        if (email != null && PersonalState.loadedEmail != email) {
            PersonalState.loadedEmail = email
            PersonalState.load()
        }
    }

    if (email == null) return

    when {
        points.isNotEmpty() -> CardBody(email, points, range, onRange = { range = it })
        isLoading -> VDCard {
            Text(
                "Cargando tu performance…",
                fontSize = 12.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
        errorMessage != null -> Text(errorMessage.orEmpty(), fontSize = 12.sp, color = MaterialTheme.colorScheme.error)
        else -> Unit // no personal data yet — card hides itself, like iOS EmptyView
    }
}

@Composable
private fun CardBody(
    email: String,
    points: List<PortfolioHistoryPoint>,
    range: PersonalRange,
    onRange: (PersonalRange) -> Unit,
) {
    val today = LocalDate.now()
    val value = rangeReturn(points, range, today)
    val heroColor = when {
        value == null -> MaterialTheme.colorScheme.onSurfaceVariant
        value >= 0 -> BrandEmerald
        else -> MaterialTheme.colorScheme.error
    }

    VDCard(innerSpacing = 10.dp) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            Box(
                Modifier.size(28.dp).clip(CircleShape).background(BrandEmerald.copy(alpha = 0.2f)),
                contentAlignment = Alignment.Center,
            ) {
                Text(
                    email.take(1).uppercase(),
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    color = BrandEmerald,
                )
            }
            Column {
                Text(
                    "TU PORTAFOLIO",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold,
                    letterSpacing = 1.1.sp,
                    color = MaterialTheme.colorScheme.onBackground,
                )
                Text(
                    "Tu dinero real · solo las picks que compraste",
                    fontSize = 11.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }

        Text(
            value?.let { Formatters.pct(it) } ?: "—",
            fontSize = 38.sp,
            fontWeight = FontWeight.Bold,
            color = heroColor,
        )

        Text(
            subtitle(points, range, today),
            fontSize = 12.sp,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )

        Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.padding(top = 2.dp)) {
            PersonalRange.entries.forEach { r ->
                val selected = r == range
                Text(
                    r.label,
                    fontSize = 12.sp,
                    fontWeight = if (selected) FontWeight.SemiBold else FontWeight.Normal,
                    color = if (selected) BrandEmerald else MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier
                        .clip(RoundedCornerShape(8.dp))
                        .background(if (selected) BrandEmerald.copy(alpha = 0.15f) else Color.White.copy(alpha = 0.06f))
                        .clickable { onRange(r) }
                        .padding(horizontal = 12.dp, vertical = 6.dp),
                )
            }
        }
    }
}

/**
 * ITD = latest cumulative value; other ranges = change since the range
 * cutoff, falling back to ITD when the user started after the cutoff.
 */
private fun rangeReturn(points: List<PortfolioHistoryPoint>, range: PersonalRange, today: LocalDate): Double? {
    val latest = points.lastOrNull()?.personalReturnPct ?: return null
    val cutoff = range.cutoff(today) ?: return latest
    val startValue = points.lastOrNull { p ->
        Formatters.parseDate(p.date)?.isAfter(cutoff) == false
    }?.personalReturnPct ?: return latest
    return latest - startValue
}

private fun subtitle(points: List<PortfolioHistoryPoint>, range: PersonalRange, today: LocalDate): String {
    val firstDate = points.firstOrNull()?.let { Formatters.parseDate(it.date) } ?: return ""
    val days = ChronoUnit.DAYS.between(firstDate, today).coerceAtLeast(1)
    val dayWord = if (days == 1L) "día" else "días"
    val cutoff = range.cutoff(today)
    val startedAfterCutoff = cutoff != null && firstDate.isAfter(cutoff)
    return when (range) {
        PersonalRange.ITD -> "Llevas $days $dayWord invirtiendo"
        PersonalRange.YTD ->
            if (startedAfterCutoff) "En lo que va del año · solo llevas $days $dayWord"
            else "En lo que va del año"
        PersonalRange.MOM ->
            if (startedAfterCutoff) "Últimos 30 días · solo llevas $days $dayWord"
            else "Últimos 30 días"
        PersonalRange.YOY ->
            if (startedAfterCutoff) "Últimos 12 meses · solo llevas $days $dayWord"
            else "Últimos 12 meses"
    }
}
