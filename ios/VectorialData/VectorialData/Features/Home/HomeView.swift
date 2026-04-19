import SwiftUI

@MainActor
final class HomeViewModel: ObservableObject {
    @Published var snapshot: PortfolioSnapshot?
    @Published var errorMessage: String?
    @Published var isLoading = false

    func load() async {
        isLoading = true
        defer { isLoading = false }
        do {
            snapshot = try await APIClient.shared.get(
                "/api/portfolio/snapshot",
                as: PortfolioSnapshot.self
            )
            errorMessage = nil
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

struct HomeView: View {
    @StateObject private var vm = HomeViewModel()

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    if let s = vm.snapshot {
                        HeroCard(snapshot: s)
                        if let pick = s.latestPick {
                            LatestPickCard(pick: pick)
                        }
                        MarketStatusRow(status: s.marketStatus)
                    } else if vm.isLoading {
                        ProgressView().padding(.top, 80)
                    } else if let msg = vm.errorMessage {
                        Text(msg)
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                            .padding(.top, 80)
                    }
                }
                .padding(16)
            }
            .background(Color("AppBackground"))
            .navigationTitle("Vectorial Data")
            .refreshable { await vm.load() }
            .task { await vm.load() }
        }
    }
}

private struct HeroCard: View {
    let snapshot: PortfolioSnapshot

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Portfolio return")
                .font(.footnote)
                .foregroundStyle(.white.opacity(0.65))
            Text(formatPct(snapshot.totalReturnPct))
                .font(.system(size: 48, weight: .bold, design: .rounded))
                .foregroundStyle(snapshot.totalReturnPct >= 0 ? Color("BrandEmerald") : .red)
            HStack(spacing: 16) {
                StatBadge(label: "Positions", value: "\(snapshot.totalPositions)")
                if let best = snapshot.best {
                    StatBadge(label: "Best", value: "\(best.ticker) \(formatPct(best.returnPct))")
                }
                if let worst = snapshot.worst {
                    StatBadge(label: "Worst", value: "\(worst.ticker) \(formatPct(worst.returnPct))")
                }
            }
        }
        .padding(20)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color("CardBackground"))
        .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
    }
}

private struct StatBadge: View {
    let label: String
    let value: String

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(label).font(.caption2).foregroundStyle(.white.opacity(0.55))
            Text(value).font(.caption.weight(.medium)).foregroundStyle(.white)
        }
    }
}

private struct LatestPickCard: View {
    let pick: PortfolioSnapshot.LatestPick

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("Pick #\(pick.pickNumber) · \(pick.date)")
                .font(.footnote)
                .foregroundStyle(.white.opacity(0.6))
            HStack(alignment: .firstTextBaseline) {
                Text(pick.ticker)
                    .font(.title.weight(.bold))
                    .foregroundStyle(.white)
                Text(pick.name)
                    .font(.subheadline)
                    .foregroundStyle(.white.opacity(0.7))
                    .lineLimit(1)
                Spacer()
                Text(formatPct(pick.returnPct))
                    .font(.headline)
                    .foregroundStyle(pick.returnPct >= 0 ? Color("BrandEmerald") : .red)
            }
        }
        .padding(20)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color("CardBackground"))
        .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
    }
}

private struct MarketStatusRow: View {
    let status: MarketStatus

    var body: some View {
        HStack(spacing: 8) {
            Circle()
                .fill(dotColor)
                .frame(width: 8, height: 8)
            Text(label)
                .font(.footnote)
                .foregroundStyle(.white.opacity(0.7))
            Spacer()
        }
        .padding(.horizontal, 4)
    }

    private var dotColor: Color {
        switch status {
        case .open: return Color("BrandEmerald")
        case .pre, .post: return .yellow
        case .closed, .weekend, .holiday: return .gray
        }
    }

    private var label: String {
        switch status {
        case .open: return "Market open"
        case .pre: return "Pre-market"
        case .post: return "After hours"
        case .closed: return "Market closed"
        case .weekend: return "Weekend — market closed"
        case .holiday: return "Holiday — market closed"
        }
    }
}

private func formatPct(_ value: Double) -> String {
    let sign = value >= 0 ? "+" : ""
    return "\(sign)\(String(format: "%.2f", value))%"
}
