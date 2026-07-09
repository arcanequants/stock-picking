import SwiftUI

enum AppTab: Hashable {
    case home, portfolio, picks, account
}

struct MainTabView: View {
    @EnvironmentObject private var notifications: NotificationsManager
    @State private var selectedTab: AppTab = .home
    @AppStorage("vd.didFirstRunSetup") private var didFirstRunSetup = false
    @State private var showFirstRun = false
    @State private var showAmountEditor = false

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
        // First run on this device: prime notifications, then set the consistent
        // per-buy amount. Both steps are skippable and shown only once.
        .task {
            if !didFirstRunSetup {
                try? await Task.sleep(for: .seconds(0.6))
                showFirstRun = true
            }
        }
        .fullScreenCover(isPresented: $showFirstRun) {
            FirstRunSetupView {
                didFirstRunSetup = true
                showFirstRun = false
            }
        }
        // Tapping the scheduled "raise your amount" reminder opens the editor.
        .onChange(of: notifications.pendingOpenAmount) { _, open in
            if open {
                showAmountEditor = true
                notifications.pendingOpenAmount = false
            }
        }
        .sheet(isPresented: $showAmountEditor) {
            NavigationStack { InvestmentAmountView() }
        }
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

/// One-time post-signin setup: notification priming → consistent-amount setup.
private struct FirstRunSetupView: View {
    var onComplete: () -> Void
    @State private var step = 0

    var body: some View {
        ZStack {
            Color("AppBackground").ignoresSafeArea()
            switch step {
            case 0:
                NotificationPrimingView { withAnimation { step = 1 } }
            default:
                NavigationStack {
                    InvestmentAmountView(onDone: onComplete)
                }
            }
        }
    }
}
