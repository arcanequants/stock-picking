import SwiftUI

/// Per-news AI chat ("Pregúntale a la IA"). Grounded on one news item;
/// premium/trial only (the caller gates entry). Suggested starter chips,
/// streamed-in answers, always-visible disclaimer.
struct NewsChatView: View {
    let item: NewsItem
    @Environment(\.dismiss) private var dismiss
    @StateObject private var model: NewsChatModel

    init(item: NewsItem) {
        self.item = item
        _model = StateObject(wrappedValue: NewsChatModel(newsId: item.id))
    }

    private let suggestions: [LocalizedStringKey] = [
        "¿Cómo me afecta a mí?",
        "¿Por qué pasó?",
        "Explícamelo más fácil",
    ]

    var body: some View {
        VStack(spacing: 0) {
            ScrollViewReader { proxy in
                ScrollView {
                    VStack(alignment: .leading, spacing: 10) {
                        newsHeader
                        if model.messages.isEmpty {
                            suggestionChips
                        }
                        ForEach(Array(model.messages.enumerated()), id: \.offset) { _, msg in
                            ChatBubble(message: msg)
                                .id(msg.id)
                        }
                        if model.isSending {
                            ChatBubble(message: .init(role: "assistant", content: "…"))
                                .id("typing")
                        }
                    }
                    .padding(16)
                }
                .onChange(of: model.messages.count) { _, _ in
                    withAnimation { proxy.scrollTo(model.messages.last?.id, anchor: .bottom) }
                }
            }
            inputBar
            disclaimer
        }
        .background(Color("AppBackground"))
        .navigationTitle("Pregúntale a la IA")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarLeading) {
                Button("Cerrar") { dismiss() }.foregroundStyle(Color("BrandEmerald"))
            }
        }
        .task { await model.loadHistory() }
    }

    private var newsHeader: some View {
        VStack(alignment: .leading, spacing: 3) {
            Text(item.headline)
                .font(.subheadline.weight(.bold))
                .foregroundStyle(.white)
                .fixedSize(horizontal: false, vertical: true)
            Text("Estás preguntando sobre esta noticia")
                .font(.caption2)
                .foregroundStyle(.white.opacity(0.4))
        }
        .padding(12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color("CardBackground"))
        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
    }

    private var suggestionChips: some View {
        FlowLayout(spacing: 8) {
            ForEach(suggestions.indices, id: \.self) { i in
                Button {
                    Task { await model.send(suggestionText(i)) }
                } label: {
                    Text(suggestions[i])
                        .font(.footnote.weight(.semibold))
                        .foregroundStyle(Color("BrandEmerald"))
                        .padding(.horizontal, 12)
                        .padding(.vertical, 8)
                        .background(Color("BrandEmerald").opacity(0.08))
                        .overlay(Capsule().stroke(Color("BrandEmerald").opacity(0.4), lineWidth: 1))
                        .clipShape(Capsule())
                }
                .buttonStyle(.plain)
            }
        }
    }

    // Suggestions must reach the API as plain String; resolve the localized value.
    private func suggestionText(_ i: Int) -> String {
        switch i {
        case 0: return String(localized: "¿Cómo me afecta a mí?")
        case 1: return String(localized: "¿Por qué pasó?")
        default: return String(localized: "Explícamelo más fácil")
        }
    }

    private var inputBar: some View {
        HStack(spacing: 10) {
            TextField("", text: $model.draft, prompt:
                Text("Pregunta sobre esta noticia…").foregroundStyle(.white.opacity(0.4)),
                axis: .vertical
            )
            .lineLimit(1...4)
            .foregroundStyle(.white)
            .submitLabel(.send)
            Button {
                Task { await model.send(model.draft) }
            } label: {
                Image(systemName: "arrow.up.circle.fill")
                    .font(.title2)
                    .foregroundStyle(canSend ? Color("BrandEmerald") : .white.opacity(0.25))
            }
            .disabled(!canSend)
        }
        .padding(.horizontal, 15)
        .padding(.vertical, 11)
        .background(Color("CardBackground"))
        .overlay(
            RoundedRectangle(cornerRadius: 22, style: .continuous)
                .stroke(.white.opacity(0.1), lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 22, style: .continuous))
        .padding(.horizontal, 14)
        .padding(.bottom, 6)
    }

    private var canSend: Bool {
        !model.draft.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty && !model.isSending
    }

    private var disclaimer: some View {
        Text("Respuestas educativas basadas en la noticia. No es asesoría de inversión personalizada.")
            .font(.caption2)
            .foregroundStyle(.white.opacity(0.35))
            .multilineTextAlignment(.center)
            .padding(.horizontal, 28)
            .padding(.bottom, 12)
    }
}

private struct ChatBubble: View {
    let message: NewsChatModel.Message

    var body: some View {
        HStack {
            if message.role == "user" { Spacer(minLength: 40) }
            Text(message.content)
                .font(.callout)
                .foregroundStyle(message.role == "user" ? .black : Color(red: 0.9, green: 0.94, blue: 0.92))
                .padding(.horizontal, 13)
                .padding(.vertical, 10)
                .background(bubbleBackground)
                .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                .frame(maxWidth: 300, alignment: message.role == "user" ? .trailing : .leading)
            if message.role != "user" { Spacer(minLength: 40) }
        }
    }

    @ViewBuilder
    private var bubbleBackground: some View {
        if message.role == "user" {
            Color("BrandEmerald")
        } else {
            Color("CardBackground").overlay(
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .stroke(.white.opacity(0.08), lineWidth: 1)
            )
        }
    }
}

@MainActor
final class NewsChatModel: ObservableObject {
    struct Message: Codable, Identifiable {
        var id = UUID()
        let role: String
        let content: String
        enum CodingKeys: String, CodingKey { case role, content }
    }

    @Published var messages: [Message] = []
    @Published var draft: String = ""
    @Published private(set) var isSending = false

    private let newsId: UUID
    init(newsId: UUID) { self.newsId = newsId }

    struct HistoryResponse: Codable { let messages: [Message] }
    struct ChatRequest: Codable { let newsId: String; let message: String }
    struct ChatReply: Codable { let reply: String }

    func loadHistory() async {
        let resp = try? await APIClient.shared.get(
            "/api/news/chat?news_id=\(newsId.uuidString.lowercased())",
            as: HistoryResponse.self
        )
        if let resp { messages = resp.messages }
    }

    func send(_ text: String) async {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty, !isSending else { return }
        draft = ""
        messages.append(.init(role: "user", content: trimmed))
        isSending = true
        defer { isSending = false }
        do {
            let reply = try await APIClient.shared.post(
                "/api/news/chat",
                body: ChatRequest(newsId: newsId.uuidString.lowercased(), message: trimmed),
                as: ChatReply.self
            )
            messages.append(.init(role: "assistant", content: reply.reply))
        } catch {
            messages.append(.init(
                role: "assistant",
                content: String(localized: "No pude responder ahora. Intenta de nuevo en un momento.")
            ))
        }
    }
}
