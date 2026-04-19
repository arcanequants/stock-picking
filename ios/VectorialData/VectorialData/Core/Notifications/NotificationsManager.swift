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
        Task { await register(token: token) }
    }

    /// Call on sign-out to stop receiving pushes on this device.
    func unregister() async {
        guard let token = lastRegisteredToken else { return }
        struct Body: Encodable { let token: String }
        _ = try? await APIClient.shared.delete(
            "/api/notifications/register-device",
            body: Body(token: token),
            as: EmptyResponse.self
        )
        lastRegisteredToken = nil
    }

    private func register(token: String) async {
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
        // Tap handling hook — for now we just noop; future: route to ticker detail.
    }
}
