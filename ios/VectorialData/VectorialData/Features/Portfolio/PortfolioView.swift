import SwiftUI

@MainActor
final class PortfolioViewModel: ObservableObject {
    @Published var response: PortfolioPositions?
    @Published var errorMessage: String?
    @Published var isLoading = false

    private enum SortMode: String, CaseIterable, Identifiable {
        case topReturn = "Top return"
        case worstReturn = "Worst return"
        case newest = "Newest"

        var id: String { rawValue }
    }

    @Published var sortMode: String = SortMode.topReturn.rawValue

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
            response = try await APIClient.shared.get(
                "/api/portfolio/positions",
                as: PortfolioPositions.self
            )
            errorMessage = nil
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

struct PortfolioView: View {
    @StateObject private var vm = PortfolioViewModel()

    var body: some View {
        NavigationStack {
            ZStack {
                Color("AppBackground").ignoresSafeArea()
                content
            }
            .navigationTitle("Portfolio")
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
            .refreshable { await vm.load() }
            .task { await vm.load() }
        }
    }

    @ViewBuilder private var content: some View {
        if vm.isLoading && vm.response == nil {
            ProgressView()
        } else if let msg = vm.errorMessage, vm.response == nil {
            Text(msg).font(.footnote).foregroundStyle(.secondary)
        } else {
            ScrollView {
                LazyVStack(spacing: 10) {
                    if let resp = vm.response {
                        TotalsRow(resp: resp)
                    }
                    ForEach(vm.displayedPositions) { p in
                        PositionRow(position: p)
                    }
                }
                .padding(16)
            }
        }
    }
}

private struct TotalsRow: View {
    let resp: PortfolioPositions

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text("Total return").font(.caption).foregroundStyle(.white.opacity(0.6))
                Text(formatPct(resp.totalReturnPct))
                    .font(.title3.weight(.semibold))
                    .foregroundStyle(resp.totalReturnPct >= 0 ? Color("BrandEmerald") : .red)
            }
            Spacer()
            VStack(alignment: .trailing, spacing: 2) {
                Text("Positions").font(.caption).foregroundStyle(.white.opacity(0.6))
                Text("\(resp.totalPositions)")
                    .font(.title3.weight(.semibold))
                    .foregroundStyle(.white)
            }
        }
        .padding(16)
        .background(Color("CardBackground"))
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
    }
}

private struct PositionRow: View {
    let position: Position

    var body: some View {
        HStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 2) {
                Text(position.ticker)
                    .font(.headline).foregroundStyle(.white)
                Text(position.name)
                    .font(.caption).foregroundStyle(.white.opacity(0.6))
                    .lineLimit(1)
                Text("\(position.buys) \(position.buys == 1 ? "buy" : "buys") · \(position.daysHeld)d")
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
}

private func formatPct(_ value: Double) -> String {
    let sign = value >= 0 ? "+" : ""
    return "\(sign)\(String(format: "%.2f", value))%"
}
