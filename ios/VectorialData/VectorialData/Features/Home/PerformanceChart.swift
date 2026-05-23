import SwiftUI
import Charts

@MainActor
final class PerformanceChartViewModel: ObservableObject {
    @Published var history: [PortfolioHistoryPoint] = []
    @Published var errorMessage: String?
    @Published var isLoading = false

    /// True once we've loaded a personal series that has at least one data
    /// point with a personal return. When false the chart falls back to the
    /// Vectorial-vs-S&P view.
    var hasPersonalSeries: Bool {
        history.contains { $0.personalReturnPct != nil }
    }

    func load(authed: Bool) async {
        isLoading = true
        defer { isLoading = false }
        let path = authed ? "/api/portfolio/history?view=personal" : "/api/portfolio/history"
        do {
            history = try await APIClient.shared.get(
                path,
                as: [PortfolioHistoryPoint].self
            )
            errorMessage = nil
        } catch {
            // Personal view fails (expired session, etc.) → silently fall
            // back to the unauthed series so the chart still renders.
            if authed {
                do {
                    history = try await APIClient.shared.get(
                        "/api/portfolio/history",
                        as: [PortfolioHistoryPoint].self
                    )
                    errorMessage = nil
                    return
                } catch {
                    errorMessage = error.localizedDescription
                }
            } else {
                errorMessage = error.localizedDescription
            }
        }
    }
}

