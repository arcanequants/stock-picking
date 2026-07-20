import SwiftUI

/// Reader view for a single news item. When the server produced the
/// 4-block "explainer de 60 segundos" it renders those blocks (qué pasó /
/// por qué importa / y para tu portafolio / cuéntalo así) with a tappable
/// glossary; otherwise it falls back to the plain markdown body. A
/// "Pregúntale a la IA" button opens the per-news chat (premium/trial).
struct NewsDetailView: View {
    let item: NewsItem
    @EnvironmentObject private var store: NewsStore
    @EnvironmentObject private var pickStatus: PickStatusStore

    @State private var glossaryTerm: GlossaryTerm?
    @State private var showChat = false
    @State private var showPaywall = false

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                header
                if item.hasExplainer {
                    explainerBlocks
                } else {
                    Text(markdownBody(item.body))
                        .font(.callout)
                        .foregroundStyle(.white.opacity(0.9))
                        .fixedSize(horizontal: false, vertical: true)
                }
                actionRow
                disclaimer
                if let urlString = item.linkUrl, let url = URL(string: urlString) {
                    linkButton(url: url)
                }
            }
            .padding(16)
        }
        .background(Color("AppBackground"))
        .navigationTitle("")
        .navigationBarTitleDisplayMode(.inline)
        .sheet(item: $glossaryTerm) { term in
            GlossarySheet(term: term)
                .presentationDetents([.height(190)])
        }
        .sheet(isPresented: $showChat) {
            NavigationStack { NewsChatView(item: item) }
        }
        .sheet(isPresented: $showPaywall) {
            PaywallView()
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 6) {
                TopicTag(topic: item.topic)
                ForEach(item.regions ?? [], id: \.self) { r in
                    Text(NewsTaxonomy.regionFlag(r)).font(.footnote)
                }
                Spacer()
                Text(readTimeLabel)
                    .font(.caption2)
                    .foregroundStyle(.white.opacity(0.4))
            }
            Text(item.headline)
                .font(.title2.weight(.bold))
                .foregroundStyle(.white)
                .fixedSize(horizontal: false, vertical: true)
            Text(formatLongDate(item.publishedAt))
                .font(.caption)
                .foregroundStyle(.white.opacity(0.5))
        }
    }

    @ViewBuilder
    private var explainerBlocks: some View {
        block(title: "QUÉ PASÓ", body: item.blockWhat)
        block(title: "POR QUÉ IMPORTA", body: item.blockWhy)
        block(title: "Y PARA TU PORTAFOLIO", body: item.blockYou)
        if let tell = item.blockTell, !tell.isEmpty {
            VStack(alignment: .leading, spacing: 6) {
                Text("💬 CUÉNTALO ASÍ")
                    .font(.caption2.weight(.bold))
                    .tracking(1.1)
                    .foregroundStyle(Color("BrandEmerald"))
                Text("“\(tell)”")
                    .font(.callout.weight(.semibold))
                    .foregroundStyle(.white)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .padding(14)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(
                LinearGradient(
                    colors: [Color("BrandEmerald").opacity(0.16), Color("BrandEmerald").opacity(0.05)],
                    startPoint: .topLeading, endPoint: .bottomTrailing
                )
            )
            .overlay(
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .stroke(Color("BrandEmerald").opacity(0.35), lineWidth: 1)
            )
            .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
        }
        if let glossary = item.glossary, !glossary.isEmpty {
            glossaryChips(glossary)
        }
    }

    @ViewBuilder
    private func block(title: LocalizedStringKey, body: String?) -> some View {
        if let body, !body.isEmpty {
            VStack(alignment: .leading, spacing: 6) {
                Text(title)
                    .font(.caption2.weight(.bold))
                    .tracking(1.1)
                    .foregroundStyle(Color("BrandEmerald").opacity(0.85))
                Text(body)
                    .font(.callout)
                    .foregroundStyle(Color(red: 0.9, green: 0.94, blue: 0.92))
                    .fixedSize(horizontal: false, vertical: true)
                    .lineSpacing(2)
            }
            .padding(14)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color("CardBackground"))
            .overlay(
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .stroke(.white.opacity(0.06), lineWidth: 1)
            )
            .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
        }
    }

    private func glossaryChips(_ glossary: [GlossaryTerm]) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("PALABRAS CLARAS")
                .font(.caption2.weight(.bold))
                .tracking(1.1)
                .foregroundStyle(.white.opacity(0.4))
            FlowLayout(spacing: 8) {
                ForEach(glossary, id: \.term) { g in
                    Button {
                        glossaryTerm = g
                    } label: {
                        HStack(spacing: 4) {
                            Image(systemName: "questionmark.circle")
                            Text(g.term)
                        }
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(Color("BrandEmerald"))
                        .padding(.horizontal, 11)
                        .padding(.vertical, 6)
                        .background(Color("BrandEmerald").opacity(0.1))
                        .clipShape(Capsule())
                    }
                    .buttonStyle(.plain)
                }
            }
        }
        .padding(.top, 2)
    }

    private var actionRow: some View {
        HStack(spacing: 9) {
            Button {
                if store.chatEnabled || pickStatus.isSubscribed {
                    showChat = true
                } else {
                    showPaywall = true
                }
            } label: {
                Label("Pregúntale a la IA", systemImage: "sparkles")
                    .font(.subheadline.weight(.bold))
                    .frame(maxWidth: .infinity, minHeight: 48)
                    .foregroundStyle(.black)
                    .background(Color("BrandEmerald"))
                    .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
            }
            .buttonStyle(.plain)

            ShareLink(item: shareText) {
                Image(systemName: "square.and.arrow.up")
                    .font(.subheadline.weight(.bold))
                    .frame(width: 52, height: 48)
                    .foregroundStyle(.white)
                    .background(Color("CardBackground"))
                    .overlay(
                        RoundedRectangle(cornerRadius: 12, style: .continuous)
                            .stroke(.white.opacity(0.1), lineWidth: 1)
                    )
                    .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
            }
        }
        .padding(.top, 2)
    }

    private var disclaimer: some View {
        Text("Información para entender, no asesoría de inversión personalizada.")
            .font(.caption2)
            .foregroundStyle(.white.opacity(0.38))
            .frame(maxWidth: .infinity, alignment: .center)
    }

    /// The shareable unit is the "cuéntalo así" line — that's the wow.
    private var shareText: String {
        if let tell = item.blockTell, !tell.isEmpty {
            return "“\(tell)”\n\n— \(item.headline) · Vectorial Data"
        }
        return "\(item.headline)\n\n— Vectorial Data"
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

    private var readTimeLabel: String {
        item.hasExplainer ? String(localized: "⏱ 60 seg") : ""
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
        return date.formatted(date: .long, time: .shortened)
    }
}

