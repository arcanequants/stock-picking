import SwiftUI

@MainActor
final class PickDetailViewModel: ObservableObject {
    @Published var research: StockResearch?
    @Published var errorMessage: String?
    @Published var isLoading = false

    let ticker: String

    init(ticker: String) {
        self.ticker = ticker
    }

    func load() async {
        isLoading = true
        defer { isLoading = false }
        do {
            research = try await APIClient.shared.get(
                "/api/picks/research/\(ticker)",
                as: StockResearch.self
            )
            errorMessage = nil
        } catch APIError.unauthorized {
            errorMessage = "Please sign in again"
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

struct PickDetailView: View {
    @EnvironmentObject private var store: PickStatusStore
    @StateObject private var vm: PickDetailViewModel
    let pick: Pick

    @State private var showBuySheet = false
    @State private var skipInFlight = false

    init(pick: Pick) {
        self.pick = pick
        _vm = StateObject(wrappedValue: PickDetailViewModel(ticker: pick.ticker))
    }

    /// Latest copy of this pick from the store. The detail view was pushed
    /// with a stale `pick`; observing the store keeps status/buy_price live.
    private var current: Pick {
        store.picks.first(where: { $0.pickNumber == pick.pickNumber }) ?? pick
    }

    var body: some View {
        ZStack(alignment: .bottom) {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    headerCard
                    decisionBanner
                    if vm.isLoading && vm.research == nil {
                        ProgressView()
                            .frame(maxWidth: .infinity)
                            .padding(.top, 40)
                    } else if let msg = vm.errorMessage, vm.research == nil {
                        Text(msg)
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                    } else if let r = vm.research {
                        if r.locked {
                            teaserSection(research: r)
                            paywallCard
                        } else {
                            premiumSections(research: r)
                        }
                    }
                    disclaimer
                    Color.clear.frame(height: 100) // breathing room above sticky CTAs
                }
                .padding(16)
            }
            decisionBar
        }
        .background(Color("AppBackground"))
        .navigationTitle(pick.ticker)
        .navigationBarTitleDisplayMode(.inline)
        .task { await vm.load() }
        .sheet(isPresented: $showBuySheet) {
            PickBuySheet(pick: current, defaultInvestment: store.defaultInvestment)
                .environmentObject(store)
                .presentationDetents([.medium, .large])
                .presentationDragIndicator(.visible)
        }
    }

    private var headerCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Pick #\(pick.pickNumber) · \(pick.date)")
                .font(.footnote)
                .foregroundStyle(.white.opacity(0.55))
            HStack(alignment: .firstTextBaseline) {
                Text(pick.ticker)
                    .font(.largeTitle.weight(.bold))
                    .foregroundStyle(.white)
                Spacer()
                Text(formatPct(pick.returnPct))
                    .font(.title3.weight(.semibold))
                    .foregroundStyle(pick.returnPct >= 0 ? Color("BrandEmerald") : .red)
            }
            Text(pick.name)
                .font(.headline)
                .foregroundStyle(.white.opacity(0.75))
            HStack(spacing: 6) {
                tag(pick.sector)
                tag(pick.region)
                if !pick.country.isEmpty {
                    tag(pick.country)
                }
            }
        }
        .padding(18)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color("CardBackground"))
        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
    }

    /// Subtle banner that surfaces the user's decision if they already made one.
    @ViewBuilder
    private var decisionBanner: some View {
        switch current.status {
        case .pending:
            EmptyView()
        case .bought:
            HStack(spacing: 10) {
                Image(systemName: "checkmark.seal.fill")
                    .foregroundStyle(Color("BrandEmerald"))
                VStack(alignment: .leading, spacing: 2) {
                    Text("Lo compraste")
                        .font(.footnote.weight(.semibold))
                        .foregroundStyle(.white)
                    if let price = current.buyPrice, let amount = current.amountInvested {
                        Text("$\(format2(price)) · invertiste $\(format2(amount))")
                            .font(.caption2)
                            .foregroundStyle(.white.opacity(0.6))
                    }
                }
                Spacer()
            }
            .padding(12)
            .background(Color("BrandEmerald").opacity(0.12))
            .overlay(
                RoundedRectangle(cornerRadius: 12, style: .continuous)
                    .stroke(Color("BrandEmerald").opacity(0.4), lineWidth: 1)
            )
            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
        case .skipped:
            HStack(spacing: 10) {
                Image(systemName: "xmark.circle.fill")
                    .foregroundStyle(.white.opacity(0.55))
                Text("Lo skippeaste")
                    .font(.footnote.weight(.semibold))
                    .foregroundStyle(.white.opacity(0.7))
                Spacer()
            }
            .padding(12)
            .background(Color.white.opacity(0.06))
            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
        }
    }

    /// Sticky bottom bar with the user's primary actions. Reshapes based on
    /// current status so we never offer "Lo compré" twice.
    private var decisionBar: some View {
        VStack(spacing: 0) {
            LinearGradient(
                colors: [Color("AppBackground").opacity(0), Color("AppBackground")],
                startPoint: .top, endPoint: .bottom
            )
            .frame(height: 18)
            HStack(spacing: 10) {
                switch current.status {
                case .pending:
                    ctaSecondary(label: "⏰ Después") {
                        Task { await store.markSkipped(pickNumber: pick.pickNumber) }
                    }
                    ctaPrimary(label: "✅ Lo compré") {
                        showBuySheet = true
                    }
                case .bought:
                    ctaSecondary(label: "Cambiar a pendiente") {
                        Task { await store.markPending(pickNumber: pick.pickNumber) }
                    }
                case .skipped:
                    ctaSecondary(label: "Volver a pendiente") {
                        Task { await store.markPending(pickNumber: pick.pickNumber) }
                    }
                    ctaPrimary(label: "✅ Sí lo compré") {
                        showBuySheet = true
                    }
                }
            }
            .padding(.horizontal, 16)
            .padding(.bottom, 20)
            .padding(.top, 6)
            .background(Color("AppBackground"))
        }
    }

    private func ctaPrimary(label: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack {
                Spacer()
                Text(label)
                    .font(.headline)
                    .foregroundStyle(.black)
                Spacer()
            }
            .padding(.vertical, 14)
            .background(Color("BrandEmerald"))
            .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
        }
        .buttonStyle(.plain)
    }

    private func ctaSecondary(label: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack {
                Spacer()
                Text(label)
                    .font(.headline)
                    .foregroundStyle(.white.opacity(0.85))
                Spacer()
            }
            .padding(.vertical, 14)
            .background(Color.white.opacity(0.08))
            .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
        }
        .buttonStyle(.plain)
    }

    @ViewBuilder
    private func teaserSection(research: StockResearch) -> some View {
        section(title: "In one line") {
            Text(research.summaryShort)
                .font(.body)
                .foregroundStyle(.white.opacity(0.85))
        }
    }

    private var paywallCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Unlock the full thesis")
                .font(.headline)
                .foregroundStyle(.white)
            Text("Get our complete research: what the company does, why we picked it, the key risk, valuation and analyst consensus.")
                .font(.footnote)
                .foregroundStyle(.white.opacity(0.75))
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            LinearGradient(
                colors: [Color("BrandIndigo"), Color("BrandEmerald")],
                startPoint: .leading, endPoint: .trailing
            )
            .opacity(0.28)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .stroke(Color("BrandEmerald").opacity(0.5), lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
    }

    @ViewBuilder
    private func premiumSections(research: StockResearch) -> some View {
        section(title: "In one line") {
            Text(research.summaryShort)
                .font(.body)
                .foregroundStyle(.white.opacity(0.9))
        }
        if let what = research.summaryWhat, !what.isEmpty {
            section(title: "What they do") {
                Text(what)
                    .font(.callout)
                    .foregroundStyle(.white.opacity(0.85))
            }
        }
        if let why = research.summaryWhy, !why.isEmpty {
            section(title: "Why we picked it") {
                Text(why)
                    .font(.callout)
                    .foregroundStyle(.white.opacity(0.85))
            }
        }
        if let risk = research.summaryRisk, !risk.isEmpty {
            section(title: "Risk to watch") {
                Text(risk)
                    .font(.callout)
                    .foregroundStyle(.white.opacity(0.85))
            }
        }
        fundamentalsCard(research: research)
    }

    @ViewBuilder
    private func fundamentalsCard(research: StockResearch) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Fundamentals")
                .font(.caption.weight(.semibold))
                .tracking(1.1)
                .foregroundStyle(.white.opacity(0.55))
            let rows = fundamentalRows(research: research)
            if rows.isEmpty {
                Text("—")
                    .font(.footnote)
                    .foregroundStyle(.white.opacity(0.5))
            } else {
                VStack(spacing: 8) {
                    ForEach(rows, id: \.label) { row in
                        HStack {
                            Text(row.label)
                                .font(.footnote)
                                .foregroundStyle(.white.opacity(0.6))
                            Spacer()
                            Text(row.value)
                                .font(.footnote.weight(.medium))
                                .foregroundStyle(.white.opacity(0.9))
                        }
                    }
                }
            }
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color("CardBackground"))
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
    }

    private func fundamentalRows(research: StockResearch) -> [FundamentalRow] {
        var rows: [FundamentalRow] = []
        if let pe = research.peRatio {
            rows.append(.init(label: "P/E ratio", value: String(format: "%.2f", pe)))
        }
        if let fwd = research.peForward {
            rows.append(.init(label: "Forward P/E", value: String(format: "%.2f", fwd)))
        }
        if let div = research.dividendYield {
            let text = div > 0 ? String(format: "%.2f%%", div) : "No dividend"
            rows.append(.init(label: "Dividend yield", value: text))
        }
        if let cap = research.marketCapB {
            rows.append(.init(label: "Market cap", value: formatMarketCap(cap)))
        }
        if let consensus = research.analystConsensus, !consensus.isEmpty {
            rows.append(.init(label: "Analyst consensus", value: consensus.capitalized))
        }
        if let upside = research.analystUpside {
            rows.append(.init(label: "Analyst upside", value: String(format: "%+.1f%%", upside)))
        }
        return rows
    }

    private func formatMarketCap(_ billions: Double) -> String {
        if billions >= 1000 {
            return String(format: "$%.2fT", billions / 1000)
        }
        return String(format: "$%.1fB", billions)
    }

    private var disclaimer: some View {
        Text("Informational only. Not personalized investment advice. Past performance does not guarantee future results.")
            .font(.caption2)
            .foregroundStyle(.white.opacity(0.4))
            .fixedSize(horizontal: false, vertical: true)
            .padding(.top, 4)
    }

    private func section<Content: View>(
        title: String,
        @ViewBuilder content: () -> Content
    ) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(title.uppercased())
                .font(.caption.weight(.semibold))
                .tracking(1.1)
                .foregroundStyle(.white.opacity(0.55))
            content()
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color("CardBackground"))
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
    }

    private func tag(_ value: String) -> some View {
        Text(value)
            .font(.caption2.weight(.medium))
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(Color.white.opacity(0.08))
            .foregroundStyle(.white.opacity(0.75))
            .clipShape(Capsule())
    }

    private struct FundamentalRow {
        let label: String
        let value: String
    }

    private func formatPct(_ value: Double) -> String {
        let sign = value >= 0 ? "+" : ""
        return "\(sign)\(String(format: "%.2f", value))%"
    }

    private func format2(_ value: Double) -> String {
        String(format: "%.2f", value)
    }
}
