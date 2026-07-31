package com.vectorialdata.app.feature.news

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material.icons.filled.Tune
import androidx.compose.material.icons.outlined.Newspaper
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
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
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.vectorialdata.app.R
import com.vectorialdata.app.core.i18n.Localizer
import com.vectorialdata.app.core.model.NewsItem
import com.vectorialdata.app.core.model.NewsTaxonomy
import com.vectorialdata.app.core.store.NewsStore
import com.vectorialdata.app.core.util.Formatters
import com.vectorialdata.app.feature.common.VDCard
import com.vectorialdata.app.ui.theme.BrandEmerald
import kotlinx.coroutines.launch
import java.time.Instant

/**
 * Full-screen news feed + in-place detail — mirror of iOS `NewsListView`
 * (navigation uses the same open-state pattern as PicksScreen). Topic chips
 * filter the feed; the tune icon opens "Tu mezcla" (delivery prefs).
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NewsListScreen(onBack: () -> Unit, modifier: Modifier = Modifier) {
    val items by NewsStore.items.collectAsStateWithLifecycle()
    val isLoading by NewsStore.isLoading.collectAsStateWithLifecycle()
    val errorMessage by NewsStore.errorMessage.collectAsStateWithLifecycle()
    val lastReadAt by NewsStore.lastReadAt.collectAsStateWithLifecycle()
    val selectedTopic by NewsStore.selectedTopic.collectAsStateWithLifecycle()
    val scope = rememberCoroutineScope()

    var openNewsId by rememberSaveable { mutableStateOf<String?>(null) }
    var showPrefs by rememberSaveable { mutableStateOf(false) }

    // Always refetch on opening the section — a news feed must never show
    // only yesterday's cache; existing items stay visible while it runs.
    // The read cursor is stamped once on entry; rows compare against the
    // value captured when the screen opened so dots stay visible this visit.
    LaunchedEffect(Unit) {
        NewsStore.load()
        NewsStore.markAllAsRead()
    }
    val cursorAtOpen = rememberSaveable { lastReadAt }

    if (showPrefs) {
        NewsPrefsSheet(onDismiss = { showPrefs = false })
    }

    val openItem = items.firstOrNull { it.id == openNewsId }
    if (openItem != null) {
        BackHandler { openNewsId = null }
        NewsDetailScreen(item = openItem, onBack = { openNewsId = null }, modifier = modifier)
        return
    }

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
                stringResource(R.string.news_title),
                fontSize = 28.sp,
                fontWeight = FontWeight.SemiBold,
                color = MaterialTheme.colorScheme.onBackground,
            )
            Spacer(Modifier.weight(1f))
            IconButton(onClick = { showPrefs = true }) {
                Icon(
                    Icons.Filled.Tune,
                    contentDescription = stringResource(R.string.news_prefs_title),
                    tint = BrandEmerald,
                )
            }
        }

        PullToRefreshBox(
            isRefreshing = isLoading && items.isNotEmpty(),
            onRefresh = { scope.launch { NewsStore.load() } },
            modifier = Modifier.fillMaxSize(),
        ) {
            when {
                isLoading && items.isEmpty() -> Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = BrandEmerald)
                }

                errorMessage != null && items.isEmpty() -> Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text(
                        errorMessage.orEmpty(),
                        fontSize = 13.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.padding(32.dp),
                    )
                }

                items.isEmpty() -> Column(Modifier.fillMaxSize().padding(16.dp)) {
                    EmptyNewsCard()
                }

                else -> {
                    val visible = NewsStore.visibleItems(items, selectedTopic)
                    LazyColumn(
                        Modifier.fillMaxSize(),
                        contentPadding = PaddingValues(16.dp),
                        verticalArrangement = Arrangement.spacedBy(10.dp),
                    ) {
                        item { TopicChips(items, selectedTopic) }
                        items(visible.size, key = { visible[it].id }) { i ->
                            val item = visible[i]
                            NewsRow(
                                item = item,
                                isUnread = item.isUnread(cursorAtOpen),
                                onClick = { openNewsId = item.id },
                            )
                        }
                    }
                }
            }
        }
    }
}

/** Horizontal filter chips: "Todo" + one per topic present in the feed. */
@Composable
private fun TopicChips(items: List<NewsItem>, selected: String?) {
    Row(
        Modifier.horizontalScroll(rememberScrollState()),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Chip(label = stringResource(R.string.news_chip_all), active = selected == null) {
            NewsStore.selectedTopic.value = null
        }
        NewsStore.availableTopics(items).forEach { id ->
            val meta = NewsTaxonomy.topics.first { it.id == id }
            Chip(
                label = "${meta.emoji} ${stringResource(meta.labelRes)}",
                active = selected == id,
            ) {
                NewsStore.selectedTopic.value = if (selected == id) null else id
            }
        }
    }
}

