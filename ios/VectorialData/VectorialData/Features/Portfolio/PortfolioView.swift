import SwiftUI

@MainActor
final class PortfolioViewModel: ObservableObject {
    @Published var modelResponse: PortfolioPositions?
    @Published var personalResponse: PortfolioPositions?
    @Published var errorMessage: String?
    @Published var isLoading = false
    @Published var selectedView: PortfolioViewMode = .model

    private enum SortMode: String, CaseIterable, Identifiable {
        case topReturn = "Top return"
        case worstReturn = "Worst return"
        case newest = "Newest"

        var id: String { rawValue }
    }

    @Published var sortMode: String = SortMode.topReturn.rawValue

    var response: PortfolioPositions? {
        switch selectedView {
        case .model: return modelResponse
        case .personal: return personalResponse
        }
    }

    var displayedPositions: [Position] {
        guard let positions = response?.positions else { return [] }
        switch sortMode {
        case SortMode.worstReturn.rawValue:
            return positions.sorted { $0.returnPct < $1.returnPct }
        case SortMode.newest.rawValue:
            return positions.sorted { $0.lastBought > $1.lastBought }
        default:
            return positions.sorted { $0.returnPct > $1.returnPct }
        }
    }

    static let sortOptions = SortMode.allCases.map(\.rawValue)

    func load() async {
        isLoading = true
        defer { isLoading = false }
        do {
            switch selectedView {
            case .model:
                modelResponse = try await APIClient.shared.get(
                    "/api/portfolio/positions",
                    as: PortfolioPositions.self
                )
            case .personal:
                personalResponse = try await APIClient.shared.get(
                    "/api/portfolio/positions?view=personal",
                    as: PortfolioPositions.self
                )
            }
            errorMessage = nil
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func switchTo(_ view: PortfolioViewMode) async {
        guard view != selectedView else { return }
        selectedView = view
        if response == nil {
            await load()
        }
    }
}

struct PortfolioView: View {
    @StateObject private var vm = PortfolioViewModel()
    @EnvironmentObject private var pickStatus: PickStatusStore
    @EnvironmentObject private var dividends: DividendStore
    @ObservedObject private var priorHoldings = PriorHoldingsStore.shared

    var body: some View {
        NavigationStack {
            ScrollView {
                LazyVStack(spacing: 12) {
                    viewSwitcher
                    if vm.selectedView == .personal && dividends.count > 0 {
                        DividendsYTDCard(
                            ytd: dividends.ytdTotal,
                            count: dividends.count,
                            companies: dividends.companies
                        )
                    }
                    if let resp = vm.response, !resp.positions.isEmpty {
                        TotalsRow(resp: resp)
                        if let sectors = resp.sectorAllocation, !sectors.isEmpty {
                            AllocationSection(title: "Sector mix", buckets: sectors)
                        }
                        if let regions = resp.regionAllocation, !regions.isEmpty {
                            AllocationSection(title: "Region mix", buckets: regions)
                        }
                        PositionsHeader()
                        ForEach(vm.displayedPositions) { p in
                            NavigationLink(value: p) {
                                PositionRow(position: p)
                            }
                            .buttonStyle(.plain)
                        }
                    } else if vm.isLoading {
                        ProgressView().padding(.top, 40)
                    } else if vm.selectedView == .personal && vm.response?.positions.isEmpty == true {
                        personalEmptyState
                    } else if let msg = vm.errorMessage {
                        Text(msg)
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                            .padding(.top, 40)
                    }
                }
                .padding(16)
            }
            .background(Color("AppBackground"))
            .navigationTitle("Portfolio")
            .navigationDestination(for: Position.self) { position in
                PositionDetailView(position: position)
            }
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Menu {
                        Picker("Sort", selection: $vm.sortMode) {
                            ForEach(PortfolioViewModel.sortOptions, id: \.self) { opt in
                                Text(opt).tag(opt)
                            }
                        }
                    } label: {
                        Image(systemName: "arrow.up.arrow.down")
                    }
                }
            }
            .refreshable {
                await vm.load()
                await dividends.load()
            }
            .task { await vm.load() }
            .task {
                if dividends.events.isEmpty {
                    await dividends.load()
                }
            }
            .onChange(of: pickStatus.lastDecisionAt) { _, _ in
                // Any pick decision invalidates the personal view's cache.
                vm.personalResponse = nil
                if vm.selectedView == .personal {
                    Task { await vm.load() }
                }
            }
            .onChange(of: priorHoldings.lastChangedAt) { _, _ in
                // Same for adding/removing prior holdings.
                vm.personalResponse = nil
                if vm.selectedView == .personal {
                    Task { await vm.load() }
                }
            }
        }
    }

    private var viewSwitcher: some View {
        Picker("View", selection: Binding(
            get: { vm.selectedView },
            set: { newValue in Task { await vm.switchTo(newValue) } }
        )) {
            ForEach(PortfolioViewMode.allCases) { view in
                Text(view.label).tag(view)
            }
        }
        .pickerStyle(.segmented)
        .padding(.bottom, 4)
    }

