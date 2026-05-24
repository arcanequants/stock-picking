import SwiftUI
import Charts

@MainActor
final class PerformanceChartViewModel: ObservableObject {
    @Published var history: [PortfolioHistoryPoint] = []
    @Published var errorMessage: String?
    @Published var isLoading = false

    func load() async {
        isLoading = true
        defer { isLoading = false }
        do {
            history = try await APIClient.shared.get(
                "/api/portfolio/history",
                as: [PortfolioHistoryPoint].self
            )
            errorMessage = nil
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

struct PerformanceChart: View {
    @StateObject private var vm = PerformanceChartViewModel()

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            header
            chart
            if let latestVectorial, let latestSpy {
                footer(vectorial: latestVectorial, spy: latestSpy)
            }
            disclaimer
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color("CardBackground"))
        .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
        .task { await vm.load() }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack(alignment: .center) {
                HStack(spacing: 8) {
                    Text("VD")
                        .font(.caption2.weight(.bold))
                        .foregroundStyle(Color.black)
                        .frame(width: 26, height: 26)
                        .background(Color("BrandEmerald"))
                        .clipShape(Circle())
                    VStack(alignment: .leading, spacing: 1) {
                        Text("VECTORIAL")
                            .font(.headline.weight(.bold))
                            .foregroundStyle(.white)
                        // Sub-label spells out "this is the public model, not
                        // your money" so users with two cards on the same
                        // screen stop confusing them at a glance.
                        Text("Modelo público · todas las picks")
                            .font(.caption2)
                            .foregroundStyle(.white.opacity(0.55))
                    }
                }
                Spacer()
                if let latestVectorial, let latestSpy {
                    HStack(spacing: 10) {
                        legendDot(color: Color("BrandEmerald"), text: "Vectorial \(formatPct(latestVectorial))")
                        legendDot(color: .white.opacity(0.5), text: "S&P \(formatPct(latestSpy))", dashed: true)
                    }
                }
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
        } else {
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
            .chartYAxis {
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
            .chartXAxis {
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
            .frame(height: 200)
        }
    }

    @ViewBuilder
    private func footer(vectorial: Double, spy: Double) -> some View {
        let diff = vectorial - spy
        let sign = diff >= 0 ? "+" : ""
        Text("Vectorial is \(sign)\(String(format: "%.2f", diff))% above the S&P 500")
            .font(.footnote.weight(.semibold))
            .foregroundStyle(Color("BrandEmerald"))
    }

    private var disclaimer: some View {
        Text("Past performance does not guarantee future results. S&P 500 is shown as a reference, not a guarantee.")
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

    private func formatPct(_ value: Double) -> String {
        let sign = value >= 0 ? "+" : ""
        return "\(sign)\(String(format: "%.2f", value))%"
    }
}
