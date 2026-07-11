package com.vectorialdata.app.core.util

import com.vectorialdata.app.R
import com.vectorialdata.app.core.i18n.Localizer
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.time.format.FormatStyle
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
    // Date rendering follows the device locale (matches the localized chrome
    // and the Accept-Language the ApiClient sends): es "8 de julio de 2026",
    // en "July 8, 2026", pt "8 de julho de 2026".
    private val longDateFmt: DateTimeFormatter
        get() = DateTimeFormatter.ofLocalizedDate(FormatStyle.LONG).withLocale(Locale.getDefault())
    private val shortDateFmt: DateTimeFormatter
        get() = DateTimeFormatter.ofPattern("d MMM", Locale.getDefault())

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

    /** "2026-05-23" -> localized long date ("23 de mayo de 2026" / "May 23, 2026"). */
    fun longSpanishDate(iso: String): String =
        parseDate(iso)?.format(longDateFmt) ?: iso

    /** "2026-05-23" -> "23 may" (dividend rows), localized month. */
    fun shortDate(iso: String): String =
        parseDate(iso)?.format(shortDateFmt) ?: iso

    /** "hoy" / "ayer" / "hace Nd" (localized) — mirror of PicksView.daysSince. */
    fun daysSinceLabel(iso: String): String {
        val date = parseDate(iso) ?: return iso
        val days = ChronoUnit.DAYS.between(date, LocalDate.now())
        return when {
            days <= 0L -> Localizer.get(R.string.days_since_today)
            days == 1L -> Localizer.get(R.string.days_since_yesterday)
            else -> Localizer.get(R.string.days_since_n, days.toInt())
        }
    }
}
