import SwiftUI

/// Mini-sheet that records what the user actually paid for a pick.
///
/// Two fields, both pre-filled aggressively so the happy path is two taps:
/// — `precio` defaults to the open price from the pick
/// — `monto` defaults to the user's saved `default_investment` (or 50 if unset)
///
/// First time only: a toggle to persist the amount as their new default. Once
/// set, the toggle hides.
struct PickBuySheet: View {
    @EnvironmentObject private var store: PickStatusStore
    @Environment(\.dismiss) private var dismiss

    let pick: Pick
    /// Fires after the sheet successfully writes the decision. PickDetailView
    /// uses this to pop the nav back to the picks list — closes the loop so
    /// the user gets a clear "done" signal instead of staring at the detail.
    let onSuccess: (() -> Void)?

    @State private var priceText: String
    @State private var amountText: String
    @State private var saveAsDefault: Bool = false
    @State private var isSubmitting = false
    @State private var errorMessage: String?
    @FocusState private var focused: Field?

    private enum Field: Hashable { case price, amount }

    /// Edit mode = pick already bought. Pre-fills from the saved decision
    /// instead of the open price / default amount, and changes the title.
    private var isEditing: Bool { pick.status == .bought }

    init(pick: Pick, defaultInvestment: Double?, onSuccess: (() -> Void)? = nil) {
        self.pick = pick
        self.onSuccess = onSuccess
        if pick.status == .bought, let savedPrice = pick.buyPrice {
            _priceText = State(initialValue: Self.format(savedPrice))
        } else {
            _priceText = State(initialValue: Self.format(pick.priceAtPick))
        }
        if pick.status == .bought, let savedAmount = pick.amountInvested {
            _amountText = State(initialValue: Self.format(savedAmount))
        } else {
            _amountText = State(initialValue: Self.format(defaultInvestment ?? 50))
        }
    }

    private var defaultIsSet: Bool {
        store.defaultInvestment != nil
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    header
                    field(
                        label: "Precio al que compraste",
                        helper: "Pre-llenado con el precio del momento del pick",
                        text: $priceText,
                        field: .price
                    )
                    field(
                        label: "Cuánto invertiste",
                        helper: defaultIsSet
                            ? "Tu default — puedes cambiarlo"
                            : "Si pones la misma cantidad cada vez, guárdala abajo",
                        text: $amountText,
                        field: .amount,
                        prefix: "$"
                    )
                    if !defaultIsSet {
                        Toggle(isOn: $saveAsDefault) {
                            Text("Recordar $\(amountText) como mi monto por pick")
                                .font(.footnote)
                                .foregroundStyle(.white.opacity(0.8))
                        }
                        .tint(Color("BrandEmerald"))
                        .padding(14)
                        .background(Color("CardBackground"))
                        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                    }
                    if let msg = errorMessage {
                        Text(msg)
                            .font(.footnote)
                            .foregroundStyle(.red)
                    }
                    Spacer(minLength: 0)
                    confirmButton
                }
                .padding(16)
            }
            .background(Color("AppBackground"))
            .navigationTitle(isEditing ? "Editar tu compra de \(pick.ticker)" : "Marcaste \(pick.ticker)")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancelar") { dismiss() }
                        .foregroundStyle(.white.opacity(0.75))
                }
            }
            .onAppear { focused = nil }
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(pick.name)
                .font(.title3.weight(.semibold))
                .foregroundStyle(.white)
            Text("Pick #\(pick.pickNumber) · \(pick.date)")
                .font(.footnote)
                .foregroundStyle(.white.opacity(0.55))
        }
    }

    @ViewBuilder
    private func field(
        label: String,
        helper: String,
        text: Binding<String>,
        field: Field,
        prefix: String? = nil
    ) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(label)
                .font(.footnote.weight(.semibold))
                .foregroundStyle(.white.opacity(0.85))
            HStack(spacing: 6) {
                if let prefix {
                    Text(prefix)
                        .font(.title3.weight(.semibold))
                        .foregroundStyle(.white.opacity(0.6))
                }
                TextField("", text: text)
                    .keyboardType(.decimalPad)
                    .font(.title3.weight(.semibold))
                    .foregroundStyle(.white)
                    .focused($focused, equals: field)
            }
            .padding(14)
            .background(Color("CardBackground"))
            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
            Text(helper)
                .font(.caption2)
                .foregroundStyle(.white.opacity(0.5))
        }
    }

    private var confirmButton: some View {
        Button(action: submit) {
            HStack {
                Spacer()
                if isSubmitting {
                    ProgressView().tint(.black)
                } else {
                    Text("Confirmar")
                        .font(.headline)
                        .foregroundStyle(.black)
                }
                Spacer()
            }
            .padding(.vertical, 14)
            .background(Color("BrandEmerald"))
            .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
        }
        .buttonStyle(.plain)
        .disabled(isSubmitting)
    }

    private func submit() {
        guard let price = parseDouble(priceText), price > 0 else {
            errorMessage = "Precio inválido."
            return
        }
        guard let amount = parseDouble(amountText), amount > 0 else {
            errorMessage = "Monto inválido."
            return
        }
        errorMessage = nil
        isSubmitting = true

        Task {
            let ok = await store.markBought(
                pickNumber: pick.pickNumber,
                buyPrice: price,
                amount: amount,
                saveAsDefault: !defaultIsSet && saveAsDefault
            )
            isSubmitting = false
            if ok {
                dismiss()
                // Hand control back to PickDetailView so it can pop the nav.
                // Slight delay so the sheet's dismiss animation completes
                // before the underlying view starts its own pop.
                if let onSuccess {
                    try? await Task.sleep(nanoseconds: 250_000_000)
                    onSuccess()
                }
            } else {
                errorMessage = store.errorMessage ?? "No se pudo guardar."
            }
        }
    }

    private func parseDouble(_ text: String) -> Double? {
        let normalized = text.replacingOccurrences(of: ",", with: ".")
        return Double(normalized)
    }

    private static func format(_ value: Double) -> String {
        if value == value.rounded() {
            return String(format: "%.0f", value)
        }
        return String(format: "%.2f", value)
    }
}
