package com.vectorialdata.app.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

// Dark-only brand palette, mirroring the iOS asset catalog (dark variants).
val AppBackground = Color(0xFF05080A)
val CardBackground = Color(0xFF0B1116)
val BrandEmerald = Color(0xFF34CDA5)
val BrandIndigo = Color(0xFF817DFA)
val TextPrimary = Color(0xFFFFFFFF)
val TextSecondary = Color(0xB3FFFFFF)

private val VectorialColors = darkColorScheme(
    primary = BrandEmerald,
    onPrimary = Color(0xFF05080A),
    secondary = BrandIndigo,
    background = AppBackground,
    onBackground = TextPrimary,
    surface = CardBackground,
    onSurface = TextPrimary,
    surfaceVariant = CardBackground,
    onSurfaceVariant = TextSecondary,
    error = Color(0xFFFF6B6B),
)

/** The app forces dark mode (iOS sets `.preferredColorScheme(.dark)`). */
@Composable
fun VectorialDataTheme(content: @Composable () -> Unit) {
    @Suppress("UNUSED_VARIABLE")
    val systemDark = isSystemInDarkTheme() // intentionally ignored: dark-only
    MaterialTheme(
        colorScheme = VectorialColors,
        typography = Typography(),
        content = content,
    )
}
