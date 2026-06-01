import SwiftUI

@MainActor
final class PickDetailViewModel: ObservableObject {
    @Published var research: StockResearch?
    @Published var errorMessage: String?
    @Published var isLoading = false

    let ticker: String

    init(ticker: String) {
        self.ticker = ticker
    }

    func load() async {
        isLoading = true
        defer { isLoading = false }
        do {
            research = try await APIClient.shared.get(
                "/api/picks/research/\(ticker)",
                as: StockResearch.self
            )
            errorMessage = nil
        } catch APIError.unauthorized {
            errorMessage = "Please sign in again"
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

struct PickDetailView: View {
    @EnvironmentObject private var store: PickStatusStore
    @EnvironmentObject private var dividends: DividendStore
    @Environment(\.dismiss) private var dismiss
    @StateObject private var vm: PickDetailViewModel
    let pick: Pick

    @State private var showBuySheet = false
    @State private var showPaywall = false
    @State private var skipInFlight = false
    /// Each deep-dive accordion is collapsed by default. Set holds the
    /// titles of currently-expanded sections (small set, so O(N) is fine).
    @State private var expandedSections: Set<String> = []

    init(pick: Pick) {
        self.pick = pick
        _vm = StateObject(wrappedValue: PickDetailViewModel(ticker: pick.ticker))
    }

    /// Latest copy of this pick from the store. The detail view was pushed
    /// with a stale `pick`; observing the store keeps status/buy_price live.
    private var current: Pick {
        store.picks.first(where: { $0.pickNumber == pick.pickNumber }) ?? pick
    }

    var body: some View {
        ZStack(alignment: .bottom) {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    headerCard
                    decisionBanner
                    dividendSection
                    if vm.isLoading && vm.research == nil {
                        ProgressView()
                            .frame(maxWidth: .infinity)
                            .padding(.top, 40)
                    } else if let msg = vm.errorMessage, vm.research == nil {
                        Text(msg)
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                    } else if let r = vm.research {
                        if r.locked {
                            teaserSection(research: r)
                            Button { showPaywall = true } label: { paywallCard }
                                .buttonStyle(.plain)
                        } else {
                            premiumSections(research: r)
                        }
                    }
                    disclaimer
                    Color.clear.frame(height: 100) // breathing room above sticky CTAs
                }
                .padding(16)
            }
            decisionBar
        }
        .background(Color("AppBackground"))
        .sheet(isPresented: $showPaywall) { PaywallView() }
        .navigationTitle(pick.ticker)
        .navigationBarTitleDisplayMode(.inline)
        .task { await vm.load() }
        .task {
            if dividends.events.isEmpty {
                await dividends.load()
            }
        }
        .sheet(isPresented: $showBuySheet) {
            PickBuySheet(
                pick: current,
                defaultInvestment: store.defaultInvestment,
                onSuccess: { dismiss() }
            )
            .environmentObject(store)
            .presentationDetents([.medium, .large])
            .presentationDragIndicator(.visible)
        }
    }

    private var headerCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Análisis del \(formatLongDate(pick.date))")
                .font(.footnote.weight(.semibold))
                .foregroundStyle(.white.opacity(0.7))
            Text("Pick #\(pick.pickNumber)")
                .font(.caption2)
                .foregroundStyle(.white.opacity(0.4))
            HStack(alignment: .firstTextBaseline) {
                Text(pick.ticker)
                    .font(.largeTitle.weight(.bold))
                    .foregroundStyle(.white)
                Spacer()
                Text(formatPct(pick.returnPct))
                    .font(.title3.weight(.semibold))
                    .foregroundStyle(pick.returnPct >= 0 ? Color("BrandEmerald") : .red)
            }
            Text(pick.name)
                .font(.headline)
                .foregroundStyle(.white.opacity(0.75))
            HStack(spacing: 6) {
                tag(pick.sector)
                tag(pick.region)
                if !pick.country.isEmpty {
                    tag(pick.country)
                }
            }
        }
        .padding(18)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color("CardBackground"))
        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
    }

    /// Subtle banner that surfaces the user's decision if they already made one.
    @ViewBuilder
    private var decisionBanner: some View {
        switch current.status {
        case .pending:
            EmptyView()
        case .bought:
            Button {
                showBuySheet = true
            } label: {
                HStack(spacing: 10) {
                    Image(systemName: "checkmark.seal.fill")
                        .foregroundStyle(Color("BrandEmerald"))
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Lo compraste")
                            .font(.footnote.weight(.semibold))
                            .foregroundStyle(.white)
                        if let price = current.buyPrice, let amount = current.amountInvested {
                            Text("$\(format2(price)) · invertiste $\(format2(amount)) · toca para editar")
                                .font(.caption2)
                                .foregroundStyle(.white.opacity(0.6))
                        } else {
                            Text("toca para editar")
                                .font(.caption2)
                                .foregroundStyle(.white.opacity(0.6))
                        }
                    }
                    Spacer()
                    Image(systemName: "pencil")
                        .font(.footnote.weight(.semibold))
                        .foregroundStyle(Color("BrandEmerald").opacity(0.8))
                }
                .padding(12)
                .background(Color("BrandEmerald").opacity(0.12))
                .overlay(
                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                        .stroke(Color("BrandEmerald").opacity(0.4), lineWidth: 1)
                )
                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
            }
            .buttonStyle(.plain)
        case .skipped:
            HStack(spacing: 10) {
                Image(systemName: "xmark.circle.fill")
                    .foregroundStyle(.white.opacity(0.55))
                Text("Lo skippeaste")
                    .font(.footnote.weight(.semibold))
                    .foregroundStyle(.white.opacity(0.7))
                Spacer()
            }
            .padding(12)
            .background(Color.white.opacity(0.06))
            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
        }
    }

    /// Only shows once the user actually bought this pick. Lists every
    /// dividend they've collected on this position with the running total
    /// and yield-on-cost (called "Yield real" — zero-jargon copy rule).
    @ViewBuilder
    private var dividendSection: some View {
        let events = dividends.eventsForPick(pick.pickNumber)
        if current.status == .bought && !events.isEmpty {
            let total = events.reduce(0.0) { $0 + $1.totalAmount }
            let yieldReal: Double? = {
                guard let invested = current.amountInvested, invested > 0
                else { return nil }
                return (total / invested) * 100
            }()
            VStack(alignment: .leading, spacing: 12) {
                HStack(spacing: 6) {
                    Text("💸 DIVIDENDOS COBRADOS")
                        .font(.caption.weight(.semibold))
                        .tracking(1.1)
                        .foregroundStyle(.white.opacity(0.55))
                    Text("\(events.count)")
                        .font(.caption2.weight(.semibold))
                        .foregroundStyle(.white.opacity(0.5))
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(Color.white.opacity(0.08))
                        .clipShape(Capsule())
                    Spacer()
                }
                VStack(spacing: 10) {
                    ForEach(events.sorted { $0.exDate > $1.exDate }) { e in
                        HStack {
                            Text(formatDate(e.exDate))
                                .font(.footnote)
                                .foregroundStyle(.white.opacity(0.6))
                            Spacer()
                            Text("$\(format2(e.totalAmount))")
                                .font(.footnote.weight(.semibold))
                                .foregroundStyle(Color("BrandEmerald"))
                        }
                    }
                }
                Divider().overlay(Color.white.opacity(0.1))
                HStack {
                    Text("Total cobrado")
                        .font(.footnote.weight(.medium))
                        .foregroundStyle(.white.opacity(0.75))
                    Spacer()
                    Text("$\(format2(total))")
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(Color("BrandEmerald"))
                }
                if let y = yieldReal {
                    HStack {
                        Text("Yield real")
                            .font(.caption)
                            .foregroundStyle(.white.opacity(0.55))
                        Spacer()
                        Text(String(format: "%.2f%%", y))
                            .font(.caption.weight(.medium))
                            .foregroundStyle(.white.opacity(0.7))
                    }
                }
            }
            .padding(16)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color("CardBackground"))
            .overlay(
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .stroke(Color("BrandEmerald").opacity(0.25), lineWidth: 1)
            )
            .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
        }
    }

    private func formatDate(_ isoDate: String) -> String {
        let inFmt = DateFormatter()
        inFmt.dateFormat = "yyyy-MM-dd"
        guard let date = inFmt.date(from: isoDate) else { return isoDate }
        let outFmt = DateFormatter()
        outFmt.locale = Locale(identifier: "es")
        outFmt.dateFormat = "d MMM"
        return outFmt.string(from: date)
    }

    /// Sticky bottom bar with the user's primary actions. Reshapes based on
    /// current status so we never offer "Lo compré" twice.
    private var decisionBar: some View {
        VStack(spacing: 0) {
            LinearGradient(
                colors: [Color("AppBackground").opacity(0), Color("AppBackground")],
                startPoint: .top, endPoint: .bottom
            )
            .frame(height: 18)
            HStack(spacing: 10) {
                switch current.status {
                case .pending:
                    ctaSecondary(label: "⏰ Después") {
                        Task { await store.markSkipped(pickNumber: pick.pickNumber) }
                    }
                    ctaPrimary(label: "✅ Lo compré") {
                        showBuySheet = true
                    }
                case .bought:
                    ctaSecondary(label: "Cambiar a pendiente") {
                        Task { await store.markPending(pickNumber: pick.pickNumber) }
                    }
                case .skipped:
                    ctaSecondary(label: "Volver a pendiente") {
                        Task { await store.markPending(pickNumber: pick.pickNumber) }
                    }
                    ctaPrimary(label: "✅ Sí lo compré") {
                        showBuySheet = true
                    }
                }
            }
            .padding(.horizontal, 16)
            .padding(.bottom, 20)
            .padding(.top, 6)
            .background(Color("AppBackground"))
        }
    }

    private func ctaPrimary(label: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack {
                Spacer()
                Text(label)
                    .font(.headline)
                    .foregroundStyle(.black)
                Spacer()
            }
            .padding(.vertical, 14)
            .background(Color("BrandEmerald"))
            .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
        }
        .buttonStyle(.plain)
    }

    private func ctaSecondary(label: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack {
                Spacer()
                Text(label)
                    .font(.headline)
                    .foregroundStyle(.white.opacity(0.85))
                Spacer()
            }
            .padding(.vertical, 14)
            .background(Color.white.opacity(0.08))
            .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
        }
        .buttonStyle(.plain)
    }

    @ViewBuilder
    private func teaserSection(research: StockResearch) -> some View {
        tldrCard(text: research.oneLiner ?? research.summaryShort)
    }

    private var paywallCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Unlock the full thesis")
                .font(.headline)
                .foregroundStyle(.white)
            Text("Get our complete research: what the company does, why we picked it, the key risk, valuation and analyst consensus.")
                .font(.footnote)
                .foregroundStyle(.white.opacity(0.75))
            HStack(spacing: 4) {
                Text("Suscríbete")
                    .font(.subheadline.weight(.semibold))
                Image(systemName: "chevron.right")
                    .font(.caption.weight(.bold))
            }
            .foregroundStyle(Color("BrandEmerald"))
            .padding(.top, 4)
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            LinearGradient(
                colors: [Color("BrandIndigo"), Color("BrandEmerald")],
                startPoint: .leading, endPoint: .trailing
            )
            .opacity(0.28)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .stroke(Color("BrandEmerald").opacity(0.5), lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
    }

    /// Mom-readable layout: one-liner + 3 plain-language pills, plus
    /// two collapsed accordions for the curious. "Qué hace" is folded
    /// into the one-liner — the average reader doesn't need a separate
    /// section. Deep traders can open the full research on web.
    @ViewBuilder
    private func premiumSections(research: StockResearch) -> some View {
        tldrCard(text: research.oneLiner ?? research.summaryShort)
        if let pills = research.whatsImportant, !pills.isEmpty {
            whatsImportantCard(pills: pills)
        }
        if let why = research.whyShort, !why.isEmpty {
            accordionSection(title: "Por qué la pickeamos", body: why)
        }
        if let risk = research.riskShort, !risk.isEmpty {
            accordionSection(title: "Riesgo principal", body: risk)
        }
        proResearchCTA(ticker: research.ticker)
    }

    /// Tappable card that hands the curious off to the full research
    /// blog on web. App stays mom-readable; the wall of analyst-grade
    /// detail lives on `vectorialdata.com/stocks/{ticker}`.
    @ViewBuilder
    private func proResearchCTA(ticker: String) -> some View {
        if let url = URL(string: "https://vectorialdata.com/stocks/\(ticker.lowercased())") {
            Link(destination: url) {
                HStack(spacing: 12) {
                    Image(systemName: "doc.text.magnifyingglass")
                        .font(.title3)
                        .foregroundStyle(Color("BrandEmerald"))
                        .frame(width: 24)
                    VStack(alignment: .leading, spacing: 2) {
                        Text("¿Quieres más detalle?")
                            .font(.footnote.weight(.semibold))
                            .foregroundStyle(.white)
                        Text("Lee el análisis completo en vectorialdata.com")
                            .font(.caption2)
                            .foregroundStyle(.white.opacity(0.6))
                    }
                    Spacer()
                    Image(systemName: "arrow.up.right")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(.white.opacity(0.5))
                }
                .padding(16)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(Color("CardBackground"))
                .overlay(
                    RoundedRectangle(cornerRadius: 16, style: .continuous)
                        .stroke(Color("BrandEmerald").opacity(0.25), lineWidth: 1)
                )
                .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
            }
            .buttonStyle(.plain)
        }
    }

    /// One-sentence TL;DR. Body comes server-side already compacted
    /// (`one_liner`) so we render it verbatim — no client parsing.
    private func tldrCard(text: String) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("EN POCAS PALABRAS")
                .font(.caption.weight(.semibold))
                .tracking(1.1)
                .foregroundStyle(.white.opacity(0.55))
            Text(markdownText(text))
                .font(.callout)
                .foregroundStyle(.white.opacity(0.9))
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color("CardBackground"))
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
    }

    /// Collapsed-by-default card for deep-dive research. Tap the header
    /// to expand. Identity = `title`, which doubles as the dedup key.
    private func accordionSection(title: String, body: String) -> some View {
        let isExpanded = expandedSections.contains(title)
        return VStack(alignment: .leading, spacing: 0) {
            Button {
                withAnimation(.easeInOut(duration: 0.2)) {
                    if isExpanded {
                        expandedSections.remove(title)
                    } else {
                        expandedSections.insert(title)
                    }
                }
            } label: {
                HStack {
                    Text(title.uppercased())
                        .font(.caption.weight(.semibold))
                        .tracking(1.1)
                        .foregroundStyle(.white.opacity(0.7))
                    Spacer()
                    Image(systemName: isExpanded ? "chevron.up" : "chevron.down")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(.white.opacity(0.5))
                }
                .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            if isExpanded {
                // Body is server-compacted (~280 chars) — render verbatim.
                // Full research lives on web, not in the app.
                Text(markdownText(body))
                    .font(.callout)
                    .foregroundStyle(.white.opacity(0.85))
                    .fixedSize(horizontal: false, vertical: true)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.top, 12)
            }
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color("CardBackground"))
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
    }

    /// Renders markdown (`**bold**`, lists, etc.) preserving newlines so
    /// paragraph breaks in the research API survive into the UI. Without
    /// this, the literal `**` characters showed up on screen.
    private func markdownText(_ s: String) -> AttributedString {
        let opts = AttributedString.MarkdownParsingOptions(
            interpretedSyntax: .inlineOnlyPreservingWhitespace
        )
        return (try? AttributedString(markdown: s, options: opts)) ?? AttributedString(s)
    }

    /// "LO IMPORTANTE" — three plain-language vital signs server-built
    /// from dividend / analyst consensus / market cap. Replaces the old
    /// DATOS CLAVE jargon (P/E ratio, Forward P/E, etc.) — average
    /// reader doesn't know those terms.
    @ViewBuilder
    private func whatsImportantCard(pills: [WhatsImportantPill]) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("LO IMPORTANTE")
                .font(.caption.weight(.semibold))
                .tracking(1.1)
                .foregroundStyle(.white.opacity(0.55))
            VStack(spacing: 12) {
                ForEach(pills, id: \.text) { pill in
                    HStack(alignment: .center, spacing: 12) {
                        Image(systemName: pill.icon)
                            .font(.title3)
                            .foregroundStyle(pillColor(pill.tint))
                            .frame(width: 24)
                        Text(pill.text)
                            .font(.footnote)
                            .foregroundStyle(.white.opacity(0.9))
                            .fixedSize(horizontal: false, vertical: true)
                        Spacer(minLength: 0)
                    }
                }
            }
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color("CardBackground"))
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
    }

    /// Maps the backend tint hint to a brand-palette color. Unknowns
    /// fall back to a soft white so we never render an empty pill.
    private func pillColor(_ tint: String) -> Color {
        switch tint {
        case "emerald": return Color("BrandEmerald")
        case "red": return .red
        case "yellow": return .yellow
        default: return .white.opacity(0.85)
        }
    }

    private var disclaimer: some View {
        Text("Informational only. Not personalized investment advice. Past performance does not guarantee future results.")
            .font(.caption2)
            .foregroundStyle(.white.opacity(0.4))
            .fixedSize(horizontal: false, vertical: true)
            .padding(.top, 4)
    }

    private func tag(_ value: String) -> some View {
        Text(value)
            .font(.caption2.weight(.medium))
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(Color.white.opacity(0.08))
            .foregroundStyle(.white.opacity(0.75))
            .clipShape(Capsule())
    }

    private func formatPct(_ value: Double) -> String {
        let sign = value >= 0 ? "+" : ""
        return "\(sign)\(String(format: "%.2f", value))%"
    }

    private func format2(_ value: Double) -> String {
        String(format: "%.2f", value)
    }

    /// "2026-05-23" → "23 de mayo de 2026". Falls back to the raw
    /// string if parsing fails so we never show an empty field.
    private func formatLongDate(_ iso: String) -> String {
        let parser = DateFormatter()
        parser.calendar = Calendar(identifier: .iso8601)
        parser.locale = Locale(identifier: "en_US_POSIX")
        parser.timeZone = TimeZone(identifier: "UTC")
        parser.dateFormat = "yyyy-MM-dd"
        guard let date = parser.date(from: iso) else { return iso }
        let out = DateFormatter()
        out.locale = Locale(identifier: "es_MX")
        out.dateFormat = "d 'de' MMMM 'de' yyyy"
        return out.string(from: date)
    }
}
