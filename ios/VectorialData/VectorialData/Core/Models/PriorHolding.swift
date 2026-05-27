import Foundation

/// One pre-Vectorial position the user manually recorded. Matches
/// `GET /api/prior-holdings → holdings[]`. Ticker is always a Vectorial
/// pick (server validates against `src/data/stocks.ts`).
struct PriorHolding: Codable, Identifiable, Equatable {
    let id: Int
    let ticker: String
    let name: String
    let purchaseDate: String
    let buyPrice: Double
    let amountInvested: Double
    let shares: Double
    let createdAt: String?
}

struct PriorHoldingsResponse: Codable {
    let holdings: [PriorHolding]
}

struct PriorHoldingResponse: Codable {
    let holding: PriorHolding
}

/// One row in the Vectorial ticker universe picker.
/// Matches `GET /api/picks/universe → tickers[]`.
struct TickerOption: Codable, Identifiable, Hashable {
    let ticker: String
    let name: String
    let sector: String?
    let region: String?

    var id: String { ticker }
}

struct TickerUniverseResponse: Codable {
    let tickers: [TickerOption]
}
