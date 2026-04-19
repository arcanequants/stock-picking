import SwiftUI

@MainActor
final class PicksViewModel: ObservableObject {
    @Published var response: PicksResponse?
    @Published var errorMessage: String?
    @Published var isLoading = false

    func load() async {
        isLoading = true
        defer { isLoading = false }
        do {
            response = try await APIClient.shared.get(
                "/api/picks",
                as: PicksResponse.self
            )
            errorMessage = nil
        } catch APIError.unauthorized {
            errorMessage = "Please sign in again"
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

struct PicksView: View {
    @StateObject private var vm = PicksViewModel()

    var body: some View {
        NavigationStack {
            ZStack {
                Color("AppBackground").ignoresSafeArea()
                content
            }
            .navigationTitle("Picks")
            .refreshable { await vm.load() }
            .task { await vm.load() }
        }
    }

    @ViewBuilder private var content: some View {
        if vm.isLoading && vm.response == nil {
            ProgressView()
        } else if let msg = vm.errorMessage, vm.response == nil {
            Text(msg).font(.footnote).foregroundStyle(.secondary)
        } else if let resp = vm.response {
            ScrollView {
                LazyVStack(spacing: 10) {
                    if !resp.isSubscribed {
                        UpsellBanner()
                    }
                    ForEach(resp.picks) { pick in
                        PickRow(pick: pick)
                    }
                }
                .padding(16)
            }
        }
    }
}

private struct PickRow: View {
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
                    .font(.caption).foregroundStyle(.white.opacity(0.65))
                    .lineLimit(1)
                Text("\(pick.date) · \(pick.sector)")
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
}

private struct UpsellBanner: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("Showing latest 3 picks")
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(.white)
            Text("Subscribe to unlock the full history and every new pick the moment it drops.")
                .font(.caption)
                .foregroundStyle(.white.opacity(0.7))
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            LinearGradient(
                colors: [Color("BrandIndigo"), Color("BrandEmerald")],
                startPoint: .leading, endPoint: .trailing
            )
            .opacity(0.25)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .stroke(Color("BrandEmerald").opacity(0.5), lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
    }
}

private func formatPct(_ value: Double) -> String {
    let sign = value >= 0 ? "+" : ""
    return "\(sign)\(String(format: "%.2f", value))%"
}
