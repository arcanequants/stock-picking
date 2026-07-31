package com.vectorialdata.app.feature.news

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowUpward
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.vectorialdata.app.R
import com.vectorialdata.app.core.i18n.Localizer
import com.vectorialdata.app.core.model.NewsItem
import com.vectorialdata.app.core.net.ApiClient
import com.vectorialdata.app.ui.theme.AppBackground
import com.vectorialdata.app.ui.theme.BrandEmerald
import kotlinx.coroutines.launch
import kotlinx.serialization.Serializable

/**
 * Per-news AI chat ("Pregúntale a la IA") — mirror of iOS `NewsChatView`.
 * Grounded on one news item; premium/trial only (the caller gates entry).
 * Suggested starter chips, markdown-lite bubbles, always-visible disclaimer.
 */
@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
fun NewsChatSheet(item: NewsItem, onDismiss: () -> Unit) {
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    val scope = rememberCoroutineScope()
    val listState = rememberLazyListState()

    val messages = remember { mutableStateListOf<ChatMessage>() }
    var draft by remember { mutableStateOf("") }
    var isSending by remember { mutableStateOf(false) }

    // The suggestion chips must reach the API as plain strings in the UI language.
    val suggestions = listOf(
        stringResource(R.string.news_chat_sugg_affect),
        stringResource(R.string.news_chat_sugg_overreact),
        stringResource(R.string.news_chat_sugg_why),
        stringResource(R.string.news_chat_sugg_simpler),
    )

    fun send(text: String) {
        val trimmed = text.trim()
        if (trimmed.isEmpty() || isSending) return
        draft = ""
        messages.add(ChatMessage("user", trimmed))
        isSending = true
        scope.launch {
            try {
                val reply: ChatReply = ApiClient.post(
                    "/api/news/chat",
                    ChatRequest(newsId = item.id, message = trimmed),
                )
                messages.add(ChatMessage("assistant", reply.reply))
            } catch (e: Exception) {
                messages.add(
                    ChatMessage("assistant", Localizer.get(R.string.news_chat_error)),
                )
            } finally {
                isSending = false
            }
        }
    }

    LaunchedEffect(Unit) {
        try {
            val resp: ChatHistory = ApiClient.get("/api/news/chat?news_id=${item.id}")
            messages.clear()
            messages.addAll(resp.messages)
        } catch (_: Exception) {
            // Empty history is a fine starting point.
        }
    }
    LaunchedEffect(messages.size, isSending) {
        val last = messages.size - 1 + (if (isSending) 1 else 0)
        if (last >= 0) listState.animateScrollToItem(last)
    }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
        containerColor = AppBackground,
    ) {
        Column(
            Modifier
                .fillMaxWidth()
                .fillMaxHeight(0.92f)
                .imePadding(),
        ) {
            Text(
                stringResource(R.string.news_ask_ai),
                fontSize = 16.sp,
                fontWeight = FontWeight.SemiBold,
                color = Color.White,
                modifier = Modifier.fillMaxWidth().padding(bottom = 10.dp),
                textAlign = androidx.compose.ui.text.style.TextAlign.Center,
            )

            LazyColumn(
                state = listState,
                modifier = Modifier.weight(1f).fillMaxWidth(),
                contentPadding = androidx.compose.foundation.layout.PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                item {
                    Column(
                        Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .background(androidx.compose.material3.MaterialTheme.colorScheme.surface)
                            .padding(12.dp),
                        verticalArrangement = Arrangement.spacedBy(3.dp),
                    ) {
                        Text(
                            item.headline,
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.White,
                        )
                        Text(
                            stringResource(R.string.news_chat_context),
                            fontSize = 10.sp,
                            color = Color.White.copy(alpha = 0.4f),
                        )
                    }
                }
                if (messages.isEmpty()) {
                    item {
                        FlowRow(
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            verticalArrangement = Arrangement.spacedBy(8.dp),
                        ) {
                            suggestions.forEach { s ->
                                Text(
                                    s,
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = BrandEmerald,
                                    modifier = Modifier
                                        .clip(CircleShape)
                                        .background(BrandEmerald.copy(alpha = 0.08f))
                                        .border(1.dp, BrandEmerald.copy(alpha = 0.4f), CircleShape)
                                        .clickable { send(s) }
                                        .padding(horizontal = 12.dp, vertical = 8.dp),
                                )
                            }
                        }
                    }
                }
                items(messages.size) { i -> ChatBubble(messages[i]) }
                if (isSending) {
                    item { ChatBubble(ChatMessage("assistant", "…")) }
                }
            }

            // Input bar.
            Row(
                Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 14.dp, vertical = 6.dp)
                    .clip(RoundedCornerShape(22.dp))
                    .background(androidx.compose.material3.MaterialTheme.colorScheme.surface)
                    .border(1.dp, Color.White.copy(alpha = 0.1f), RoundedCornerShape(22.dp))
                    .padding(horizontal = 15.dp, vertical = 11.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                Box(Modifier.weight(1f)) {
                    if (draft.isEmpty()) {
                        Text(
                            stringResource(R.string.news_chat_placeholder),
                            fontSize = 14.sp,
                            color = Color.White.copy(alpha = 0.4f),
                        )
                    }
                    BasicTextField(
                        value = draft,
                        onValueChange = { draft = it },
                        textStyle = TextStyle(color = Color.White, fontSize = 14.sp),
                        cursorBrush = SolidColor(BrandEmerald),
                        maxLines = 4,
                        modifier = Modifier.fillMaxWidth(),
                    )
                }
                val canSend = draft.isNotBlank() && !isSending
                Icon(
                    Icons.Filled.ArrowUpward,
                    contentDescription = stringResource(R.string.news_chat_send),
                    tint = if (canSend) Color.Black else Color.White.copy(alpha = 0.25f),
                    modifier = Modifier
                        .size(28.dp)
                        .clip(CircleShape)
                        .background(if (canSend) BrandEmerald else Color.White.copy(alpha = 0.06f))
                        .clickable(enabled = canSend) { send(draft) }
                        .padding(5.dp),
                )
            }

            Text(
                stringResource(R.string.news_chat_disclaimer),
                fontSize = 10.sp,
                color = Color.White.copy(alpha = 0.35f),
                textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                modifier = Modifier.fillMaxWidth().padding(horizontal = 28.dp).padding(bottom = 12.dp),
            )
        }
    }
}