@Composable
private fun Chip(label: String, active: Boolean, tap: () -> Unit) {
    Text(
        label,
        fontSize = 13.sp,
        fontWeight = FontWeight.SemiBold,
        color = if (active) BrandEmerald else Color.White.copy(alpha = 0.62f),
        modifier = Modifier
            .clip(CircleShape)
            .background(
                if (active) BrandEmerald.copy(alpha = 0.14f)
                else MaterialTheme.colorScheme.surface,
            )
            .border(
                1.dp,
                if (active) BrandEmerald.copy(alpha = 0.4f) else Color.White.copy(alpha = 0.08f),
                CircleShape,
            )
            .clickable(onClick = tap)
            .padding(horizontal = 13.dp, vertical = 7.dp),
    )
}

/** Meta line + headline + summary + read-time/ticker hint — iOS `NewsRow`. */
@Composable
private fun NewsRow(item: NewsItem, isUnread: Boolean, onClick: () -> Unit) {
    VDCard(onClick = onClick, innerSpacing = 7.dp) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(6.dp),
        ) {
            TopicTag(item.topic)
            item.regions.orEmpty().forEach { r ->
                Text(NewsTaxonomy.regionFlag(r), fontSize = 11.sp)
            }
            Text(
                relativeDate(item.publishedAt),
                fontSize = 11.sp,
                color = Color.White.copy(alpha = 0.4f),
            )
            Spacer(Modifier.weight(1f))
            if (isUnread) {
                Box(Modifier.size(7.dp).clip(CircleShape).background(BrandEmerald))
            }
        }
        Text(
            item.headline,
            fontSize = 14.sp,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.onBackground,
        )
        Text(
            summaryLine(item),
            fontSize = 12.sp,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            maxLines = 2,
        )
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(4.dp),
        ) {
            Icon(
                Icons.Filled.Schedule,
                contentDescription = null,
                tint = BrandEmerald.copy(alpha = 0.9f),
                modifier = Modifier.size(12.dp),
            )
            Text(
                readTime(item),
                fontSize = 11.sp,
                fontWeight = FontWeight.SemiBold,
                color = BrandEmerald.copy(alpha = 0.9f),
            )
            item.tickers?.takeIf { it.isNotEmpty() }?.let { tickers ->
                Text(
                    "· ${tickers.take(2).joinToString(", ")}",
                    fontSize = 11.sp,
                    color = Color.White.copy(alpha = 0.45f),
                )
            }
        }
    }
}

/** Colored pill for the news topic — mirror of iOS `TopicTag`. */
@Composable
fun TopicTag(topic: String?) {
    val color = when (topic) {
        "economy" -> Color(0xFF80B8FF)
        "companies", "picks" -> BrandEmerald
        "politics" -> Color(0xFFF5B561)
        else -> Color(0xFFC9A3FF) // markets
    }
    Text(
        stringResource(NewsTaxonomy.topicLabelRes(topic)).uppercase(),
        fontSize = 10.sp,
        fontWeight = FontWeight.Bold,
        letterSpacing = 0.4.sp,
        color = color,
        modifier = Modifier
            .clip(RoundedCornerShape(6.dp))
            .background(color.copy(alpha = 0.15f))
            .padding(horizontal = 7.dp, vertical = 3.dp),
    )
}

private fun summaryLine(item: NewsItem): String =
    item.blockWhat?.takeIf { it.isNotEmpty() }
        ?: item.body.lineSequence().firstOrNull()?.trim().orEmpty().ifEmpty { item.body }

/** ~200 words per minute → seconds, rounded to a friendly bucket. */
private fun readTime(item: NewsItem): String {
    val text = if (item.hasExplainer) {
        listOfNotNull(item.blockWhat, item.blockWhy, item.blockYou).joinToString(" ")
    } else item.body
    val words = maxOf(1, text.split(' ', '\n').count { it.isNotBlank() })
    val secs = (words / 200.0 * 60).toInt()
    val bucket = maxOf(30, minOf(90, (secs / 15) * 15 + 15))
    return Localizer.get(R.string.news_read_time, bucket)
}

/** "ahora" / "hace 5m" / "hace 3h" / "ayer" / "hace 4d" / "23 may". */
private fun relativeDate(iso: String): String {
    val date = NewsItem.parseISO(iso) ?: return ""
    val secs = (Instant.now().toEpochMilli() - date.toEpochMilli()) / 1000
    return when {
        secs < 60 -> Localizer.get(R.string.news_rel_now)
        secs < 3600 -> Localizer.get(R.string.news_rel_min, (secs / 60).toInt())
        secs < 86400 -> Localizer.get(R.string.news_rel_hour, (secs / 3600).toInt())
        secs < 2 * 86400 -> Localizer.get(R.string.days_since_yesterday)
        secs < 7 * 86400 -> Localizer.get(R.string.days_since_n, (secs / 86400).toInt())
        else -> Formatters.shortDate(iso.take(10))
    }
}

@Composable
private fun EmptyNewsCard() {
    VDCard(innerSpacing = 8.dp) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            Icon(
                Icons.Outlined.Newspaper,
                contentDescription = null,
                tint = BrandEmerald,
                modifier = Modifier.size(18.dp),
            )
            Text(
                stringResource(R.string.news_empty_title),
                fontSize = 15.sp,
                fontWeight = FontWeight.SemiBold,
                color = MaterialTheme.colorScheme.onBackground,
            )
        }
        Text(
            stringResource(R.string.news_empty_body),
            fontSize = 12.sp,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
    }
}
