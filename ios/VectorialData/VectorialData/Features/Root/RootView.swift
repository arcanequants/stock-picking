import SwiftUI

/// Top-level router — switches between auth gate, loading splash,
/// and the main tab experience based on `AuthManager.state`.
struct RootView: View {
    @EnvironmentObject private var auth: AuthManager

    var body: some View {
        Group {
            switch auth.state {
            case .unknown:
                SplashView()
            case .signedOut:
                AuthView()
            case .signedIn:
                MainTabView()
            }
        }
        .animation(.easeInOut(duration: 0.2), value: auth.state)
    }
}

private struct SplashView: View {
    var body: some View {
        ZStack {
            Color("AppBackground").ignoresSafeArea()
            ProgressView().tint(.white)
        }
    }
}
