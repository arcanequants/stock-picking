import Foundation

/// Matches entries in `GET /api/portfolio/positions → positions[]`.
///
/// Dollar-denominated fields (`totalInvested`, `avgPrice`, `currentPrice`)
/// are decoded but **must not be rendered** — the product rule is
/// percentages-only in the UI.
struct Position: Codable, Equatable, Identifiable {
    let ticker: String
    let name: String
    let buys: Int
    let totalInvested: Double
    let totalShares: Double
    let avgPrice: Double
    let currentPrice: Double
    let returnPct: Double
    let firstBought: String
    let lastBought: String
    let daysHeld: Int

    var id: String { ticker }
}

/// Response envelope for `GET /api/portfolio/positions`.
struct PortfolioPositions: Codable, Equatable {
    let positions: [Position]
    let totalReturnPct: Double
    let totalPositions: Int
    let since: String?
}
