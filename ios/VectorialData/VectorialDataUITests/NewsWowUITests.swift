import XCTest

/// Visual verification of Vectorial Noticias v2 against the local mock backend
/// (scratchpad/mock-news-server.mjs on :8799). Signs in with demo, opens the
/// news feed and screenshots the feed, the explainer detail, the AI chat, and
/// "Tu mezcla" prefs. Dev-only.
final class NewsWowUITests: XCTestCase {

    @MainActor
    func testCaptureNewsWow() throws {
        let app = XCUIApplication()
        app.launchEnvironment["VD_API_BASE_URL"] = "http://localhost:8799"
        app.launchArguments += [
            "-vd.didFirstRunSetup", "YES",
            "-vd.didCoachTour", "YES",
            "-AppleLanguages", "(es)",
            "-AppleLocale", "es_MX",
        ]
        app.launch()

        // Sign in with the demo credentials if onboarding shows.
        if !app.tabBars.firstMatch.waitForExistence(timeout: 8) {
            let hatch = app.buttons["Iniciar sesión"].firstMatch
            XCTAssertTrue(hatch.waitForExistence(timeout: 15))
            let email = app.textFields.firstMatch
            for _ in 0..<8 where !email.exists {
                if hatch.exists { hatch.tap() }
                _ = email.waitForExistence(timeout: 3)
            }
            email.tap(); email.typeText("demo@vectorialdata.com")
            let pw = app.secureTextFields.firstMatch
            pw.tap(); pw.typeText("123456789")
            app.buttons["Iniciar sesión"].firstMatch.tap()
            let sb = XCUIApplication(bundleIdentifier: "com.apple.springboard")
            let notNow = sb.buttons["Not Now"].firstMatch
            if notNow.waitForExistence(timeout: 4) { notNow.tap() }
        }
        XCTAssertTrue(app.tabBars.firstMatch.waitForExistence(timeout: 20), "not signed in")

        // Open Noticias via the Home news card (title "NOTICIAS").
        let home = app.tabBars.buttons.element(boundBy: 0)
        home.tap()
        let newsCard = app.staticTexts["NOTICIAS"].firstMatch
        XCTAssertTrue(newsCard.waitForExistence(timeout: 10), "news card not found on Home")
        newsCard.tap()

        // Feed.
        let feedHeadline = app.staticTexts["EE.UU. hizo más barato pedir dinero"].firstMatch
        XCTAssertTrue(feedHeadline.waitForExistence(timeout: 10), "news feed did not load")
        sleep(1)
        shot(app, "news-1-feed")

        // Explainer detail — NavigationLink(value:) with .buttonStyle(.plain)
        // isn't reliably hittable via .tap(); a window-coordinate tap on the
        // card lands inside the link and pushes the destination.
        // The whole row is a Button with a combined accessibility label.
        let cardButton = app.buttons.containing(
            NSPredicate(format: "label CONTAINS %@", "primera bajada del año")
        ).firstMatch
        XCTAssertTrue(cardButton.waitForExistence(timeout: 4), "news card button not found")
        // .tap() on a plain-styled NavigationLink row sometimes no-ops; a
        // hit-point coordinate tap reliably activates it.
        cardButton.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5)).tap()
        let block = app.staticTexts["QUÉ PASÓ"].firstMatch
        XCTAssertTrue(block.waitForExistence(timeout: 8), "explainer blocks not rendered")
        sleep(1)
        shot(app, "news-2-detail")

        // AI chat.
        let ask = app.buttons["Pregúntale a la IA"].firstMatch
        XCTAssertTrue(ask.waitForExistence(timeout: 6))
        ask.tap()
        let suggestion = app.buttons["¿Cómo me afecta a mí?"].firstMatch
        XCTAssertTrue(suggestion.waitForExistence(timeout: 8), "chat did not open")
        sleep(1)
        shot(app, "news-3-chat-empty")
        suggestion.tap()
        sleep(3) // wait for the mock reply
        shot(app, "news-4-chat-reply")
        // Close chat.
        app.buttons["Cerrar"].firstMatch.tap()

        // Prefs ("Tu mezcla") via the feed toolbar gear.
        let back = app.navigationBars.buttons.element(boundBy: 0)
        if back.exists { back.tap() }
        let gear = app.buttons["Tu mezcla"].firstMatch
        XCTAssertTrue(gear.waitForExistence(timeout: 8), "prefs gear not found")
        gear.tap()
        let temas = app.staticTexts["TEMAS"].firstMatch
        XCTAssertTrue(temas.waitForExistence(timeout: 8), "prefs screen not shown")
        sleep(1)
        shot(app, "news-5-prefs")
    }

    @MainActor
    private func shot(_ app: XCUIApplication, _ name: String) {
        let a = XCTAttachment(screenshot: app.screenshot())
        a.name = name
        a.lifetime = .keepAlways
        add(a)
    }
}
