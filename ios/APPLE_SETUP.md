# Apple Developer Setup — Checklist

Everything that must happen in the Apple Developer Portal before the first
TestFlight build. Order matters — steps further down reference IDs created
earlier.

Account: WALLPAY (renewed 2026-04).

---

## 1. Register App IDs

At https://developer.apple.com/account/resources/identifiers/list

Create two App IDs (type: App, platform: iOS):

| Description       | Bundle ID                           | Capabilities            |
| ----------------- | ----------------------------------- | ----------------------- |
| Vectorial Data    | `com.vectorialdata.app`             | Push Notifications      |
| VD Widgets        | `com.vectorialdata.app.widgets`     | — (none)                |

For the main app ID, enable **Push Notifications** (no need to configure a
dev/prod SSL cert — we use token auth with a P8 key).

---

## 2. Create the APNs Auth Key (P8)

At https://developer.apple.com/account/resources/authkeys/list → **+**.

- Name: `Vectorial Data APNs`
- Enable **Apple Push Notifications service (APNs)**
- Download the `.p8` file **once** — you can't re-download it.
- Note the **Key ID** shown on the confirmation page (10 chars, e.g. `ABC123XYZ9`).

You'll also need the **Team ID**: top-right of the Apple Developer portal,
under your account name (10 chars).

---

## 3. Add env vars to Vercel

Project → Settings → Environment Variables. Add for **Production** (and
Preview if you want to test there too):

| Name              | Value                                                         |
| ----------------- | ------------------------------------------------------------- |
| `APNS_TEAM_ID`    | 10-char Team ID                                               |
| `APNS_KEY_ID`     | 10-char Key ID                                                |
| `APNS_P8_KEY`     | Paste the entire contents of the `.p8` file (incl. header/footer) |
| `APNS_BUNDLE_ID`  | `com.vectorialdata.app`                                       |
| `APNS_PRODUCTION` | `true`                                                        |

`APNS_P8_KEY` is multi-line: Vercel's env var UI accepts line breaks — paste
the whole `-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n`
block verbatim.

Redeploy after adding so the new vars are picked up.

Without these vars the APNs fanout in `src/app/api/cron/email-pick/approve/route.ts`
is a safe no-op.

---

## 4. Xcode signing

Open `ios/VectorialData/VectorialData.xcodeproj` in Xcode.

For both targets (`VectorialData` and `VectorialDataWidgets`):

- **Signing & Capabilities** → check **Automatically manage signing**
- **Team** → select the Wallpay team
- Bundle Identifier should match the two IDs from step 1.

The main target should show a **Push Notifications** capability (from the
entitlements file). If not, click **+ Capability** → Push Notifications.

---

## 5. Register the device for development testing (optional)

If you want to run a Debug build on a physical iPhone before TestFlight:

- Devices → **+** → paste the device UDID (from Finder → iPhone → click under
  name).
- Xcode will auto-provision on first build.

Not needed for TestFlight itself.

---

## 6. TestFlight — App Store Connect

At https://appstoreconnect.apple.com/apps → **+** → **New App**:

- Platform: iOS
- Name: `Vectorial Data`
- Primary language: English
- Bundle ID: `com.vectorialdata.app` (picked from the dropdown)
- SKU: `vectorialdata-ios`

You don't need screenshots, description, or pricing to upload a TestFlight
build — those are only required for App Store review.

---

## What you don't need yet

- **Universal Links / AASA file** — we use a custom URL scheme
  (`vectorialdata://auth`) which works without domain verification. Can add
  later for nicer deep-links.
- **App Groups** — widget doesn't share Keychain with the main app; it hits
  the public `/api/portfolio/snapshot` endpoint directly.
- **Live Activity push** — Phase 4 ships as a Lock Screen / Dynamic Island
  configuration only. Starting/updating activities from the backend can come
  in v1.1.
