import SwiftUI

/// Full-screen launch splash: dark field + ambient glow + one-shot owl reveal +
/// the "Vectorial Data" wordmark. Calls `onFinished` once the reveal settles so
/// the app can fade into the resolved root (onboarding / home).
struct LaunchSplashView: View {
    var style: OwlRevealStyle = .particles
    var onFinished: (() -> Void)?

    @State private var showWord = false

    var body: some View {
        ZStack {
            backdrop
            VStack(spacing: 22) {
                OwlReveal(style: style, size: 150) {
                    withAnimation(.easeOut(duration: 0.5)) { showWord = true }
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.9) { onFinished?() }
                }
                VStack(spacing: 6) {
                    Text("Vectorial Data")
                        .font(.largeTitle.bold())
                        .foregroundStyle(.white)
                    Text("Una acción cuando vale la pena")
                        .font(.callout)
                        .foregroundStyle(.white.opacity(0.6))
                }
                .opacity(showWord ? 1 : 0)
                .offset(y: showWord ? 0 : 8)
            }
        }
    }

    private var backdrop: some View {
        ZStack {
            Color.black
            RadialGradient(
                colors: [Color(red: 0.05, green: 0.10, blue: 0.12), .black],
                center: .center, startRadius: 0, endRadius: 420)
        }
        .ignoresSafeArea()
    }
}
