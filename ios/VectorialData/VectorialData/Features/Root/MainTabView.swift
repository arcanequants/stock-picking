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
        // Any incoming push tap that targets a pick or the weekly digest lands
        // in the Picks tab — that's where both flows live.
        .onChange(of: notifications.pendingPickNumber) { _, newValue in
            if newValue != nil { selectedTab = .picks }
        }
        .onChange(of: notifications.pendingWeeklyDigest) { _, newValue in
            if newValue { selectedTab = .picks }
        }
    }
}
