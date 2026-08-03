package com.vectorialdata.app.feature.onboarding

import androidx.compose.animation.core.animateDpAsState
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.geometry.RoundRect
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.PathOperation
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.layout.positionInRoot
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.vectorialdata.app.R
import com.vectorialdata.app.ui.theme.BrandEmerald
import kotlinx.coroutines.flow.MutableStateFlow

/**
 * Spotlighted views report their root-space frame here; the tour reads the
 * last known value (a tab switch mid-tour must not drop the rect).
 * Compose analogue of the iOS `CoachTargetKey` preference.
 */
object CoachTargets {
    val firstPickCard = MutableStateFlow<Rect?>(null)

    fun reportFirstPickCard(rect: Rect) {
        firstPickCard.value = rect
    }
}

/** Report this view's root-space frame as the first-pick-card tour target. */
fun Modifier.coachTargetFirstPick(): Modifier = onGloballyPositioned { coords ->
    val pos = coords.positionInRoot()
    CoachTargets.reportFirstPickCard(
        Rect(pos, Size(coords.size.width.toFloat(), coords.size.height.toFloat())),
    )
}

/**
 * Game-style first-run coach marks — mirror of iOS `CoachTourView`: the
 * screen dims, ONE element lights up with a one-sentence tooltip, tap
 * anywhere advances. 4 steps, always skippable. Replayable from Cuenta →
 * "Ver tutorial".
 *
 * [tabBarBounds] is the NavigationBar's root-space frame (reported by the
 * scaffold); tab item rects are derived from it (4 equal slots).
 */
@Composable
fun CoachTourOverlay(
    tabBarBounds: Rect?,
    onSelectTab: (Int) -> Unit,
    onFinished: () -> Unit,
) {
    var step by rememberSaveable { mutableIntStateOf(0) }
    val firstCard by CoachTargets.firstPickCard.collectAsStateWithLifecycle()

    data class Step(
        val emoji: String,
        val titleRes: Int,
        val messageRes: Int,
        val tabIndex: Int?, // spotlight a tab item; null = the content card
        val switchTo: Int,
    )

    val steps = remember {
        listOf(
            Step("📥", R.string.tour_s1_title, R.string.tour_s1_msg, tabIndex = 2, switchTo = 0),
            Step("🏦", R.string.tour_s2_title, R.string.tour_s2_msg, tabIndex = null, switchTo = 2),
            Step("📈", R.string.tour_s3_title, R.string.tour_s3_msg, tabIndex = 1, switchTo = 1),
            Step("⚙️", R.string.tour_s4_title, R.string.tour_s4_msg, tabIndex = 3, switchTo = 3),
        )
    }

    // The initial step's tab; advances switch synchronously in the tap
    // handler (an effect keyed on `step` applied one frame late).
    androidx.compose.runtime.LaunchedEffect(Unit) {
        onSelectTab(steps[step].switchTo)
    }

    val density = LocalDensity.current
    val s = steps[step]

    Box(
        Modifier
            .fillMaxSize()
            .clickable(
                interactionSource = remember { MutableInteractionSource() },
                indication = null,
            ) {
                if (step < steps.size - 1) {
                    step += 1
                    onSelectTab(steps[step].switchTo)
                } else {
                    onFinished()
                }
            },
    ) {
        // Spotlight rect in root coordinates.
        val cutout: Rect = when {
            s.tabIndex != null && tabBarBounds != null -> {
                val slot = tabBarBounds.width / 4f
                Rect(
                    Offset(tabBarBounds.left + slot * s.tabIndex + slot * 0.12f, tabBarBounds.top + 6f),
                    Size(slot * 0.76f, tabBarBounds.height * 0.72f),
                )
            }
            s.tabIndex == null && firstCard != null -> firstCard!!.inflate(with(density) { 4.dp.toPx() })
            else -> {
                // Fallback: a card-sized region below the header.
                with(density) {
                    Rect(Offset(15.dp.toPx(), 210.dp.toPx()), Size(1000.dp.toPx(), 96.dp.toPx()))
                }
            }
        }

        // Dim everything except the cutout (even-odd path difference).
        Canvas(Modifier.fillMaxSize()) {
            val full = Path().apply { addRect(Rect(Offset.Zero, size)) }
            val hole = Path().apply {
                addRoundRect(
                    RoundRect(cutout, androidx.compose.ui.geometry.CornerRadius(14.dp.toPx())),
                )
            }
            drawPath(
                Path.combine(PathOperation.Difference, full, hole),
                Color.Black.copy(alpha = 0.72f),
            )
            // Glow ring.
            drawPath(hole, BrandEmerald, style = Stroke(width = 3.dp.toPx()))
        }

        // Skip — always visible, top right.
        Text(
            stringResource(R.string.onb_skip),
            fontSize = 14.sp,
            color = Color.White.copy(alpha = 0.7f),
            modifier = Modifier
                .align(Alignment.TopEnd)
                .statusBarsPadding()
                .padding(top = 10.dp, end = 20.dp)
                .clickable(onClick = onFinished),
        )

        // Tooltip near the cutout.
        val conf = androidx.compose.ui.platform.LocalConfiguration.current
        val screenH = with(density) { conf.screenHeightDp.dp.toPx() }
        val above = cutout.center.y > screenH * 0.55f
        val tooltipY = with(density) {
            (if (above) cutout.top - 190.dp.toPx() else cutout.bottom + 24.dp.toPx()).toDp()
        }
        Column(
            Modifier
                .padding(horizontal = 24.dp)
                .offset(y = animateDpAsState(tooltipY, label = "tooltipY").value)
                .fillMaxWidth()
                .clip(RoundedCornerShape(14.dp))
                .background(Color(0xFF0E1A16))
                .padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp),
        ) {
            Row(horizontalArrangement = Arrangement.spacedBy(7.dp)) {
                Text(s.emoji, fontSize = 14.sp)
                Text(
                    stringResource(s.titleRes),
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White,
                )
            }
            Text(
                stringResource(s.messageRes),
                fontSize = 13.sp,
                lineHeight = 18.sp,
                color = Color(0xFFC9D6CF),
            )
            Row(
                Modifier.padding(top = 6.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    stringResource(R.string.tour_progress, step + 1, steps.size),
                    fontSize = 10.sp,
                    color = Color.White.copy(alpha = 0.55f),
                )
                Spacer(Modifier.weight(1f))
                Text(
                    stringResource(
                        if (step == steps.size - 1) R.string.tour_done else R.string.onb_next,
                    ),
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.Black,
                    modifier = Modifier
                        .clip(CircleShape)
                        .background(BrandEmerald)
                        .padding(horizontal = 13.dp, vertical = 6.dp),
                )
            }
        }
    }
}
