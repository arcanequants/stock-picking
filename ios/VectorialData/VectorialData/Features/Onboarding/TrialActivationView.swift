import SwiftUI
import UserNotifications

/// First-run step right after account creation: start the 14-day free trial
/// through Apple (IAP introductory offer on the monthly subscription). The
/// StoreKit sheet asks for Face ID / Apple ID confirmation; $0 today, then
/// $0.99/mo from day 14 until canceled — Apple handles the billing.
struct TrialActivationView: View {
    @StateObject private var store = StoreManager.shared
    var onDone: (() -> Void)?

    @State private var purchasing = false

    var body: some View {
        ZStack {
            Color("AppBackground").ignoresSafeArea()
            VStack(spacing: 16) {
                Spacer(minLength: 12)

                Image("OwlMark")
                    .resizable().scaledToFit()
                    .frame(width: 60, height: 60)
                    .clipShape(Circle())
                    .shadow(color: Color("BrandEmerald").opacity(0.5), radius: 18)

                Text("Activa tus\n14 días gratis.")
                    .font(.largeTitle.bold())
                    .foregroundStyle(.white)
                    .multilineTextAlignment(.center)

                VStack(alignment: .leading, spacing: 7) {
                    check("Cada pick, en el momento que vale")
                    check("Tesis completa + valuación")
                    check("El portafolio real, en vivo")
                    check("Cancela cuando quieras en Ajustes")
                }
                .padding(.top, 2)

                timeline
                    .padding(.top, 4)

                Spacer()

                if case .failed(let msg) = store.phase {
                    Text(msg)
                        .font(.caption)
                        .foregroundStyle(.red)
                        .multilineTextAlignment(.center)
                }

                Button(action: startTrial) {
                    HStack {
                        if purchasing { ProgressView().tint(.black) }
                        else { Text("Empezar prueba gratis") }
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
                .disabled(purchasing)

                Button("Ahora no") { onDone?() }
                    .font(.subheadline)
                    .foregroundStyle(.white.opacity(0.6))
                    .disabled(purchasing)

                Text("Se cobra con tu Apple ID al terminar la prueba, salvo que canceles antes.")
                    .font(.caption2)
                    .foregroundStyle(.white.opacity(0.4))
                    .multilineTextAlignment(.center)
            }
            .padding(.horizontal, 24)
            .padding(.bottom, 18)
        }
        .preferredColorScheme(.dark)
        .task { await store.loadProduct() }
    }

    private var timeline: some View {
        VStack(spacing: 0) {
            timelineRow("Hoy", "Gratis — acceso completo")
            Divider().overlay(Color.white.opacity(0.08))
            timelineRow("Día 12", "Te recordamos que la prueba termina")
            Divider().overlay(Color.white.opacity(0.08))
            timelineRow("Día 14", "Empieza \(store.displayPrice ?? "$0.99")/mes")
        }
        .padding(.horizontal, 14)
        .background(Color("CardBackground"))
        .clipShape(RoundedRectangle(cornerRadius: 13))
    }

    private func timelineRow(_ when: String, _ what: String) -> some View {
        HStack {
            Text(when)
                .font(.subheadline.weight(.semibold).monospacedDigit())
                .foregroundStyle(Color("BrandEmerald"))
                .frame(width: 62, alignment: .leading)
            Text(what)
                .font(.footnote)
                .foregroundStyle(.white.opacity(0.75))
            Spacer(minLength: 0)
        }
        .padding(.vertical, 11)
    }

    private func check(_ text: String) -> some View {
        HStack(spacing: 9) {
            Image(systemName: "checkmark.circle.fill")
                .font(.footnote)
                .foregroundStyle(Color("BrandEmerald"))
            Text(text)
                .font(.footnote)
                .foregroundStyle(.white.opacity(0.8))
        }
    }

    private func startTrial() {
        purchasing = true
        Task {
            let ok = await store.purchase()
            purchasing = false
            if ok {
                TrialEndReminder.schedule()
                onDone?()
            }
            // On cancel/failure the user stays here; "Ahora no" always exits.
        }
    }
}

/// Local day-12 heads-up so "Día 12: te recordamos" is a real promise. Fires
/// only if notification permission is granted (primed right after this step).
enum TrialEndReminder {
    static let id = "vd.trialEndReminder"

    static func schedule() {
        let content = UNMutableNotificationContent()
        content.title = "Tu prueba termina en 2 días"
        content.body = "El día 14 empieza el cobro de $0.99/mes con tu Apple ID. Si no quieres continuar, cancela en Ajustes — sin preguntas."
        content.sound = .default
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 12 * 86_400, repeats: false)
        UNUserNotificationCenter.current().add(
            UNNotificationRequest(identifier: id, content: content, trigger: trigger))
    }
}
