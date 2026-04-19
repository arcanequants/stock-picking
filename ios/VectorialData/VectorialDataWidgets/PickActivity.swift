import ActivityKit
import SwiftUI
import WidgetKit

struct PickLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: PickActivityAttributes.self) { context in
            // Lock Screen / banner
            PickLockScreenView(
                attributes: context.attributes,
                state: context.state
            )
            .activityBackgroundTint(Color.black)
            .activitySystemActionForegroundColor(.white)
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("#\(context.attributes.pickNumber)")
                            .font(.caption2.weight(.semibold))
                            .foregroundStyle(.secondary)
                        Text(context.attributes.ticker)
                            .font(.headline)
                    }
                }
                DynamicIslandExpandedRegion(.trailing) {
                    Text(formatPct(context.state.returnPct))
                        .font(.title3.weight(.bold))
                        .foregroundStyle(colorFor(context.state.returnPct))
                }
                DynamicIslandExpandedRegion(.bottom) {
                    HStack {
                        Text(context.attributes.name)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                        Spacer()
                        Text("Updated \(relative(context.state.updatedAt))")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                }
            } compactLeading: {
                Text(context.attributes.ticker)
                    .font(.caption2.weight(.semibold))
            } compactTrailing: {
                Text(formatPct(context.state.returnPct))
                    .font(.caption2.weight(.semibold))
                    .foregroundStyle(colorFor(context.state.returnPct))
            } minimal: {
                Text(formatPct(context.state.returnPct))
                    .font(.caption2.weight(.bold))
                    .foregroundStyle(colorFor(context.state.returnPct))
            }
        }
    }
}

private struct PickLockScreenView: View {
    let attributes: PickActivityAttributes
    let state: PickActivityAttributes.ContentState

    var body: some View {
        HStack(spacing: 16) {
            VStack(alignment: .leading, spacing: 4) {
                HStack(spacing: 6) {
                    Image("OwlMark")
                        .resizable()
                        .scaledToFit()
                        .frame(width: 18, height: 18)
                    Text("Pick #\(attributes.pickNumber)")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(.secondary)
                }
                Text(attributes.ticker)
                    .font(.title2.weight(.bold))
                    .foregroundStyle(.white)
                Text(attributes.name)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
            }
            Spacer()
            VStack(alignment: .trailing, spacing: 4) {
                Text(formatPct(state.returnPct))
                    .font(.system(size: 28, weight: .bold, design: .rounded))
                    .foregroundStyle(colorFor(state.returnPct))
                Text("$\(String(format: "%.2f", state.currentPrice))")
                    .font(.caption.weight(.medium))
                    .foregroundStyle(.secondary)
            }
        }
        .padding(.horizontal, 18)
        .padding(.vertical, 14)
    }
}

private func formatPct(_ v: Double) -> String {
    let sign = v >= 0 ? "+" : ""
    return "\(sign)\(String(format: "%.2f", v))%"
}

private func colorFor(_ v: Double) -> Color {
    v >= 0 ? Color(red: 0.13, green: 0.71, blue: 0.48) : Color(red: 0.93, green: 0.27, blue: 0.27)
}

private func relative(_ date: Date) -> String {
    let f = RelativeDateTimeFormatter()
    f.unitsStyle = .abbreviated
    return f.localizedString(for: date, relativeTo: Date())
}
