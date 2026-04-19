import SwiftUI

struct MainTabView: View {
    var body: some View {
        TabView {
            HomeView()
                .tabItem { Label("Home", systemImage: "house.fill") }

            PortfolioView()
                .tabItem { Label("Portfolio", systemImage: "chart.pie.fill") }

            PicksView()
                .tabItem { Label("Picks", systemImage: "list.bullet.rectangle") }

            AccountView()
                .tabItem { Label("Account", systemImage: "person.crop.circle") }
        }
        .tint(Color("BrandEmerald"))
    }
}
