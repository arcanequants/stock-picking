import SwiftUI

@main
struct VectorialDataApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) private var appDelegate
    @StateObject private var authManager = AuthManager.shared
    @StateObject private var notifications = NotificationsManager.shared
    @StateObject private var pickStatus = PickStatusStore.shared
    @StateObject private var dividends = DividendStore.shared

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(authManager)
                .environmentObject(notifications)
                .environmentObject(pickStatus)
                .environmentObject(dividends)
                .preferredColorScheme(.dark)
                .onOpenURL { url in
                    authManager.handleDeepLink(url)
                }
                .task {
                    await authManager.restoreSession()
                }
        }
    }
}
