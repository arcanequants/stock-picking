import SwiftUI

/// Guided account creation for the "Empezar 14 días gratis" CTA.
///
/// Flow: email → `free-register` (source "ios": creates the auth user only —
/// the 14-day trial is Apple's introductory offer, activated right after
/// sign-in via TrialActivationView) → `magic-link` email with the 8-digit
/// code → code entry → signed in. RootView flips to MainTabView the moment
/// auth state changes, which dismisses this cover.
///
/// No password field here — passwordless is the product. (The optional
/// password lives only on the sign-in screen, where App Review uses the demo
/// account.)
struct CreateAccountView: View {
    @EnvironmentObject private var auth: AuthManager
    @Environment(\.dismiss) private var dismiss

    private enum Step { case email, code }
    @State private var step: Step = .email
    @State private var email = ""
    @State private var code = ""
    @State private var busy = false
    @State private var errorMessage: String?
    @FocusState private var focused: Bool

    var body: some View {
        ZStack {
            Color("AppBackground").ignoresSafeArea()
            VStack(spacing: 0) {
                header
                ScrollView {
                    VStack(alignment: .leading, spacing: 18) {
                        switch step {
                        case .email: emailStep
                        case .code: codeStep
                        }
                    }
                    .padding(.horizontal, 22)
                    .padding(.top, 8)
                }
            }
        }
        .preferredColorScheme(.dark)
    }

    private var header: some View {
        HStack {
            Button {
                if step == .code { withAnimation { step = .email } } else { dismiss() }
            } label: {
                Image(systemName: "chevron.left")
                    .font(.body.weight(.semibold))
                    .foregroundStyle(.white.opacity(0.8))
                    .frame(width: 40, height: 40)
            }
            Spacer()
        }
        .padding(.horizontal, 10)
        .padding(.top, 6)
    }

    // MARK: - Step 1: email

    private var emailStep: some View {
        VStack(alignment: .leading, spacing: 16) {
            Image("OwlMark")
                .resizable().scaledToFit()
                .frame(width: 56, height: 56)
                .clipShape(Circle())
                .shadow(color: Color("BrandEmerald").opacity(0.5), radius: 16)
                .frame(maxWidth: .infinity, alignment: .center)

            Text("Crea tu cuenta")
                .font(.largeTitle.bold())
                .foregroundStyle(.white)

            Text("Crea tu cuenta y activa tus 14 días gratis con tu Apple ID.")
                .font(.body)
                .foregroundStyle(.white.opacity(0.7))

            HStack(spacing: 10) {
                Image(systemName: "envelope.fill")
                    .foregroundStyle(.white.opacity(0.5))
                TextField("", text: $email, prompt:
                    Text("tu@correo.com").foregroundStyle(.white.opacity(0.4))
                )
                .textContentType(.emailAddress)
                .keyboardType(.emailAddress)
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled()
                .foregroundStyle(.white)
                .focused($focused)
            }
            .padding(15)
            .background(Color("CardBackground"))
            .overlay(RoundedRectangle(cornerRadius: 13).stroke(.white.opacity(0.12), lineWidth: 1))
            .clipShape(RoundedRectangle(cornerRadius: 13))

            if let errorMessage {
                Text(errorMessage)
                    .font(.footnote)
                    .foregroundStyle(.red)
            }

            Button(action: createAccount) {
                HStack {
                    if busy { ProgressView().tint(.black) }
                    else { Text("Crear cuenta y empezar") }
                }
                .font(.headline)
                .foregroundStyle(.black)
                .frame(maxWidth: .infinity, minHeight: 52)
                .background(
                    LinearGradient(colors: [Color(red: 0.05, green: 0.64, blue: 0.44), Color("BrandEmerald")],
                                   startPoint: .leading, endPoint: .trailing)
                )
                .clipShape(RoundedRectangle(cornerRadius: 14))
            }
            .disabled(busy)

            VStack(alignment: .leading, spacing: 8) {
                perk("checkmark.circle.fill", "14 días gratis, acceso completo")
                perk("creditcard", "Luego $0.99/mes con tu Apple ID — cancela cuando quieras antes del día 14 y no se te cobra.")
                perk("key.fill", "Sin contraseña — te enviamos un código a tu correo.")
            }
            .padding(.top, 4)

            Text("Al continuar aceptas los Términos y la Política de Privacidad.")
                .font(.caption2)
                .foregroundStyle(.white.opacity(0.4))
                .padding(.top, 6)
        }
        .onAppear { focused = true }
    }

