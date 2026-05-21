import SwiftUI

/// Friday-digest landing screen. Reached by tapping the weekly recap push;
/// also surfaces the same content the push body summarized. Reads everything
/// off PickStatusStore so it's always in sync with manual decisions made
/// elsewhere in the app.
struct WeeklyDigestView: View {
    @EnvironmentObject private var store: PickStatusStore

    var body: some View {
        ScrollView {
            LazyVStack(alignment: .leading, spacing: 14) {
                header

                if !boughtThisWeek.isEmpty {
                    sectionHeader(
                        title: "COMPRASTE",
                        count: boughtThisWeek.count,
                        icon: "checkmark.circle.fill"
                    )
                    ForEach(boughtThisWeek) { pick in
                        NavigationLink(value: PicksDestination.pick(pick)) {
                            BoughtThisWeekRow(pick: pick)
                        }
                        .buttonStyle(.plain)
                    }
                }

                if !pending.isEmpty {
                    sectionHeader(
                        title: "TE FALTA POR DECIDIR",
                        count: pending.count,
                        icon: "clock.fill"
                    )
                    ForEach(pending) { pick in
                        NavigationLink(value: PicksDestination.pick(pick)) {
                            PendingDigestRow(pick: pick)
                        }
                        .buttonStyle(.plain)
                    }
                }

                if boughtThisWeek.isEmpty && pending.isEmpty {
                    allCaughtUp
                }
            }
            .padding(16)
        }
        .background(Color("AppBackground"))
        .navigationTitle("Recap semanal")
        .navigationBarTitleDisplayMode(.inline)
        .task {
            if store.picks.isEmpty {
                await store.load()
            }
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("Esta semana en Vectorial")
                .font(.title3.weight(.semibold))
                .foregroundStyle(.white)
            Text(summaryLine)
                .font(.footnote)
                .foregroundStyle(.white.opacity(0.65))
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.bottom, 4)
    }

    private var summaryLine: String {
        let b = boughtThisWeek.count
        let p = pending.count
        if b > 0 && p > 0 {
            return "\(b) \(b == 1 ? "comprado" : "comprados") · \(p) \(p == 1 ? "pendiente" : "pendientes")"
        }
        if b > 0 {
            return "\(b) \(b == 1 ? "comprado" : "comprados") · al día con los picks"
        }
        if p > 0 {
            return "\(p) \(p == 1 ? "pick pendiente" : "picks pendientes")"
        }
        return "Sin movimientos esta semana"
    }

    private var allCaughtUp: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Al día")
                .font(.headline)
                .foregroundStyle(.white)
            Text("No tienes picks pendientes y nada nuevo cayó esta semana. Disfruta el viernes.")
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

    // MARK: - Filters

    /// Mirrors the backend's 7-day rolling window so the in-app summary
    /// matches the push body the user just tapped.
    private var boughtThisWeek: [Pick] {
        let cutoff = sevenDaysAgoString()
        return store.bought
            .filter { ($0.decidedAt ?? "") >= cutoff }
            .sorted { $0.pickNumber > $1.pickNumber }
    }

    private var pending: [Pick] {
        store.pending.sorted { $0.pickNumber > $1.pickNumber }
    }

    private func sevenDaysAgoString() -> String {
        let cutoff = Date().addingTimeInterval(-7 * 86400)
        let fmt = DateFormatter()
        fmt.dateFormat = "yyyy-MM-dd"
        return fmt.string(from: cutoff)
    }

    private func sectionHeader(title: String, count: Int, icon: String) -> some View {
        HStack(spacing: 6) {
            Image(systemName: icon)
                .font(.caption)
                .foregroundStyle(.white.opacity(0.55))
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

private struct BoughtThisWeekRow: View {
    let pick: Pick

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: "checkmark.circle.fill")
                .font(.title3)
                .foregroundStyle(Color("BrandEmerald"))
            VStack(alignment: .leading, spacing: 2) {
                HStack(spacing: 6) {
                    Text("#\(pick.pickNumber)")
                        .font(.caption).foregroundStyle(.white.opacity(0.5))
                    Text(pick.ticker)
                        .font(.headline).foregroundStyle(.white)
                }
                Text(pick.name)
                    .font(.caption).foregroundStyle(.white.opacity(0.6))
                    .lineLimit(1)
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
}

private struct PendingDigestRow: View {
    let pick: Pick

    var body: some View {
        HStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 2) {
                HStack(spacing: 6) {
                    Text("#\(pick.pickNumber)")
                        .font(.caption).foregroundStyle(.white.opacity(0.5))
                    Text(pick.ticker)
                        .font(.headline).foregroundStyle(.white)
                }
                Text(pick.name)
                    .font(.caption).foregroundStyle(.white.opacity(0.65))
                    .lineLimit(1)
                Text("va \(formatPct(pick.returnPct))")
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
}

private func formatPct(_ value: Double) -> String {
    let sign = value >= 0 ? "+" : ""
    return "\(sign)\(String(format: "%.2f", value))%"
}
