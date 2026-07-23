import Foundation
import SwiftUI

/// Single source of truth for the iOS news feed. Backs the Home card,
/// the full list, and the deep-linked detail when the user taps a push.
///
/// Unread count is purely device-local: persisted via `@AppStorage` so
/// the user opening the app on a different device starts fresh — that's
/// a deliberate v1 simplification (no server-side read state yet).
@MainActor
final class NewsStore: ObservableObject {
    static let shared = NewsStore()

    @Published private(set) var items: [NewsItem] = []
    @Published private(set) var isLoading: Bool = false
    @Published private(set) var errorMessage: String?
    /// Per-news AI chat availability, from the last /api/news response.
    @Published private(set) var chatEnabled: Bool = false
    /// Active feed filter — nil = "Todo". Matches a NewsTaxonomy topic id.
    @Published var selectedTopic: String?

    @AppStorage("news.lastReadAt") private var lastReadAtRaw: Double = 0

    private init() {}

    /// Clears all cached state. Called on sign-out so the next user never
    /// sees the previous user's news or unread cursor.
    func reset() {
        items = []
        errorMessage = nil
        isLoading = false
        chatEnabled = false
        selectedTopic = nil
        lastReadAtRaw = 0
    }

    func load() async {
        guard !isLoading else { return }
        isLoading = true
        defer { isLoading = false }
        do {
            let resp = try await APIClient.shared.get(
                "/api/news",
                as: NewsListResponse.self
            )
            self.items = resp.news
            self.chatEnabled = resp.chatEnabled ?? false
            self.errorMessage = nil
        } catch APIError.unauthorized {
            errorMessage = String(localized: "Inicia sesión otra vez.")
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    /// Topics present in the current feed — only these chips are shown.
    var availableTopics: [String] {
        let present = Set(items.compactMap { $0.topic })
        return NewsTaxonomy.topics.map(\.id).filter { present.contains($0) }
    }

    /// Feed filtered by the selected topic chip.
    var visibleItems: [NewsItem] {
        guard let topic = selectedTopic else { return items }
        return items.filter { $0.topic == topic }
    }

    /// Call when the user actually opens the news list. Stamps the
    /// "last read" cursor so the unread count drops to zero.
    func markAllAsRead() {
        lastReadAtRaw = Date().timeIntervalSince1970
    }

    var lastReadAt: Date? {
        lastReadAtRaw > 0 ? Date(timeIntervalSince1970: lastReadAtRaw) : nil
    }

    var unreadCount: Int {
        let cursor = lastReadAt
        return items.filter { $0.isUnread(relativeTo: cursor) }.count
    }

    var mostRecentUnread: NewsItem? {
        let cursor = lastReadAt
        return items.first(where: { $0.isUnread(relativeTo: cursor) })
    }

    func item(byId id: UUID) -> NewsItem? {
        items.first(where: { $0.id == id })
    }
}