    private func perk(_ icon: String, _ text: String) -> some View {
        HStack(alignment: .top, spacing: 9) {
            Image(systemName: icon)
                .font(.footnote)
                .foregroundStyle(Color("BrandEmerald"))
                .frame(width: 18)
            Text(text)
                .font(.footnote)
                .foregroundStyle(.white.opacity(0.65))
                .fixedSize(horizontal: false, vertical: true)
        }
    }

    // MARK: - Step 2: code

    private var codeStep: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Revisa tu correo")
                .font(.largeTitle.bold())
                .foregroundStyle(.white)

            Text("Enviamos un código a ")
                .font(.body).foregroundStyle(.white.opacity(0.7))
            + Text(email.lowercased())
                .font(.body.weight(.semibold)).foregroundStyle(.white)
            + Text(". Escríbelo aquí y listo — tu cuenta queda creada.")
                .font(.body).foregroundStyle(.white.opacity(0.7))

            TextField("", text: $code, prompt:
                Text("00000000").foregroundStyle(.white.opacity(0.3))
            )
            .keyboardType(.numberPad)
            .textContentType(.oneTimeCode)
            .multilineTextAlignment(.center)
            .font(.system(size: 26, weight: .semibold, design: .monospaced))
            .foregroundStyle(.white)
            .padding(14)
            .background(Color("CardBackground"))
            .overlay(RoundedRectangle(cornerRadius: 13).stroke(.white.opacity(0.14), lineWidth: 1))
            .clipShape(RoundedRectangle(cornerRadius: 13))
            .focused($focused)
            .onChange(of: code) { _, newValue in
                code = String(newValue.filter { $0.isNumber }.prefix(8))
            }

            if let errorMessage {
                Text(errorMessage)
                    .font(.footnote)
                    .foregroundStyle(.red)
            }

            Button(action: verify) {
                HStack {
                    if busy { ProgressView().tint(.black) }
                    else { Text("Confirmar") }
                }
                .font(.headline)
                .foregroundStyle(.black)
                .frame(maxWidth: .infinity, minHeight: 52)
                .background(
                    LinearGradient(colors: [Color(red: 0.05, green: 0.64, blue: 0.44), Color("BrandEmerald")],
                                   startPoint: .leading, endPoint: .trailing)
                )
                .clipShape(RoundedRectangle(cornerRadius: 14))
            }
            .disabled(busy || code.count < 6)
            .opacity(code.count < 6 ? 0.6 : 1)

            Button("Reenviar código") { resend() }
                .font(.subheadline)
                .foregroundStyle(.white.opacity(0.6))
                .frame(maxWidth: .infinity)
                .disabled(busy)

            Text("¿No llega? Revisa tu carpeta de spam.")
                .font(.caption)
                .foregroundStyle(.white.opacity(0.4))
                .frame(maxWidth: .infinity)
        }
        .onAppear { focused = true }
    }

    // MARK: - Actions

    private func createAccount() {
        let trimmed = email.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        guard trimmed.contains("@"), trimmed.contains(".") else {
            errorMessage = "Escribe un correo válido."
            return
        }
        errorMessage = nil
        busy = true
        Task {
            defer { busy = false }
            do {
                // 1. Create the account + start the no-card trial (idempotent).
                try await auth.startFreeTrial(email: trimmed)
                // 2. Send the sign-in code to that inbox.
                try await auth.requestMagicLink(email: trimmed, locale: Locale.current.identifier)
                withAnimation { step = .code }
            } catch {
                errorMessage = "No pudimos crear tu cuenta. Revisa tu conexión e inténtalo de nuevo."
            }
        }
    }

    private func verify() {
        errorMessage = nil
        busy = true
        Task {
            defer { busy = false }
            do {
                try await auth.verifyOTP(email: email.lowercased(), otp: code)
                // Auth state flips to signedIn → RootView swaps to MainTabView.
            } catch {
                errorMessage = "Código incorrecto o vencido. Inténtalo de nuevo."
            }
        }
    }

    private func resend() {
        errorMessage = nil
        busy = true
        Task {
            defer { busy = false }
            try? await auth.requestMagicLink(email: email.lowercased(), locale: Locale.current.identifier)
        }
    }
}
