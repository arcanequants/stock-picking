# App Store Submission Status — Vectorial Data (iOS)

App ID (ASC): `6775619461` · Bundle: `com.vectorialdata.app` · Team: `QMHJWQPS7H`

## Current

- **Version 1.0 · Build 4** → **WAITING_FOR_REVIEW** (submitted 2026-06-27)
- Fix: in-app account deletion (Apple Guideline **5.1.1(v)**) — see `APPLE_RESPONSE_account_deletion.md`.
- Review submission: `6a6df950-b3ce-45a3-b497-ee07cfd9978e`.

## History

- **Build 3 (1.0)** — REJECTED 2026-06-20 for 5.1.1(v) (no in-app account deletion). Submission `9a97e9dd-...` → canceled/COMPLETE when build 4 was resubmitted.

## How build 4 was archived, uploaded & submitted (all CLI/API, no Xcode GUI)

Signing/upload use the App Store Connect API key (no interactive Apple ID):
- Key: `~/.appstoreconnect/private_keys/AuthKey_ZR4K3YM223.p8` (key id `ZR4K3YM223`, **App Manager**)
- Issuer ID: `69a6de8a-2f80-47e3-e053-5b8c7c11a4d1`

1. `xcodegen generate` (build number lives in `project.yml` → `CURRENT_PROJECT_VERSION`).
2. `xcodebuild archive -scheme VectorialData -configuration Release -destination 'generic/platform=iOS' -archivePath build/VectorialData-1.0.4.xcarchive -allowProvisioningUpdates -authenticationKeyPath <p8> -authenticationKeyID ZR4K3YM223 -authenticationKeyIssuerID <issuer>`
3. `xcodebuild -exportArchive -archivePath <archive> -exportOptionsPlist ExportOptions.plist -exportPath build/export -allowProvisioningUpdates -authenticationKey*` — `ExportOptions.plist` has `method: app-store-connect`, `destination: upload`, so it uploads in one shot.
4. ASC API (JWT ES256 signed with the .p8): attach build 4 to the version, set App Review `notes` (PATCH only `notes` — never wipe demo creds), then resubmit.

**Gotcha — resubmitting after a rejection (UNRESOLVED_ISSUES):** the rejected `appStoreVersion` stays attached to the old review submission. Adding it to a new submission fails with `STATE_ERROR.ITEM_PART_OF_ANOTHER_SUBMISSION` until you **cancel the old submission** (`PATCH /v1/reviewSubmissions/{old} {canceled:true}` → it goes CANCELING → COMPLETE, freeing the version). Then: create new reviewSubmission → add reviewSubmissionItem (the version) → `PATCH {submitted:true}`.

## Next
- Wait for review (24–48h typical). Optional: reply in Resolution Center + attach a physical-device screen recording (not required — written notes + the build cover it).
