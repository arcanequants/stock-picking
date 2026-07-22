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

enum HomeDestination: Hashable {
    case newsList
    case newsItem(UUID)
}

struct HomeView: View {
    @StateObject private var vm = HomeViewModel()
    @EnvironmentObject private var news: NewsStore
    @EnvironmentObject private var notifications: NotificationsManager
    @State private var navPath: [HomeDestination] = []

    var body: some View {
        NavigationStack(path: $navPath) {
            ScrollView {
                VStack(spacing: 14) {
                    PerformanceChart()
                    NewsHomeCard()
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
            .refreshable {
                await vm.load()
                await news.load()
            }
            .task {
                await vm.load()
                if news.items.isEmpty {
                    await news.load()
                }
            }
            .navigationDestination(for: HomeDestination.self) { dest in
                switch dest {
                case .newsList:
                    NewsListView()
                case .newsItem(let id):
                    if let item = news.item(byId: id) {
                        NewsDetailView(item: item)
                    } else {
                        NewsListView()
                    }
                }
            }
            .navigationDestination(for: NewsItem.self) { item in
                NewsDetailView(item: item)
            }
            // `.task(id:)` covers both the cold-launch tap (initial value set
            // before mount) and later changes, so it's the sole owner — a
            // separate `.onChange` would double-fire and race.
            .task(id: notifications.pendingNewsId) {
                await handlePendingNews(notifications.pendingNewsId)
            }
        }
    }

    private func handlePendingNews(_ id: UUID?) async {
        guard let id else { return }
        if news.items.isEmpty {
            await news.load()
        }
        // Push the detail (which sits on top of the list in the back stack
        // so back goes to the list, then to Home).
        navPath = [.newsList, .newsItem(id)]
        notifications.pendingNewsId = nil
    }
}

/// Entry card to the news feed. Hides itself if there's nothing
/// to surface — no empty clutter on Home. When there are unread
/// items it shows the most recent headline as preview.
private struct NewsHomeCard: View {
    @EnvironmentObject private var store: NewsStore

    var body: some View {
        if store.items.isEmpty {
            EmptyView()
        } else {
            NavigationLink(value: HomeDestination.newsList) {
                cardBody
            }
            .buttonStyle(.plain)
        }
    }

    private var cardBody: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 6) {
                Image(systemName: "newspaper.fill")
                    .font(.caption)
                    .foregroundStyle(Color("BrandEmerald"))
                Text("NOTICIAS")
                    .font(.caption.weight(.semibold))
                    .tracking(1.1)
                    .foregroundStyle(.white.opacity(0.85))
                if store.unreadCount > 0 {
                    Text(store.unreadCount == 1
                         ? String(localized: "● 1 nueva")
                         : String(localized: "● \(store.unreadCount) nuevas"))
                        .font(.caption2.weight(.semibold))
                        .foregroundStyle(Color("BrandEmerald"))
                }
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(.white.opacity(0.5))
            }
            Text("Lo último que cambia tu tesis")
                .font(.footnote)
                .foregroundStyle(.white.opacity(0.65))
            if let preview = store.mostRecentUnread ?? store.items.first {
                Divider().overlay(Color.white.opacity(0.1))
                Text(preview.headline)
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(.white)
                    .lineLimit(2)
                    .multilineTextAlignment(.leading)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            LinearGradient(
                colors: [Color("BrandIndigo"), Color("BrandEmerald")],
                startPoint: .leading, endPoint: .trailing
            )
            .opacity(0.18)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .stroke(Color("BrandEmerald").opacity(0.4), lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
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

    private func statColumn(label: LocalizedStringKey, value: String, color: Color) -> some View {
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
            Text("Análisis del \(formatLongDate(pick.date))")
                .font(.footnote.weight(.semibold))
                .foregroundStyle(.white.opacity(0.7))
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

    private func formatLongDate(_ iso: String) -> String {
        let parser = DateFormatter()
        parser.calendar = Calendar(identifier: .iso8601)
        parser.locale = Locale(identifier: "en_US_POSIX")
        parser.timeZone = TimeZone(identifier: "UTC")
        parser.dateFormat = "yyyy-MM-dd"
        guard let date = parser.date(from: iso) else { return iso }
        return date.formatted(date: .long, time: .omitted)
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
        case .open: return String(localized: "Market open")
        case .pre: return String(localized: "Pre-market")
        case .post: return String(localized: "After hours")
        case .closed: return String(localized: "Market closed")
        case .weekend: return String(localized: "Weekend — market closed")
        case .holiday: return String(localized: "Holiday — market closed")
        }
    }
}

private func formatPct(_ value: Double) -> String {
    let sign = value >= 0 ? "+" : ""
    return "\(sign)\(String(format: "%.2f", value))%"
}
