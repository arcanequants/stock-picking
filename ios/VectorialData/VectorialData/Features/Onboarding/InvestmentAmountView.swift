import SwiftUI

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
    @AppStorage("vd.remindRaiseAmount") private var remindToRaise = true

    private let quickAmounts: [Double] = [1, 2, 5, 20]

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                header
                amountDisplay
                quickChips
                ladder
                reminderToggle
            }
            .padding(.horizontal, 20)
            .padding(.top, 12)
            .padding(.bottom, 24)
        }
        .background(Color("AppBackground").ignoresSafeArea())
        .safeAreaInset(edge: .bottom) { saveBar }
        .navigationTitle(onDone == nil ? "Tu monto" : "")
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
                } label: {
                    Text(currency(a))
                        .font(.subheadline.weight(.semibold).monospacedDigit())
                        .foregroundStyle(amount == a ? Color("BrandEmerald") : .white.opacity(0.8))
                        .frame(maxWidth: .infinity, minHeight: 44)
                        .background(amount == a ? Color("BrandEmerald").opacity(0.12) : Color("CardBackground"))
                        .overlay(
                            RoundedRectangle(cornerRadius: 11)
                                .stroke(amount == a ? Color("BrandEmerald") : Color.white.opacity(0.08), lineWidth: 1)
                        )
                        .clipShape(RoundedRectangle(cornerRadius: 11))
                }
                .buttonStyle(.plain)
            }
        }
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

    private func ladderBar(_ amt: String, _ when: String, _ h: CGFloat) -> some View {
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
                    saving = false
                    if let onDone { onDone() } else { dismiss() }
                }
            } label: {
                HStack {
                    if saving { ProgressView().tint(.black) }
                    else { Text(onDone == nil ? "Guardar" : "Guardar mi monto") }
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
