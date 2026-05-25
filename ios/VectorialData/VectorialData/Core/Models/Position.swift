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
    /// Personal view only. Number of pre-Vectorial holdings the user
    /// recorded for this ticker. Zero for model view.
    let priorCount: Int?
    /// Personal view only. True when at least one prior holding contributes
    /// to this aggregated position.
    let hasPrior: Bool?
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

    enum CodingKeys: String, CodingKey {
        case ticker, name, buys, priorCount, hasPrior
        case totalInvested, totalShares, avgPrice, currentPrice, returnPct
        case firstBought, lastBought, daysHeld
        case sector, region, country, dividendYield
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.ticker = try c.decode(String.self, forKey: .ticker)
        self.name = try c.decode(String.self, forKey: .name)
        self.buys = try c.decode(Int.self, forKey: .buys)
        self.priorCount = try c.decodeIfPresent(Int.self, forKey: .priorCount)
        self.hasPrior = try c.decodeIfPresent(Bool.self, forKey: .hasPrior)
        self.totalInvested = try c.decode(Double.self, forKey: .totalInvested)
        self.totalShares = try c.decode(Double.self, forKey: .totalShares)
        self.avgPrice = try c.decode(Double.self, forKey: .avgPrice)
        self.currentPrice = try c.decode(Double.self, forKey: .currentPrice)
        self.returnPct = try c.decode(Double.self, forKey: .returnPct)
        self.firstBought = try c.decode(String.self, forKey: .firstBought)
        self.lastBought = try c.decode(String.self, forKey: .lastBought)
        self.daysHeld = try c.decode(Int.self, forKey: .daysHeld)
        self.sector = try c.decodeIfPresent(String.self, forKey: .sector)
        self.region = try c.decodeIfPresent(String.self, forKey: .region)
        self.country = try c.decodeIfPresent(String.self, forKey: .country)
        self.dividendYield = try c.decodeIfPresent(Double.self, forKey: .dividendYield)
    }
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
