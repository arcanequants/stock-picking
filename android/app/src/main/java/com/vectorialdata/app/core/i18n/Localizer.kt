package com.vectorialdata.app.core.i18n

import android.content.Context

/**
 * Resolves Android string resources from NON-Composable code (stores,
 * ApiClient errors, Formatters helpers) — the equivalent of iOS's
 * `String(localized:)`, which works anywhere without a view context.
 *
 * Composables should keep using `stringResource` / `pluralStringResource`
 * directly; this reads the SAME per-locale strings.xml resources, so there is
 * one source of truth and the device locale drives both. Backed by the
 * application Context (initialized in [com.vectorialdata.app.VectorialDataApp]),
 * which is process-lived and safe to hold statically.
 */
object Localizer {
    private lateinit var appContext: Context

    fun init(context: Context) {
        appContext = context.applicationContext
    }

    fun get(resId: Int): String = appContext.getString(resId)

    fun get(resId: Int, vararg args: Any): String = appContext.getString(resId, *args)

    fun plural(resId: Int, quantity: Int, vararg args: Any): String =
        appContext.resources.getQuantityString(resId, quantity, *args)
}
