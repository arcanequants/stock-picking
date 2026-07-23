import SwiftUI
import UserNotifications

/// Set the consistent per-buy amount. The whole philosophy: the SAME amount
/// every time, starting with what you won't feel, raised in steps over time.
/// Used both as a first-run step (pass `onDone`) and from the Account tab.
struct InvestmentAmountView: View {
    @EnvironmentObject private var pickStatus: PickStatusStore
    @Environment(\.dismiss) private var dismiss

    /// When set, this is the onboarding first-run step: shows a big save CTA
    /// that calls back. When nil, it's the settings entry (save + pop).
    var onDone: (() -> Void)?

    @State private var amount: Double = 2
    @State private var saving = false
    @State private var customText = ""
    @FocusState private var customFocused: Bool
    @AppStorage("vd.remindRaiseAmount") private var remindToRaise = true
    @AppStorage("vd.amountSetAt") private var amountSetAt: Double = 0

    private let quickAmounts: [Double] = [1, 2, 5, 20]

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                header
                amountDisplay
                quickChips
                customField
                ladder
                reminderToggle
            }
            .padding(.horizontal, 20)
            .padding(.top, 12)
            .padding(.bottom, 24)
        }
        .background(Color("AppBackground").ignoresSafeArea())
        .safeAreaInset(edge: .bottom) { saveBar }
        .navigationTitle(onDone == nil ? String(localized: "Tu monto") : "")
        .navigationBarTitleDisplayMode(.inline)
        .toolbarBackground(Color("AppBackground"), for: .navigationBar)
        .toolbarColorScheme(.dark, for: .navigationBar)
        .onAppear { if let d = pickStatus.defaultInvestment { amount = d } }
    }

    private var header: some View {
        VStack(spacing: 6) {
            Text("¿Cuánto en cada compra?")
                .font(.title2.bold())
                .foregroundStyle(.white)
                .multilineTextAlignment(.center)
            Text("La misma cantidad cada vez. Empieza con lo que no te pese.")
                .font(.subheadline)
                .foregroundStyle(.white.opacity(0.65))
                .multilineTextAlignment(.center)
        }
        .padding(.top, 8)
    }

    private var amountDisplay: some View {
        VStack(spacing: 2) {
            Text(currency(amount))
                .font(.system(size: 52, weight: .bold, design: .rounded).monospacedDigit())
                .foregroundStyle(Color("BrandEmerald"))
            Text("por cada pick")
                .font(.caption)
                .foregroundStyle(.white.opacity(0.5))
        }
    }

    private var quickChips: some View {
        HStack(spacing: 10) {
            ForEach(quickAmounts, id: \.self) { a in
                Button {
                    amount = a
                    customText = ""
                    customFocused = false
                } label: {
                    Text(currency(a))
                        .font(.subheadline.weight(.semibold).monospacedDigit())
                        .foregroundStyle(isSelected(a) ? Color("BrandEmerald") : .white.opacity(0.8))
                        .frame(maxWidth: .infinity, minHeight: 44)
                        .background(isSelected(a) ? Color("BrandEmerald").opacity(0.12) : Color("CardBackground"))
                        .overlay(
                            RoundedRectangle(cornerRadius: 11)
                                .stroke(isSelected(a) ? Color("BrandEmerald") : Color.white.opacity(0.08), lineWidth: 1)
                        )
                        .clipShape(RoundedRectangle(cornerRadius: 11))
                }
                .buttonStyle(.plain)
            }
        }
    }

    /// A quick chip is selected only when it matches AND the user isn't typing
    /// a custom amount.
    private func isSelected(_ a: Double) -> Bool {
        customText.isEmpty && amount == a
    }

    private var customField: some View {
        HStack(spacing: 8) {
            Text("Otro monto")
                .font(.subheadline)
                .foregroundStyle(.white.opacity(0.7))
            Spacer()
            Text("$")
                .font(.title3.weight(.semibold))
                .foregroundStyle(.white.opacity(0.5))
            TextField("0", text: $customText)
                .keyboardType(.decimalPad)
                .focused($customFocused)
                .multilineTextAlignment(.trailing)
                .font(.title3.weight(.bold).monospacedDigit())
                .foregroundStyle(Color("BrandEmerald"))
                .frame(width: 90)
                .onChange(of: customText) { _, newValue in
                    let cleaned = newValue.replacingOccurrences(of: ",", with: ".")
                    if let v = Double(cleaned), v > 0 { amount = v }
                }
        }
        .padding(14)
        .background(Color("CardBackground"))
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(customFocused ? Color("BrandEmerald") : Color.white.opacity(0.08), lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    private var ladder: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("La idea es subirlo con el tiempo")
                .font(.caption)
                .foregroundStyle(.white.opacity(0.5))
                .frame(maxWidth: .infinity, alignment: .center)
            HStack(alignment: .bottom, spacing: 12) {
                ladderBar("$2", "hoy–mes 4", 0.30)
                ladderBar("$5", "mes 5–14", 0.55)
                ladderBar("$50", "año 3", 1.0)
            }
            .frame(height: 120)
        }
        .padding(16)
        .background(Color("CardBackground"))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    private func ladderBar(_ amt: String, _ when: LocalizedStringKey, _ h: CGFloat) -> some View {
        VStack(spacing: 6) {
            Text(amt)
                .font(.caption.weight(.bold).monospacedDigit())
                .foregroundStyle(Color("BrandEmerald"))
            RoundedRectangle(cornerRadius: 6)
                .fill(LinearGradient(colors: [Color(red: 0.05, green: 0.64, blue: 0.44), Color("BrandEmerald").opacity(0.35)],
                                     startPoint: .bottom, endPoint: .top))
                .frame(height: max(14, 78 * h))
            Text(when)
                .font(.system(size: 9))
                .foregroundStyle(.white.opacity(0.4))
        }
        .frame(maxWidth: .infinity)
    }

    private var reminderToggle: some View {
        Toggle(isOn: $remindToRaise) {
            VStack(alignment: .leading, spacing: 2) {
                Text("Recordarme subirlo")
                    .font(.subheadline)
                    .foregroundStyle(.white)
                Text("Cada cierto tiempo, un escalón más")
                    .font(.caption2)
                    .foregroundStyle(.white.opacity(0.5))
            }
        }
        .tint(Color("BrandEmerald"))
        .padding(14)
        .background(Color("CardBackground"))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    private var saveBar: some View {
        VStack(spacing: 8) {
            Button {
                saving = true
                Task {
                    _ = await pickStatus.updateDefaultInvestment(amount)
                    amountSetAt = Date().timeIntervalSince1970
                    if remindToRaise {
                        await RaiseReminder.schedule(currentAmount: amount)
                    } else {
                        RaiseReminder.cancel()
                    }
                    saving = false
                    if let onDone { onDone() } else { dismiss() }
                }
            } label: {
                HStack {
                    if saving { ProgressView().tint(.black) }
                    else if onDone == nil { Text("Guardar") } else { Text("Guardar mi monto") }
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
            .disabled(saving)
            Text("Puedes cambiarlo cuando quieras")
                .font(.caption2)
                .foregroundStyle(.white.opacity(0.45))
        }
        .padding(.horizontal, 20)
        .padding(.top, 10)
        .padding(.bottom, 8)
        .background(.ultraThinMaterial)
    }

    private func currency(_ v: Double) -> String {
        if v.truncatingRemainder(dividingBy: 1) == 0 { return "$\(Int(v))" }
        return String(format: "$%.2f", v)
    }
}

/// Schedules a one-shot LOCAL notification that nudges the user to raise their
/// per-buy amount once they've held the current step long enough. Fires only if
/// notification permission is granted (we prime it during onboarding). Rescheduled
/// each time the amount is saved; canceled if the reminder toggle is off.
enum RaiseReminder {
    static let id = "vd.raiseAmountReminder"

    /// The next rung of the ladder + how long to wait, based on the current
    /// amount. Above ~$50 we stop nudging.
    static func nextRung(for amount: Double) -> (next: Double, days: Double)? {
        switch amount {
        case ..<5:    return (5, 120)    // ~4 meses en el escalón inicial
        case 5..<50:  return (50, 300)   // ~10 meses en el escalón medio
        default:      return nil          // ya está alto — no molestar
        }
    }

    static func schedule(currentAmount: Double) async {
        cancel()
        guard let rung = nextRung(for: currentAmount) else { return }
        let content = UNMutableNotificationContent()
        content.title = String(localized: "¿Listo para el siguiente escalón?")
        content.body = String(localized: "Llevas un tiempo invirtiendo \(money(currentAmount)) en cada compra. Si ya no lo sientes, súbelo a \(money(rung.next)).")
        content.sound = .default
        content.userInfo = ["kind": "raise_amount"]
        let trigger = UNTimeIntervalNotificationTrigger(
            timeInterval: rung.days * 86_400, repeats: false)
        let request = UNNotificationRequest(identifier: id, content: content, trigger: trigger)
        try? await UNUserNotificationCenter.current().add(request)
    }

    static func cancel() {
        UNUserNotificationCenter.current()
            .removePendingNotificationRequests(withIdentifiers: [id])
    }

    private static func money(_ v: Double) -> String {
        v.truncatingRemainder(dividingBy: 1) == 0 ? "$\(Int(v))" : String(format: "$%.2f", v)
    }
}
