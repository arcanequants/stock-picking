import SwiftUI

/// Magic-link entry screen. User types email → we POST to `/api/auth/magic-link`
/// → show "check your email" confirmation. Deep link back (`vectorialdata://auth`)
/// completes sign-in via `AuthManager.handleDeepLink`.
struct AuthView: View {
    @EnvironmentObject private var auth: AuthManager

    @State private var email: String = ""
    @State private var isSending = false
    @State private var sent = false
    @State private var errorMessage: String?

    var body: some View {
        ZStack {
            Color("AppBackground").ignoresSafeArea()

            VStack(spacing: 24) {
                Spacer()

                Image("OwlMark")
                    .resizable()
                    .scaledToFit()
                    .frame(width: 128, height: 128)
                    .accessibilityHidden(true)

                VStack(spacing: 8) {
                    Text("Vectorial Data")
                        .font(.largeTitle.weight(.semibold))
                        .foregroundStyle(.white)
                    Text("One stock pick a day. Every day.")
                        .font(.body)
                        .foregroundStyle(.white.opacity(0.7))
                        .multilineTextAlignment(.center)
                }

                if sent {
                    ConfirmationCard(email: email)
                } else {
                    SignInCard(
                        email: $email,
                        isSending: isSending,
                        errorMessage: errorMessage,
                        onSend: send
                    )
                }

                Spacer()

                Text("By continuing you agree to the Terms and Privacy Policy.")
                    .font(.footnote)
                    .foregroundStyle(.white.opacity(0.5))
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 32)
            }
            .padding(24)
        }
        .preferredColorScheme(.dark)
    }

    private func send() {
        let trimmed = email.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        guard trimmed.contains("@"), trimmed.contains(".") else {
            errorMessage = "Enter a valid email"
            return
        }
        errorMessage = nil
        isSending = true
        Task {
            defer { isSending = false }
            do {
                try await auth.requestMagicLink(
                    email: trimmed,
                    locale: Locale.current.identifier
                )
                sent = true
            } catch {
                errorMessage = error.localizedDescription
            }
        }
    }
}

private struct SignInCard: View {
    @Binding var email: String
    let isSending: Bool
    let errorMessage: String?
    let onSend: () -> Void

    var body: some View {
        VStack(spacing: 12) {
            HStack(spacing: 10) {
                Image(systemName: "envelope.fill")
                    .foregroundStyle(.white.opacity(0.5))
                TextField("", text: $email, prompt:
                    Text("you@example.com").foregroundStyle(.white.opacity(0.4))
                )
                .textContentType(.emailAddress)
                .keyboardType(.emailAddress)
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled()
                .foregroundStyle(.white)
            }
            .padding(14)
            .background(Color("CardBackground"))
            .overlay(
                RoundedRectangle(cornerRadius: 12, style: .continuous)
                    .stroke(.white.opacity(0.12), lineWidth: 1)
            )
            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))

            Button(action: onSend) {
                HStack {
                    if isSending { ProgressView().tint(.white) }
                    Text(isSending ? "Sending…" : "Send magic link")
                        .font(.headline)
                }
                .frame(maxWidth: .infinity, minHeight: 50)
                .foregroundStyle(.white)
                .background(Color("BrandEmerald"))
                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
            }
            .disabled(isSending || email.isEmpty)
            .opacity(isSending || email.isEmpty ? 0.6 : 1)

            if let errorMessage {
                Text(errorMessage)
                    .font(.footnote)
                    .foregroundStyle(.red)
            }
        }
        .padding(.horizontal, 8)
    }
}

private struct ConfirmationCard: View {
    let email: String

    var body: some View {
        VStack(spacing: 12) {
            Image(systemName: "envelope.badge.fill")
                .font(.system(size: 44))
                .foregroundStyle(Color("BrandEmerald"))
            Text("Check your email")
                .font(.title2.weight(.semibold))
                .foregroundStyle(.white)
            Text("We sent a sign-in link to \(email). Tap it on this device to continue.")
                .font(.body)
                .multilineTextAlignment(.center)
                .foregroundStyle(.white.opacity(0.75))
        }
        .padding(24)
        .frame(maxWidth: .infinity)
        .background(Color("CardBackground"))
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
    }
}
