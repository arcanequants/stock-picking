import XCTest

/// Push-tap deep-link coverage, two layers:
///
/// 1. `testInjectedNewsPushDeepLinksToDetail` — the in-app chain via the
///    DEBUG seam (`-vd.debugPendingNewsId`), deterministic.
/// 2. `testForegroundBannerTapOpensDetail` — a REAL banner tap: the HOST
///    injects a push via `xcrun simctl push` while the app is foregrounded;
///    the test taps the banner and asserts the news detail appears. This is
///    the layer the seam can't cover (didReceive parsing + delegate wiring).
///
/// Assertions use language-neutral substrings (the sim renders Spanish
/// content; asserting English text was a previous false negative).
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

        let headlineText = app.staticTexts
            .matching(NSPredicate(format: "label CONTAINS[c] %@", headline))
            .firstMatch
        XCTAssertTrue(
            headlineText.waitForExistence(timeout: 40),
            "News detail never appeared for the injected push tap"
        )
    }

    func testForegroundBannerTapOpensDetail() throws {
        let env = ProcessInfo.processInfo.environment
        let headline = env["HEADLINE"] ?? ""
        XCTAssertFalse(headline.isEmpty, "HEADLINE env var missing")

        let app = XCUIApplication()
        app.launch()
        // Past the splash; the host injects the push around now.
        Thread.sleep(forTimeInterval: 6)

        let springboard = XCUIApplication(bundleIdentifier: "com.apple.springboard")
        let banner = springboard.descendants(matching: .any)
            .matching(NSPredicate(format: "label CONTAINS[c] %@", "Vectorial Noticias"))
            .firstMatch

        var tapped = false
        for _ in 0..<25 {
            if banner.isHittable {
                banner.tap()
                tapped = true
                break
            }
            Thread.sleep(forTimeInterval: 2)
        }
        XCTAssertTrue(tapped, "The foreground banner never became tappable")

        let headlineText = app.staticTexts
            .matching(NSPredicate(format: "label CONTAINS[c] %@", headline))
            .firstMatch
        XCTAssertTrue(
            headlineText.waitForExistence(timeout: 30),
            "REAL tap did not navigate to the news detail"
        )
    }
}
