package com.vectorialdata.app.feature.picks

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.AccessTimeFilled
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.pluralStringResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.vectorialdata.app.R
import com.vectorialdata.app.core.model.Pick
import com.vectorialdata.app.core.store.PickStatusStore
import com.vectorialdata.app.core.util.Formatters
import com.vectorialdata.app.feature.common.VDCard
import com.vectorialdata.app.ui.theme.BrandEmerald
import java.time.LocalDate

/**
 * Friday-digest landing screen — mirror of iOS `WeeklyDigestView`. Reached by
 * tapping the weekly recap push; reads everything off [PickStatusStore] so
 * it's always in sync with decisions made elsewhere in the app.
 */
@Composable
fun WeeklyDigestScreen(
    onBack: () -> Unit,
    onOpenPick: (Int) -> Unit,
    modifier: Modifier = Modifier,
) {
    val picks by PickStatusStore.picks.collectAsStateWithLifecycle()

    LaunchedEffect(Unit) {
        if (PickStatusStore.picks.value.isEmpty()) PickStatusStore.load()
    }

    // Mirrors the backend's 7-day rolling window so the in-app summary
    // matches the push body the user just tapped. `decidedAt` is an ISO
    // timestamp, so a lexicographic compare against yyyy-MM-dd works.
    val cutoff = LocalDate.now().minusDays(7).toString()
    val boughtThisWeek = PickStatusStore.bought(picks)
        .filter { (it.decidedAt ?: "") >= cutoff }
        .sortedByDescending { it.pickNumber }
    val pending = PickStatusStore.pending(picks).sortedByDescending { it.pickNumber }

    BackHandler(onBack = onBack)

    Column(modifier.fillMaxSize()) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            IconButton(onClick = onBack) {
                Icon(
                    Icons.AutoMirrored.Filled.ArrowBack,
                    contentDescription = stringResource(R.string.back),
                    tint = MaterialTheme.colorScheme.onBackground,
                )
            }
            Text(
                stringResource(R.string.digest_title),
                fontSize = 20.sp,
                fontWeight = FontWeight.SemiBold,
                color = MaterialTheme.colorScheme.onBackground,
            )
        }

        LazyColumn(
            Modifier.fillMaxSize(),
            contentPadding = androidx.compose.foundation.layout.PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            item { DigestHeader(boughtThisWeek.size, pending.size) }

            if (boughtThisWeek.isNotEmpty()) {
                item {
                    DigestSectionHeader(
                        stringResource(R.string.digest_bought_header),
                        boughtThisWeek.size,
                        Icons.Filled.CheckCircle,
                    )
                }
                items(boughtThisWeek.size, key = { "b${boughtThisWeek[it].pickNumber}" }) { i ->
                    BoughtThisWeekRow(boughtThisWeek[i]) { onOpenPick(boughtThisWeek[i].pickNumber) }
                }
            }

            if (pending.isNotEmpty()) {
                item {
                    DigestSectionHeader(
                        stringResource(R.string.digest_pending_header),
                        pending.size,
                        Icons.Filled.AccessTimeFilled,
                    )
                }
                items(pending.size, key = { "p${pending[it].pickNumber}" }) { i ->
                    PendingDigestRow(pending[i]) { onOpenPick(pending[i].pickNumber) }
                }
            }

            if (boughtThisWeek.isEmpty() && pending.isEmpty()) {
                item { AllCaughtUpCard() }
            }

            item { Spacer(Modifier.height(16.dp)) }
        }
    }
}

@Composable
private fun DigestHeader(bought: Int, pending: Int) {
    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
        Text(
            stringResource(R.string.digest_header),
            fontSize = 20.sp,
            fontWeight = FontWeight.SemiBold,
            color = MaterialTheme.colorScheme.onBackground,
        )
        val summary = when {
            bought > 0 && pending > 0 ->
                pluralStringResource(R.plurals.digest_bought_count, bought, bought) +
                    " · " + pluralStringResource(R.plurals.digest_pending_count, pending, pending)
            bought > 0 ->
                pluralStringResource(R.plurals.digest_bought_count, bought, bought) +
                    " · " + stringResource(R.string.digest_up_to_date_suffix)
            pending > 0 -> pluralStringResource(R.plurals.digest_pick_pending_count, pending, pending)
            else -> stringResource(R.string.digest_no_moves)
        }
        Text(summary, fontSize = 13.sp, color = Color.White.copy(alpha = 0.65f))
    }
}

@Composable
private fun DigestSectionHeader(title: String, count: Int, icon: androidx.compose.ui.graphics.vector.ImageVector) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(6.dp),
        modifier = Modifier.padding(top = 8.dp),
    ) {
        Icon(icon, contentDescription = null, tint = Color.White.copy(alpha = 0.55f), modifier = Modifier.size(14.dp))
        Text(
            title,
            fontSize = 12.sp,
            fontWeight = FontWeight.SemiBold,
            letterSpacing = 1.1.sp,
            color = Color.White.copy(alpha = 0.55f),
        )
        Text(
            "$count",
            fontSize = 11.sp,
            fontWeight = FontWeight.SemiBold,
            color = Color.White.copy(alpha = 0.5f),
            modifier = Modifier
                .clip(RoundedCornerShape(50))
                .background(Color.White.copy(alpha = 0.08f))
                .padding(horizontal = 8.dp, vertical = 2.dp),
        )
    }
}

@Composable
private fun BoughtThisWeekRow(pick: Pick, onClick: () -> Unit) {
    VDCard(onClick = onClick, innerSpacing = 0.dp) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            Icon(Icons.Filled.CheckCircle, contentDescription = null, tint = BrandEmerald, modifier = Modifier.size(22.dp))
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
                Text(pick.name, fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant, maxLines = 1)
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

@Composable
private fun PendingDigestRow(pick: Pick, onClick: () -> Unit) {
    VDCard(onClick = onClick, innerSpacing = 2.dp) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Text("#${pick.pickNumber}", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
            Text(
                pick.ticker,
                fontSize = 15.sp,
                fontWeight = FontWeight.SemiBold,
                color = MaterialTheme.colorScheme.onBackground,
            )
            Spacer(Modifier.weight(1f))
            Text(stringResource(R.string.picks_decide), fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = BrandEmerald)
        }
        Text(pick.name, fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant, maxLines = 1)
        Text(
            stringResource(R.string.digest_goes, Formatters.pct(pick.returnPct)),
            fontSize = 11.sp,
            color = Color.White.copy(alpha = 0.45f),
        )
    }
}

@Composable
private fun AllCaughtUpCard() {
    VDCard(innerSpacing = 8.dp) {
        Column(Modifier.fillMaxWidth().padding(vertical = 8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(
                stringResource(R.string.digest_caught_up_title),
                fontSize = 15.sp,
                fontWeight = FontWeight.SemiBold,
                color = MaterialTheme.colorScheme.onBackground,
            )
            Text(
                stringResource(R.string.digest_caught_up_body),
                fontSize = 12.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}