    private var personalEmptyState: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Tu portfolio personal está vacío")
                .font(.headline)
                .foregroundStyle(.white)
            Text("Marca un pick como comprado en la pestaña Picks para empezar a tracking tu portfolio real.")
                .font(.footnote)
                .foregroundStyle(.white.opacity(0.7))
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(18)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color("CardBackground"))
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
        .padding(.top, 30)
    }
}

private struct DividendsYTDCard: View {
    let ytd: Double
    let count: Int
    let companies: Int

    var body: some View {
        HStack(alignment: .center, spacing: 14) {
            Text("💸")
                .font(.system(size: 34))
            VStack(alignment: .leading, spacing: 2) {
                Text("COBRADO EN DIVIDENDOS")
                    .font(.caption2.weight(.semibold))
                    .tracking(1.1)
                    .foregroundStyle(.white.opacity(0.55))
                Text("$\(String(format: "%.2f", ytd))")
                    .font(.title.weight(.bold))
                    .foregroundStyle(Color("BrandEmerald"))
                Text("YTD · \(count) \(count == 1 ? "pago" : "pagos") · \(companies) \(companies == 1 ? "empresa" : "empresas")")
                    .font(.caption)
                    .foregroundStyle(.white.opacity(0.55))
            }
            Spacer()
        }
        .padding(18)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            LinearGradient(
                colors: [
                    Color("BrandEmerald").opacity(0.18),
                    Color("CardBackground"),
                ],
                startPoint: .topLeading, endPoint: .bottomTrailing
            )
        )
        .overlay(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .stroke(Color("BrandEmerald").opacity(0.35), lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
    }
}

private struct TotalsRow: View {
    let resp: PortfolioPositions

    var body: some View {
        HStack(alignment: .top) {
            VStack(alignment: .leading, spacing: 2) {
                Text("Total return").font(.caption).foregroundStyle(.white.opacity(0.6))
                Text(formatPct(resp.totalReturnPct))
                    .font(.title3.weight(.semibold))
                    .foregroundStyle(resp.totalReturnPct >= 0 ? Color("BrandEmerald") : .red)
            }
            Spacer()
            VStack(alignment: .center, spacing: 2) {
                Text("Positions").font(.caption).foregroundStyle(.white.opacity(0.6))
                Text("\(resp.totalPositions)")
                    .font(.title3.weight(.semibold))
                    .foregroundStyle(.white)
            }
            Spacer()
            if let dy = resp.avgDividendYield, dy > 0 {
                VStack(alignment: .trailing, spacing: 2) {
                    Text("Avg dividend").font(.caption).foregroundStyle(.white.opacity(0.6))
                    Text(String(format: "%.2f%%", dy))
                        .font(.title3.weight(.semibold))
                        .foregroundStyle(.white)
                }
            }
        }
        .padding(16)
        .background(Color("CardBackground"))
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
    }
}

private struct PositionsHeader: View {
    var body: some View {
        HStack {
            Text("POSITIONS")
                .font(.caption.weight(.semibold))
                .tracking(1.1)
                .foregroundStyle(.white.opacity(0.55))
            Spacer()
        }
        .padding(.top, 4)
    }
}

private struct PositionRow: View {
    let position: Position

    var body: some View {
        HStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 2) {
                HStack(spacing: 6) {
                    Text(position.ticker)
                        .font(.headline).foregroundStyle(.white)
                    if position.hasPrior == true {
                        PriorPill(count: position.priorCount ?? 0)
                    }
                }
                Text(position.name)
                    .font(.caption).foregroundStyle(.white.opacity(0.6))
                    .lineLimit(1)
                Text(metaLine)
                    .font(.caption2).foregroundStyle(.white.opacity(0.45))
            }
            Spacer()
            Text(formatPct(position.returnPct))
                .font(.headline.weight(.semibold))
                .foregroundStyle(position.returnPct >= 0 ? Color("BrandEmerald") : .red)
        }
        .padding(14)
        .background(Color("CardBackground"))
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
    }

    private var metaLine: String {
        let buys = position.buys
        let label = buys == 1 ? "buy" : "buys"
        return "\(buys) \(label) · \(position.daysHeld)d"
    }
}

private struct PriorPill: View {
    let count: Int

    var body: some View {
        Text(count > 1 ? "PREVIAS · \(count)" : "PREVIA")
            .font(.system(size: 9, weight: .bold))
            .tracking(0.6)
            .foregroundStyle(Color("BrandIndigo"))
            .padding(.horizontal, 5)
            .padding(.vertical, 2)
            .background(Color("BrandIndigo").opacity(0.18))
            .clipShape(Capsule())
    }
}

private func formatPct(_ value: Double) -> String {
    let sign = value >= 0 ? "+" : ""
    return "\(sign)\(String(format: "%.2f", value))%"
}
