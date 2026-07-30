import Foundation
import LocalAuthentication
import Security

/// Tiny wrapper around the Keychain for storing string secrets.
/// Used for the app's auth token — never written to UserDefaults.
enum KeychainHelper {
    static func set(_ value: String, forKey key: String, service: String = AppConfig.keychainService) {
        guard let data = value.data(using: .utf8) else { return }
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key,
        ]
        SecItemDelete(query as CFDictionary)
        var add = query
        add[kSecValueData as String] = data
        add[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
        SecItemAdd(add as CFDictionary, nil)
    }

    static func get(_ key: String, service: String = AppConfig.keychainService) -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne,
        ]
        var item: CFTypeRef?
        guard SecItemCopyMatching(query as CFDictionary, &item) == errSecSuccess,
              let data = item as? Data,
              let s = String(data: data, encoding: .utf8) else { return nil }
        return s
    }

    static func delete(_ key: String, service: String = AppConfig.keychainService) {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key,
        ]
        SecItemDelete(query as CFDictionary)
    }

    // MARK: - Biometric-protected items (Face ID / Touch ID)

    /// Stores a secret readable ONLY after a successful Face ID / Touch ID
    /// match (`.biometryCurrentSet`: re-enrolling biometrics invalidates it,
    /// so a new face/finger can never unlock an old credential).
    static func setBiometric(_ value: String, forKey key: String, service: String = AppConfig.keychainService) {
        guard let data = value.data(using: .utf8) else { return }
        let base: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key,
        ]
        SecItemDelete(base as CFDictionary)
        guard let access = SecAccessControlCreateWithFlags(
            nil,
            kSecAttrAccessibleWhenUnlockedThisDeviceOnly,
            .biometryCurrentSet,
            nil
        ) else { return }
        var add = base
        add[kSecValueData as String] = data
        add[kSecAttrAccessControl as String] = access
        SecItemAdd(add as CFDictionary, nil)
    }

    /// Reads a biometric-protected secret; iOS shows the Face ID / Touch ID
    /// prompt. Blocking, so it hops off the main thread. Returns nil on
    /// cancel, mismatch, or missing/invalidated item.
    static func getBiometric(_ key: String, prompt: String, service: String = AppConfig.keychainService) async -> String? {
        await withCheckedContinuation { cont in
            DispatchQueue.global(qos: .userInitiated).async {
                let context = LAContext()
                context.localizedReason = prompt
                let query: [String: Any] = [
                    kSecClass as String: kSecClassGenericPassword,
                    kSecAttrService as String: service,
                    kSecAttrAccount as String: key,
                    kSecReturnData as String: true,
                    kSecMatchLimit as String: kSecMatchLimitOne,
                    kSecUseAuthenticationContext as String: context,
                ]
                var item: CFTypeRef?
                let status = SecItemCopyMatching(query as CFDictionary, &item)
                guard status == errSecSuccess,
                      let data = item as? Data,
                      let s = String(data: data, encoding: .utf8) else {
                    cont.resume(returning: nil)
                    return
                }
                cont.resume(returning: s)
            }
        }
    }

    /// True when a biometric-protected item exists, WITHOUT prompting:
    /// `interactionNotAllowed` is precisely "it's there but needs biometry".
    static func hasBiometricItem(_ key: String, service: String = AppConfig.keychainService) -> Bool {
        let context = LAContext()
        context.interactionNotAllowed = true
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key,
            kSecUseAuthenticationContext as String: context,
        ]
        let status = SecItemCopyMatching(query as CFDictionary, nil)
        return status == errSecInteractionNotAllowed || status == errSecSuccess
    }
}
