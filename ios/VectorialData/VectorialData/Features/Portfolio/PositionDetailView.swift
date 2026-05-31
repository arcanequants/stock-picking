import SwiftUI

@MainActor
final class PositionDetailViewModel: ObservableObject {
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

struct PositionDetailView: View {
    let position: Position
    @StateObject private var vm: PositionDetailViewModel
    @EnvironmentObject private var pickStatus: PickStatusStore

    @State private var editingPick: Pick?

    init(position: Position) {
        self.position = position
        _vm = StateObject(wrappedValue: PositionDetailViewModel(ticker: position.ticker))
    }

    /// Bought picks for this ticker — drives the "Editar tu compra"
    /// section. Most recent first so the freshest buy is the obvious
    /// first edit target.
    private var editableBuys: [Pick] {
        pickStatus.picks
            .filter { $0.ticker == position.ticker && $0.status == .bought }
            .sorted { $0.pickNumber > $1.pickNumber }
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                headerCard
                positionFactsCard
                if !editableBuys.isEmpty {
                    editBuyCard
                }
                if let r = vm.research {
                    if r.locked {
                        paywallCard
                    } else if let why = r.summaryWhy, !why.isEmpty {
                        whyCard(summary: why)
                    }
                }
                disclaimer
            }
            .padding(16)
        }
        .background(Color("AppBackground"))
        .navigationTitle(position.ticker)
        .navigationBarTitleDisplayMode(.inline)
        .task { await vm.load() }
        .sheet(item: $editingPick) { pick in
            PickBuySheet(
                pick: pick,
                defaultInvestment: pickStatus.defaultInvestment,
                onSuccess: nil
            )
            .environmentObject(pickStatus)
            .presentationDetents([.medium, .large])
            .presentationDragIndicator(.visible)
        }
    }

    /// Second entry point for editing a buy (the first lives in
    /// PickDetailView). Surfaces here because users often spot a typo
    /// while looking at their portfolio, not while re-opening the pick.
    private var editBuyCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("EDITAR TU COMPRA")
                .font(.caption.weight(.semibold))
                .tracking(1.1)
                .foregroundStyle(.white.opacity(0.55))
            VStack(spacing: 8) {
                ForEach(editableBuys) { pick in
                    Button {
                        editingPick = pick
                    } label: {
                        HStack(spacing: 10) {
                            Image(systemName: "pencil")
                                .foregroundStyle(Color("BrandEmerald"))
                            VStack(alignment: .leading, spacing: 2) {
                                Text("Pick #\(pick.pickNumber) · \(pick.date)")
                                    .font(.footnote.weight(.semibold))
                                    .foregroundStyle(.white)
                                if let price = pick.buyPrice, let amount = pick.amountInvested {
                                    Text("$\(format2(price)) · invertiste $\(format2(amount))")
                                        .font(.caption2)
                                        .foregroundStyle(.white.opacity(0.6))
                                }
                            }
                            Spacer()
                            Image(systemName: "chevron.right")
                                .font(.caption.weight(.semibold))
                                .foregroundStyle(.white.opacity(0.4))
                        }
                        .padding(12)
                        .background(Color.white.opacity(0.04))
                        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                    }
                    .buttonStyle(.plain)
                }
            }
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color("CardBackground"))
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
    }

    private func format2(_ value: Double) -> String {
        String(format: "%.2f", value)
    }

    private var headerCard: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(position.ticker)
                .font(.largeTitle.weight(.bold))
                .foregroundStyle(.white)
            Text(position.name)
                .font(.subheadline)
                .foregroundStyle(.white.opacity(0.7))
            HStack {
                Text(formatPct(position.returnPct))
                    .font(.title2.weight(.semibold))
                    .foregroundStyle(position.returnPct >= 0 ? Color("BrandEmerald") : .red)
                Spacer()
                Text("\(position.daysHeld)d held")
                    .font(.footnote)
                    .foregroundStyle(.white.opacity(0.5))
            }
        }
        .padding(18)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color("CardBackground"))
        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
    }

    private var positionFactsCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Our position")
                .font(.caption.weight(.semibold))
                .tracking(1.1)
                .foregroundStyle(.white.opacity(0.55))
            VStack(spacing: 8) {
                row(
                    label: position.buys == 1 ? "Buys" : "Buys (avg)",
                    value: "\(position.buys)"
                )
                row(label: "First bought", value: position.firstBought)
                if position.lastBought != position.firstBought {
                    row(label: "Last bought", value: position.lastBought)
                }
                if let sector = position.sector, !sector.isEmpty {
                    row(label: "Sector", value: sector)
                }
                if let region = position.region, !region.isEmpty {
                    row(label: "Region", value: region)
                }
                if let dy = position.dividendYield {
                    let text = dy > 0 ? String(format: "%.2f%%", dy) : "No dividend"
                    row(label: "Dividend yield", value: text)
                }
            }
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color("CardBackground"))
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
    }

    private func whyCard(summary: String) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("WHY WE PICKED IT")
                .font(.caption.weight(.semibold))
                .tracking(1.1)
                .foregroundStyle(.white.opacity(0.55))
            Text(summary)
                .font(.callout)
                .foregroundStyle(.white.opacity(0.85))
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color("CardBackground"))
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
    }

    private var paywallCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("See why we picked this")
                .font(.headline)
                .foregroundStyle(.white)
            Text("Subscribe to unlock our full thesis, the risk we're watching, and valuation on every position.")
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

    private var disclaimer: some View {
        Text("Informational only. Not personalized investment advice. Past performance does not guarantee future results.")
            .font(.caption2)
            .foregroundStyle(.white.opacity(0.4))
            .fixedSize(horizontal: false, vertical: true)
    }

    private func row(label: String, value: String) -> some View {
        HStack {
            Text(label)
                .font(.footnote)
                .foregroundStyle(.white.opacity(0.6))
            Spacer()
            Text(value)
                .font(.footnote.weight(.medium))
                .foregroundStyle(.white.opacity(0.9))
        }
    }

    private func formatPct(_ value: Double) -> String {
        let sign = value >= 0 ? "+" : ""
        return "\(sign)\(String(format: "%.2f", value))%"
    }
}
