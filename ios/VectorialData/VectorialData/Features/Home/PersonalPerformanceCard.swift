import SwiftUI

/// Time window the user can pick for their own performance card. ITD is
/// always the default — most newcomers only have a handful of days, and
/// "since I started" is the honest framing.
enum PersonalRange: String, CaseIterable, Identifiable {
    case itd = "ITD"
    case ytd = "YTD"
    case mom = "1M"
    case yoy = "1A"

    var id: String { rawValue }

    var label: String { rawValue }
}

@MainActor
final class PersonalPerformanceViewModel: ObservableObject {
    @Published var history: [PortfolioHistoryPoint] = []
    @Published var errorMessage: String?
    @Published var isLoading = false

    func load() async {
        isLoading = true
        defer { isLoading = false }
        do {
            history = try await APIClient.shared.get(
                "/api/portfolio/history?view=personal",
                as: [PortfolioHistoryPoint].self
            )
            errorMessage = nil
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    /// The personal-only points (those where the user actually had positions).
    var personalPoints: [PortfolioHistoryPoint] {
        history.filter { $0.personalReturnPct != nil }
    }

    /// The first date the user had any personal position.
    var firstDate: Date? {
        personalPoints.first?.parsedDate
    }

    /// Days the user has been invested (rounded down to whole days).
    var daysInvested: Int {
        guard let first = firstDate else { return 0 }
        let delta = Calendar.current.dateComponents([.day], from: first, to: Date()).day ?? 0
        return max(delta, 1)
    }

    /// Return % for the requested window. ITD is the latest cumulative return.
    /// Other ranges report the *change* in cumulative return between the
    /// window's start and today — an approximation that ignores inflows during
    /// the period, fine for V1 where users hold for short horizons.
    func returnPct(for range: PersonalRange) -> Double? {
        let points = personalPoints
        guard let last = points.last?.personalReturnPct else { return nil }

        switch range {
        case .itd:
            return last
        case .ytd, .mom, .yoy:
            guard let cutoff = cutoffDate(for: range) else { return nil }
            // First personal point on or after the cutoff. If the user
            // started investing AFTER the cutoff (common for newcomers
            // picking "1A"), fall back to ITD so the number is meaningful.
            let startPoint = points.first { p in
                guard let d = p.parsedDate else { return false }
                return d >= cutoff
            }
            guard let start = startPoint?.personalReturnPct else {
                return last
            }
            return last - start
        }
    }

    /// Whether this range has enough history to be meaningful. ITD always
    /// passes; the others need data points strictly before the cutoff.
    func hasMeaningfulData(for range: PersonalRange) -> Bool {
        guard range != .itd else { return true }
        guard let cutoff = cutoffDate(for: range) else { return false }
        return personalPoints.contains { ($0.parsedDate ?? .distantFuture) < cutoff }
    }

    private func cutoffDate(for range: PersonalRange) -> Date? {
        let cal = Calendar.current
        let now = Date()
        switch range {
        case .itd:
            return nil
        case .ytd:
            let year = cal.component(.year, from: now)
            return cal.date(from: DateComponents(year: year, month: 1, day: 1))
        case .mom:
            return cal.date(byAdding: .day, value: -30, to: now)
        case .yoy:
            return cal.date(byAdding: .day, value: -365, to: now)
        }
    }
}

struct PersonalPerformanceCard: View {
    @EnvironmentObject private var auth: AuthManager
    @StateObject private var vm = PersonalPerformanceViewModel()
    @State private var selectedRange: PersonalRange = .itd

    var body: some View {
        // The .task must live on a view that always renders, otherwise we
        // hit a catch-22: no data → render EmptyView → task never fires →
        // data stays empty forever. Wrap everything in a Group so the task
        // attaches to a stable parent.
        Group {
            if auth.currentUser == nil {
                EmptyView()
            } else if vm.personalPoints.isEmpty {
                EmptyView()
            } else {
                card
            }
        }
        .task(id: auth.currentUser?.email ?? "") {
            guard auth.currentUser != nil else { return }
            await vm.load()
        }
    }

    private var card: some View {
        VStack(alignment: .leading, spacing: 14) {
            header
            heroNumber
            subtitle
            rangePicker
        }
        .padding(18)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color("CardBackground"))
        .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
    }

    private var header: some View {
        HStack {
            Text("TU PERFORMANCE")
                .font(.caption.weight(.semibold))
                .tracking(1.2)
                .foregroundStyle(.white.opacity(0.55))
            Spacer()
        }
    }

    @ViewBuilder private var heroNumber: some View {
        let pct = vm.returnPct(for: selectedRange)
        HStack(alignment: .firstTextBaseline, spacing: 8) {
            Text(pct.map(formatPct) ?? "—")
                .font(.system(size: 38, weight: .bold))
                .foregroundStyle((pct ?? 0) >= 0 ? Color("BrandEmerald") : .red)
                .contentTransition(.numericText())
                .animation(.easeOut(duration: 0.2), value: pct)
            Spacer()
        }
    }

    @ViewBuilder private var subtitle: some View {
        switch selectedRange {
        case .itd:
            Text("Llevas \(vm.daysInvested) \(vm.daysInvested == 1 ? "día" : "días") invirtiendo")
                .font(.footnote)
                .foregroundStyle(.white.opacity(0.6))
        case .ytd:
            Text("En lo que va del año")
                .font(.footnote)
                .foregroundStyle(.white.opacity(0.6))
        case .mom:
            Text("Últimos 30 días")
                .font(.footnote)
                .foregroundStyle(.white.opacity(0.6))
        case .yoy:
            Text("Últimos 12 meses")
                .font(.footnote)
                .foregroundStyle(.white.opacity(0.6))
        }
    }

    private var rangePicker: some View {
        HStack(spacing: 8) {
            ForEach(PersonalRange.allCases) { range in
                rangePill(range)
            }
        }
    }

    private func rangePill(_ range: PersonalRange) -> some View {
        let isSelected = selectedRange == range
        let isAvailable = vm.hasMeaningfulData(for: range)
        return Button {
            if isAvailable {
                selectedRange = range
            }
        } label: {
            Text(range.label)
                .font(.caption.weight(.semibold))
                .foregroundStyle(
                    isSelected ? Color.black : (isAvailable ? .white.opacity(0.75) : .white.opacity(0.25))
                )
                .frame(maxWidth: .infinity)
                .padding(.vertical, 8)
                .background(
                    isSelected
                    ? AnyShapeStyle(Color("BrandEmerald"))
                    : AnyShapeStyle(Color.white.opacity(isAvailable ? 0.08 : 0.04))
                )
                .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
        }
        .disabled(!isAvailable)
    }

    private func formatPct(_ value: Double) -> String {
        let sign = value >= 0 ? "+" : ""
        return "\(sign)\(String(format: "%.2f", value))%"
    }
}
