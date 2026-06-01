import SwiftUI
import StoreKit

/// Subscription sheet. Sells the single monthly plan via Apple In-App
/// Purchase ($1/mo). Presented from any paywall card.
struct PaywallView: View {
    @StateObject private var store = StoreManager.shared
    @Environment(\.dismiss) private var dismiss
    @Environment(\.openURL) private var openURL

    private let benefits = [
        "Every new pick the moment it drops",
        "The full thesis: what the company does and why we picked it",
        "The key risk we're watching on each position",
        "Valuation and analyst consensus",
    ]

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
                    Button("Cerrar") { dismiss() }
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
            Text("Unlock the full history and every new pick the moment it drops.")
                .font(.subheadline)
                .foregroundStyle(.white.opacity(0.7))
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var benefitList: some View {
        VStack(alignment: .leading, spacing: 14) {
            ForEach(benefits, id: \.self) { benefit in
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
                Text("Restore Purchases")
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
            return "Subscribe — \(price)/month"
        }
        return "Subscribe"
    }

    private var isBusy: Bool {
        store.phase == .purchasing || store.phase == .restoring
    }

    private var legalLinks: some View {
        VStack(spacing: 4) {
            Text("Auto-renews monthly until canceled. Manage or cancel anytime in your Apple ID settings.")
                .font(.caption2)
                .foregroundStyle(.white.opacity(0.5))
                .multilineTextAlignment(.center)
            HStack(spacing: 16) {
                Button("Terms") {
                    if let url = URL(string: "https://vectorialdata.com/terms") { openURL(url) }
                }
                Button("Privacy") {
                    if let url = URL(string: "https://vectorialdata.com/privacy") { openURL(url) }
                }
            }
            .font(.caption2)
            .foregroundStyle(.white.opacity(0.5))
        }
    }
}
