import SwiftUI
import WidgetKit

// MARK: - Timeline

struct PortfolioEntry: TimelineEntry {
    let date: Date
    let snapshot: PortfolioSnapshot?
}

struct PortfolioTimelineProvider: TimelineProvider {
    private let apiBase = URL(string: "https://www.vectorialdata.com")!

    func placeholder(in context: Context) -> PortfolioEntry {
        PortfolioEntry(date: Date(), snapshot: .preview)
    }

    func getSnapshot(in context: Context, completion: @escaping (PortfolioEntry) -> Void) {
        Task {
            let snap = await fetchSnapshot()
            completion(PortfolioEntry(date: Date(), snapshot: snap))
        }
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<PortfolioEntry>) -> Void) {
        Task {
            let snap = await fetchSnapshot()
            let now = Date()
            let next = Calendar.current.date(byAdding: .minute, value: 15, to: now) ?? now.addingTimeInterval(900)
            let timeline = Timeline(entries: [PortfolioEntry(date: now, snapshot: snap)], policy: .after(next))
            completion(timeline)
        }
    }

    private func fetchSnapshot() async -> PortfolioSnapshot? {
        let url = apiBase.appendingPathComponent("/api/portfolio/snapshot")
        var req = URLRequest(url: url)
        req.cachePolicy = .reloadIgnoringLocalCacheData
        req.timeoutInterval = 10
        do {
            let (data, _) = try await URLSession.shared.data(for: req)
            let decoder = JSONDecoder()
            decoder.keyDecodingStrategy = .convertFromSnakeCase
            return try decoder.decode(PortfolioSnapshot.self, from: data)
        } catch {
            return nil
        }
    }
}

// MARK: - Widget

struct PortfolioWidget: Widget {
    let kind: String = "PortfolioWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: PortfolioTimelineProvider()) { entry in
            PortfolioWidgetView(entry: entry)
                .containerBackground(for: .widget) { Color.black }
        }
        .configurationDisplayName("Portfolio")
        .description("Track your Vectorial Data portfolio at a glance.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

// MARK: - View

struct PortfolioWidgetView: View {
    let entry: PortfolioEntry
    @Environment(\.widgetFamily) private var family

    var body: some View {
        switch family {
        case .systemMedium:
            MediumLayout(snapshot: entry.snapshot)
        default:
            SmallLayout(snapshot: entry.snapshot)
        }
    }
}

private struct SmallLayout: View {
    let snapshot: PortfolioSnapshot?

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack(spacing: 6) {
                Image("OwlMark")
                    .resizable()
                    .scaledToFit()
                    .frame(width: 18, height: 18)
                Text("VD")
                    .font(.caption2.weight(.semibold))
                    .foregroundStyle(.secondary)
                Spacer()
            }
            Spacer()
            if let s = snapshot {
                Text(formatPct(s.totalReturnPct))
                    .font(.system(size: 32, weight: .bold, design: .rounded))
                    .foregroundStyle(colorFor(s.totalReturnPct))
                Text("\(s.totalPositions) picks")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            } else {
                Text("—")
                    .font(.system(size: 32, weight: .bold, design: .rounded))
                    .foregroundStyle(.secondary)
            }
        }
    }
}

private struct MediumLayout: View {
    let snapshot: PortfolioSnapshot?

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 6) {
                Image("OwlMark").resizable().scaledToFit().frame(width: 18, height: 18)
                Text("Vectorial Data")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(.secondary)
                Spacer()
                if let s = snapshot {
                    marketDot(s.marketStatus)
                }
            }
            if let s = snapshot {
                HStack(alignment: .firstTextBaseline, spacing: 12) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Total")
                            .font(.caption2).foregroundStyle(.secondary)
                        Text(formatPct(s.totalReturnPct))
                            .font(.system(size: 28, weight: .bold, design: .rounded))
                            .foregroundStyle(colorFor(s.totalReturnPct))
                    }
                    Spacer()
                    VStack(alignment: .trailing, spacing: 4) {
                        if let best = s.best {
                            rowEntry(label: "Best", ticker: best.ticker, pct: best.returnPct)
                        }
                        if let worst = s.worst {
                            rowEntry(label: "Worst", ticker: worst.ticker, pct: worst.returnPct)
                        }
                    }
                }
                if let pick = s.latestPick {
                    HStack(spacing: 4) {
                        Text("#\(pick.pickNumber)")
                            .font(.caption2.weight(.semibold))
                            .foregroundStyle(.secondary)
                        Text(pick.ticker)
                            .font(.caption2.weight(.semibold))
                        Text(pick.name)
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                            .lineLimit(1)
                        Spacer()
                        Text(formatPct(pick.returnPct))
                            .font(.caption2.weight(.semibold))
                            .foregroundStyle(colorFor(pick.returnPct))
                    }
                }
            } else {
                Text("Open the app to sync.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }
            Spacer()
        }
    }

    private func rowEntry(label: String, ticker: String, pct: Double) -> some View {
        HStack(spacing: 4) {
            Text(label).font(.caption2).foregroundStyle(.secondary)
            Text(ticker).font(.caption2.weight(.semibold))
            Text(formatPct(pct))
                .font(.caption2.weight(.semibold))
                .foregroundStyle(colorFor(pct))
        }
    }

    private func marketDot(_ status: MarketStatus) -> some View {
        Circle()
            .fill(status == .open ? Color.green : Color.gray)
            .frame(width: 6, height: 6)
    }
}

// MARK: - Helpers

private func formatPct(_ v: Double) -> String {
    let sign = v >= 0 ? "+" : ""
    return "\(sign)\(String(format: "%.2f", v))%"
}

private func colorFor(_ v: Double) -> Color {
    v >= 0 ? Color(red: 0.13, green: 0.71, blue: 0.48) : Color(red: 0.93, green: 0.27, blue: 0.27)
}

extension PortfolioSnapshot {
    static let preview = PortfolioSnapshot(
        totalReturnPct: 12.48,
        totalPositions: 24,
        since: "2024-06-01",
        best: Position(ticker: "NVDA", returnPct: 94.2),
        worst: Position(ticker: "BABA", returnPct: -18.7),
        latestPick: LatestPick(
            pickNumber: 24,
            ticker: "PLTR",
            name: "Palantir",
            date: "2026-04-18",
            returnPct: 4.1
        ),
        marketStatus: .open,
        asOf: "2026-04-19"
    )
}
