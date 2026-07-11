package com.vectorialdata.app

import android.app.Application
import com.vectorialdata.app.core.auth.SecureStore
import com.vectorialdata.app.core.i18n.Localizer

/** Application entry point. Initializes the encrypted token store + localizer. */
class VectorialDataApp : Application() {
    override fun onCreate() {
        super.onCreate()
        SecureStore.init(this)
        Localizer.init(this)
    }
}
