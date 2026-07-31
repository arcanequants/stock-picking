import UIKit

/// Bridges UIKit's notification-token callbacks into our SwiftUI app.
/// Wired in via `@UIApplicationDelegateAdaptor` in `VectorialDataApp`.
final class AppDelegate: NSObject, UIApplicationDelegate {
    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions:
            [UIApplication.LaunchOptionsKey: Any]? = nil
    ) -> Bool {
        // Touch the singleton NOW so UNUserNotificationCenter.delegate is set
        // before launch finishes. iOS only delivers a cold-launch push tap to
        // a delegate that already exists at this point — leaving it to the
        // first SwiftUI render (@StateObject) is too late, and every tap on a
        // push with the app killed was silently dropped.
        _ = NotificationsManager.shared
        return true
    }

    func application(
        _ application: UIApplication,
        didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data
    ) {
        Task { @MainActor in
            NotificationsManager.shared.didReceiveToken(deviceToken)
        }
    }

    func application(
        _ application: UIApplication,
        didFailToRegisterForRemoteNotificationsWithError error: Error
    ) {
        #if DEBUG
        print("[APNs] failed to register:", error.localizedDescription)
        #endif
    }
}
