import Foundation

/// One curated app-only news item. Matches `GET /api/news → news[]`.
/// The website intentionally has no equivalent — web has its own
/// AI/SEO-oriented news scheme. This is the human-curated channel.
struct NewsItem: Codable, Identifiable, Equatable, Hashable {
    let id: UUID
    let headline: String
    let body: String
    let linkUrl: String?
    /// "all" | "premium" — premium items are hidden server-side for
    /// non-subscribers, so the app only ever receives ones it can show.
    let audience: String
    let publishedAt: String

    // No CodingKeys overrides: the shared APIClient JSONDecoder uses
    // `.convertFromSnakeCase`, so `link_url`/`published_at` become
    // `linkUrl`/`publishedAt` automatically. Adding explicit raw values
    // here would double-translate and silently break decoding.

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
}
