import SwiftUI

/// Top-level router. On launch it plays the animated owl splash over the
/// resolving content, then reveals:
///   • signed-out  → onboarding (new users) with a sign-in escape hatch
///   • signed-in   → the main tab experience (paywall gating handles trial /
///                    already-subscribed — web subscriptions are honored since
///                    `isSubscribed` reads the shared backend).
struct RootView: View {
    @EnvironmentObject private var auth: AuthManager
    @State private var splashDone = false

    var body: some View {
        ZStack {
            content

            if !splashDone {
                LaunchSplashView {
                    withAnimation(.easeInOut(duration: 0.45)) { splashDone = true }
                }
                .transition(.opacity)
                .zIndex(10)
            }
        }
    }

    @ViewBuilder
    private var content: some View {
        switch auth.state {
        case .unknown:
            // Covered by the splash; a plain field for the moment the splash
            // finishes before auth has resolved.
            Color("AppBackground").ignoresSafeArea()
        case .signedOut:
            OnboardingView()
        case .signedIn:
            MainTabView()
        }
    }
}
