import Foundation

/// One chronological pick entry. Matches `GET /api/picks → picks[]`.
struct Pick: Codable, Equatable, Identifiable {
    let pickNumber: Int
    let ticker: String
    let name: String
    let sector: String
    let region: String
    let country: String
    let priceAtPick: Double
    let currentPrice: Double
    let returnPct: Double
    let date: String
    let type: String
    let cycleNumber: Int?
    let researchUrl: String?

    var id: Int { pickNumber }
}

struct PicksResponse: Codable, Equatable {
    let picks: [Pick]
    let isSubscribed: Bool
}
