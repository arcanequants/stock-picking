package com.vectorialdata.app.feature.common

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

/**
 * The standard rounded card every Home/Picks section uses — mirror of the
 * iOS `Color("CardBackground") + RoundedRectangle(16)` pattern.
 */
@Composable
fun VDCard(
    modifier: Modifier = Modifier,
    onClick: (() -> Unit)? = null,
    innerSpacing: Dp = 8.dp,
    content: @Composable ColumnScope.() -> Unit,
) {
    var base = modifier
        .fillMaxWidth()
        .clip(RoundedCornerShape(16.dp))
        .background(MaterialTheme.colorScheme.surface)
    if (onClick != null) base = base.clickable(onClick = onClick)

    Column(
        modifier = base.padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(innerSpacing),
        content = content,
    )
}
