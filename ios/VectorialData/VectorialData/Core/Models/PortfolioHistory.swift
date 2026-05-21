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

    var id: String { date }

    /// Parses `date` (YYYY-MM-DD) into a `Date` in UTC, or nil if malformed.
    var parsedDate: Date? {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withFullDate]
        return formatter.date(from: date)
    }
}
