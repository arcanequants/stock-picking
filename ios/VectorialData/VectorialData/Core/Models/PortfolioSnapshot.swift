import Foundation

/// Matches `GET /api/portfolio/snapshot` — small, public payload designed
/// for Home tab, widgets, and Live Activities.
struct PortfolioSnapshot: Codable, Equatable {
    let totalReturnPct: Double
    let totalPositions: Int
    let since: String?
    let best: Position?
    let worst: Position?
    let latestPick: LatestPick?
    let marketStatus: MarketStatus
    let asOf: String

    struct Position: Codable, Equatable {
        let ticker: String
        let returnPct: Double
    }

    struct LatestPick: Codable, Equatable {
        let pickNumber: Int
        let ticker: String
        let name: String
        let date: String
        let returnPct: Double
    }
}

enum MarketStatus: String, Codable, Equatable {
    case open
    case pre
    case post
    case closed
    case weekend
    case holiday

    /// Fallback for unknown server values — treat as closed rather than crash.
    init(from decoder: Decoder) throws {
        let raw = try decoder.singleValueContainer().decode(String.self)
        self = MarketStatus(rawValue: raw) ?? .closed
    }
}
