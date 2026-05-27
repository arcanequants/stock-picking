import Foundation

/// Single source of truth for picks + per-user decisions. Owns the
/// `[Pick]` array that PicksView, PickDetailView, and the weekly digest
/// all render from. Mutations (mark bought / skipped / pending) round-trip
/// through the backend and refresh the local copy on success.
///
/// PortfolioViewModel observes `lastDecisionAt` to know when to refetch the
/// personal portfolio view.
@MainActor
final class PickStatusStore: ObservableObject {
    static let shared = PickStatusStore()

    @Published private(set) var picks: [Pick] = []
    @Published private(set) var defaultInvestment: Double?
    @Published private(set) var isSubscribed: Bool = false
    @Published private(set) var isLoading: Bool = false
    @Published private(set) var errorMessage: String?
    /// Picks dated before this don't surface in the main feed.
    @Published private(set) var accessStartedAt: String?

    /// Bumped every time a decision lands. PortfolioViewModel observes this
    /// and refetches the personal view when it changes.
    @Published private(set) var lastDecisionAt: Date?

    private init() {}

    func load() async {
        isLoading = true
        defer { isLoading = false }
        do {
            let resp = try await APIClient.shared.get(
                "/api/picks",
                as: PicksResponse.self
            )
            self.picks = resp.picks
            self.defaultInvestment = resp.defaultInvestment
            self.isSubscribed = resp.isSubscribed
            self.accessStartedAt = resp.accessStartedAt
            self.errorMessage = nil
        } catch APIError.unauthorized {
            errorMessage = "Please sign in again"
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    /// Mark a pick as bought. If `saveAsDefault` is true, the amount is
    /// persisted as the user's `default_investment` on the subscribers row.
    @discardableResult
    func markBought(
        pickNumber: Int,
        buyPrice: Double,
        amount: Double,
        saveAsDefault: Bool
    ) async -> Bool {
        struct Body: Encodable {
            let status: String
            let buyPrice: Double
            let amountInvested: Double
            let saveAsDefault: Bool
        }
        let body = Body(
            status: "bought",
            buyPrice: buyPrice,
            amountInvested: amount,
            saveAsDefault: saveAsDefault
        )
        return await postDecision(pickNumber: pickNumber, body: body)
    }

    @discardableResult
    func markSkipped(pickNumber: Int) async -> Bool {
        struct Body: Encodable {
            let status: String
        }
        return await postDecision(pickNumber: pickNumber, body: Body(status: "skipped"))
    }

    /// Set or clear the user's default "monto por pick". Pass `nil` to clear
    /// so the next bought-pick sheet starts fresh.
    @discardableResult
    func updateDefaultInvestment(_ amount: Double?) async -> Bool {
        struct Body: Encodable { let amount: Double? }
        struct Resp: Decodable {
            let ok: Bool?
            let defaultInvestment: Double?
        }
        do {
            let resp = try await APIClient.shared.post(
                "/api/me/default-investment",
                body: Body(amount: amount),
                as: Resp.self
            )
            self.defaultInvestment = resp.defaultInvestment
            return true
        } catch {
            errorMessage = error.localizedDescription
            return false
        }
    }

    @discardableResult
    func markPending(pickNumber: Int) async -> Bool {
        struct Empty: Encodable {}
        do {
            let _ = try await APIClient.shared.delete(
                "/api/picks/\(pickNumber)/decision",
                body: Empty(),
                as: DecisionResponse.self
            )
            updateLocal(pickNumber: pickNumber, status: .pending, buyPrice: nil, amount: nil)
            lastDecisionAt = Date()
            return true
        } catch {
            errorMessage = error.localizedDescription
            return false
        }
    }

    private func postDecision<B: Encodable>(pickNumber: Int, body: B) async -> Bool {
        do {
            let resp = try await APIClient.shared.post(
                "/api/picks/\(pickNumber)/decision",
                body: body,
                as: DecisionResponse.self
            )
            updateLocal(
                pickNumber: pickNumber,
                status: PickStatus(rawValue: resp.status) ?? .pending,
                buyPrice: resp.buyPrice,
                amount: resp.amountInvested
            )
            if let newDefault = resp.defaultInvestment {
                self.defaultInvestment = newDefault
            }
            lastDecisionAt = Date()
            return true
        } catch {
            errorMessage = error.localizedDescription
            return false
        }
    }

    private func updateLocal(
        pickNumber: Int,
        status: PickStatus,
        buyPrice: Double?,
        amount: Double?
    ) {
        guard let idx = picks.firstIndex(where: { $0.pickNumber == pickNumber }) else { return }
        picks[idx].status = status
        picks[idx].buyPrice = buyPrice
        picks[idx].amountInvested = amount
        picks[idx].decidedAt = ISO8601DateFormatter().string(from: Date())
    }

    // MARK: - Derived collections

    var pending: [Pick] {
        picks.filter { $0.status == .pending }
    }

    var bought: [Pick] {
        picks.filter { $0.status == .bought }
    }

    var skipped: [Pick] {
        picks.filter { $0.status == .skipped }
    }

    /// Newest-first list of every pick that has a decision attached, for the
    /// "Historial" section. Decided picks first; among them, most recent first.
    var historial: [Pick] {
        picks
            .filter { $0.status != .pending }
            .sorted { ($0.decidedAt ?? "") > ($1.decidedAt ?? "") }
    }
}

private struct DecisionResponse: Decodable {
    let ok: Bool?
    let pickNumber: Int
    let status: String
    let buyPrice: Double?
    let amountInvested: Double?
    let defaultInvestment: Double?
}
