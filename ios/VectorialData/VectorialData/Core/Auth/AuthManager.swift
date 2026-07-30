import Foundation
import LocalAuthentication
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
    /// Long-lived server credential for Face ID / Touch ID re-login, stored
    /// biometric-protected. Survives sign-out on purpose: only the enrolled
    /// face/finger can release it.
    private let deviceCredentialKey = "device_credential"

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
            await APIClient.shared.setRefreshHandler { [weak self] in
                await self?.refreshAccessToken() ?? false
            }
        }
    }

    /// Supabase auth user id, decoded from the access token's `sub` claim.
    /// Used as the StoreKit `appAccountToken` so App Store Server
    /// Notifications can be matched back to this user server-side even when
    /// the post-purchase verify call never landed.
    var userUUID: UUID? {
        guard let token = KeychainHelper.get(accessTokenKey) else { return nil }
        let parts = token.split(separator: ".")
        guard parts.count >= 2 else { return nil }
        var b64 = String(parts[1])
            .replacingOccurrences(of: "-", with: "+")
            .replacingOccurrences(of: "_", with: "/")
        while b64.count % 4 != 0 { b64 += "=" }
        guard let data = Data(base64Encoded: b64),
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let sub = json["sub"] as? String else { return nil }
        return UUID(uuidString: sub)
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

    /// Creates the account + starts the 14-day free trial (backend
    /// `free-register`: auth user + `trialing` subscriber, no card). Idempotent —
    /// if the email already has an account the backend answers `already: true`
    /// and the caller just proceeds to the sign-in code. Throws on failure.
    func startFreeTrial(email: String) async throws {
        struct Body: Encodable { let email: String; let source: String }
        struct Response: Decodable {
            let success: Bool?
            let already: Bool?
            let trial: Bool?
        }
        _ = try await APIClient.shared.post(
            "/api/auth/free-register",
            body: Body(email: email.lowercased().trimmingCharacters(in: .whitespaces), source: "ios"),
            as: Response.self
        )
    }

    /// True only when the LAST refresh attempt was explicitly rejected by the
    /// server (4xx from ios-refresh, or no stored token) — the only evidence
    /// that the session is truly dead. A refresh that failed because we're
    /// offline must NOT cascade into a sign-out.
    private var refreshDeniedByServer = false

    /// Trades the Keychain refresh_token for a fresh access_token. Called
    /// automatically by `APIClient` on 401s. Returns `true` if the bearer was
    /// refreshed and the original request should retry.
    func refreshAccessToken() async -> Bool {
        guard let refreshToken = KeychainHelper.get(refreshTokenKey) else {
            refreshDeniedByServer = true
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
            refreshDeniedByServer = false
            return true
        } catch APIError.unauthorized {
            refreshDeniedByServer = true
            return false
        } catch APIError.server(let status, _) where (400..<500).contains(status) {
            refreshDeniedByServer = true
            return false
        } catch {
            // Network/timeout/5xx: the token may still be perfectly valid.
            refreshDeniedByServer = false
            return false
        }
    }

    // MARK: - Face ID / Touch ID re-login

    /// True when this device can offer biometric sign-in: a device credential
    /// is enrolled AND the hardware has usable biometrics.
    var canBiometricLogin: Bool {
        guard KeychainHelper.hasBiometricItem(deviceCredentialKey) else { return false }
        var error: NSError?
        return LAContext().canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error)
    }

    /// Which biometry the hardware has, for button copy (Face ID vs Touch ID).
    var biometryType: LABiometryType {
        let ctx = LAContext()
        _ = ctx.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: nil)
        return ctx.biometryType
    }

    /// Ask the server for a long-lived device credential and store it behind
    /// biometrics. No-op when one is already enrolled, biometrics are
    /// unavailable, or the server errors (best-effort — never blocks login).
    private func enrollDeviceCredentialIfNeeded() async {
        guard !KeychainHelper.hasBiometricItem(deviceCredentialKey) else { return }
        var error: NSError?
        guard LAContext().canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error) else { return }

        struct Resp: Decodable { let deviceToken: String }
        guard let resp = try? await APIClient.shared.post(
            "/api/auth/device-credential",
            body: EmptyBody(),
            as: Resp.self
        ) else { return }
        KeychainHelper.setBiometric(resp.deviceToken, forKey: deviceCredentialKey)
    }

    /// Face ID / Touch ID sign-in: release the stored credential with a
    /// biometric match and exchange it for a fresh session. Returns true when
    /// the user ends up signed in.
    func biometricLogin() async -> Bool {
        lastAuthError = nil
        guard let token = await KeychainHelper.getBiometric(
            deviceCredentialKey,
            prompt: String(localized: "Inicia sesión en Vectorial Data")
        ) else {
            // Canceled, mismatch, or invalidated by re-enrolled biometrics.
            return false
        }

        struct Body: Encodable { let deviceToken: String }
        struct Response: Decodable {
            let accessToken: String
            let refreshToken: String
            let expiresAt: Int?
        }
        do {
            let resp = try await APIClient.shared.post(
                "/api/auth/device-login",
                body: Body(deviceToken: token),
                as: Response.self
            )
            KeychainHelper.set(resp.accessToken, forKey: accessTokenKey)
            KeychainHelper.set(resp.refreshToken, forKey: refreshTokenKey)
            await APIClient.shared.setBearer(resp.accessToken)
            await refreshProfile()
            return state == .signedIn
        } catch APIError.unauthorized {
            // Revoked server-side — drop the credential so the button hides.
            KeychainHelper.delete(deviceCredentialKey)
            lastAuthError = String(localized: "Tu acceso con Face ID expiró. Entra con tu correo.")
            return false
        } catch {
            lastAuthError = String(localized: "No hubo conexión. Intenta de nuevo.")
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

    /// Verifies the numeric OTP code from the sign-in email (length follows
    /// Supabase's Email OTP Length setting — currently 8). Alternative to
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
            // Enroll Face ID / Touch ID re-login in the background. Running
            // here (not per login call) also covers users who were already
            // signed in before this feature shipped.
            Task { await self.enrollDeviceCredentialIfNeeded() }
        } catch APIError.unauthorized where refreshDeniedByServer {
            // 401 AND the server explicitly rejected our refresh token: the
            // session is dead for real (revoked/rotated elsewhere). Sign out.
            await clearSession()
        } catch {
            // Anything else — offline, timeout, 5xx, or a 401 whose refresh
            // failed for network reasons — keeps the session. Signed-in UI
            // with cached/stale data beats logging the user out on a bad
            // connection; stores surface their own load errors.
            if state == .unknown { state = .signedIn }
        }
    }
}

struct EmptyResponse: Decodable {}
struct EmptyBody: Encodable {}