@Composable
private fun ChatBubble(message: ChatMessage) {
    val isUser = message.role == "user"
    Row(Modifier.fillMaxWidth()) {
        if (isUser) Spacer(Modifier.weight(1f, fill = true))
        Text(
            // The model answers with inline markdown (**bold**); plain text
            // would show the raw asterisks.
            markdownLite(message.content),
            fontSize = 14.sp,
            lineHeight = 20.sp,
            color = if (isUser) Color.Black else Color(0xFFE6F0EB),
            modifier = Modifier
                .widthIn(max = 300.dp)
                .clip(RoundedCornerShape(16.dp))
                .background(
                    if (isUser) BrandEmerald
                    else androidx.compose.material3.MaterialTheme.colorScheme.surface,
                )
                .border(
                    1.dp,
                    if (isUser) Color.Transparent else Color.White.copy(alpha = 0.08f),
                    RoundedCornerShape(16.dp),
                )
                .padding(horizontal = 13.dp, vertical = 10.dp),
        )
        if (!isUser) Spacer(Modifier.weight(1f, fill = true))
    }
}

@Serializable
data class ChatMessage(val role: String, val content: String)

@Serializable
private data class ChatHistory(val messages: List<ChatMessage> = emptyList())

@Serializable
private data class ChatRequest(val newsId: String, val message: String)

@Serializable
private data class ChatReply(val reply: String)
