package com.vectorialdata.app.feature.news

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.RadioButtonChecked
import androidx.compose.material.icons.filled.RadioButtonUnchecked
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.vectorialdata.app.R
import com.vectorialdata.app.core.net.ApiClient
import com.vectorialdata.app.ui.theme.AppBackground
import com.vectorialdata.app.ui.theme.BrandEmerald
import kotlinx.coroutines.launch
import kotlinx.serialization.Serializable

/**
 * "Tu mezcla" — the user picks which news topics + regions they want pushed
 * and when (instant / daily digest / none). Persisted via /api/news/prefs.
 * "Mis picks" and "Global" are always on and shown as locked rows.
 * Mirror of iOS `NewsPrefsView`.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NewsPrefsSheet(onDismiss: () -> Unit) {
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    val scope = rememberCoroutineScope()

    val topics = remember { mutableStateOf(setOf<String>()) }
    val regions = remember { mutableStateOf(setOf<String>()) }
    var delivery by remember { mutableStateOf("instant") }
    var isSaving by remember { mutableStateOf(false) }
    var saveError by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(Unit) {
        try {
            val resp: PrefsResponse = ApiClient.get("/api/news/prefs")
            topics.value = resp.prefs.topics.toSet()
            regions.value = resp.prefs.regions.toSet()
            delivery = resp.prefs.delivery
        } catch (_: Exception) {
            // Defaults: everything on, instant.
            topics.value = TOPIC_ROWS.map { it.id }.toSet()
            regions.value = REGION_ROWS.map { it.id }.toSet()
            delivery = "instant"
        }
    }

    fun save() {
        if (isSaving) return
        isSaving = true
        scope.launch {
            try {
                ApiClient.put<PrefsPayload, PrefsResponse>(
                    "/api/news/prefs",
                    PrefsPayload(topics.value.toList(), regions.value.toList(), delivery),
                )
                saveError = null
                // Dismiss ONLY when the server accepted the prefs — closing
                // on failure made the toggles look saved while instant pushes
                // kept coming.
                onDismiss()
            } catch (e: Exception) {
                saveError = com.vectorialdata.app.core.i18n.Localizer.get(R.string.news_prefs_save_error)
            } finally {
                isSaving = false
            }
        }
    }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
        containerColor = AppBackground,
    ) {
        Column(Modifier.fillMaxWidth().fillMaxHeight(0.92f)) {
            // Title row with Guardar.
            Row(
                Modifier.fillMaxWidth().padding(horizontal = 16.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    stringResource(R.string.news_prefs_title),
                    fontSize = 17.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = Color.White,
                )
                Spacer(Modifier.weight(1f))
                if (isSaving) {
                    CircularProgressIndicator(
                        color = BrandEmerald,
                        strokeWidth = 2.dp,
                        modifier = Modifier.size(20.dp),
                    )
                } else {
                    Text(
                        stringResource(R.string.news_prefs_save),
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Bold,
                        color = BrandEmerald,
                        modifier = Modifier.clickable { save() },
                    )
                }
            }

            Column(
                Modifier
                    .weight(1f)
                    .verticalScroll(rememberScrollState())
                    .padding(16.dp),
            ) {
                Text(
                    stringResource(R.string.news_prefs_subtitle),
                    fontSize = 14.sp,
                    color = Color.White.copy(alpha = 0.6f),
                    modifier = Modifier.padding(bottom = 8.dp),
                )

                SectionHeader(stringResource(R.string.news_prefs_topics))
                LockedRow(
                    emoji = "📈",
                    title = stringResource(R.string.news_topic_picks),
                    subtitle = stringResource(R.string.news_prefs_picks_sub),
                )
                TOPIC_ROWS.forEach { row ->
                    ToggleRow(
                        emoji = row.emoji,
                        title = stringResource(row.titleRes),
                        subtitle = row.subtitleRes?.let { stringResource(it) },
                        isOn = topics.value.contains(row.id),
                    ) { on ->
                        topics.value = if (on) topics.value + row.id else topics.value - row.id
                    }
                }

                SectionHeader(stringResource(R.string.news_prefs_regions))
                LockedRow(
                    emoji = "🌍",
                    title = stringResource(R.string.news_prefs_global),
                    subtitle = stringResource(R.string.news_prefs_global_sub),
                )
                REGION_ROWS.forEach { row ->
                    ToggleRow(
                        emoji = row.emoji,
                        title = stringResource(row.titleRes),
                        subtitle = null,
                        isOn = regions.value.contains(row.id),
                    ) { on ->
                        regions.value = if (on) regions.value + row.id else regions.value - row.id
                    }
                }

                SectionHeader(stringResource(R.string.news_prefs_when))
                DELIVERY_ROWS.forEach { row ->
                    RadioRow(
                        title = stringResource(row.titleRes),
                        subtitle = stringResource(row.subtitleRes),
                        selected = delivery == row.id,
                    ) { delivery = row.id }
                }
            }

            saveError?.let { err ->
                Text(
                    err,
                    fontSize = 13.sp,
                    color = MaterialTheme.colorScheme.error,
                    textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(MaterialTheme.colorScheme.surface)
                        .padding(10.dp),
                )
            }
        }
    }
}

@Composable
private fun SectionHeader(title: String) {
    Text(
        title,
        fontSize = 12.sp,
        fontWeight = FontWeight.Bold,
        letterSpacing = 1.1.sp,
        color = Color.White.copy(alpha = 0.4f),
        modifier = Modifier.padding(top = 16.dp, bottom = 6.dp, start = 4.dp),
    )
}

@Composable
private fun RowShell(
    emoji: String,
    title: String,
    subtitle: String?,
    borderColor: Color = Color.White.copy(alpha = 0.06f),
    trailing: @Composable () -> Unit,
) {
    Row(
        Modifier
            .fillMaxWidth()
            .padding(bottom = 8.dp)
            .clip(RoundedCornerShape(14.dp))
            .background(MaterialTheme.colorScheme.surface)
            .border(1.dp, borderColor, RoundedCornerShape(14.dp))
            .padding(12.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(11.dp),
    ) {
        Text(emoji, fontSize = 19.sp)
        Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(1.dp)) {
            Text(title, fontSize = 15.sp, fontWeight = FontWeight.Medium, color = Color.White)
            if (subtitle != null) {
                Text(subtitle, fontSize = 10.sp, color = Color.White.copy(alpha = 0.4f))
            }
        }
        trailing()
    }
}

@Composable
private fun ToggleRow(
    emoji: String,
    title: String,
    subtitle: String?,
    isOn: Boolean,
    onChange: (Boolean) -> Unit,
) {
    RowShell(emoji, title, subtitle) {
        Switch(
            checked = isOn,
            onCheckedChange = onChange,
            colors = SwitchDefaults.colors(
                checkedTrackColor = BrandEmerald,
                checkedThumbColor = Color.White,
            ),
        )
    }
}

@Composable
private fun LockedRow(emoji: String, title: String, subtitle: String) {
    RowShell(emoji, title, subtitle) {
        Text(
            stringResource(R.string.news_prefs_always),
            fontSize = 10.sp,
            fontWeight = FontWeight.SemiBold,
            color = Color.White.copy(alpha = 0.35f),
        )
    }
}

@Composable
private fun RadioRow(title: String, subtitle: String, selected: Boolean, tap: () -> Unit) {
    Row(
        Modifier
            .fillMaxWidth()
            .padding(bottom = 8.dp)
            .clip(RoundedCornerShape(14.dp))
            .background(MaterialTheme.colorScheme.surface)
            .border(
                1.dp,
                if (selected) BrandEmerald.copy(alpha = 0.4f) else Color.White.copy(alpha = 0.06f),
                RoundedCornerShape(14.dp),
            )
            .clickable(onClick = tap)
            .padding(12.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(11.dp),
    ) {
        Icon(
            if (selected) Icons.Filled.RadioButtonChecked else Icons.Filled.RadioButtonUnchecked,
            contentDescription = null,
            tint = if (selected) BrandEmerald else Color.White.copy(alpha = 0.3f),
            modifier = Modifier.size(22.dp),
        )
        Column(verticalArrangement = Arrangement.spacedBy(1.dp)) {
            Text(title, fontSize = 15.sp, fontWeight = FontWeight.Medium, color = Color.White)
            Text(subtitle, fontSize = 10.sp, color = Color.White.copy(alpha = 0.4f))
        }
    }
}

// Togglable rows (picks / global are locked-on, excluded here) — iOS `NewsPrefsModel`.
private data class PrefRow(val id: String, val emoji: String, val titleRes: Int, val subtitleRes: Int? = null)
private data class DeliveryRow(val id: String, val titleRes: Int, val subtitleRes: Int)

private val TOPIC_ROWS = listOf(
    PrefRow("companies", "🏢", R.string.news_prefs_companies, R.string.news_prefs_companies_sub),
    PrefRow("economy", "🌍", R.string.news_topic_economy, R.string.news_prefs_economy_sub),
    PrefRow("politics", "🏛️", R.string.news_prefs_politics, R.string.news_prefs_politics_sub),
    PrefRow("markets", "💱", R.string.news_prefs_markets, R.string.news_prefs_markets_sub),
)

private val REGION_ROWS = listOf(
    PrefRow("us", "🇺🇸", R.string.news_region_us),
    PrefRow("mx", "🇲🇽", R.string.news_region_mx),
    PrefRow("br", "🇧🇷", R.string.news_region_br),
    PrefRow("in", "🇮🇳", R.string.news_region_in),
    PrefRow("eu", "🇪🇺", R.string.news_region_eu),
    PrefRow("asia", "🌏", R.string.news_region_asia),
)

private val DELIVERY_ROWS = listOf(
    DeliveryRow("instant", R.string.news_delivery_instant, R.string.news_delivery_instant_sub),
    DeliveryRow("daily", R.string.news_delivery_daily, R.string.news_delivery_daily_sub),
    DeliveryRow("none", R.string.news_delivery_none, R.string.news_delivery_none_sub),
)

@Serializable
private data class PrefsPayload(
    val topics: List<String>,
    val regions: List<String>,
    val delivery: String,
)

@Serializable
private data class PrefsEnvelope(
    val topics: List<String> = emptyList(),
    val regions: List<String> = emptyList(),
    val delivery: String = "instant",
)

@Serializable
private data class PrefsResponse(val prefs: PrefsEnvelope = PrefsEnvelope())
