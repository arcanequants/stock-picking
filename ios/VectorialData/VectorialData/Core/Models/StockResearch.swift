import Foundation

/// Full research payload for a single pick. Matches
/// `GET /api/picks/research/:ticker`.
///
/// When `locked == true` (non-subscribed users), only the base identification
/// fields + `summaryShort` are populated. Subscribed users get every field.
struct StockResearch: Codable, Equatable, Identifiable {
    let ticker: String
    let name: String
    let sector: String
    let industry: String
    let country: String
    let region: String
    let currency: String
    let summaryShort: String
    let pickNumber: Int?
    let pickDate: String?
    let isSubscribed: Bool
    let locked: Bool

    let summaryWhat: String?
    let summaryWhy: String?
    let summaryRisk: String?
    let peRatio: Double?
    let peForward: Double?
    let dividendYield: Double?
    let marketCapB: Double?
    let analystConsensus: String?
    let analystTarget: Double?
    let analystUpside: Double?
    let waMessage: String?

    var id: String { ticker }
}
