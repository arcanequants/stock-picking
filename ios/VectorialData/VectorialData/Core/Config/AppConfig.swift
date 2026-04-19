import Foundation

enum AppConfig {
    /// Canonical production base URL for the Vectorial Data API.
    /// Local development can override via VD_API_BASE_URL in scheme env vars.
    static let apiBaseURL: URL = {
        if let override = ProcessInfo.processInfo.environment["VD_API_BASE_URL"],
           let url = URL(string: override) {
            return url
        }
        return URL(string: "https://www.vectorialdata.com")!
    }()

    /// Deep-link scheme registered in Info.plist CFBundleURLTypes.
    static let urlScheme = "vectorialdata"

    /// Keychain service identifier for the auth token.
    static let keychainService = "com.vectorialdata.app.auth"
}
