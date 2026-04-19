import Foundation

/// Matches `GET /api/me` response. `convertFromSnakeCase` on JSONDecoder
/// maps `is_subscribed` → `isSubscribed`, etc.
struct UserProfile: Codable, Equatable {
    let email: String
    let isSubscribed: Bool
    let subscriptionStatus: String?
    let deliveryChannel: String?
    let locale: String?
    let createdAt: String?
    let currentPeriodEnd: String?
}
