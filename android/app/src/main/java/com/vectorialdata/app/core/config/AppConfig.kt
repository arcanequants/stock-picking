package com.vectorialdata.app.core.config

import com.vectorialdata.app.BuildConfig

/**
 * Mirror of iOS `AppConfig`. Canonical production base URL for the
 * Vectorial Data API; overridable per build type via BuildConfig.
 */
object AppConfig {
    /** Base URL for the Vectorial Data API (no trailing slash). */
    val apiBaseUrl: String = BuildConfig.API_BASE_URL.trimEnd('/')

    /** Deep-link scheme registered in the manifest. */
    const val URL_SCHEME = "vectorialdata"

    /** Client identifier sent to the backend so it emits the right magic link. */
    const val CLIENT = "android"
}
