import SwiftUI

/// "Posiciones anteriores" — surface for early users to record positions
/// they owned BEFORE Vectorial. Tickers are constrained to Vectorial
/// picks (server-validated). Aggregated into the personal portfolio.
struct PriorHoldingsView: View {
    @StateObject private var store = PriorHoldingsStore.shared
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
            .task {
                await store.load()
                if store.availableTickers.isEmpty {
                    await store.loadUniverse()
                }
            }
            .refreshable { await store.load() }
            .sheet(isPresented: $isAdding) {
                AddPriorHoldingSheet(
                    availableTickers: store.availableTickers
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
                        // Resolve IDs synchronously from the current snapshot;
                        // the array may mutate before the async delete runs, so
                        // indexing by offset later could crash.
                        let ids = offsets.map { store.holdings[$0].id }
                        Task { await delete(ids: ids) }
                    }
                }
            }
        }
    }

    private func delete(ids: [Int]) async {
        for id in ids {
            await store.remove(id: id)
        }
    }
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
    @State private var selected: TickerOption?
    @State private var purchaseDate: Date = Date()
    @State private var amountText: String = ""
    @State private var priceText: String = ""
    @State private var isSaving = false
    @State private var errorMessage: String?

    var body: some View {
        NavigationStack {
            Form {
                Section("Ticker") {
                    NavigationLink {
                        TickerPickerView(
                            tickers: availableTickers,
                            selected: $selected
                        )
                    } label: {
                        HStack {
                            Text("Ticker")
                            Spacer()
                            if let s = selected {
                                Text("\(s.ticker) — \(s.name)")
                                    .foregroundStyle(.secondary)
                                    .lineLimit(1)
                            } else {
                                Text("Selecciona")
                                    .foregroundStyle(.secondary)
                            }
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
        selected != nil
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
        guard
            let ticker = selected?.ticker,
            let price = parsedPrice,
            let amount = parsedAmount
        else { return }
        isSaving = true
        defer { isSaving = false }
        errorMessage = nil

        let dateStr = isoDate(purchaseDate)
        let ok = await onSave(ticker, dateStr, price, amount)
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

/// Searchable list of every Vectorial-picked ticker. Filters on both
/// `ticker` and `name` so users can find e.g. NVDA by typing "nvidia".
private struct TickerPickerView: View {
    let tickers: [TickerOption]
    @Binding var selected: TickerOption?

    @Environment(\.dismiss) private var dismiss
    @State private var query: String = ""

    var body: some View {
        List {
            ForEach(filtered) { option in
                Button {
                    selected = option
                    dismiss()
                } label: {
                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(option.ticker)
                                .font(.headline)
                            Text(option.name)
                                .font(.caption)
                                .foregroundStyle(.secondary)
                                .lineLimit(1)
                        }
                        Spacer()
                        if selected?.ticker == option.ticker {
                            Image(systemName: "checkmark")
                                .foregroundStyle(Color("BrandEmerald"))
                        }
                    }
                }
                .buttonStyle(.plain)
            }
        }
        .listStyle(.plain)
        .searchable(
            text: $query,
            placement: .navigationBarDrawer(displayMode: .always),
            prompt: "Buscar por ticker o nombre"
        )
        .navigationTitle("Elige el ticker")
        .navigationBarTitleDisplayMode(.inline)
    }

    private var filtered: [TickerOption] {
        let q = query.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !q.isEmpty else { return tickers }
        let lower = q.lowercased()
        return tickers.filter {
            $0.ticker.lowercased().contains(lower)
                || $0.name.lowercased().contains(lower)
        }
    }
}
