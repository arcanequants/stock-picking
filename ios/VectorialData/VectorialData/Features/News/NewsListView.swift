import SwiftUI

/// Full-screen news feed. Reached from the Home card or as the back
/// stop of a push deep link (push → detail → back lands here). Topic
/// chips filter the feed; a gear opens "Tu mezcla" (delivery prefs).
struct NewsListView: View {
    @EnvironmentObject private var store: NewsStore
    @State private var showPrefs = false

    var body: some View {
        content
            .background(Color("AppBackground"))
            .navigationTitle("Noticias")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        showPrefs = true
                    } label: {
                        Image(systemName: "slider.horizontal.3")
                            .foregroundStyle(Color("BrandEmerald"))
                    }
                    .accessibilityLabel(Text("Tu mezcla"))
                }
            }
            .sheet(isPresented: $showPrefs) {
                NavigationStack { NewsPrefsView() }
            }
            .refreshable { await store.load() }
            .task {
                // Always refetch on opening the section — a news feed must
                // never show only yesterday's cache; existing items stay
                // visible while the request runs.
                await store.load()
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
                LazyVStack(spacing: 10, pinnedViews: []) {
                    TopicChips()
                        .padding(.bottom, 2)
                    ForEach(store.visibleItems) { item in
                        // Emit HomeDestination (the enclosing NavigationStack's
                        // typed path element) — a NavigationLink(value: NewsItem)
                        // would be a no-op against a `[HomeDestination]` path.
                        NavigationLink(value: HomeDestination.newsItem(item.id)) {
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

/// Horizontal filter chips: "Todo" + one per topic present in the feed.
private struct TopicChips: View {
    @EnvironmentObject private var store: NewsStore

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                chip(label: Text("Todo"), active: store.selectedTopic == nil) {
                    store.selectedTopic = nil
                }
                ForEach(store.availableTopics, id: \.self) { id in
                    let meta = NewsTaxonomy.topics.first(where: { $0.id == id })
                    chip(
                        label: Text("\(meta?.emoji ?? "") ") + Text(NewsTaxonomy.topicLabel(id)),
                        active: store.selectedTopic == id
                    ) {
                        store.selectedTopic = (store.selectedTopic == id) ? nil : id
                    }
                }
            }
            .padding(.horizontal, 2)
        }
    }

    private func chip(label: Text, active: Bool, tap: @escaping () -> Void) -> some View {
        Button(action: tap) {
            label
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(active ? Color("BrandEmerald") : .white.opacity(0.62))
                .padding(.horizontal, 13)
                .padding(.vertical, 7)
                .background(active ? Color("BrandEmerald").opacity(0.14) : Color("CardBackground"))
                .overlay(
                    Capsule().stroke(
                        active ? Color("BrandEmerald").opacity(0.4) : .white.opacity(0.08),
                        lineWidth: 1
                    )
                )
                .clipShape(Capsule())
        }
        .buttonStyle(.plain)
    }
}

private struct NewsRow: View {
    let item: NewsItem
    let isUnread: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: 7) {
            // Meta line: topic tag · region flags · relative time.
            HStack(spacing: 6) {
                TopicTag(topic: item.topic)
                ForEach(item.regions ?? [], id: \.self) { r in
                    Text(NewsTaxonomy.regionFlag(r)).font(.caption2)
                }
                Text(relativeDate(item.publishedAt))
                    .font(.caption2)
                    .foregroundStyle(.white.opacity(0.4))
                Spacer(minLength: 0)
                if isUnread {
                    Circle().fill(Color("BrandEmerald")).frame(width: 7, height: 7)
                }
            }
            Text(item.headline)
                .font(.subheadline.weight(.bold))
                .foregroundStyle(.white)
                .multilineTextAlignment(.leading)
                .fixedSize(horizontal: false, vertical: true)
            Text(summaryLine(item))
                .font(.caption)
                .foregroundStyle(.white.opacity(0.6))
                .lineLimit(2)
                .multilineTextAlignment(.leading)
            // Read-time + ticker hint.
            HStack(spacing: 8) {
                Label(readTime(item), systemImage: "clock")
                    .font(.caption2.weight(.semibold))
                    .foregroundStyle(Color("BrandEmerald").opacity(0.9))
                if let tickers = item.tickers, !tickers.isEmpty {
                    Text("· \(tickers.prefix(2).joined(separator: ", "))")
                        .font(.caption2)
                        .foregroundStyle(.white.opacity(0.45))
                }
            }
            .padding(.top, 1)
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color("CardBackground"))
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
    }

    private func summaryLine(_ item: NewsItem) -> String {
        if let what = item.blockWhat, !what.isEmpty { return what }
        return item.body.split(separator: "\n").first.map(String.init) ?? item.body
    }

    /// ~200 words per minute → seconds, rounded to a friendly bucket.
    private func readTime(_ item: NewsItem) -> String {
        let text = item.hasExplainer
            ? [item.blockWhat, item.blockWhy, item.blockYou].compactMap { $0 }.joined(separator: " ")
            : item.body
        let words = max(1, text.split(whereSeparator: { $0 == " " || $0 == "\n" }).count)
        let secs = Int((Double(words) / 200.0 * 60).rounded())
        let bucket = max(30, min(90, (secs / 15) * 15 + 15))
        return String(localized: "\(bucket) seg")
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

/// Colored pill for the news topic (economy/companies/politics/markets/picks).
struct TopicTag: View {
    let topic: String?

    var body: some View {
        Text(NewsTaxonomy.topicLabel(topic))
            .font(.caption2.weight(.bold))
            .tracking(0.4)
            .textCase(.uppercase)
            .foregroundStyle(color)
            .padding(.horizontal, 7)
            .padding(.vertical, 3)
            .background(color.opacity(0.15))
            .clipShape(RoundedRectangle(cornerRadius: 6, style: .continuous))
    }

    private var color: Color {
        switch topic {
        case "economy": return Color(red: 0.5, green: 0.72, blue: 1.0)
        case "companies", "picks": return Color("BrandEmerald")
        case "politics": return Color(red: 0.96, green: 0.71, blue: 0.38)
        default: return Color(red: 0.79, green: 0.64, blue: 1.0) // markets
        }
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
