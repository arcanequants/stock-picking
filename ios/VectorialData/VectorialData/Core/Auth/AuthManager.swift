import Foundation
import SwiftUI

/// Observable auth state + magic-link flow coordinator.
///
/// Auth flow (iOS):
///   1. User types email → `requestMagicLink(client: "ios")`
///   2. Backend emails a `vectorialdata://auth?token_hash=X&type=Y` link
///   3. `handleDeepLink(url)` exchanges token_hash for a JWT via
///      `/api/auth/ios-exchange`, stores it in the Keychain, and loads
///      the profile.
@MainActor
final class AuthManager: ObservableObject {
    static let shared = AuthManager()

    @Published private(set) var state: AuthState = .unknown
    @Published private(set) var currentUser: UserProfile?

    private let accessTokenKey = "access_token"
    private let refreshTokenKey = "refresh_token"

    enum AuthState: Equatable {
        case unknown
        case signedOut
        case signedIn
    }

    private init() {}

    func restoreSession() async {
        if let token = KeychainHelper.get(accessTokenKey) {
            await APIClient.shared.setBearer(token)
            await refreshProfile()
        } else {
            state = .signedOut
        }
    }

    /// Sends a magic-link email. Success shows "check your email" in the UI.
    func requestMagicLink(email: String, locale: String) async throws {
        struct Body: Encodable {
            let email: String
            let locale: String
            let client: String
        }
        _ = try await APIClient.shared.post(
            "/api/auth/magic-link",
            body: Body(email: email, locale: locale, client: "ios"),
            as: EmptyResponse.self
        )
    }

    /// Called by the @main App when a `vectorialdata://auth?token_hash=X&type=Y` URL is opened.
    func handleDeepLink(_ url: URL) {
        guard url.scheme == AppConfig.urlScheme, url.host == "auth" else { return }

        let items = URLComponents(url: url, resolvingAgainstBaseURL: false)?.queryItems ?? []
        guard let tokenHash = items.first(where: { $0.name == "token_hash" })?.value else {
            return
        }
        let type = items.first(where: { $0.name == "type" })?.value ?? "magiclink"

        Task { await exchange(tokenHash: tokenHash, type: type) }
    }

    func signOut() async {
        KeychainHelper.delete(accessTokenKey)
        KeychainHelper.delete(refreshTokenKey)
        await APIClient.shared.clearBearer()
        currentUser = nil
        state = .signedOut
    }

    private func exchange(tokenHash: String, type: String) async {
        struct Body: Encodable { let tokenHash: String; let type: String }
        struct Response: Decodable {
            let accessToken: String
            let refreshToken: String
            let expiresAt: Int?
            let email: String
        }
        do {
            let resp = try await APIClient.shared.post(
                "/api/auth/ios-exchange",
                body: Body(tokenHash: tokenHash, type: type),
                as: Response.self
            )
            KeychainHelper.set(resp.accessToken, forKey: accessTokenKey)
            KeychainHelper.set(resp.refreshToken, forKey: refreshTokenKey)
            await APIClient.shared.setBearer(resp.accessToken)
            await refreshProfile()
        } catch {
            // Invalid or expired link — force back to sign-in.
            KeychainHelper.delete(accessTokenKey)
            KeychainHelper.delete(refreshTokenKey)
            await APIClient.shared.clearBearer()
            currentUser = nil
            state = .signedOut
        }
    }

    private func refreshProfile() async {
        do {
            let me = try await APIClient.shared.get("/api/me", as: UserProfile.self)
            currentUser = me
            state = .signedIn
        } catch {
            KeychainHelper.delete(accessTokenKey)
            KeychainHelper.delete(refreshTokenKey)
            await APIClient.shared.clearBearer()
            currentUser = nil
            state = .signedOut
        }
    }
}

struct EmptyResponse: Decodable {}
