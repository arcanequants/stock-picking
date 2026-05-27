import SwiftUI

enum PicksDestination: Hashable {
    case pick(Pick)
    case weeklyDigest
}

struct PicksView: View {
    @EnvironmentObject private var store: PickStatusStore
    @EnvironmentObject private var notifications: NotificationsManager
    @State private var navPath: [PicksDestination] = []

    var body: some View {
        NavigationStack(path: $navPath) {
            content
                .background(Color("AppBackground"))
                .navigationTitle("Picks de Vectorial")
                .navigationDestination(for: Pick.self) { pick in
                    PickDetailView(pick: pick)
                }
                .navigationDestination(for: PicksDestination.self) { dest in
                    switch dest {
                    case .pick(let pick):
                        PickDetailView(pick: pick)
                    case .weeklyDigest:
                        WeeklyDigestView()
                    }
                }
                .refreshable { await store.load() }
                .task {
                    if store.picks.isEmpty {
                        await store.load()
                    }
                }
                .onChange(of: notifications.pendingPickNumber) { _, newValue in
                    Task { await handlePendingPick(newValue) }
                }
                .onChange(of: notifications.pendingWeeklyDigest) { _, newValue in
                    if newValue {
                        navPath = [.weeklyDigest]
                        notifications.pendingWeeklyDigest = false
                    }
                }
                .task(id: notifications.pendingPickNumber) {
                    // Catch the case where the tap fires before the view is mounted.
                    await handlePendingPick(notifications.pendingPickNumber)
                }
        }
    }

    private func handlePendingPick(_ pickNumber: Int?) async {
        guard let pickNumber else { return }
        if store.picks.isEmpty {
            await store.load()
        }
        if let pick = store.picks.first(where: { $0.pickNumber == pickNumber }) {
            navPath = [.pick(pick)]
            notifications.pendingPickNumber = nil
        }
    }

