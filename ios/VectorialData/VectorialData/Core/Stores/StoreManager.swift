import Foundation
import StoreKit

/// StoreKit 2 driver for the single auto-renewable subscription
/// (`com.vectorialdata.app.premium.monthly`, $1/mo).
///
/// Flow: load the product → `purchase()` → StoreKit returns a verified
/// `Transaction` → we POST its `jwsRepresentation` to `/api/iap/verify`,
/// which writes `subscription_status='active'` on the subscriber row (the
/// same source of truth Stripe feeds). We then refresh the local stores so
/// the paywall disappears immediately.
///
/// Renewals/refunds arrive server-to-server via App Store Server
/// Notifications V2 (`/api/webhooks/apple`); the client only needs to react
/// to the unfinished-transaction stream to stay current within a session.
@MainActor
final class StoreManager: ObservableObject {
    static let shared = StoreManager()

    static let productID = "com.vectorialdata.app.premium.monthly"

    enum PurchasePhase: Equatable {
        case idle
        case loading
        case purchasing
        case restoring
        case success
        case failed(String)
    }

    @Published private(set) var product: Product?
    @Published private(set) var phase: PurchasePhase = .idle
    /// Whether THIS Apple ID is still eligible for the introductory (free
    /// trial) offer. Apple grants the intro offer at most once per account per
    /// subscription group, so we must check before advertising "14 days free".
    @Published private(set) var isEligibleForIntro = false

    private var updatesTask: Task<Void, Never>?

    private init() {}

    /// Display price string from the App Store (localized, e.g. "$1.00").
    var displayPrice: String? { product?.displayPrice }

    /// The configured introductory offer (App Store Connect), if any. For us
    /// this is a 14-day free trial with `paymentMode == .freeTrial`.
    var introOffer: Product.SubscriptionOffer? {
        product?.subscription?.introductoryOffer
    }

    /// True when we should advertise the free trial: an intro offer exists, is
    /// a free trial, and this account hasn't used it yet.
    var showsFreeTrial: Bool {
        isEligibleForIntro && introOffer?.paymentMode == .freeTrial
    }

    /// Number of days in the free-trial intro offer (e.g. 14), derived from the
    /// offer period so copy always matches the App Store Connect config.
    var trialDays: Int? {
        guard let offer = introOffer, offer.paymentMode == .freeTrial else { return nil }
        let p = offer.period
        switch p.unit {
        case .day: return p.value
        case .week: return p.value * 7
        case .month: return p.value * 30
        case .year: return p.value * 365
        @unknown default: return p.value
        }
    }

    /// Begin listening for transaction updates. Call once at app launch.
    func start() {
        guard updatesTask == nil else { return }
        updatesTask = Task.detached { [weak self] in
            for await result in Transaction.updates {
                await self?.handle(verificationResult: result, syncToBackend: true)
            }
        }
        Task { await loadProduct() }
    }

    func loadProduct() async {
        if phase == .idle { phase = .loading }
        do {
            let products = try await Product.products(for: [Self.productID])
            self.product = products.first
            // Intro-offer eligibility is per Apple ID; check it so we only
            // advertise the free trial to accounts that can actually redeem it.
            if let sub = products.first?.subscription {
                self.isEligibleForIntro = await sub.isEligibleForIntroOffer
            }
            if phase == .loading { phase = .idle }
        } catch {
            phase = .failed("No pudimos cargar la suscripción.")
        }
    }

    /// Purchase the monthly subscription. Returns true if the user is now
    /// subscribed (verified by the backend).
    @discardableResult
    func purchase() async -> Bool {
        guard let product else {
            await loadProduct()
            guard product != nil else {
                phase = .failed("Suscripción no disponible.")
                return false
            }
            return await purchase()
        }

        phase = .purchasing
        do {
            let result = try await product.purchase()
            switch result {
            case .success(let verification):
                let ok = await handle(verificationResult: verification, syncToBackend: true)
                phase = ok ? .success : .failed("No pudimos confirmar tu compra.")
                return ok
            case .userCancelled:
                phase = .idle
                return false
            case .pending:
                // Ask-to-buy / SCA — resolved later via Transaction.updates.
                phase = .idle
                return false
            @unknown default:
                phase = .idle
                return false
            }
        } catch {
            phase = .failed("La compra no se completó.")
            return false
        }
    }

    /// Restore Purchases. Re-syncs entitlements with the App Store, then posts
    /// the current entitlement (if any) to the backend.
    @discardableResult
    func restore() async -> Bool {
        phase = .restoring
        do {
            try await AppStore.sync()
        } catch {
            // sync throws on cancel; fall through to check entitlements anyway.
        }

        for await result in Transaction.currentEntitlements {
            if case .verified(let tx) = result, tx.productID == Self.productID {
                let ok = await handle(verificationResult: result, syncToBackend: true)
                phase = ok ? .success : .failed("No pudimos restaurar tu compra.")
                return ok
            }
        }
        phase = .failed("No encontramos una suscripción activa.")
        return false
    }

    /// Verify a StoreKit transaction locally, send its JWS to the backend, and
    /// refresh the app's subscription state. Always `finish()`es verified
    /// transactions so StoreKit stops re-delivering them.
    @discardableResult
    private func handle(
        verificationResult: VerificationResult<Transaction>,
        syncToBackend: Bool
    ) async -> Bool {
        guard case .verified(let transaction) = verificationResult else {
            return false
        }

        var backendOK = true
        if syncToBackend {
            backendOK = await sendToBackend(jws: verificationResult.jwsRepresentation)
        }

        await transaction.finish()

        if backendOK {
            await PickStatusStore.shared.load()
            await AuthManager.shared.refreshCurrentUser()
        }
        return backendOK
    }

    private func sendToBackend(jws: String) async -> Bool {
        struct Body: Encodable { let signedTransaction: String }
        struct Resp: Decodable {
            let isSubscribed: Bool
            let subscriptionStatus: String?
            let currentPeriodEnd: String?
        }
        do {
            let resp = try await APIClient.shared.post(
                "/api/iap/verify",
                body: Body(signedTransaction: jws),
                as: Resp.self
            )
            return resp.isSubscribed
        } catch {
            return false
        }
    }
}
