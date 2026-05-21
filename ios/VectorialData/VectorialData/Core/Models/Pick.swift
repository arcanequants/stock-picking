import Foundation

/// What the user did with a pick. `pending` is the implicit default — any
/// pick the user has not acted on is pending.
enum PickStatus: String, Codable, Equatable {
    case pending
    case bought
    case skipped
}

/// One chronological pick entry. Matches `GET /api/picks → picks[]`.
struct Pick: Codable, Identifiable {
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

    // Per-user decision fields — present once the user marks the pick.
    var status: PickStatus
    var buyPrice: Double?
    var amountInvested: Double?
    var decidedAt: String?

    var id: Int { pickNumber }

    enum CodingKeys: String, CodingKey {
        case pickNumber, ticker, name, sector, region, country
        case priceAtPick, currentPrice, returnPct
        case date, type, cycleNumber, researchUrl
        case status, buyPrice, amountInvested, decidedAt
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.pickNumber = try c.decode(Int.self, forKey: .pickNumber)
        self.ticker = try c.decode(String.self, forKey: .ticker)
        self.name = try c.decode(String.self, forKey: .name)
        self.sector = try c.decode(String.self, forKey: .sector)
        self.region = try c.decode(String.self, forKey: .region)
        self.country = try c.decode(String.self, forKey: .country)
        self.priceAtPick = try c.decode(Double.self, forKey: .priceAtPick)
        self.currentPrice = try c.decode(Double.self, forKey: .currentPrice)
        self.returnPct = try c.decode(Double.self, forKey: .returnPct)
        self.date = try c.decode(String.self, forKey: .date)
        self.type = try c.decode(String.self, forKey: .type)
        self.cycleNumber = try c.decodeIfPresent(Int.self, forKey: .cycleNumber)
        self.researchUrl = try c.decodeIfPresent(String.self, forKey: .researchUrl)
        self.status = try c.decodeIfPresent(PickStatus.self, forKey: .status) ?? .pending
        self.buyPrice = try c.decodeIfPresent(Double.self, forKey: .buyPrice)
        self.amountInvested = try c.decodeIfPresent(Double.self, forKey: .amountInvested)
        self.decidedAt = try c.decodeIfPresent(String.self, forKey: .decidedAt)
    }
}

extension Pick: Hashable {
    /// Identity is the pick_number. NavigationStack would otherwise treat
    /// "same pick, freshly-updated status" as a brand-new destination.
    static func == (lhs: Pick, rhs: Pick) -> Bool {
        lhs.pickNumber == rhs.pickNumber
    }

    func hash(into hasher: inout Hasher) {
        hasher.combine(pickNumber)
    }
}

struct PicksResponse: Codable, Equatable {
    let picks: [Pick]
    let isSubscribed: Bool
    let defaultInvestment: Double?

    enum CodingKeys: String, CodingKey {
        case picks, isSubscribed, defaultInvestment
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        self.picks = try c.decode([Pick].self, forKey: .picks)
        self.isSubscribed = try c.decode(Bool.self, forKey: .isSubscribed)
        self.defaultInvestment = try c.decodeIfPresent(Double.self, forKey: .defaultInvestment)
    }

    static func == (lhs: PicksResponse, rhs: PicksResponse) -> Bool {
        lhs.picks.map(\.pickNumber) == rhs.picks.map(\.pickNumber)
            && lhs.isSubscribed == rhs.isSubscribed
            && lhs.defaultInvestment == rhs.defaultInvestment
    }
}
