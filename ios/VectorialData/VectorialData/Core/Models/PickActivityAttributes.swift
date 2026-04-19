import ActivityKit
import Foundation

/// Compiled into both the main app and the widget extension so ActivityKit
/// can encode the payload on one side and decode it on the other.
///
/// Static attributes are set once when the activity starts (pick metadata).
/// ContentState is the mutable live snapshot — re-sent each time the app
/// updates the activity.
struct PickActivityAttributes: ActivityAttributes {
    struct ContentState: Codable, Hashable {
        let currentPrice: Double
        let returnPct: Double
        let updatedAt: Date
    }

    let pickNumber: Int
    let ticker: String
    let name: String
    let entryPrice: Double
    let startedAt: Date
}
