import Foundation
import SwiftUI
#if canImport(UIKit)
import UIKit
#endif

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
    /// Set when a magic-link exchange or OTP verify fails so the sign-in
    /// screen can tell the user. Views may clear this on dismiss.
    @Published var lastAuthError: String?

    private let accessTokenKey = "access_token"
    private let refreshTokenKey = "refresh_token"

    enum AuthState: Equatable {
        case unknown
        case signedOut
        case signedIn
    }

    private init() {
        // Hook the network client into our refresh flow. APIClient calls back
        // here whenever a request returns 401; we trade the refresh_token in
        // the Keychain for a fresh access_token and let the request retry.
        Task { [weak self] in
            await APIClient.shared.setRefreshHandler {
                await self?.refreshAccessToken() ?? false
            }
        }
    }

    func restoreSession() async {
        if let token = KeychainHelper.get(accessTokenKey) {
            await APIClient.shared.setBearer(token)
            await refreshProfile()
        } else {
            state = .signedOut
        }
    }

    /// Sends a magic-link email. Success shows "check your email" in the UI.
    ///
    /// In Debug builds, when the backend returns `dev_link` (RESEND not configured),
    /// auto-open it so the simulator deep-links back into the app without needing
    /// `xcrun simctl openurl` from a terminal.
    func requestMagicLink(email: String, locale: String) async throws {
        lastAuthError = nil
        struct Body: Encodable {
            let email: String
            let locale: String
            let client: String
        }
        struct Response: Decodable {
            let ok: Bool?
            let devLink: String?
        }
        let resp = try await APIClient.shared.post(
            "/api/auth/magic-link",
            body: Body(email: email, locale: locale, client: "ios"),
            as: Response.self
        )

        #if DEBUG && canImport(UIKit)
        if let link = resp.devLink, let url = URL(string: link) {
            UIApplication.shared.open(url, options: [:], completionHandler: nil)
        }
        #endif
    }

    /// Trades the Keychain refresh_token for a fresh access_token. Called
    /// automatically by `APIClient` on 401s. Returns `true` if the bearer was
    /// refreshed and the original request should retry.
    func refreshAccessToken() async -> Bool {
        guard let refreshToken = KeychainHelper.get(refreshTokenKey) else {
            return false
        }
        struct Body: Encodable { let refreshToken: String }
        struct Response: Decodable {
            let accessToken: String
            let refreshToken: String
            let expiresAt: Int?
        }
        do {
            let resp = try await APIClient.shared.post(
                "/api/auth/ios-refresh",
                body: Body(refreshToken: refreshToken),
                as: Response.self
            )
            KeychainHelper.set(resp.accessToken, forKey: accessTokenKey)
            KeychainHelper.set(resp.refreshToken, forKey: refreshTokenKey)
            await APIClient.shared.setBearer(resp.accessToken)
            return true
        } catch {
            return false
        }
    }

    /// Public re-fetch of `/api/me`. Views that show subscription state
    /// (e.g. AccountView) call this on appear so the user doesn't see stale
    /// "Free" status after their Stripe payment activates.
    func refreshCurrentUser() async {
        await refreshProfile()
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

    /// Signs in using demo credentials (App Store Review bypass).
    /// Calls /api/auth/demo-login which validates email+password server-side
    /// and returns a JWT without requiring email verification.
    func demoLogin(email: String, password: String) async throws {
        lastAuthError = nil
        struct Body: Encodable { let email: String; let password: String }
        struct Response: Decodable {
            let accessToken: String
            let refreshToken: String
            let expiresAt: Int?
            let email: String
        }
        do {
            let resp = try await APIClient.shared.post(
                "/api/auth/demo-login",
                body: Body(email: email, password: password),
                as: Response.self
            )
            KeychainHelper.set(resp.accessToken, forKey: accessTokenKey)
            KeychainHelper.set(resp.refreshToken, forKey: refreshTokenKey)
            await APIClient.shared.setBearer(resp.accessToken)
            lastAuthError = nil
            await refreshProfile()
        } catch {
            lastAuthError = "Invalid credentials."
            throw error
        }
    }

    /// Verifies the 6-digit OTP code from the sign-in email. Alternative to
    /// tapping the magic link — works even when the deep link fails to open the
    /// app (e.g. email opened on a different device or in a browser).
    func verifyOTP(email: String, otp: String) async throws {
        lastAuthError = nil
        struct Body: Encodable { let email: String; let otp: String }
        struct Response: Decodable {
            let accessToken: String
            let refreshToken: String
            let expiresAt: Int?
            let email: String
        }
        do {
            let resp = try await APIClient.shared.post(
                "/api/auth/ios-otp-verify",
                body: Body(email: email, otp: otp),
                as: Response.self
            )
            KeychainHelper.set(resp.accessToken, forKey: accessTokenKey)
            KeychainHelper.set(resp.refreshToken, forKey: refreshTokenKey)
            await APIClient.shared.setBearer(resp.accessToken)
            lastAuthError = nil
            await refreshProfile()
        } catch {
            lastAuthError = "Incorrect code or it has expired. Please try again."
            throw error
        }
    }

    func signOut() async {
        // Unregister the push token while we still hold a valid bearer, so
        // this device stops receiving the signed-out user's notifications.
        await NotificationsManager.shared.unregister()
        await clearSession()
    }

    /// Permanently deletes the user's account on the server, then wipes the
    /// local session. Required by App Store Guideline 5.1.1(v).
    ///
    /// The backend cancels any Stripe subscription and removes all user data;
    /// it cannot cancel an Apple In-App Purchase subscription — the user does
    /// that in App Store Settings (the confirmation UI tells them so).
    ///
    /// Throws if the server fails to delete the account, in which case the
    /// local session is left intact so the user can retry.
    func deleteAccount() async throws {
        // Unregister this device's push token while we still hold a valid
        // bearer, mirroring sign-out, before the account disappears.
        await NotificationsManager.shared.unregister()
        _ = try await APIClient.shared.post(
            "/api/account/delete",
            body: EmptyBody(),
            as: EmptyResponse.self
        )
        await clearSession()
    }

    /// Wipes all local session state: keychain tokens, bearer, profile, and
    /// every cached store. Used by sign-out and by any path that detects a
    /// dead session, so a second user never sees the first user's cached data.
    private func clearSession() async {
        KeychainHelper.delete(accessTokenKey)
        KeychainHelper.delete(refreshTokenKey)
        await APIClient.shared.clearBearer()
        currentUser = nil
        state = .signedOut
        resetCaches()
    }

    private func resetCaches() {
        PickStatusStore.shared.reset()
        DividendStore.shared.reset()
        PriorHoldingsStore.shared.reset()
        NewsStore.shared.reset()
        NotificationsManager.shared.clearPending()
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
            lastAuthError = nil
            await refreshProfile()
        } catch {
            // Invalid or expired link — force back to sign-in with a reason.
            lastAuthError = "Ese enlace expiró o ya se usó. Pide uno nuevo."
            await clearSession()
        }
    }

    private func refreshProfile() async {
        do {
            let me = try await APIClient.shared.get("/api/me", as: UserProfile.self)
            currentUser = me
            state = .signedIn
            // Re-attach this device's push token to the now-signed-in user.
            await NotificationsManager.shared.refreshRegistrationIfAuthorized()
        } catch {
            await clearSession()
        }
    }
}

struct EmptyResponse: Decodable {}
struct EmptyBody: Encodable {}
