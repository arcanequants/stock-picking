import XCTest

/// Repro for "new picks don't show in Elecciones": fresh launch (demo
/// session already on the sim), tap the Picks tab, assert the NEWEST picks
/// (#139-143, published 2026-08-18) are present.
final class PicksFreshUITests: XCTestCase {

    func testPicksTabShowsNewestPicks() throws {
        let app = XCUIApplication()
        app.launch()

        // Past splash.
        Thread.sleep(forTimeInterval: 5)

        app.buttons["Elecciones"].firstMatch.tap()
        Thread.sleep(forTimeInterval: 2)

        // Any of the brand-new tickers should be visible near the top.
        let mara = app.staticTexts["MARA"].firstMatch
        let mcd = app.staticTexts["MCD"].firstMatch
        let found = mara.waitForExistence(timeout: 20) || mcd.waitForExistence(timeout: 5)

        if !found {
            // Scroll once in case the pending section sits lower.
            app.swipeUp()
            Thread.sleep(forTimeInterval: 1)
        }
        XCTAssertTrue(
            found || mara.exists || mcd.exists,
            "Los picks nuevos (#139-143) no aparecen en Elecciones"
        )
    }
}
