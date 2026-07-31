package com.vectorialdata.app.core.auth

import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyPermanentlyInvalidatedException
import android.security.keystore.KeyProperties
import android.util.Base64
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricPrompt
import androidx.core.content.ContextCompat
import androidx.fragment.app.FragmentActivity
import java.security.KeyPairGenerator
import java.security.KeyStore
import java.security.PrivateKey
import java.security.PublicKey
import javax.crypto.Cipher
import kotlin.coroutines.resume
import kotlinx.coroutines.suspendCancellableCoroutine

/**
 * Biometric-protected storage for the long-lived device credential — Android
 * counterpart of the iOS `KeychainHelper.setBiometric` (`.biometryCurrentSet`).
 *
 * RSA keypair in the Keystore: the PUBLIC key encrypts the credential at
 * enrollment with no prompt; the PRIVATE key requires a biometric match per
 * use (`setUserAuthenticationRequired`) and is hardware-invalidated when
 * biometrics are re-enrolled (`setInvalidatedByBiometricEnrollment`) — the
 * same guarantees as the iOS ACL. Ciphertext lives in the (already
 * encrypted) SecureStore prefs.
 */
object BiometricAuth {
    private const val KEY_ALIAS = "vd.deviceCredentialKey"
    private const val CIPHERTEXT_KEY = "device_credential.ct"
    private const val TRANSFORM = "RSA/ECB/OAEPWithSHA-256AndMGF1Padding"

    /** Whether the hardware has usable, enrolled biometrics. */
    fun canAuthenticate(context: android.content.Context): Boolean =
        BiometricManager.from(context)
            .canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_STRONG) ==
            BiometricManager.BIOMETRIC_SUCCESS

    /** A credential is enrolled on this device. */
    fun hasCredential(): Boolean = SecureStore.get(CIPHERTEXT_KEY) != null

    fun deleteCredential() {
        SecureStore.delete(CIPHERTEXT_KEY)
        runCatching { keyStore().deleteEntry(KEY_ALIAS) }
    }

    /**
     * Encrypt and store the server-issued device token. Public-key encrypt —
     * no prompt; only [releaseCredential] requires the biometric match.
     */
    fun storeCredential(deviceToken: String): Boolean = runCatching {
        val cipher = Cipher.getInstance(TRANSFORM)
        cipher.init(Cipher.ENCRYPT_MODE, getOrCreatePublicKey())
        val ct = cipher.doFinal(deviceToken.toByteArray(Charsets.UTF_8))
        SecureStore.set(Base64.encodeToString(ct, Base64.NO_WRAP), CIPHERTEXT_KEY)
    }.isSuccess

    /**
     * Release the stored credential behind a biometric prompt. Returns null
     * on cancel/mismatch; deletes the credential and returns null when the
     * key was invalidated by re-enrolled biometrics.
     */
    suspend fun releaseCredential(activity: FragmentActivity, title: String): String? {
        val ctRaw = SecureStore.get(CIPHERTEXT_KEY) ?: return null

        val cipher = Cipher.getInstance(TRANSFORM)
        try {
            val priv = keyStore().getKey(KEY_ALIAS, null) as? PrivateKey ?: return null
            cipher.init(Cipher.DECRYPT_MODE, priv)
        } catch (e: KeyPermanentlyInvalidatedException) {
            // Biometrics re-enrolled since issuance — the credential must die.
            deleteCredential()
            return null
        } catch (e: Exception) {
            return null
        }

        val authed = authenticate(activity, title, cipher) ?: return null
        return runCatching {
            String(authed.doFinal(Base64.decode(ctRaw, Base64.NO_WRAP)), Charsets.UTF_8)
        }.getOrNull()
    }

    private suspend fun authenticate(
        activity: FragmentActivity,
        title: String,
        cipher: Cipher,
    ): Cipher? = suspendCancellableCoroutine { cont ->
        val prompt = BiometricPrompt(
            activity,
            ContextCompat.getMainExecutor(activity),
            object : BiometricPrompt.AuthenticationCallback() {
                override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
                    if (cont.isActive) cont.resume(result.cryptoObject?.cipher)
                }

                override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
                    if (cont.isActive) cont.resume(null)
                }
            },
        )
        val info = BiometricPrompt.PromptInfo.Builder()
            .setTitle(title)
            .setNegativeButtonText(
                activity.getString(com.vectorialdata.app.R.string.cancel),
            )
            .setAllowedAuthenticators(BiometricManager.Authenticators.BIOMETRIC_STRONG)
            .build()
        prompt.authenticate(info, BiometricPrompt.CryptoObject(cipher))
        cont.invokeOnCancellation { prompt.cancelAuthentication() }
    }

    private fun keyStore(): KeyStore =
        KeyStore.getInstance("AndroidKeyStore").apply { load(null) }

    private fun getOrCreatePublicKey(): PublicKey {
        keyStore().getCertificate(KEY_ALIAS)?.publicKey?.let { return it }
        val generator = KeyPairGenerator.getInstance(
            KeyProperties.KEY_ALGORITHM_RSA, "AndroidKeyStore",
        )
        generator.initialize(
            KeyGenParameterSpec.Builder(
                KEY_ALIAS,
                KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT,
            )
                .setKeySize(2048)
                .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_RSA_OAEP)
                .setDigests(KeyProperties.DIGEST_SHA256)
                // Only the private (decrypt) half is gated — encryption at
                // enrollment must work without a prompt.
                .setUserAuthenticationRequired(true)
                .setInvalidatedByBiometricEnrollment(true)
                .setUserAuthenticationParameters(0, KeyProperties.AUTH_BIOMETRIC_STRONG)
                .build(),
        )
        return generator.generateKeyPair().public
    }
}
