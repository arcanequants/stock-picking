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
                VStack(spacing: 14) {
                    PerformanceChart()
                    PersonalPerformanceCard()
                    if let s = vm.snapshot {
                        QuickStatsCard(snapshot: s)
                        if let pick = s.latestPick {
                            LatestPickCard(pick: pick)
                        }
                        MarketStatusRow(status: s.marketStatus)
                    } else if vm.isLoading {
                        ProgressView().padding(.top, 40)
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
            .navigationTitle("Vectorial Data")
            .refreshable { await vm.load() }
            .task { await vm.load() }
        }
    }
}

private struct QuickStatsCard: View {
    let snapshot: PortfolioSnapshot

    var body: some View {
        HStack(alignment: .top, spacing: 16) {
            statColumn(
                label: "Positions",
                value: "\(snapshot.totalPositions)",
                color: .white
            )
            if let best = snapshot.best {
                statColumn(
                    label: "Best",
                    value: "\(best.ticker) \(formatPct(best.returnPct))",
                    color: Color("BrandEmerald")
                )
            }
            if let worst = snapshot.worst {
                statColumn(
                    label: "Worst",
                    value: "\(worst.ticker) \(formatPct(worst.returnPct))",
                    color: worst.returnPct >= 0 ? Color("BrandEmerald") : .red
                )
            }
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color("CardBackground"))
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
    }

    private func statColumn(label: String, value: String, color: Color) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(label)
                .font(.caption2)
                .foregroundStyle(.white.opacity(0.55))
            Text(value)
                .font(.footnote.weight(.semibold))
                .foregroundStyle(color)
                .lineLimit(1)
                .minimumScaleFactor(0.7)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
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
