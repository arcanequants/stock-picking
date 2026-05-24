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
    /// One human sentence — server-side compacted from `summary_short`,
    /// markdown stripped, enumerations cut. Render verbatim.
    let oneLiner: String?
    let pickNumber: Int?
    let pickDate: String?
    let isSubscribed: Bool
    let locked: Bool

    let summaryWhat: String?
    let summaryWhy: String?
    let summaryRisk: String?
    /// Mom-readable short paragraphs (~280 chars). Server-side compacted
    /// — render verbatim, no client parsing.
    let whyShort: String?
    let riskShort: String?
    /// "LO IMPORTANTE" pills — 3 plain-language vital signs replacing
    /// the old DATOS CLAVE (P/E ratio etc.). Server-built so the UI
    /// stays jargon-free.
    let whatsImportant: [WhatsImportantPill]?
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

struct WhatsImportantPill: Codable, Equatable, Hashable {
    /// SF Symbol name (e.g. "dollarsign.circle.fill"). Native rendering
    /// dodges the emoji-tofu the Simulator showed when these were
    /// emoji code points.
    let icon: String
    /// Backend-suggested color bucket; the iOS layer maps to brand
    /// palette. Unknown values fall back to neutral white.
    let tint: String
    let text: String
}
