import XCTest

/// Drives the real app through demo sign-in and captures a screenshot of each
/// coach-tour step so the spotlight geometry can be tuned against the actual
/// iOS 26 tab bar. Not shipped — dev verification only.
final class CoachTourUITests: XCTestCase {

    @MainActor
    func testCaptureCoachTourSteps() throws {
        let app = XCUIApplication()
        // Skip first-run setup so the tour fires right after sign-in; run in es.
        app.launchArguments += [
            "-vd.didFirstRunSetup", "YES",
            "-vd.didCoachTour", "NO",
            "-AppleLanguages", "(es)",
            "-AppleLocale", "es_MX",
        ]
        app.launch()

        // A previous run leaves the demo session in the Keychain — the app then
        // boots straight into MainTabView. Only sign in when onboarding shows.
        if !app.tabBars.firstMatch.waitForExistence(timeout: 10) {
            // Splash → onboarding: the splash overlay eats taps for a few
            // seconds, so retry until AuthView shows.
            let signInHatch = app.buttons["Iniciar sesión"].firstMatch
            XCTAssertTrue(signInHatch.waitForExistence(timeout: 15), "onboarding sign-in button not found")
            let email = app.textFields.firstMatch
            for _ in 0..<8 where !email.exists {
                if signInHatch.exists { signInHatch.tap() }
                _ = email.waitForExistence(timeout: 3)
            }
            XCTAssertTrue(email.exists, "email field not found")
            email.tap()
            email.typeText("demo@vectorialdata.com")

            let password = app.secureTextFields.firstMatch
            XCTAssertTrue(password.waitForExistence(timeout: 5), "password field not found")
            password.tap()
            password.typeText("123456789")

            let submit = app.buttons["Iniciar sesión"].firstMatch
            XCTAssertTrue(submit.waitForExistence(timeout: 5))
            submit.tap()
        }

        // Signed in → MainTabView; tour fires ~0.8s later.
        let tabBar = app.tabBars.firstMatch
        XCTAssertTrue(tabBar.waitForExistence(timeout: 20), "tab bar never appeared — sign-in failed?")

        // Dismiss the system "Save Password?" sheet if it shows up.
        let springboard = XCUIApplication(bundleIdentifier: "com.apple.springboard")
        let notNow = springboard.buttons["Not Now"].firstMatch
        if notNow.waitForExistence(timeout: 4) { notNow.tap() }

        let skip = app.buttons["Saltar"].firstMatch
        XCTAssertTrue(skip.waitForExistence(timeout: 10), "coach tour never appeared")

        // Capture the 4 steps; tap-anywhere advances.
        for step in 1...4 {
            sleep(2) // let data/tab-switch/animation settle
            attach(app, name: "tour-step\(step)")
            if step == 2 {
                // Real geometry to tune the spotlight rects against.
                var s = "window: \(app.windows.firstMatch.frame)\n"
                let tabs = app.tabBars.firstMatch
                s += "tabBar: \(tabs.frame)\n"
                for b in tabs.buttons.allElementsBoundByIndex {
                    s += "tab[\(b.label)]: \(b.frame)\n"
                }
                s += "\n\(app.debugDescription)"
                let att = XCTAttachment(string: s)
                att.name = "frames"
                att.lifetime = .keepAlways
                add(att)
            }
            if step < 4 {
                app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.45)).tap()
            }
        }

        // Final tap finishes the tour.
        app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.45)).tap()
        sleep(1)
        attach(app, name: "after-tour")
    }

    /// Shell localization smoke test: under English, no Spanish leaks on the
    /// main screens (nav title, section headers).
    @MainActor
    func testEnglishShellLocalized() throws {
        let app = XCUIApplication()
        app.launchArguments += [
            "-vd.didFirstRunSetup", "YES",
            "-vd.didCoachTour", "YES",
            "-AppleLanguages", "(en)",
            "-AppleLocale", "en_US",
        ]
        app.launch()
        let tabs = app.tabBars.firstMatch
        XCTAssertTrue(tabs.waitForExistence(timeout: 20), "not signed in? run the tour test first")

        // The launch splash eats taps for a few seconds — retry until the
        // picks content actually shows.
        let pendingHeader = app.staticTexts["PENDING"].firstMatch
        for _ in 0..<6 where !pendingHeader.exists {
            tabs.buttons.element(boundBy: 2).tap()
            _ = pendingHeader.waitForExistence(timeout: 3)
        }
        XCTAssertTrue(pendingHeader.exists,
                      "PENDING header missing — Spanish leaking into en?")
        XCTAssertTrue(app.navigationBars["Vectorial Picks"].firstMatch.waitForExistence(timeout: 5),
                      "nav title not localized")
        attach(app, name: "en-picks")

        for (index, name) in [(3, "en-account"), (1, "en-portfolio"), (0, "en-home")] {
            tabs.buttons.element(boundBy: index).tap()
            sleep(1)
            attach(app, name: name)
        }
    }

    /// The real new-user sequence: first-run setup completes → tour fires by
    /// itself. Run with app defaults cleared and NO launch-arg pins.
    @MainActor
    func testNaturalFirstRunThenTour() throws {
        let app = XCUIApplication()
        app.launchArguments += ["-AppleLanguages", "(es)", "-AppleLocale", "es_MX"]
        app.launch()

        // Trial step (if subscription state hasn't resolved) and notification
        // priming both exit via "Ahora no".
        let guardar = app.buttons["Guardar mi monto"].firstMatch
        for _ in 0..<3 where !guardar.exists {
            let ahoraNo = app.buttons["Ahora no"].firstMatch
            if ahoraNo.waitForExistence(timeout: 15) { ahoraNo.tap() }
            _ = guardar.waitForExistence(timeout: 5)
        }
        XCTAssertTrue(guardar.exists, "amount step never showed")
        guardar.tap()

        let skip = app.buttons["Saltar"].firstMatch
        XCTAssertTrue(skip.waitForExistence(timeout: 10), "tour did not auto-fire after first-run")
        sleep(1)
        attach(app, name: "auto-tour-after-firstrun")
        skip.tap()
    }

    @MainActor
    private func attach(_ app: XCUIApplication, name: String) {
        let shot = XCTAttachment(screenshot: app.screenshot())
        shot.name = name
        shot.lifetime = .keepAlways
        add(shot)
    }
}
