package com.vectorialdata.app

import android.app.Application
import com.vectorialdata.app.core.auth.SecureStore
import com.vectorialdata.app.core.billing.BillingManager
import com.vectorialdata.app.core.i18n.Localizer
import com.vectorialdata.app.core.notifications.LocalReminders
import com.vectorialdata.app.core.notifications.NotificationsManager

/** Application entry point. Initializes the encrypted token store + localizer. */
class VectorialDataApp : Application() {
    override fun onCreate() {
        super.onCreate()
        SecureStore.init(this)
        Localizer.init(this)
        NotificationsManager.init(this)
        LocalReminders.init(this)
        // Connection is deferred to the first paywall (BillingManager.start())
        // so a cold start doesn't pay for a Play handshake nobody asked for.
        BillingManager.init(this)
    }
}
