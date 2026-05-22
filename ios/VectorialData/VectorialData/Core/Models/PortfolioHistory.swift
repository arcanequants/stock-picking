import Foundation

/// One data point for the performance chart. Matches entries in
/// `GET /api/portfolio/history`.
///
/// `spyReturnPct` is optional because early snapshots (before S&P tracking
/// was added) don't have the field.
struct PortfolioHistoryPoint: Codable, Equatable, Identifiable {
    let date: String
    let returnPct: Double
    let spyReturnPct: Double?
    /// Only present when the chart is loaded with `?view=personal` AND the
    /// authed user had at least one bought pick on or before this date.
    let personalReturnPct: Double?

    var id: String { date }

    /// Parses `date` (YYYY-MM-DD) into a `Date` in UTC, or nil if malformed.
    var parsedDate: Date? {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withFullDate]
        return formatter.date(from: date)
    }
}
