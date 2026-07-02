package com.vectorialdata.app

import android.app.Application
import com.vectorialdata.app.core.auth.SecureStore

/** Application entry point. Initializes the encrypted token store once. */
class VectorialDataApp : Application() {
    override fun onCreate() {
        super.onCreate()
        SecureStore.init(this)
    }
}
