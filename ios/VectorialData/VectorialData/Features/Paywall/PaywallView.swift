import SwiftUI
import StoreKit

/// Subscription sheet. Sells the single monthly plan via Apple In-App
/// Purchase ($1/mo). Presented from any paywall card.
struct PaywallView: View {
    @StateObject private var store = StoreManager.shared
    @Environment(\.dismiss) private var dismiss
    @Environment(\.openURL) private var openURL

    /// ISO 639-1 language code derived from device preferred languages.
    private var langCode: String {
        Locale.preferredLanguages.first.map { String($0.prefix(2)) } ?? "es"
    }

    private var copy: PaywallCopy { PaywallCopy.for(langCode) }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    header
                    benefitList
                    Spacer(minLength: 8)
                }
                .padding(20)
            }
            .background(Color("AppBackground").ignoresSafeArea())
            .safeAreaInset(edge: .bottom) { footer }
            .navigationTitle("")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(copy.close) { dismiss() }
                        .foregroundStyle(.white.opacity(0.7))
                }
            }
            .onChange(of: store.phase) { _, phase in
                if phase == .success { dismiss() }
            }
        }
        .task { await store.loadProduct() }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Vectorial Data Premium")
                .font(.title2.weight(.bold))
                .foregroundStyle(.white)
            Text(copy.subtitle)
                .font(.subheadline)
                .foregroundStyle(.white.opacity(0.7))
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var benefitList: some View {
        VStack(alignment: .leading, spacing: 14) {
            ForEach(copy.benefits, id: \.self) { benefit in
                HStack(alignment: .top, spacing: 10) {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundStyle(Color("BrandEmerald"))
                        .font(.body)
                    Text(benefit)
                        .font(.subheadline)
                        .foregroundStyle(.white.opacity(0.9))
                    Spacer(minLength: 0)
                }
            }
        }
    }

    private var footer: some View {
        VStack(spacing: 12) {
            if case .failed(let message) = store.phase {
                Text(message)
                    .font(.caption)
                    .foregroundStyle(.red)
                    .multilineTextAlignment(.center)
            }

            Button {
                Task { await store.purchase() }
            } label: {
                HStack {
                    if store.phase == .purchasing {
                        ProgressView().tint(.white)
                    } else {
                        Text(subscribeTitle)
                            .font(.headline)
                    }
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 15)
                .background(
                    LinearGradient(
                        colors: [Color("BrandIndigo"), Color("BrandEmerald")],
                        startPoint: .leading, endPoint: .trailing
                    )
                )
                .foregroundStyle(.white)
                .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
            }
            .disabled(isBusy)

            Button {
                Task { await store.restore() }
            } label: {
                Text(copy.restore)
                    .font(.subheadline)
                    .foregroundStyle(.white.opacity(0.7))
            }
            .disabled(isBusy)

            legalLinks
        }
        .padding(.horizontal, 20)
        .padding(.top, 12)
        .padding(.bottom, 8)
        .background(.ultraThinMaterial)
    }

    private var subscribeTitle: String {
        if let price = store.displayPrice {
            return "\(copy.subscribeCTA) — \(price)/\(copy.month)"
        }
        return copy.subscribeCTA
    }

    private var isBusy: Bool {
        store.phase == .purchasing || store.phase == .restoring
    }

    private var legalLinks: some View {
        VStack(spacing: 4) {
            Text(copy.autoRenew)
                .font(.caption2)
                .foregroundStyle(.white.opacity(0.5))
                .multilineTextAlignment(.center)
            HStack(spacing: 16) {
                Button(copy.terms) {
                    if let url = URL(string: "https://vectorialdata.com/\(langCode)/terms") {
                        openURL(url)
                    }
                }
                Button(copy.privacy) {
                    if let url = URL(string: "https://vectorialdata.com/\(langCode)/privacy") {
                        openURL(url)
                    }
                }
            }
            .font(.caption2)
            .foregroundStyle(.white.opacity(0.5))
        }
    }
}

// MARK: - Localized copy

private struct PaywallCopy {
    let close: String
    let subtitle: String
    let benefits: [String]
    let subscribeCTA: String
    let month: String
    let restore: String
    let autoRenew: String
    let terms: String
    let privacy: String

    static func `for`(_ lang: String) -> PaywallCopy {
        switch lang {
        case "en":
            return PaywallCopy(
                close: "Close",
                subtitle: "Unlock the full history and every new pick the moment it drops.",
                benefits: [
                    "Every new pick the moment it drops",
                    "The full thesis: what the company does and why we picked it",
                    "The key risk we're watching on each position",
                    "Valuation and analyst consensus",
                ],
                subscribeCTA: "Subscribe",
                month: "month",
                restore: "Restore Purchases",
                autoRenew: "Auto-renews monthly until canceled. Manage in Apple ID settings.",
                terms: "Terms",
                privacy: "Privacy"
            )
        case "pt":
            return PaywallCopy(
                close: "Fechar",
                subtitle: "Desbloqueie o histórico completo e cada nova escolha assim que é publicada.",
                benefits: [
                    "Cada nova escolha assim que é publicada",
                    "A tese completa: o que a empresa faz e por que escolhemos",
                    "O risco principal que monitoramos em cada posição",
                    "Valuation e consenso dos analistas",
                ],
                subscribeCTA: "Assinar",
                month: "mês",
                restore: "Restaurar Compras",
                autoRenew: "Renova automaticamente todo mês até o cancelamento. Gerencie nas configurações do Apple ID.",
                terms: "Termos",
                privacy: "Privacidade"
            )
        default: // es
            return PaywallCopy(
                close: "Cerrar",
                subtitle: "Desbloquea el historial completo y cada nuevo pick al momento en que se publica.",
                benefits: [
                    "Cada nuevo pick al momento en que se publica",
                    "La tesis completa: qué hace la empresa y por qué la elegimos",
                    "El riesgo clave que monitoreamos en cada posición",
                    "Valuación y consenso de analistas",
                ],
                subscribeCTA: "Suscribirse",
                month: "mes",
                restore: "Restaurar Compras",
                autoRenew: "Se renueva mensualmente hasta ser cancelada. Gestiona en la configuración del Apple ID.",
                terms: "Términos",
                privacy: "Privacidad"
            )
        }
    }
}
