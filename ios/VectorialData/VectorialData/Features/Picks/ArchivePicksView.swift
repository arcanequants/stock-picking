import SwiftUI

/// Pre-access picks. Subscribed-only — `/api/picks/archive` returns 403
/// otherwise. Read-only: archive picks cannot be marked as bought, since
/// they were not part of the user's subscription.
struct ArchivePicksView: View {
    @State private var picks: [Pick] = []
    @State private var isLoading = false
    @State private var errorMessage: String?

    var body: some View {
        content
            .background(Color("AppBackground"))
            .navigationTitle("Archivo")
            .navigationBarTitleDisplayMode(.large)
            .task { await load() }
            .refreshable { await load() }
    }

    @ViewBuilder
    private var content: some View {
        if isLoading && picks.isEmpty {
            ProgressView()
                .frame(maxWidth: .infinity, maxHeight: .infinity)
        } else if let msg = errorMessage, picks.isEmpty {
            Text(msg)
                .font(.footnote)
                .foregroundStyle(.secondary)
                .frame(maxWidth: .infinity, maxHeight: .infinity)
        } else if picks.isEmpty {
            Text("No hay picks anteriores a tu acceso.")
                .font(.footnote)
                .foregroundStyle(.secondary)
                .frame(maxWidth: .infinity, maxHeight: .infinity)
        } else {
            ScrollView {
                LazyVStack(spacing: 10) {
                    HeaderNote()
                    ForEach(picks) { pick in
                        NavigationLink(value: pick) {
                            ArchivePickRow(pick: pick)
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(16)
            }
        }
    }

    private func load() async {
        isLoading = true
        defer { isLoading = false }
        do {
            let resp = try await APIClient.shared.get(
                "/api/picks/archive",
                as: ArchivePicksResponse.self
            )
            self.picks = resp.picks
            self.errorMessage = nil
        } catch APIError.unauthorized {
            errorMessage = "Inicia sesión otra vez."
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

private struct HeaderNote: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("Picks anteriores a tu acceso")
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(.white)
            Text("Son informativos — no estaban en tu suscripción y no aparecen en tu portafolio.")
                .font(.caption)
                .foregroundStyle(.white.opacity(0.65))
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color("CardBackground").opacity(0.6))
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
    }
}

private struct ArchivePickRow: View {
    let pick: Pick

    var body: some View {
        HStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 2) {
                HStack(spacing: 6) {
                    Text("#\(pick.pickNumber)")
                        .font(.caption).foregroundStyle(.white.opacity(0.5))
                    Text(pick.ticker)
                        .font(.headline).foregroundStyle(.white)
                }
                Text(pick.name)
                    .font(.caption).foregroundStyle(.white.opacity(0.6))
                    .lineLimit(1)
                Text(pick.date)
                    .font(.caption2).foregroundStyle(.white.opacity(0.45))
            }
            Spacer()
            Text(formatPct(pick.returnPct))
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(pick.returnPct >= 0 ? Color("BrandEmerald") : .red)
        }
        .padding(14)
        .background(Color("CardBackground"))
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
    }

    private func formatPct(_ value: Double) -> String {
        let sign = value >= 0 ? "+" : ""
        return "\(sign)\(String(format: "%.2f", value))%"
    }
}
