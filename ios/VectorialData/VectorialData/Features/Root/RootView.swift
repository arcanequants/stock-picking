import SwiftUI

/// Whether the launch splash has finished. First-run and the coach tour wait
/// for it: a fullScreenCover presented while the scene is still activating
/// behind the splash is silently dropped on cold launches.
private struct SplashDoneKey: EnvironmentKey {
    static let defaultValue = true
}

extension EnvironmentValues {
    var vdSplashDone: Bool {
        get { self[SplashDoneKey.self] }
        set { self[SplashDoneKey.self] = newValue }
    }
}

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
                .environment(\.vdSplashDone, splashDone)

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
