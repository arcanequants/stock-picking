import Foundation
import SwiftUI

/// One curated app-only news item. Matches `GET /api/news → news[]`.
/// The website intentionally has no equivalent — web has its own
/// AI/SEO-oriented news scheme. This is the human-curated channel.
struct GlossaryTerm: Codable, Equatable, Hashable, Identifiable {
    let term: String
    let def: String
    var id: String { term }
}

struct NewsItem: Codable, Identifiable, Equatable, Hashable {
    let id: UUID
    let headline: String
    let body: String
    let linkUrl: String?
    /// "all" | "premium" — premium items are hidden server-side for
    /// non-subscribers, so the app only ever receives ones it can show.
    let audience: String
    let publishedAt: String

    // --- "explainer de 60 segundos" enrichment (server-side at ingest) ---
    /// "picks" | "companies" | "economy" | "politics" | "markets"
    let topic: String?
    /// e.g. ["us","global"] — drives the flag chips.
    let regions: [String]?
    /// Tickers this news materially affects (for the "afecta a X" hint).
    let tickers: [String]?
    /// The 4 explainer blocks. Nil on legacy rows → falls back to `body`.
    let blockWhat: String?
    let blockWhy: String?
    let blockYou: String?
    let blockTell: String?
    let glossary: [GlossaryTerm]?

    // No CodingKeys overrides: the shared APIClient JSONDecoder uses
    // `.convertFromSnakeCase`, so `link_url`/`published_at`/`block_what`
    // become `linkUrl`/`publishedAt`/`blockWhat` automatically. Adding
    // explicit raw values here would double-translate and break decoding.

    /// True when the server produced the 4-block explainer for this item.
    var hasExplainer: Bool {
        [blockWhat, blockWhy, blockYou, blockTell].allSatisfy { ($0?.isEmpty == false) }
    }

    /// True for items published while the user was offline / asleep —
    /// drives the unread dot in the list and the badge count on the
    /// Home card. `lastReadAt` is stored per-device in `@AppStorage`.
    func isUnread(relativeTo lastReadAt: Date?) -> Bool {
        guard let lastReadAt else { return true }
        guard let published = NewsItem.parseISO(publishedAt) else { return false }
        return published > lastReadAt
    }

    static func parseISO(_ s: String) -> Date? {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let d = f.date(from: s) { return d }
        f.formatOptions = [.withInternetDateTime]
        return f.date(from: s)
    }
}

struct NewsListResponse: Codable {
    let news: [NewsItem]
    /// Whether the per-news AI chat is available to this user (premium/trial).
    let chatEnabled: Bool?
}

/// Topic + region display metadata: emoji, localized label, accent color key.
enum NewsTaxonomy {
    /// Order defines the filter-chip order in the feed.
    static let topics: [(id: String, emoji: String, key: LocalizedStringKey)] = [
        ("picks", "📈", "Mis picks"),
        ("companies", "🏢", "Empresas"),
        ("economy", "🌍", "Economía"),
        ("politics", "🏛️", "Política"),
        ("markets", "💱", "Mercados"),
    ]

    static let regionFlags: [String: String] = [
        "global": "🌍", "us": "🇺🇸", "mx": "🇲🇽", "br": "🇧🇷",
        "in": "🇮🇳", "eu": "🇪🇺", "asia": "🌏",
    ]

    static func topicLabel(_ id: String?) -> LocalizedStringKey {
        topics.first(where: { $0.id == id })?.key ?? "Mercados"
    }

    static func topicEmoji(_ id: String?) -> String {
        topics.first(where: { $0.id == id })?.emoji ?? "💱"
    }

    static func regionFlag(_ id: String) -> String {
        regionFlags[id] ?? "🌍"
    }
}
