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
    @State private var resendCooldown: Int = 0
    @State private var cooldownTimer: Timer?
    @State private var otpCode: String = ""
    @State private var isVerifyingOTP = false

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
                    ConfirmationCard(
                        email: email,
                        isResending: isSending,
                        isVerifyingOTP: isVerifyingOTP,
                        resendCooldown: resendCooldown,
                        otpCode: $otpCode,
                        errorMessage: errorMessage ?? auth.lastAuthError,
                        onResend: resend,
                        onUseDifferentEmail: useDifferentEmail,
                        onVerifyOTP: verifyOTP
                    )
                } else {
                    SignInCard(
                        email: $email,
                        isSending: isSending,
                        errorMessage: errorMessage ?? auth.lastAuthError,
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
        .onDisappear { cooldownTimer?.invalidate() }
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
                startResendCooldown()
            } catch {
                errorMessage = error.localizedDescription
            }
        }
    }

    private func resend() {
        guard resendCooldown == 0, !isSending else { return }
        isSending = true
        Task {
            defer { isSending = false }
            do {
                try await auth.requestMagicLink(
                    email: email,
                    locale: Locale.current.identifier
                )
                startResendCooldown()
            } catch {
                errorMessage = error.localizedDescription
            }
        }
    }

    private func useDifferentEmail() {
        cooldownTimer?.invalidate()
        cooldownTimer = nil
        resendCooldown = 0
        sent = false
        errorMessage = nil
        otpCode = ""
        auth.lastAuthError = nil
    }

    private func verifyOTP() {
        let code = otpCode.trimmingCharacters(in: .whitespacesAndNewlines)
        guard code.count == 6 else {
            errorMessage = "Enter the 6-digit code from your email."
            return
        }
        errorMessage = nil
        isVerifyingOTP = true
        Task {
            defer { isVerifyingOTP = false }
            do {
                try await auth.verifyOTP(email: email, otp: code)
            } catch {
                // auth.lastAuthError is set by AuthManager
            }
        }
    }

    private func startResendCooldown() {
        cooldownTimer?.invalidate()
        resendCooldown = 30
        cooldownTimer = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { timer in
            Task { @MainActor in
                if resendCooldown > 0 {
                    resendCooldown -= 1
                } else {
                    timer.invalidate()
                }
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
    let isResending: Bool
    let isVerifyingOTP: Bool
    let resendCooldown: Int
    @Binding var otpCode: String
    let errorMessage: String?
    let onResend: () -> Void
    let onUseDifferentEmail: () -> Void
    let onVerifyOTP: () -> Void

    var body: some View {
        VStack(spacing: 20) {
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

            // OTP code entry — alternative to tapping the deep link
            VStack(spacing: 8) {
                Text("Or enter the 6-digit code from your email")
                    .font(.footnote)
                    .foregroundStyle(.white.opacity(0.55))
                    .multilineTextAlignment(.center)
                HStack(spacing: 10) {
                    TextField("", text: $otpCode, prompt:
                        Text("000000").foregroundStyle(.white.opacity(0.3))
                    )
                    .keyboardType(.numberPad)
                    .textContentType(.oneTimeCode)
                    .multilineTextAlignment(.center)
                    .font(.system(size: 22, weight: .semibold, design: .monospaced))
                    .foregroundStyle(.white)
                    .padding(12)
                    .background(Color("CardBackground"))
                    .overlay(
                        RoundedRectangle(cornerRadius: 10, style: .continuous)
                            .stroke(.white.opacity(0.18), lineWidth: 1)
                    )
                    .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                    .onChange(of: otpCode) { _, newValue in
                        otpCode = String(newValue.filter { $0.isNumber }.prefix(6))
                    }
                    Button(action: onVerifyOTP) {
                        Group {
                            if isVerifyingOTP {
                                ProgressView().tint(.white)
                            } else {
                                Text("Verify")
                                    .font(.subheadline.weight(.semibold))
                            }
                        }
                        .frame(minWidth: 72, minHeight: 44)
                        .foregroundStyle(.white)
                        .background(Color("BrandEmerald"))
                        .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                    }
                    .disabled(otpCode.count < 6 || isVerifyingOTP)
                    .opacity(otpCode.count < 6 || isVerifyingOTP ? 0.5 : 1)
                }
                if let msg = errorMessage {
                    Text(msg)
                        .font(.footnote)
                        .foregroundStyle(.red)
                        .multilineTextAlignment(.center)
                }
            }

            Text("Didn't receive it? Check your spam folder.")
                .font(.footnote)
                .foregroundStyle(.white.opacity(0.55))
                .multilineTextAlignment(.center)

            VStack(spacing: 10) {
                Button(action: onResend) {
                    HStack {
                        if isResending { ProgressView().tint(.white) }
                        Text(resendLabel)
                            .font(.subheadline.weight(.semibold))
                    }
                    .frame(maxWidth: .infinity, minHeight: 44)
                    .foregroundStyle(.white)
                    .overlay(
                        RoundedRectangle(cornerRadius: 10, style: .continuous)
                            .stroke(.white.opacity(0.25), lineWidth: 1)
                    )
                }
                .disabled(resendCooldown > 0 || isResending)
                .opacity(resendCooldown > 0 || isResending ? 0.5 : 1)

                Button(action: onUseDifferentEmail) {
                    Text("Use a different email")
                        .font(.subheadline)
                        .foregroundStyle(.white.opacity(0.7))
                        .frame(maxWidth: .infinity, minHeight: 44)
                }
            }
        }
        .padding(24)
        .frame(maxWidth: .infinity)
        .background(Color("CardBackground"))
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
    }

    private var resendLabel: String {
        if isResending { return "Resending…" }
        if resendCooldown > 0 { return "Resend in \(resendCooldown)s" }
        return "Resend email"
    }
}
