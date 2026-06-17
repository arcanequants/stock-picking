import SwiftUI

enum AppTab: Hashable {
    case home, portfolio, picks, account
}

struct MainTabView: View {
    @EnvironmentObject private var notifications: NotificationsManager
    @State private var selectedTab: AppTab = .home

    var body: some View {
        TabView(selection: $selectedTab) {
            HomeView()
                .tabItem { Label("Home", systemImage: "house.fill") }
                .tag(AppTab.home)

            PortfolioView()
                .tabItem { Label("Portfolio", systemImage: "chart.pie.fill") }
                .tag(AppTab.portfolio)

            PicksView()
                .tabItem { Label("Picks", systemImage: "list.bullet.rectangle") }
                .tag(AppTab.picks)

            AccountView()
                .tabItem { Label("Account", systemImage: "person.crop.circle") }
                .tag(AppTab.account)
        }
        .tint(Color("BrandEmerald"))
        .onOpenURL { url in
            let components = URLComponents(url: url, resolvingAgainstBaseURL: false)
            // vectorialdata://tab?name=picks|portfolio|home|account
            if url.host == "tab", let name = components?.queryItems?.first(where: { $0.name == "name" })?.value {
                switch name {
                case "picks":     selectedTab = .picks
                case "portfolio": selectedTab = .portfolio
                case "account":   selectedTab = .account
                default:          selectedTab = .home
                }
            // vectorialdata://pick?number=<pickNumber>
            } else if url.host == "pick",
                      let numStr = components?.queryItems?.first(where: { $0.name == "number" })?.value,
                      let num = Int(numStr) {
                notifications.pendingPickNumber = num
                selectedTab = .picks
            // vectorialdata://paywall
            } else if url.host == "paywall" {
                notifications.pendingShowPaywall = true
                selectedTab = .picks
            }
        }
        // A push tapped while the app was killed sets the pending payload
        // before this view mounts, so `.onChange` never fires for it. Read the
        // current values once on appear to catch the cold-launch case.
        .task { routeToPendingTab() }
        // Any incoming push tap that targets a pick or the weekly digest lands
        // in the Picks tab — that's where both flows live.
        .onChange(of: notifications.pendingPickNumber) { _, _ in routeToPendingTab() }
        .onChange(of: notifications.pendingWeeklyDigest) { _, _ in routeToPendingTab() }
        // News pushes deep-link into the Home tab — that's where the
        // news entry card and detail navigation live.
        .onChange(of: notifications.pendingNewsId) { _, _ in routeToPendingTab() }
    }

    private func routeToPendingTab() {
        if notifications.pendingNewsId != nil {
            selectedTab = .home
        } else if notifications.pendingPickNumber != nil || notifications.pendingWeeklyDigest {
            selectedTab = .picks
        }
    }
}
