import SwiftUI

/// Reader view for a single news item. Body supports markdown so we
/// can ship light formatting (bold, lists, links) without building an
/// editor. Optional `link_url` becomes a CTA button at the bottom.
struct NewsDetailView: View {
    let item: NewsItem

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                header
                Text(markdownBody(item.body))
                    .font(.callout)
                    .foregroundStyle(.white.opacity(0.9))
                    .fixedSize(horizontal: false, vertical: true)
                if let urlString = item.linkUrl,
                   let url = URL(string: urlString) {
                    linkButton(url: url)
                }
            }
            .padding(16)
        }
        .background(Color("AppBackground"))
        .navigationTitle("")
        .navigationBarTitleDisplayMode(.inline)
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(item.headline)
                .font(.title2.weight(.bold))
                .foregroundStyle(.white)
                .fixedSize(horizontal: false, vertical: true)
            Text(formatLongDate(item.publishedAt))
                .font(.caption)
                .foregroundStyle(.white.opacity(0.5))
        }
    }

    private func linkButton(url: URL) -> some View {
        Link(destination: url) {
            HStack {
                Image(systemName: "arrow.up.right.square")
                Text("Abrir enlace")
                    .font(.subheadline.weight(.semibold))
                Spacer()
            }
            .foregroundStyle(Color("BrandEmerald"))
            .padding(14)
            .background(Color("BrandEmerald").opacity(0.12))
            .overlay(
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .stroke(Color("BrandEmerald").opacity(0.4), lineWidth: 1)
            )
            .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
        }
    }

    private func markdownBody(_ s: String) -> AttributedString {
        let opts = AttributedString.MarkdownParsingOptions(
            interpretedSyntax: .inlineOnlyPreservingWhitespace
        )
        return (try? AttributedString(markdown: s, options: opts))
            ?? AttributedString(s)
    }

    private func formatLongDate(_ iso: String) -> String {
        guard let date = NewsItem.parseISO(iso) else { return iso }
        let f = DateFormatter()
        f.locale = Locale(identifier: "es")
        f.dateFormat = "d 'de' MMMM 'de' yyyy · HH:mm"
        return f.string(from: date)
    }
}
