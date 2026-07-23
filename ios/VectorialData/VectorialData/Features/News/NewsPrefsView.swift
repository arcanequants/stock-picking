import SwiftUI

/// "Tu mezcla" — the user picks which news topics + regions they want pushed
/// and when (instant / daily digest / none). Persisted via /api/news/prefs.
/// "Mis picks" and "Global" are always on and shown as locked rows.
struct NewsPrefsView: View {
    @Environment(\.dismiss) private var dismiss
    @StateObject private var model = NewsPrefsModel()

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 4) {
                Text("Elige qué noticias recibes. Nosotros las explicamos fácil.")
                    .font(.subheadline)
                    .foregroundStyle(.white.opacity(0.6))
                    .padding(.horizontal, 4)
                    .padding(.bottom, 8)

                section("TEMAS")
                lockedRow(emoji: "📈", title: "Mis picks",
                          subtitle: "Noticias de las empresas de tu portafolio")
                ForEach(NewsPrefsModel.topicRows, id: \.id) { row in
                    toggleRow(emoji: row.emoji, title: row.title, subtitle: row.subtitle,
                              isOn: model.binding(topic: row.id))
                }

                section("REGIONES")
                lockedRow(emoji: "🌍", title: "Global",
                          subtitle: "Lo que mueve al mundo entero")
                ForEach(NewsPrefsModel.regionRows, id: \.id) { row in
                    toggleRow(emoji: row.emoji, title: row.title, subtitle: nil,
                              isOn: model.binding(region: row.id))
                }

                section("CUÁNDO TE AVISAMOS")
                ForEach(NewsPrefsModel.deliveryRows, id: \.id) { row in
                    radioRow(title: row.title, subtitle: row.subtitle,
                             selected: model.delivery == row.id) {
                        model.delivery = row.id
                    }
                }
            }
            .padding(16)
        }
        .background(Color("AppBackground"))
        .navigationTitle("Tu mezcla")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    Task { await model.save(); dismiss() }
                } label: {
                    if model.isSaving { ProgressView() }
                    else { Text("Guardar").font(.headline).foregroundStyle(Color("BrandEmerald")) }
                }
                .disabled(model.isSaving)
            }
        }
        .task { await model.load() }
    }

    private func section(_ title: LocalizedStringKey) -> some View {
        Text(title)
            .font(.caption.weight(.bold))
            .tracking(1.1)
            .foregroundStyle(.white.opacity(0.4))
            .padding(.top, 16)
            .padding(.bottom, 6)
            .padding(.horizontal, 4)
    }

    private func rowShell<Trailing: View>(
        emoji: String, title: LocalizedStringKey, subtitle: LocalizedStringKey?,
        @ViewBuilder trailing: () -> Trailing
    ) -> some View {
        HStack(spacing: 11) {
            Text(emoji).font(.title3)
            VStack(alignment: .leading, spacing: 1) {
                Text(title).font(.body.weight(.medium)).foregroundStyle(.white)
                if let subtitle {
                    Text(subtitle).font(.caption2).foregroundStyle(.white.opacity(0.4))
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
            Spacer(minLength: 8)
            trailing()
        }
        .padding(12)
        .frame(maxWidth: .infinity)
        .background(Color("CardBackground"))
        .overlay(
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .stroke(.white.opacity(0.06), lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
        .padding(.bottom, 8)
    }

    private func toggleRow(emoji: String, title: LocalizedStringKey,
                           subtitle: LocalizedStringKey?, isOn: Binding<Bool>) -> some View {
        rowShell(emoji: emoji, title: title, subtitle: subtitle) {
            Toggle("", isOn: isOn)
                .labelsHidden()
                .tint(Color("BrandEmerald"))
        }
    }

    private func lockedRow(emoji: String, title: LocalizedStringKey,
                           subtitle: LocalizedStringKey) -> some View {
        rowShell(emoji: emoji, title: title, subtitle: subtitle) {
            Text("Siempre")
                .font(.caption2.weight(.semibold))
                .foregroundStyle(.white.opacity(0.35))
        }
    }

    private func radioRow(title: LocalizedStringKey, subtitle: LocalizedStringKey,
                          selected: Bool, tap: @escaping () -> Void) -> some View {
        Button(action: tap) {
            HStack(spacing: 11) {
                Image(systemName: selected ? "largecircle.fill.circle" : "circle")
                    .foregroundStyle(selected ? Color("BrandEmerald") : .white.opacity(0.3))
                    .font(.title3)
                VStack(alignment: .leading, spacing: 1) {
                    Text(title).font(.body.weight(.medium)).foregroundStyle(.white)
                    Text(subtitle).font(.caption2).foregroundStyle(.white.opacity(0.4))
                }
                Spacer()
            }
            .padding(12)
            .frame(maxWidth: .infinity)
            .background(Color("CardBackground"))
            .overlay(
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .stroke(selected ? Color("BrandEmerald").opacity(0.4) : .white.opacity(0.06), lineWidth: 1)
            )
            .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
            .padding(.bottom, 8)
        }
        .buttonStyle(.plain)
    }
}

@MainActor
final class NewsPrefsModel: ObservableObject {
    @Published var topics: Set<String> = []
    @Published var regions: Set<String> = []
    @Published var delivery: String = "instant"
    @Published private(set) var isSaving = false

    struct Row { let id: String; let emoji: String; let title: LocalizedStringKey; let subtitle: LocalizedStringKey? }
    struct DRow { let id: String; let title: LocalizedStringKey; let subtitle: LocalizedStringKey }

    // Togglable rows (picks / global are locked-on, excluded here).
    static let topicRows: [Row] = [
        .init(id: "companies", emoji: "🏢", title: "Empresas y resultados", subtitle: "Ganancias, productos, movidas grandes"),
        .init(id: "economy", emoji: "🌍", title: "Economía", subtitle: "Tasas, inflación, empleo — sin jerga"),
        .init(id: "politics", emoji: "🏛️", title: "Política y regulación", subtitle: "Solo cuando mueve tu dinero"),
        .init(id: "markets", emoji: "💱", title: "Mercados y divisas", subtitle: "Bolsas, dólar, petróleo, oro"),
    ]
    static let regionRows: [Row] = [
        .init(id: "us", emoji: "🇺🇸", title: "Estados Unidos", subtitle: nil),
        .init(id: "mx", emoji: "🇲🇽", title: "México", subtitle: nil),
        .init(id: "br", emoji: "🇧🇷", title: "Brasil", subtitle: nil),
        .init(id: "in", emoji: "🇮🇳", title: "India", subtitle: nil),
        .init(id: "eu", emoji: "🇪🇺", title: "Europa", subtitle: nil),
        .init(id: "asia", emoji: "🌏", title: "Asia", subtitle: nil),
    ]
    static let deliveryRows: [DRow] = [
        .init(id: "instant", title: "Al momento", subtitle: "Push cuando pase algo que importe"),
        .init(id: "daily", title: "Resumen diario · 8:00", subtitle: "Todo lo del día en una sola notificación"),
        .init(id: "none", title: "Sin avisos", subtitle: "Lo leo cuando abra la app"),
    ]

    func binding(topic id: String) -> Binding<Bool> {
        Binding(get: { self.topics.contains(id) },
                set: { if $0 { self.topics.insert(id) } else { self.topics.remove(id) } })
    }
    func binding(region id: String) -> Binding<Bool> {
        Binding(get: { self.regions.contains(id) },
                set: { if $0 { self.regions.insert(id) } else { self.regions.remove(id) } })
    }

    struct PrefsPayload: Codable {
        let topics: [String]; let regions: [String]; let delivery: String
    }
    struct PrefsResponse: Codable { let prefs: PrefsPayload }

    func load() async {
        do {
            let resp = try await APIClient.shared.get("/api/news/prefs", as: PrefsResponse.self)
            topics = Set(resp.prefs.topics)
            regions = Set(resp.prefs.regions)
            delivery = resp.prefs.delivery
        } catch {
            // Defaults: everything on, instant.
            topics = Set(Self.topicRows.map(\.id))
            regions = Set(Self.regionRows.map(\.id))
            delivery = "instant"
        }
    }

    func save() async {
        isSaving = true
        defer { isSaving = false }
        let payload = PrefsPayload(topics: Array(topics), regions: Array(regions), delivery: delivery)
        _ = try? await APIClient.shared.put("/api/news/prefs", body: payload, as: PrefsResponse.self)
    }
}
