import SwiftUI

enum AppTab: Hashable {
    case home, portfolio, picks, account
}

struct MainTabView: View {
    @EnvironmentObject private var notifications: NotificationsManager
    @Environment(\.vdSplashDone) private var splashDone
    @State private var selectedTab: AppTab = .home
    @AppStorage("vd.didFirstRunSetup") private var didFirstRunSetup = false
    @AppStorage("vd.didCoachTour") private var didCoachTour = false
    @State private var showFirstRun = false
    @State private var showTour = false
    @State private var showAmountEditor = false
    @State private var coachTargets: [String: CGRect] = [:]

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
        // Waits for the splash: a cover presented while the scene is still
        // activating behind it is silently dropped on cold launches.
        .task(id: splashDone) {
            if splashDone && !didFirstRunSetup {
                try? await Task.sleep(for: .seconds(0.4))
                showFirstRun = true
            }
        }
        .fullScreenCover(isPresented: $showFirstRun) {
            FirstRunSetupView {
                didFirstRunSetup = true
                showFirstRun = false
            }
        }
        // Coach-marks tour: once, right after first-run setup finishes (or on
        // this launch if setup already happened). "Ver tutorial" in Cuenta
        // flips didCoachTour back to false to replay it.
        .task(id: "\(showFirstRun)-\(splashDone)") {
            guard splashDone, didFirstRunSetup, !didCoachTour, !showFirstRun else { return }
            try? await Task.sleep(for: .seconds(0.8))
            withAnimation { showTour = true }
        }
        .onChange(of: didCoachTour) { _, done in
            if !done && didFirstRunSetup && !showFirstRun {
                withAnimation { showTour = true }
            }
        }
        // Spotlighted views report their global frames; keep the last known
        // value so a tab switch mid-tour doesn't drop the rect.
        .onPreferenceChange(CoachTargetKey.self) { targets in
            Task { @MainActor in
                coachTargets.merge(targets) { $1 }
            }
        }
        .overlay {
            if showTour {
                CoachTourView(
                    onSelectTab: { selectedTab = $0 },
                    onFinished: {
                        didCoachTour = true
                        withAnimation { showTour = false }
                    },
                    firstCardFrame: coachTargets["first-pick"]
                )
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

/// One-time post-signin setup: Apple trial activation → notification priming →
/// consistent-amount setup. Skipping any step is always possible.
private struct FirstRunSetupView: View {
    @EnvironmentObject private var pickStatus: PickStatusStore
    var onComplete: () -> Void
    @State private var step = 0

    var body: some View {
        ZStack {
            Color("AppBackground").ignoresSafeArea()
            switch step {
            case 0:
                // Already-subscribed accounts (web Stripe or a previous Apple
                // sub restored) skip straight to notifications.
                if pickStatus.isSubscribed {
                    Color("AppBackground").onAppear { step = 1 }
                } else {
                    TrialActivationView { withAnimation { step = 1 } }
                }
            case 1:
                NotificationPrimingView { withAnimation { step = 2 } }
            default:
                NavigationStack {
                    InvestmentAmountView(onDone: onComplete)
                }
            }
        }
    }
}
