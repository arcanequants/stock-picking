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
    // Starts true so the card renders a visible loading placeholder on first
    // frame. If we left this false, the body would resolve to EmptyView,
    // SwiftUI would collapse the Group, and `.task` would never fire.
    @Published var isLoading = true
    @Published var hasLoadedOnce = false

    func load() async {
        isLoading = true
        defer {
            isLoading = false
            hasLoadedOnce = true
        }
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
        // `vm.isLoading` starts true so the very first frame renders the
        // loading placeholder — that gives `.task` a real view to attach
        // to. If we started with EmptyView, the Group would collapse and
        // the task would never fire.
        Group {
            if auth.currentUser == nil {
                EmptyView()
            } else if !vm.personalPoints.isEmpty {
                card
            } else if vm.isLoading {
                loadingPlaceholder
            } else if let msg = vm.errorMessage {
                errorPlaceholder(msg)
            } else {
                EmptyView()
            }
        }
        .task(id: auth.currentUser?.email ?? "") {
            guard auth.currentUser != nil else { return }
            await vm.load()
        }
    }

    private var loadingPlaceholder: some View {
        HStack {
            ProgressView()
                .tint(Color("BrandEmerald"))
            Text("Cargando tu performance…")
                .font(.footnote)
                .foregroundStyle(.white.opacity(0.5))
            Spacer()
        }
        .padding(18)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color("CardBackground"))
        .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
    }

    private func errorPlaceholder(_ msg: String) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("TU PERFORMANCE")
                .font(.caption.weight(.semibold))
                .tracking(1.2)
                .foregroundStyle(.white.opacity(0.55))
            Text(msg)
                .font(.footnote)
                .foregroundStyle(.red.opacity(0.85))
        }
        .padding(18)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color("CardBackground"))
        .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
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
        // Emerald 1px outline so this card visually owns "your money"
        // and stops being confused with the Vectorial model portfolio
        // above. Same treatment as the dividends card after you've
        // bought a pick.
        .overlay(
            RoundedRectangle(cornerRadius: 20, style: .continuous)
                .stroke(Color("BrandEmerald").opacity(0.35), lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
    }

    /// First character of the user's email — cheap, no PII surfaced
    /// beyond what the user already sees in Account.
    private var userInitial: String {
        let email = auth.currentUser?.email ?? "?"
        return String(email.first ?? "?").uppercased()
    }

    private var header: some View {
        HStack(alignment: .center) {
            HStack(spacing: 6) {
                Text(userInitial)
                    .font(.caption2.weight(.bold))
                    .foregroundStyle(Color("BrandEmerald"))
                    .frame(width: 22, height: 22)
                    .background(Color("BrandEmerald").opacity(0.18))
                    .clipShape(Circle())
                Text("TU PORTAFOLIO")
                    .font(.caption.weight(.semibold))
                    .tracking(1.0)
                    .foregroundStyle(.white.opacity(0.7))
            }
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
        Text(subtitleText)
            .font(.footnote)
            .foregroundStyle(.white.opacity(0.6))
    }

    private var subtitleText: String {
        let days = vm.daysInvested
        let dayWord = days == 1 ? "día" : "días"
        // If the user doesn't have history before the cutoff yet, the
        // number we're showing is "since you started" — say so honestly
        // instead of pretending it covers the full window.
        let hasFullWindow = vm.hasMeaningfulData(for: selectedRange)
        switch selectedRange {
        case .itd:
            return "Llevas \(days) \(dayWord) invirtiendo"
        case .ytd:
            return hasFullWindow
                ? "En lo que va del año"
                : "En lo que va del año · solo llevas \(days) \(dayWord)"
        case .mom:
            return hasFullWindow
                ? "Últimos 30 días"
                : "Últimos 30 días · solo llevas \(days) \(dayWord)"
        case .yoy:
            return hasFullWindow
                ? "Últimos 12 meses"
                : "Últimos 12 meses · solo llevas \(days) \(dayWord)"
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
        return Button {
            selectedRange = range
        } label: {
            Text(range.label)
                .font(.caption.weight(.semibold))
                .foregroundStyle(isSelected ? Color.black : .white.opacity(0.75))
                .frame(maxWidth: .infinity)
                .padding(.vertical, 8)
                .background(
                    isSelected
                    ? AnyShapeStyle(Color("BrandEmerald"))
                    : AnyShapeStyle(Color.white.opacity(0.08))
                )
                .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
        }
    }

    private func formatPct(_ value: Double) -> String {
        let sign = value >= 0 ? "+" : ""
        return "\(sign)\(String(format: "%.2f", value))%"
    }
}