private struct GlossarySheet: View {
    let term: GlossaryTerm

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(term.term)
                .font(.title3.weight(.bold))
                .foregroundStyle(.white)
            Text(term.def)
                .font(.callout)
                .foregroundStyle(.white.opacity(0.8))
                .fixedSize(horizontal: false, vertical: true)
            Spacer()
        }
        .padding(22)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color("AppBackground"))
        .presentationDragIndicator(.visible)
    }
}

/// Minimal wrapping HStack for the glossary chips (no third-party deps).
struct FlowLayout: Layout {
    var spacing: CGFloat = 8

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let maxWidth = proposal.width ?? .infinity
        var rows: [[CGSize]] = [[]]
        var x: CGFloat = 0
        for sub in subviews {
            let size = sub.sizeThatFits(.unspecified)
            if x + size.width > maxWidth, !rows[rows.count - 1].isEmpty {
                rows.append([])
                x = 0
            }
            rows[rows.count - 1].append(size)
            x += size.width + spacing
        }
        let height = rows.reduce(0) { acc, row in
            acc + (row.map(\.height).max() ?? 0) + spacing
        } - spacing
        return CGSize(width: maxWidth == .infinity ? x : maxWidth, height: max(0, height))
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        var x = bounds.minX
        var y = bounds.minY
        var rowHeight: CGFloat = 0
        for sub in subviews {
            let size = sub.sizeThatFits(.unspecified)
            if x + size.width > bounds.maxX, x > bounds.minX {
                x = bounds.minX
                y += rowHeight + spacing
                rowHeight = 0
            }
            sub.place(at: CGPoint(x: x, y: y), proposal: ProposedViewSize(size))
            x += size.width + spacing
            rowHeight = max(rowHeight, size.height)
        }
    }
}