    @ViewBuilder
    private var content: some View {
        if store.isLoading && store.picks.isEmpty {
            ProgressView()
                .frame(maxWidth: .infinity, maxHeight: .infinity)
        } else if let msg = store.errorMessage, store.picks.isEmpty {
            Text(msg)
                .font(.footnote)
                .foregroundStyle(.secondary)
                .frame(maxWidth: .infinity, maxHeight: .infinity)
        } else if store.picks.isEmpty {
            ScrollView {
                LazyVStack(spacing: 10) {
                    if !store.isSubscribed {
                        UpsellBanner()
                    }
                    CountdownEmptyCard()
                }
                .padding(16)
            }
        } else {
            ScrollView {
                LazyVStack(spacing: 10) {
                    if !store.isSubscribed {
                        UpsellBanner()
                    }
                    if !store.pending.isEmpty {
                        sectionHeader(
                            title: "PENDIENTES",
                            count: store.pending.count
                        )
                        ForEach(orderedPending(store.pending)) { pick in
                            NavigationLink(value: PicksDestination.pick(pick)) {
                                PendingPickRow(pick: pick)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    if !store.historial.isEmpty {
                        sectionHeader(
                            title: "HISTORIAL",
                            count: store.historial.count
                        )
                        ForEach(store.historial) { pick in
                            NavigationLink(value: PicksDestination.pick(pick)) {
                                HistoryPickRow(pick: pick)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }
                .padding(16)
            }
        }
    }

    /// Pending newest first — that's what people are actively trying to decide.
    private func orderedPending(_ picks: [Pick]) -> [Pick] {
        picks.sorted { $0.pickNumber > $1.pickNumber }
    }

    private func sectionHeader(title: String, count: Int) -> some View {
        HStack {
            Text(title)
                .font(.caption.weight(.semibold))
                .tracking(1.1)
                .foregroundStyle(.white.opacity(0.55))
            Text("\(count)")
                .font(.caption2.weight(.semibold))
                .foregroundStyle(.white.opacity(0.5))
                .padding(.horizontal, 6)
                .padding(.vertical, 2)
                .background(Color.white.opacity(0.08))
                .clipShape(Capsule())
            Spacer()
        }
        .padding(.top, 8)
    }
}

private struct PendingPickRow: View {
    let pick: Pick

    var body: some View {
        HStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 2) {
                HStack(spacing: 6) {
                    Text("#\(pick.pickNumber)")
                        .font(.caption).foregroundStyle(.white.opacity(0.5))
                    Text(pick.ticker)
                        .font(.headline).foregroundStyle(.white)
                    if pick.type == "rebuy" {
                        RebuyBadge()
                    }
                }
                Text(pick.name)
                    .font(.caption).foregroundStyle(.white.opacity(0.65))
                    .lineLimit(1)
                Text("\(daysSince(pick.date)) · va \(formatPct(pick.returnPct))")
                    .font(.caption2).foregroundStyle(.white.opacity(0.45))
            }
            Spacer()
            Text("Decidir →")
                .font(.caption.weight(.semibold))
                .foregroundStyle(Color("BrandEmerald"))
        }
        .padding(14)
        .background(Color("CardBackground"))
        .overlay(
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .stroke(Color("BrandEmerald").opacity(0.25), lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
    }

    private func daysSince(_ dateStr: String) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        guard let date = formatter.date(from: dateStr) else { return dateStr }
        let days = Int(Date().timeIntervalSince(date) / 86400)
        if days <= 0 { return "hoy" }
        if days == 1 { return "ayer" }
        return "hace \(days)d"
    }

    private func formatPct(_ value: Double) -> String {
        let sign = value >= 0 ? "+" : ""
        return "\(sign)\(String(format: "%.2f", value))%"
    }
}

private struct HistoryPickRow: View {
    let pick: Pick

    var body: some View {
        HStack(spacing: 12) {
            statusBadge
            VStack(alignment: .leading, spacing: 2) {
                HStack(spacing: 6) {
                    Text("#\(pick.pickNumber)")
                        .font(.caption).foregroundStyle(.white.opacity(0.5))
                    Text(pick.ticker)
                        .font(.headline).foregroundStyle(.white)
                    if pick.type == "rebuy" {
                        RebuyBadge()
                    }
                }
                Text(pick.name)
                    .font(.caption).foregroundStyle(.white.opacity(0.6))
                    .lineLimit(1)
                Text(subline)
                    .font(.caption2).foregroundStyle(.white.opacity(0.45))
            }
            Spacer()
            Text(formatPct(pick.returnPct))
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(pick.returnPct >= 0 ? Color("BrandEmerald") : .red)
        }
        .padding(14)
        .background(Color("CardBackground"))
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
    }

    private var statusBadge: some View {
        Group {
            switch pick.status {
            case .bought:
                Image(systemName: "checkmark.circle.fill")
                    .foregroundStyle(Color("BrandEmerald"))
            case .skipped:
                Image(systemName: "xmark.circle.fill")
                    .foregroundStyle(.white.opacity(0.45))
            case .pending:
                Image(systemName: "circle.dotted")
                    .foregroundStyle(.white.opacity(0.45))
            }
        }
        .font(.title3)
    }

    private var subline: String {
        switch pick.status {
        case .bought:
            if let p = pick.buyPrice {
                return "comprado a $\(String(format: "%.2f", p))"
            }
            return "comprado"
        case .skipped:
            return "skip · \(pick.date)"
        case .pending:
            return pick.date
        }
    }

    private func formatPct(_ value: Double) -> String {
        let sign = value >= 0 ? "+" : ""
        return "\(sign)\(String(format: "%.2f", value))%"
    }
}

private struct UpsellBanner: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("Showing latest 3 picks")
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(.white)
            Text("Subscribe to unlock the full history and every new pick the moment it drops.")
                .font(.caption)
                .foregroundStyle(.white.opacity(0.7))
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            LinearGradient(
                colors: [Color("BrandIndigo"), Color("BrandEmerald")],
                startPoint: .leading, endPoint: .trailing
            )
            .opacity(0.25)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .stroke(Color("BrandEmerald").opacity(0.5), lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
    }
}

private struct RebuyBadge: View {
    var body: some View {
        Text("RECOMPRA")
            .font(.system(size: 9, weight: .bold))
            .tracking(0.6)
            .foregroundStyle(Color("BrandIndigo"))
            .padding(.horizontal, 5)
            .padding(.vertical, 2)
            .background(Color("BrandIndigo").opacity(0.18))
            .clipShape(Capsule())
    }
}

private struct CountdownEmptyCard: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 6) {
                Image(systemName: "hourglass")
                    .foregroundStyle(Color("BrandEmerald"))
                Text("Aún no hay picks nuevos")
                    .font(.headline)
                    .foregroundStyle(.white)
            }
            Text("Los picks llegan al ritmo de mercado, no del calendario. Te avisamos al instante cuando salga el siguiente.")
                .font(.caption)
                .foregroundStyle(.white.opacity(0.7))
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color("CardBackground"))
        .overlay(
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .stroke(Color.white.opacity(0.08), lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
    }
}

