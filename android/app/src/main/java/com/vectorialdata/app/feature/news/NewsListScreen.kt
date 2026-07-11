package com.vectorialdata.app.feature.news

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
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
import com.vectorialdata.app.core.store.NewsStore
import com.vectorialdata.app.core.util.Formatters
import com.vectorialdata.app.feature.common.VDCard
import com.vectorialdata.app.ui.theme.BrandEmerald
import kotlinx.coroutines.launch
import java.time.Instant

/**
 * Full-screen news feed + in-place detail — mirror of iOS `NewsListView`
 * (navigation uses the same open-state pattern as PicksScreen).
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NewsListScreen(onBack: () -> Unit, modifier: Modifier = Modifier) {
    val items by NewsStore.items.collectAsStateWithLifecycle()
    val isLoading by NewsStore.isLoading.collectAsStateWithLifecycle()
    val errorMessage by NewsStore.errorMessage.collectAsStateWithLifecycle()
    val lastReadAt by NewsStore.lastReadAt.collectAsStateWithLifecycle()
    val scope = rememberCoroutineScope()

    var openNewsId by rememberSaveable { mutableStateOf<String?>(null) }

    // The read cursor is stamped once on entry; rows compare against the
    // value captured when the screen opened so dots stay visible this visit.
    LaunchedEffect(Unit) {
        if (NewsStore.items.value.isEmpty()) NewsStore.load()
        NewsStore.markAllAsRead()
    }
    val cursorAtOpen = rememberSaveable { lastReadAt }

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

                else -> LazyColumn(
                    Modifier.fillMaxSize(),
                    contentPadding = androidx.compose.foundation.layout.PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp),
                ) {
                    items(items.size, key = { items[it].id }) { i ->
                        val item = items[i]
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

/** Unread dot + headline + first body line + relative date — iOS `NewsRow`. */
@Composable
private fun NewsRow(item: NewsItem, isUnread: Boolean, onClick: () -> Unit) {
    VDCard(onClick = onClick, innerSpacing = 0.dp) {
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            Box(
                Modifier
                    .padding(top = 7.dp)
                    .size(8.dp)
                    .clip(CircleShape)
                    .background(if (isUnread) BrandEmerald else Color.Transparent),
            )
            Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text(
                    item.headline,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = MaterialTheme.colorScheme.onBackground,
                )
                Text(
                    item.body.lineSequence().firstOrNull()?.trim() ?: item.body,
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 2,
                )
                Text(
                    relativeDate(item.publishedAt),
                    fontSize = 11.sp,
                    color = Color.White.copy(alpha = 0.4f),
                )
            }
        }
    }
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
