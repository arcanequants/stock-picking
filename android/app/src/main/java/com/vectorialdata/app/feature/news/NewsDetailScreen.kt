package com.vectorialdata.app.feature.news

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
import androidx.compose.material.icons.automirrored.filled.OpenInNew
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.vectorialdata.app.R
import com.vectorialdata.app.core.i18n.Localizer
import com.vectorialdata.app.core.model.NewsItem
import com.vectorialdata.app.core.util.Formatters
import com.vectorialdata.app.ui.theme.BrandEmerald

/**
 * Reader for one news item — mirror of iOS `NewsDetailView`. Bodies ship
 * light inline markdown; v1 renders **bold** and strips [label](url) down
 * to the label (the CTA button carries the item's link instead).
 */
@Composable
fun NewsDetailScreen(item: NewsItem, onBack: () -> Unit, modifier: Modifier = Modifier) {
    val uriHandler = LocalUriHandler.current

    Column(modifier.fillMaxSize()) {
        IconButton(onClick = onBack) {
            Icon(
                Icons.AutoMirrored.Filled.ArrowBack,
                contentDescription = stringResource(R.string.back),
                tint = MaterialTheme.colorScheme.onBackground,
            )
        }

        Column(
            Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(
                    item.headline,
                    fontSize = 22.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onBackground,
                )
                Text(
                    longDate(item.publishedAt),
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }

            Text(
                markdownLite(item.body),
                fontSize = 14.sp,
                lineHeight = 21.sp,
                color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.9f),
            )

            item.linkUrl?.takeIf { it.isNotBlank() }?.let { url ->
                Row(
                    Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(14.dp))
                        .background(BrandEmerald.copy(alpha = 0.12f))
                        .border(1.dp, BrandEmerald.copy(alpha = 0.4f), RoundedCornerShape(14.dp))
                        .clickable { uriHandler.openUri(url) }
                        .padding(14.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    Icon(
                        Icons.AutoMirrored.Filled.OpenInNew,
                        contentDescription = null,
                        tint = BrandEmerald,
                        modifier = Modifier.size(18.dp),
                    )
                    Text(
                        stringResource(R.string.news_open_link),
                        fontSize = 14.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = BrandEmerald,
                    )
                    Spacer(Modifier.weight(1f))
                }
            }

            Spacer(Modifier.size(16.dp))
        }
    }
}

private fun longDate(iso: String): String {
    val date = NewsItem.parseISO(iso) ?: return iso
    val day = Formatters.longSpanishDate(iso.take(10))
    val local = java.time.ZonedDateTime.ofInstant(date, java.time.ZoneId.systemDefault())
    return Localizer.get(R.string.date_at_time, day, "%02d:%02d".format(local.hour, local.minute))
}

/**
 * Minimal inline-markdown renderer: `**bold**` gets a bold span and
 * `[label](url)` collapses to its label. Everything else passes through.
 */
private fun markdownLite(source: String): AnnotatedString {
    // [label](url) → label
    val delinked = source.replace(Regex("\\[([^\\]]+)\\]\\(([^)]+)\\)"), "$1")
    return buildAnnotatedString {
        var rest = delinked
        while (true) {
            val start = rest.indexOf("**")
            val end = if (start >= 0) rest.indexOf("**", start + 2) else -1
            if (start < 0 || end < 0) {
                append(rest)
                break
            }
            append(rest.substring(0, start))
            withStyle(SpanStyle(fontWeight = FontWeight.Bold)) {
                append(rest.substring(start + 2, end))
            }
            rest = rest.substring(end + 2)
        }
    }
}
