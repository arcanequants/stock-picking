import SwiftUI

/// Full-screen news feed. Reached from the Home card or as the back
/// stop of a push deep link (push → detail → back lands here).
struct NewsListView: View {
    @EnvironmentObject private var store: NewsStore

    var body: some View {
        content
            .background(Color("AppBackground"))
            .navigationTitle("Noticias")
            .navigationBarTitleDisplayMode(.large)
            .refreshable { await store.load() }
            .task {
                if store.items.isEmpty {
                    await store.load()
                }
                store.markAllAsRead()
            }
    }

    @ViewBuilder
    private var content: some View {
        if store.isLoading && store.items.isEmpty {
            ProgressView()
                .frame(maxWidth: .infinity, maxHeight: .infinity)
        } else if let msg = store.errorMessage, store.items.isEmpty {
            VStack(spacing: 10) {
                Text(msg)
                    .font(.footnote)
                    .foregroundStyle(.white.opacity(0.6))
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        } else if store.items.isEmpty {
            EmptyNewsCard()
                .padding(16)
        } else {
            ScrollView {
                LazyVStack(spacing: 10) {
                    ForEach(store.items) { item in
                        NavigationLink(value: item) {
                            NewsRow(
                                item: item,
                                isUnread: item.isUnread(relativeTo: store.lastReadAt)
                            )
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(16)
            }
        }
    }
}

private struct NewsRow: View {
    let item: NewsItem
    let isUnread: Bool

    var body: some View {
        HStack(alignment: .top, spacing: 10) {
            Circle()
                .fill(isUnread ? Color("BrandEmerald") : Color.clear)
                .frame(width: 8, height: 8)
                .padding(.top, 7)
            VStack(alignment: .leading, spacing: 4) {
                Text(item.headline)
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(.white)
                    .multilineTextAlignment(.leading)
                    .fixedSize(horizontal: false, vertical: true)
                Text(firstLine(item.body))
                    .font(.caption)
                    .foregroundStyle(.white.opacity(0.6))
                    .lineLimit(2)
                    .multilineTextAlignment(.leading)
                Text(relativeDate(item.publishedAt))
                    .font(.caption2)
                    .foregroundStyle(.white.opacity(0.4))
            }
            Spacer(minLength: 0)
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color("CardBackground"))
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
    }

    private func firstLine(_ body: String) -> String {
        body.split(separator: "\n").first.map(String.init) ?? body
    }

    private func relativeDate(_ iso: String) -> String {
        guard let date = NewsItem.parseISO(iso) else { return "" }
        let secs = Date().timeIntervalSince(date)
        if secs < 60 { return String(localized: "ahora") }
        if secs < 3600 { return String(localized: "hace \(Int(secs/60))m") }
        if secs < 86400 { return String(localized: "hace \(Int(secs/3600))h") }
        let days = Int(secs / 86400)
        if days == 1 { return String(localized: "ayer") }
        if days < 7 { return String(localized: "hace \(days)d") }
        let f = DateFormatter()
        f.locale = Locale.current
        f.dateFormat = "d MMM"
        return f.string(from: date)
    }
}

private struct EmptyNewsCard: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 6) {
                Image(systemName: "newspaper")
                    .foregroundStyle(Color("BrandEmerald"))
                Text("Aún no hay noticias")
                    .font(.headline)
                    .foregroundStyle(.white)
            }
            Text("Te avisamos al instante cuando publiquemos algo que cambie tu tesis.")
                .font(.caption)
                .foregroundStyle(.white.opacity(0.7))
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color("CardBackground"))
        .overlay(
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .stroke(Color.white.opacity(0.08), lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
    }
}
