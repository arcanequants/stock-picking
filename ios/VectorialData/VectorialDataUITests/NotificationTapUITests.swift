import XCTest

/// Verifies the push-tap deep-link chain end-to-end without springboard
/// automation (cover-sheet taps aren't reliably automatable on iOS 26):
/// `-vd.debugPendingNewsId` (DEBUG-only seam in NotificationsManager.init)
/// injects the pending news id at the exact point a real cold-launch tap's
/// `didReceive` would — everything downstream (MainTabView tab switch →
/// HomeView list+detail navigation → NewsDetailView render) runs identically.
///
/// The two pieces this doesn't cover are intentionally tiny and reviewed:
/// didReceive's userInfo parsing (5 lines) and the delegate-at-launch
/// ordering (AppDelegate; Apple's documented contract), covered by device QA.
///
/// Requires: sim signed in (demo) and NEWS_ID/HEADLINE env vars pointing at
/// a real feed item:
///   TEST_RUNNER_NEWS_ID=<uuid> TEST_RUNNER_HEADLINE=<substring> \
///     xcodebuild test -only-testing:VectorialDataUITests/NotificationTapUITests
final class NotificationTapUITests: XCTestCase {

    func testInjectedNewsPushDeepLinksToDetail() throws {
        let env = ProcessInfo.processInfo.environment
        let newsId = env["NEWS_ID"] ?? ""
        let headline = env["HEADLINE"] ?? ""
        XCTAssertFalse(newsId.isEmpty, "NEWS_ID env var missing")
        XCTAssertFalse(headline.isEmpty, "HEADLINE env var missing")

        let app = XCUIApplication()
        app.launchArguments += ["-vd.debugPendingNewsId", newsId]
        app.launch()

        // Splash (~4s) → MainTabView routes to Home → HomeView loads the
        // feed and pushes list + detail. The detail shows the headline.
        let headlineText = app.staticTexts
            .matching(NSPredicate(format: "label CONTAINS[c] %@", headline))
            .firstMatch
        XCTAssertTrue(
            headlineText.waitForExistence(timeout: 40),
            "News detail never appeared for the injected push tap"
        )
    }
}
