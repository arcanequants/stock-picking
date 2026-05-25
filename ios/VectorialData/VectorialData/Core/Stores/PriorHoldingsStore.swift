import Foundation

/// User-recorded positions that pre-date Vectorial. Backs the
/// "Posiciones anteriores" screen in Account. The personal portfolio
/// view aggregates these into each ticker so the user's total position
/// size + weighted avg buy price reflect their real holdings.
@MainActor
final class PriorHoldingsStore: ObservableObject {
    static let shared = PriorHoldingsStore()

    @Published private(set) var holdings: [PriorHolding] = []
    @Published private(set) var isLoading: Bool = false
    @Published var errorMessage: String?

    /// Bumped every time a holding is added or removed. Other stores
    /// (portfolio) can observe this to know when to refetch.
    @Published private(set) var lastChangedAt: Date?

    private init() {}

    func load() async {
        isLoading = true
        defer { isLoading = false }
        do {
            let resp = try await APIClient.shared.get(
                "/api/prior-holdings",
                as: PriorHoldingsResponse.self
            )
            self.holdings = resp.holdings
            self.errorMessage = nil
        } catch APIError.unauthorized {
            errorMessage = "Inicia sesión otra vez."
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    /// Returns the new holding on success, or nil with `errorMessage` set.
    @discardableResult
    func add(
        ticker: String,
        purchaseDate: String,
        buyPrice: Double,
        amountInvested: Double
    ) async -> PriorHolding? {
        struct Body: Encodable {
            let ticker: String
            let purchaseDate: String
            let buyPrice: Double
            let amountInvested: Double
        }
        let body = Body(
            ticker: ticker,
            purchaseDate: purchaseDate,
            buyPrice: buyPrice,
            amountInvested: amountInvested
        )
        do {
            let resp = try await APIClient.shared.post(
                "/api/prior-holdings",
                body: body,
                as: PriorHoldingResponse.self
            )
            self.holdings.insert(resp.holding, at: 0)
            self.lastChangedAt = Date()
            self.errorMessage = nil
            return resp.holding
        } catch APIError.server(_, let data) {
            errorMessage = parseError(data: data) ?? "No se pudo guardar."
            return nil
        } catch APIError.unauthorized {
            errorMessage = "Inicia sesión otra vez."
            return nil
        } catch {
            errorMessage = error.localizedDescription
            return nil
        }
    }

    @discardableResult
    func remove(id: Int) async -> Bool {
        struct Empty: Encodable {}
        struct OK: Decodable { let ok: Bool? }
        do {
            let _ = try await APIClient.shared.delete(
                "/api/prior-holdings/\(id)",
                body: Empty(),
                as: OK.self
            )
            self.holdings.removeAll { $0.id == id }
            self.lastChangedAt = Date()
            return true
        } catch {
            errorMessage = error.localizedDescription
            return false
        }
    }

    private func parseError(data: Data) -> String? {
        struct Err: Decodable {
            let error: String?
            let message: String?
        }
        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        if let err = try? decoder.decode(Err.self, from: data) {
            return err.message ?? humanize(err.error)
        }
        return nil
    }

    private func humanize(_ code: String?) -> String? {
        switch code {
        case "missing_ticker": return "Falta el ticker."
        case "invalid_date": return "Fecha inválida."
        case "future_date": return "La fecha no puede ser en el futuro."
        case "invalid_buy_price": return "Precio inválido."
        case "invalid_amount": return "Monto inválido."
        case "ticker_not_in_vectorial":
            return "Solo puedes agregar tickers que son picks de Vectorial."
        default: return code
        }
    }
}
