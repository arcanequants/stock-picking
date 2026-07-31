package com.vectorialdata.app.feature.news

import android.content.Intent
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.HelpOutline
import androidx.compose.material.icons.automirrored.filled.OpenInNew
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.Share
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.vectorialdata.app.R
import com.vectorialdata.app.core.i18n.Localizer
import com.vectorialdata.app.core.model.GlossaryTerm
import com.vectorialdata.app.core.model.NewsItem
import com.vectorialdata.app.core.model.NewsTaxonomy
import com.vectorialdata.app.core.store.NewsStore
import com.vectorialdata.app.core.store.PickStatusStore
import com.vectorialdata.app.core.util.Formatters
import com.vectorialdata.app.feature.paywall.rememberPaywallLauncher
import com.vectorialdata.app.ui.theme.BrandEmerald

/**
 * Reader for one news item — mirror of iOS `NewsDetailView`. When the server
 * produced the 4-block "explainer de 60 segundos" it renders those blocks
 * (qué pasó / por qué importa / y para tu portafolio / cuéntalo así) with a
 * tappable glossary; otherwise it falls back to the plain markdown body.
 * "Pregúntale a la IA" opens the per-news chat (premium/trial).
 */
@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
fun NewsDetailScreen(item: NewsItem, onBack: () -> Unit, modifier: Modifier = Modifier) {
    val uriHandler = LocalUriHandler.current
    val context = LocalContext.current
    val chatEnabled by NewsStore.chatEnabled.collectAsStateWithLifecycle()
    val isSubscribed by PickStatusStore.isSubscribed.collectAsStateWithLifecycle()
    val openPaywall = rememberPaywallLauncher()

    // Plain remember: GlossaryTerm is not Parcelable (a config change just
    // closes the sheet, which is fine).
    var glossaryTerm by androidx.compose.runtime.remember { mutableStateOf<GlossaryTerm?>(null) }
    var showChat by rememberSaveable { mutableStateOf(false) }

    glossaryTerm?.let { term ->
        ModalBottomSheet(
            onDismissRequest = { glossaryTerm = null },
            containerColor = MaterialTheme.colorScheme.background,
        ) {
            Column(
                Modifier.fillMaxWidth().padding(horizontal = 22.dp).padding(bottom = 32.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                Text(term.term, fontSize = 19.sp, fontWeight = FontWeight.Bold, color = Color.White)
                Text(term.def, fontSize = 14.sp, color = Color.White.copy(alpha = 0.8f), lineHeight = 20.sp)
            }
        }
    }

    if (showChat) {
        NewsChatSheet(item = item, onDismiss = { showChat = false })
    }

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
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            // Header: topic tag · flags · read time, headline, date.
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                ) {
                    TopicTag(item.topic)
                    item.regions.orEmpty().forEach { r ->
                        Text(NewsTaxonomy.regionFlag(r), fontSize = 13.sp)
                    }
                    Spacer(Modifier.weight(1f))
                    if (item.hasExplainer) {
                        Text(
                            stringResource(R.string.news_60s_label),
                            fontSize = 11.sp,
                            color = Color.White.copy(alpha = 0.4f),
                        )
                    }
                }
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

            if (item.hasExplainer) {
                ExplainerBlock(stringResource(R.string.news_block_what), item.blockWhat)
                ExplainerBlock(stringResource(R.string.news_block_why), item.blockWhy)
                ExplainerBlock(stringResource(R.string.news_block_you), item.blockYou)
                item.blockTell?.let { TellCard(strippingQuotes(it)) }
                item.glossary?.takeIf { it.isNotEmpty() }?.let { glossary ->
                    GlossaryChips(glossary) { glossaryTerm = it }
                }
            } else {
                Text(
                    markdownLite(item.body),
                    fontSize = 14.sp,
                    lineHeight = 21.sp,
                    color = MaterialTheme.colorScheme.onBackground.copy(alpha = 0.9f),
                )
            }

            // Action row: Ask the AI (gated) + share.
            Row(horizontalArrangement = Arrangement.spacedBy(9.dp)) {
                Row(
                    Modifier
                        .weight(1f)
                        .height(48.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(BrandEmerald)
                        .clickable {
                            if (chatEnabled || isSubscribed) showChat = true else openPaywall()
                        },
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.Center,
                ) {
                    Icon(
                        Icons.Filled.AutoAwesome,
                        contentDescription = null,
                        tint = Color.Black,
                        modifier = Modifier.size(16.dp),
                    )
                    Spacer(Modifier.size(6.dp))
                    Text(
                        stringResource(R.string.news_ask_ai),
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.Black,
                    )
                }
                Row(
                    Modifier
                        .size(width = 52.dp, height = 48.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(MaterialTheme.colorScheme.surface)
                        .border(1.dp, Color.White.copy(alpha = 0.1f), RoundedCornerShape(12.dp))
                        .clickable {
                            val send = Intent(Intent.ACTION_SEND).apply {
                                type = "text/plain"
                                putExtra(Intent.EXTRA_TEXT, shareText(item))
                            }
                            context.startActivity(Intent.createChooser(send, null))
                        },
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.Center,
                ) {
                    Icon(
                        Icons.Filled.Share,
                        contentDescription = stringResource(R.string.news_share),
                        tint = Color.White,
                        modifier = Modifier.size(18.dp),
                    )
                }
            }

            Text(
                stringResource(R.string.news_disclaimer),
                fontSize = 10.sp,
                color = Color.White.copy(alpha = 0.38f),
                modifier = Modifier.fillMaxWidth(),
                textAlign = androidx.compose.ui.text.style.TextAlign.Center,
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

@Composable
private fun ExplainerBlock(title: String, body: String?) {
    if (body.isNullOrEmpty()) return
    Column(
        Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .background(MaterialTheme.colorScheme.surface)
            .border(1.dp, Color.White.copy(alpha = 0.06f), RoundedCornerShape(14.dp))
            .padding(14.dp),
        verticalArrangement = Arrangement.spacedBy(6.dp),
    ) {
        Text(
            title,
            fontSize = 10.sp,
            fontWeight = FontWeight.Bold,
            letterSpacing = 1.1.sp,
            color = BrandEmerald.copy(alpha = 0.85f),
        )
        Text(
            body,
            fontSize = 14.sp,
            lineHeight = 21.sp,
            color = Color(0xFFE6F0EB),
        )
    }
}

/** "💬 CUÉNTALO ASÍ" — the shareable one-liner, emerald-tinted. */
@Composable
private fun TellCard(tell: String) {
    if (tell.isEmpty()) return
    Column(
        Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .background(
                Brush.linearGradient(
                    listOf(BrandEmerald.copy(alpha = 0.16f), BrandEmerald.copy(alpha = 0.05f)),
                ),
            )
            .border(1.dp, BrandEmerald.copy(alpha = 0.35f), RoundedCornerShape(14.dp))
            .padding(14.dp),
        verticalArrangement = Arrangement.spacedBy(6.dp),
    ) {
        Text(
            stringResource(R.string.news_block_tell),
            fontSize = 10.sp,
            fontWeight = FontWeight.Bold,
            letterSpacing = 1.1.sp,
            color = BrandEmerald,
        )
        Text(
            "“$tell”",
            fontSize = 14.sp,
            fontWeight = FontWeight.SemiBold,
            lineHeight = 21.sp,
            color = Color.White,
        )
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun GlossaryChips(glossary: List<GlossaryTerm>, onTap: (GlossaryTerm) -> Unit) {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text(
            stringResource(R.string.news_glossary_header),
            fontSize = 10.sp,
            fontWeight = FontWeight.Bold,
            letterSpacing = 1.1.sp,
            color = Color.White.copy(alpha = 0.4f),
        )
        FlowRow(
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            glossary.forEach { g ->
                Row(
                    Modifier
                        .clip(CircleShape)
                        .background(BrandEmerald.copy(alpha = 0.1f))
                        .clickable { onTap(g) }
                        .padding(horizontal = 11.dp, vertical = 6.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp),
                ) {
                    Icon(
                        Icons.AutoMirrored.Filled.HelpOutline,
                        contentDescription = null,
                        tint = BrandEmerald,
                        modifier = Modifier.size(13.dp),
                    )
                    Text(
                        g.term,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = BrandEmerald,
                    )
                }
            }
        }
    }
}

/** The shareable unit is the "cuéntalo así" line — that's the wow. */
private fun shareText(item: NewsItem): String {
    val tell = item.blockTell?.let(::strippingQuotes)
    return if (!tell.isNullOrEmpty()) {
        "“$tell”\n\n— ${item.headline} · Vectorial Data"
    } else {
        "${item.headline}\n\n— Vectorial Data"
    }
}

/**
 * The model sometimes wraps the "cuéntalo así" line in its own quotation
 * marks; the UI supplies the typographic quotes, so strip any incoming ones.
 */
private fun strippingQuotes(s: String): String =
    s.trim().trim('"', '“', '”', '«', '»', '\'', '‘', '’').trim()

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
internal fun markdownLite(source: String): AnnotatedString {
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
