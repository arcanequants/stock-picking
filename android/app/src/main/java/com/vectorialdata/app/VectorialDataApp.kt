package com.vectorialdata.app

import android.app.Application
import com.vectorialdata.app.core.auth.SecureStore
import com.vectorialdata.app.core.i18n.Localizer
import com.vectorialdata.app.core.notifications.NotificationsManager

/** Application entry point. Initializes the encrypted token store + localizer. */
class VectorialDataApp : Application() {
    override fun onCreate() {
        super.onCreate()
        SecureStore.init(this)
        Localizer.init(this)
        NotificationsManager.init(this)
    }
}