struct PerformanceChart: View {
    @EnvironmentObject private var auth: AuthManager
    @StateObject private var vm = PerformanceChartViewModel()

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            header
            chart
            footer
            disclaimer
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color("CardBackground"))
        .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
        .task(id: auth.currentUser?.email ?? "") {
            await vm.load(authed: auth.currentUser != nil)
        }
    }

    private var header: some View {
        HStack(alignment: .firstTextBaseline) {
            Text("PORTFOLIO PERFORMANCE")
                .font(.caption.weight(.semibold))
                .tracking(1.2)
                .foregroundStyle(.white.opacity(0.55))
            Spacer()
            legend
        }
    }

    @ViewBuilder private var legend: some View {
        if vm.hasPersonalSeries, let personal = latestPersonal, let vectorial = latestVectorial {
            HStack(spacing: 10) {
                legendDot(color: Color("BrandEmerald"), text: "Mío \(formatPct(personal))")
                legendDot(color: .white.opacity(0.5), text: "Vectorial \(formatPct(vectorial))", dashed: true)
            }
        } else if let vectorial = latestVectorial, let spy = latestSpy {
            HStack(spacing: 10) {
                legendDot(color: Color("BrandEmerald"), text: "Vectorial \(formatPct(vectorial))")
                legendDot(color: .white.opacity(0.5), text: "S&P \(formatPct(spy))", dashed: true)
            }
        }
    }

    @ViewBuilder private var chart: some View {
        if vm.isLoading && vm.history.isEmpty {
            ProgressView()
                .frame(height: 200)
                .frame(maxWidth: .infinity)
        } else if vm.history.isEmpty {
            Text("No data yet")
                .font(.footnote)
                .foregroundStyle(.white.opacity(0.5))
                .frame(height: 200)
                .frame(maxWidth: .infinity)
        } else if vm.hasPersonalSeries {
            personalChart
        } else {
            vectorialChart
        }
    }

    /// Only the days where the user actually had bought positions. Used to
    /// keep the Mío series contiguous so a 1- or 2-point ramp still renders.
    private var personalPoints: [PortfolioHistoryPoint] {
        vm.history.filter { $0.personalReturnPct != nil }
    }

    private var personalChart: some View {
        Chart {
            ForEach(personalPoints) { point in
                if let date = point.parsedDate, let personal = point.personalReturnPct {
                    LineMark(
                        x: .value("Date", date),
                        y: .value("Mío", personal),
                        series: .value("Series", "Mío")
                    )
                    .foregroundStyle(Color("BrandEmerald"))
                    .interpolationMethod(.linear)
                    .lineStyle(StrokeStyle(lineWidth: 2.4))
                    .symbol {
                        Circle()
                            .fill(Color("BrandEmerald"))
                            .frame(width: 5, height: 5)
                    }
                }
            }
            ForEach(vm.history) { point in
                if let date = point.parsedDate {
                    LineMark(
                        x: .value("Date", date),
                        y: .value("Vectorial", point.returnPct),
                        series: .value("Series", "Vectorial")
                    )
                    .foregroundStyle(.white.opacity(0.55))
                    .interpolationMethod(.catmullRom)
                    .lineStyle(StrokeStyle(lineWidth: 1.5, dash: [4, 3]))
                }
            }
            RuleMark(y: .value("Zero", 0))
                .foregroundStyle(.white.opacity(0.15))
                .lineStyle(StrokeStyle(lineWidth: 0.5, dash: [2, 3]))
        }
        .chartYAxis { yAxisMarks }
        .chartXAxis { xAxisMarks }
        .frame(height: 200)
    }

    private var vectorialChart: some View {
        Chart {
            ForEach(vm.history) { point in
                if let date = point.parsedDate {
                    LineMark(
                        x: .value("Date", date),
                        y: .value("Vectorial", point.returnPct),
                        series: .value("Series", "Vectorial")
                    )
                    .foregroundStyle(Color("BrandEmerald"))
                    .interpolationMethod(.catmullRom)
                    .lineStyle(StrokeStyle(lineWidth: 2.2))
                }
            }
            ForEach(vm.history) { point in
                if let date = point.parsedDate, let spy = point.spyReturnPct {
                    LineMark(
                        x: .value("Date", date),
                        y: .value("S&P 500", spy),
                        series: .value("Series", "S&P 500")
                    )
                    .foregroundStyle(.white.opacity(0.5))
                    .interpolationMethod(.catmullRom)
                    .lineStyle(StrokeStyle(lineWidth: 1.5, dash: [4, 3]))
                }
            }
            RuleMark(y: .value("Zero", 0))
                .foregroundStyle(.white.opacity(0.15))
                .lineStyle(StrokeStyle(lineWidth: 0.5, dash: [2, 3]))
        }
        .chartYAxis { yAxisMarks }
        .chartXAxis { xAxisMarks }
        .frame(height: 200)
    }

    @AxisContentBuilder private var yAxisMarks: some AxisContent {
        AxisMarks(position: .leading) { value in
            AxisGridLine().foregroundStyle(.white.opacity(0.08))
            AxisValueLabel {
                if let v = value.as(Double.self) {
                    Text("\(Int(v))%")
                        .font(.caption2)
                        .foregroundStyle(.white.opacity(0.5))
                }
            }
        }
    }

    @AxisContentBuilder private var xAxisMarks: some AxisContent {
        AxisMarks(values: .stride(by: .day, count: 7)) { value in
            AxisGridLine().foregroundStyle(.white.opacity(0.05))
            AxisValueLabel {
                if let date = value.as(Date.self) {
                    Text(date, format: .dateTime.month(.abbreviated).day())
                        .font(.caption2)
                        .foregroundStyle(.white.opacity(0.45))
                }
            }
        }
    }

    @ViewBuilder private var footer: some View {
        if vm.hasPersonalSeries, let personal = latestPersonal, let vectorial = latestVectorial {
            let diff = personal - vectorial
            let sign = diff >= 0 ? "+" : ""
            Text("Tu portafolio is \(sign)\(String(format: "%.2f", diff))% vs Vectorial")
                .font(.footnote.weight(.semibold))
                .foregroundStyle(diff >= 0 ? Color("BrandEmerald") : .red)
        } else if let vectorial = latestVectorial, let spy = latestSpy {
            let diff = vectorial - spy
            let sign = diff >= 0 ? "+" : ""
            Text("Vectorial is \(sign)\(String(format: "%.2f", diff))% above the S&P 500")
                .font(.footnote.weight(.semibold))
                .foregroundStyle(diff >= 0 ? Color("BrandEmerald") : .red)
        }
    }

    private var disclaimer: some View {
        Text(vm.hasPersonalSeries
            ? "Tu performance se calcula con los precios y montos que marcaste al comprar."
            : "Past performance does not guarantee future results. S&P 500 is shown as a reference, not a guarantee.")
            .font(.caption2)
            .foregroundStyle(.white.opacity(0.4))
            .fixedSize(horizontal: false, vertical: true)
    }

    private func legendDot(color: Color, text: String, dashed: Bool = false) -> some View {
        HStack(spacing: 4) {
            if dashed {
                Rectangle()
                    .fill(color)
                    .frame(width: 12, height: 2)
            } else {
                Circle()
                    .fill(color)
                    .frame(width: 7, height: 7)
            }
            Text(text)
                .font(.caption2.weight(.medium))
                .foregroundStyle(.white.opacity(0.85))
        }
    }

    private var latestVectorial: Double? { vm.history.last?.returnPct }
    private var latestSpy: Double? { vm.history.last(where: { $0.spyReturnPct != nil })?.spyReturnPct }
    private var latestPersonal: Double? { vm.history.last(where: { $0.personalReturnPct != nil })?.personalReturnPct }

    private func formatPct(_ value: Double) -> String {
        let sign = value >= 0 ? "+" : ""
        return "\(sign)\(String(format: "%.2f", value))%"
    }
}
