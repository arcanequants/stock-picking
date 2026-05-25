import SwiftUI

/// "Posiciones anteriores" — surface for early users to record positions
/// they owned BEFORE Vectorial. Tickers are constrained to Vectorial
/// picks (server-validated). Aggregated into the personal portfolio.
struct PriorHoldingsView: View {
    @StateObject private var store = PriorHoldingsStore.shared
    @EnvironmentObject private var picks: PickStatusStore
    @State private var isAdding = false

    var body: some View {
        content
            .navigationTitle("Posiciones anteriores")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        isAdding = true
                    } label: {
                        Image(systemName: "plus")
                    }
                }
            }
            .task { await store.load() }
            .refreshable { await store.load() }
            .sheet(isPresented: $isAdding) {
                AddPriorHoldingSheet(
                    availableTickers: availableTickers
                ) { ticker, date, price, amount in
                    let new = await store.add(
                        ticker: ticker,
                        purchaseDate: date,
                        buyPrice: price,
                        amountInvested: amount
                    )
                    return new != nil
                }
            }
    }

    @ViewBuilder
    private var content: some View {
        if store.isLoading && store.holdings.isEmpty {
            ProgressView()
                .frame(maxWidth: .infinity, maxHeight: .infinity)
        } else if store.holdings.isEmpty {
            EmptyStateView { isAdding = true }
        } else {
            List {
                Section {
                    Text("Estas posiciones se suman a tu portafolio personal y ajustan el precio promedio de cada ticker. Solo aceptamos tickers que son picks de Vectorial.")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                Section("Tus posiciones") {
                    ForEach(store.holdings) { h in
                        PriorHoldingRow(holding: h)
                    }
                    .onDelete { offsets in
                        Task { await delete(at: offsets) }
                    }
                }
            }
        }
    }

    private var availableTickers: [TickerOption] {
        let unique = Dictionary(grouping: picks.picks, by: \.ticker)
            .compactMap { _, group -> TickerOption? in
                guard let first = group.first else { return nil }
                return TickerOption(ticker: first.ticker, name: first.name)
            }
        return unique.sorted { $0.ticker < $1.ticker }
    }

    private func delete(at offsets: IndexSet) async {
        for index in offsets {
            let h = store.holdings[index]
            await store.remove(id: h.id)
        }
    }
}

struct TickerOption: Identifiable, Hashable {
    let ticker: String
    let name: String
    var id: String { ticker }
}

private struct PriorHoldingRow: View {
    let holding: PriorHolding

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text(holding.ticker).font(.headline)
                Spacer()
                Text(holding.purchaseDate)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            Text(holding.name)
                .font(.caption)
                .foregroundStyle(.secondary)
            Text("\(formatShares(holding.shares)) acciones · entrada a \(formatPrice(holding.buyPrice))")
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
        .padding(.vertical, 2)
    }

    private func formatShares(_ value: Double) -> String {
        String(format: "%.4f", value)
    }

    private func formatPrice(_ value: Double) -> String {
        "$" + String(format: "%.2f", value)
    }
}

private struct EmptyStateView: View {
    let onAdd: () -> Void

    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "archivebox")
                .font(.system(size: 44))
                .foregroundStyle(.tertiary)
            Text("Aún no agregaste posiciones anteriores")
                .font(.headline)
            Text("Si ya tenías acciones de algún ticker de Vectorial antes de empezar aquí, agrégalas para que tu portafolio refleje tu posición real.")
                .font(.caption)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 24)
            Button {
                onAdd()
            } label: {
                Text("Agregar una posición")
                    .padding(.horizontal, 16)
                    .padding(.vertical, 8)
            }
            .buttonStyle(.borderedProminent)
            .tint(Color("BrandEmerald"))
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

private struct AddPriorHoldingSheet: View {
    let availableTickers: [TickerOption]
    /// Returns true on success so the sheet can dismiss.
    let onSave: (String, String, Double, Double) async -> Bool

    @Environment(\.dismiss) private var dismiss
    @State private var selectedTicker: String = ""
    @State private var purchaseDate: Date = Date()
    @State private var amountText: String = ""
    @State private var priceText: String = ""
    @State private var isSaving = false
    @State private var errorMessage: String?

    var body: some View {
        NavigationStack {
            Form {
                Section("Ticker") {
                    Picker("Ticker", selection: $selectedTicker) {
                        Text("Selecciona").tag("")
                        ForEach(availableTickers) { option in
                            Text("\(option.ticker) — \(option.name)")
                                .tag(option.ticker)
                        }
                    }
                }

                Section("Fecha de compra") {
                    DatePicker(
                        "Fecha",
                        selection: $purchaseDate,
                        in: ...Date(),
                        displayedComponents: .date
                    )
                    .datePickerStyle(.compact)
                }

                Section("Precio de compra") {
                    HStack {
                        Text("$").foregroundStyle(.secondary)
                        TextField("0.00", text: $priceText)
                            .keyboardType(.decimalPad)
                    }
                }

                Section("Monto invertido (USD)") {
                    HStack {
                        Text("$").foregroundStyle(.secondary)
                        TextField("0.00", text: $amountText)
                            .keyboardType(.decimalPad)
                    }
                }

                if let msg = errorMessage {
                    Section {
                        Text(msg)
                            .font(.caption)
                            .foregroundStyle(.red)
                    }
                }
            }
            .navigationTitle("Nueva posición")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancelar") { dismiss() }
                        .disabled(isSaving)
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button {
                        Task { await save() }
                    } label: {
                        if isSaving { ProgressView() } else { Text("Guardar") }
                    }
                    .disabled(!canSave || isSaving)
                }
            }
        }
    }

    private var canSave: Bool {
        !selectedTicker.isEmpty
            && parsedPrice != nil
            && parsedAmount != nil
    }

    private var parsedPrice: Double? {
        let cleaned = priceText.replacingOccurrences(of: ",", with: ".")
        guard let v = Double(cleaned), v > 0 else { return nil }
        return v
    }

    private var parsedAmount: Double? {
        let cleaned = amountText.replacingOccurrences(of: ",", with: ".")
        guard let v = Double(cleaned), v > 0 else { return nil }
        return v
    }

    private func save() async {
        guard let price = parsedPrice, let amount = parsedAmount else { return }
        isSaving = true
        defer { isSaving = false }
        errorMessage = nil

        let dateStr = isoDate(purchaseDate)
        let ok = await onSave(selectedTicker, dateStr, price, amount)
        if ok {
            dismiss()
        } else {
            errorMessage = PriorHoldingsStore.shared.errorMessage
                ?? "No se pudo guardar."
        }
    }

    private func isoDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.calendar = Calendar(identifier: .iso8601)
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.timeZone = TimeZone(identifier: "UTC")
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.string(from: date)
    }
}
