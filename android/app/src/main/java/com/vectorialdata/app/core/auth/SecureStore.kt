package com.vectorialdata.app.core.auth

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

/**
 * Android equivalent of iOS `KeychainHelper`. Stores the auth tokens in an
 * AES-256 EncryptedSharedPreferences file backed by a hardware-backed master
 * key (Android Keystore) — the closest analogue to the iOS Keychain with
 * `kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly`.
 *
 * Initialize once from the Application with [init]; afterward use the static
 * get/set/delete the same way the Swift code calls `KeychainHelper`.
 */
object SecureStore {
    private const val FILE_NAME = "com.vectorialdata.app.auth"
    private lateinit var prefs: SharedPreferences

    fun init(context: Context) {
        if (::prefs.isInitialized) return
        val masterKey = MasterKey.Builder(context)
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .build()
        prefs = EncryptedSharedPreferences.create(
            context,
            FILE_NAME,
            masterKey,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
        )
    }

    fun set(value: String, forKey: String) {
        prefs.edit().putString(forKey, value).apply()
    }

    fun get(key: String): String? = prefs.getString(key, null)

    fun delete(key: String) {
        prefs.edit().remove(key).apply()
    }
}
