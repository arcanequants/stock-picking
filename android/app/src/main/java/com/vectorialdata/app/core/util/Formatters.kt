package com.vectorialdata.app.core.util

import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.time.temporal.ChronoUnit
import java.util.Locale

/**
 * Shared formatting rules, one place instead of the per-view helpers the
 * iOS app duplicates. Same output byte-for-byte:
 *  - percentages: explicit "+" for gains, always 2 decimals ("+12.34%")
 *  - money: raw 2-decimal numbers; the "$" literal lives at the call site
 *    and ONLY ever prefixes the user's own typed money / dividends — never
 *    a pick price or model performance.
 *  - dates: wire format is YYYY-MM-DD (UTC).
 */
object Formatters {
    private val esMX = Locale("es", "MX")
    private val longDateFmt = DateTimeFormatter.ofPattern("d 'de' MMMM 'de' yyyy", esMX)
    private val shortDateFmt = DateTimeFormatter.ofPattern("d MMM", Locale("es"))

    fun pct(value: Double): String {
        val sign = if (value >= 0) "+" else ""
        return sign + String.format(Locale.US, "%.2f", value) + "%"
    }

    fun money2(value: Double): String = String.format(Locale.US, "%.2f", value)

    /** Buy-sheet field pre-fill: whole numbers drop decimals ("50"). */
    fun moneyTrim(value: Double): String =
        if (value % 1.0 == 0.0) String.format(Locale.US, "%.0f", value)
        else String.format(Locale.US, "%.2f", value)

    fun parseDate(iso: String): LocalDate? =
        runCatching { LocalDate.parse(iso.take(10)) }.getOrNull()

    /** "2026-05-23" -> "23 de mayo de 2026" (es_MX, like iOS formatLongDate). */
    fun longSpanishDate(iso: String): String =
        parseDate(iso)?.format(longDateFmt) ?: iso

    /** "2026-05-23" -> "23 may" (dividend rows). */
    fun shortDate(iso: String): String =
        parseDate(iso)?.format(shortDateFmt) ?: iso

    /** "hoy" / "ayer" / "hace Nd" — mirror of PicksView.daysSince. */
    fun daysSinceLabel(iso: String): String {
        val date = parseDate(iso) ?: return iso
        val days = ChronoUnit.DAYS.between(date, LocalDate.now())
        return when {
            days <= 0L -> "hoy"
            days == 1L -> "ayer"
            else -> "hace ${days}d"
        }
    }
}
