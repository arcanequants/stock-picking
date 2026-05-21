import Foundation

/// Matches entries in `GET /api/portfolio/positions → positions[]`.
///
/// Dollar-denominated fields (`totalInvested`, `avgPrice`, `currentPrice`)
/// are decoded but **must not be rendered** — the product rule is
/// percentages-only in the UI.
struct Position: Codable, Equatable, Hashable, Identifiable {
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
    let sector: String?
    let region: String?
    let country: String?
    let dividendYield: Double?

    var id: String { ticker }
}

struct AllocationBucket: Codable, Equatable, Identifiable {
    let name: String
    let count: Int
    let pct: Double

    var id: String { name }
}

/// Response envelope for `GET /api/portfolio/positions`.
struct PortfolioPositions: Codable, Equatable {
    let view: String?
    let positions: [Position]
    let totalReturnPct: Double
    let totalPositions: Int
    let avgDividendYield: Double?
    let sectorAllocation: [AllocationBucket]?
    let regionAllocation: [AllocationBucket]?
    let since: String?
}

enum PortfolioViewMode: String, CaseIterable, Identifiable {
    case model
    case personal

    var id: String { rawValue }

    var label: String {
        switch self {
        case .model: return "Model"
        case .personal: return "Mío"
        }
    }
}
