import Foundation

/// Per-user dividend ledger. Backed by `/api/portfolio/dividends`.
///
/// Read once at app launch (and on pull-to-refresh / decision change). Cached
/// in memory so PickDetailView and PortfolioView both read instantly without
/// per-pick network calls.
@MainActor
final class DividendStore: ObservableObject {
    static let shared = DividendStore()

    @Published private(set) var ytdTotal: Double = 0
    @Published private(set) var allTimeTotal: Double = 0
    @Published private(set) var count: Int = 0
    @Published private(set) var companies: Int = 0
    @Published private(set) var events: [DividendEvent] = []
    @Published private(set) var byTicker: [String: Double] = [:]
    @Published private(set) var isLoading: Bool = false
    @Published private(set) var errorMessage: String?

    private init() {}

    func load() async {
        isLoading = true
        defer { isLoading = false }
        do {
            let resp = try await APIClient.shared.get(
                "/api/portfolio/dividends",
                as: DividendsResponse.self
            )
            self.ytdTotal = resp.ytdTotal
            self.allTimeTotal = resp.allTimeTotal
            self.count = resp.count
            self.companies = resp.companies
            self.events = resp.events
            self.byTicker = resp.byTicker
            self.errorMessage = nil
        } catch APIError.unauthorized {
            errorMessage = "Please sign in again"
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func eventsForPick(_ pickNumber: Int) -> [DividendEvent] {
        events.filter { $0.pickNumber == pickNumber }
    }

    func totalForPick(_ pickNumber: Int) -> Double {
        eventsForPick(pickNumber).reduce(0) { $0 + $1.totalAmount }
    }
}

struct DividendEvent: Codable, Identifiable, Equatable {
    let id: String
    let ticker: String
    let pickNumber: Int
    let exDate: String
    let payDate: String?
    let amountPerShare: Double
    let sharesHeld: Double
    let totalAmount: Double
}

private struct DividendsResponse: Decodable {
    let ytdTotal: Double
    let allTimeTotal: Double
    let count: Int
    let companies: Int
    let byTicker: [String: Double]
    let events: [DividendEvent]
}
