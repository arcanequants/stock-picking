import Foundation
import UIKit
import UserNotifications

/// Owns the push notification lifecycle.
///
/// Flow:
///   1. `requestAuthorization` asks the user and registers with APNs.
///   2. `AppDelegate` forwards `didRegisterForRemoteNotificationsWithDeviceToken`
///      → `didReceiveToken(_:)` which POSTs to `/api/notifications/register-device`.
///   3. On sign out call `unregister` which DELETEs the token.
@MainActor
final class NotificationsManager: NSObject, ObservableObject {
    static let shared = NotificationsManager()

    @Published private(set) var authorizationStatus: UNAuthorizationStatus = .notDetermined
    @Published private(set) var lastRegisteredToken: String?

    /// The APNs token persists across launches so `unregister()` can DELETE
    /// it on sign-out even after a cold start (the in-memory copy is gone by
    /// then). Stored in UserDefaults — it's a device token, not a secret.
    private let tokenDefaultsKey = "apns.deviceToken"

    /// When the user taps a "Nuevo pick" push the payload arrives here. The
    /// Picks tab consumes and clears it via `consumePendingPickTap()`.
    @Published var pendingPickNumber: Int?

    /// Fires when the user taps a Friday-digest push. The weekly digest
    /// screen consumes and clears it.
    @Published var pendingWeeklyDigest: Bool = false

    /// Set when the user taps a curated-news push. HomeView consumes
    /// and clears it after pushing the detail onto its nav stack.
    @Published var pendingNewsId: UUID?

    /// Triggers the paywall sheet in PicksView via URL scheme. Consumed
    /// immediately after presentation; not persisted across launches.
    @Published var pendingShowPaywall: Bool = false

    /// Set when the user taps the scheduled "raise your amount" reminder, so
    /// MainTabView opens the per-buy amount editor.
    @Published var pendingOpenAmount: Bool = false

    private override init() {
        super.init()
        UNUserNotificationCenter.current().delegate = self
        Task { await refreshStatus() }
    }

    func refreshStatus() async {
        let settings = await UNUserNotificationCenter.current().notificationSettings()
        authorizationStatus = settings.authorizationStatus
    }

    /// Ask the user and register for remote notifications. Returns whether
    /// authorization was granted.
    @discardableResult
    func requestAuthorization() async -> Bool {
        do {
            let granted = try await UNUserNotificationCenter.current()
                .requestAuthorization(options: [.alert, .badge, .sound])
            await refreshStatus()
            if granted {
                UIApplication.shared.registerForRemoteNotifications()
            }
            return granted
        } catch {
            return false
        }
    }

    /// Called by `AppDelegate` with the raw APNs token bytes.
    func didReceiveToken(_ data: Data) {
        let token = data.map { String(format: "%02x", $0) }.joined()
        lastRegisteredToken = token
        UserDefaults.standard.set(token, forKey: tokenDefaultsKey)
        Task { await register(token: token) }
    }

    /// Re-attach this device's push token to the signed-in user. Called after
    /// a successful profile load so a token minted while signed out (or under
    /// the previous user) gets bound to the current account.
    func refreshRegistrationIfAuthorized() async {
        guard let token = lastRegisteredToken
            ?? UserDefaults.standard.string(forKey: tokenDefaultsKey)
        else { return }
        lastRegisteredToken = token
        await register(token: token)
    }

    /// Clears in-memory deep-link payloads. Called on sign-out so a tapped
    /// push from the previous session doesn't route the next user.
    func clearPending() {
        pendingPickNumber = nil
        pendingWeeklyDigest = false
        pendingNewsId = nil
        pendingShowPaywall = false
    }

    /// Call on sign-out to stop receiving pushes on this device. Reads the
    /// token from persistence so it works even after a cold launch where the
    /// in-memory copy was never repopulated.
    func unregister() async {
        guard let token = lastRegisteredToken
            ?? UserDefaults.standard.string(forKey: tokenDefaultsKey)
        else { return }
        struct Body: Encodable { let token: String }
        _ = try? await APIClient.shared.delete(
            "/api/notifications/register-device",
            body: Body(token: token),
            as: EmptyResponse.self
        )
        lastRegisteredToken = nil
        UserDefaults.standard.removeObject(forKey: tokenDefaultsKey)
    }

    private func register(token: String) async {
        // Only bind the token to a user once we actually have a session;
        // otherwise the unauthenticated POST 401s and the token is dropped.
        guard AuthManager.shared.state == .signedIn else { return }
        struct Body: Encodable {
            let token: String
            let platform: String
            let appVersion: String?
        }
        let version = Bundle.main
            .object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String
        _ = try? await APIClient.shared.post(
            "/api/notifications/register-device",
            body: Body(token: token, platform: "ios", appVersion: version),
            as: EmptyResponse.self
        )
    }
}

extension NotificationsManager: UNUserNotificationCenterDelegate {
    // Show notifications while app is foregrounded.
    nonisolated func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification
    ) async -> UNNotificationPresentationOptions {
        [.banner, .sound, .badge]
    }

    nonisolated func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse
    ) async {
        // Parse everything into Sendable locals here, in the nonisolated
        // context, so the closure hopped to the main actor never captures the
        // non-Sendable `userInfo` ([AnyHashable: Any]).
        let userInfo = response.notification.request.content.userInfo
        let kind = userInfo["kind"] as? String
        let pickNumber = parsePickNumber(userInfo)
        let newsId = (userInfo["news_id"] as? String).flatMap(UUID.init(uuidString:))

        await MainActor.run {
            switch kind {
            case "new_pick":
                if let pickNumber { Self.shared.pendingPickNumber = pickNumber }
            case "weekly_digest":
                Self.shared.pendingWeeklyDigest = true
            case "news":
                if let newsId { Self.shared.pendingNewsId = newsId }
            case "dividend_paid":
                // Re-use the new-pick deep link: route to the pick detail
                // where the new "DIVIDENDOS" section is already visible.
                if let pickNumber { Self.shared.pendingPickNumber = pickNumber }
            case "raise_amount":
                Self.shared.pendingOpenAmount = true
            default:
                break
            }
        }
    }

    /// Reads `pick_number` from a notification payload, tolerating both Int and
    /// String encodings. Pure + nonisolated so it runs in the delegate context.
    private nonisolated func parsePickNumber(_ userInfo: [AnyHashable: Any]) -> Int? {
        if let n = userInfo["pick_number"] as? Int { return n }
        if let s = userInfo["pick_number"] as? String { return Int(s) }
        return nil
    }
}
