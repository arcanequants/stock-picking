# Vectorial Data — Android

Native Android client for Vectorial Data (Stock Picking), a 1:1 port of the
SwiftUI iOS app in `../ios`. Thin client over the shared `vectorialdata.com`
backend — **zero new endpoints owned by the app**.

## Stack
- **Kotlin 2.0** + **Jetpack Compose** (Material 3, dark-only)
- **OkHttp** + **kotlinx.serialization** (snake_case) — mirrors the iOS `APIClient`
- **EncryptedSharedPreferences** (Android Keystore) — mirrors the iOS Keychain
- Coroutines + StateFlow — mirrors `@MainActor ObservableObject`
- `applicationId = com.vectorialdata.app` (debug suffix `.debug`), `minSdk 26`, `targetSdk 34`

## Architecture (mirrors iOS folders)
```
core/config   AppConfig            (base URL, scheme, client id)
core/net      ApiClient            (== APIClient.swift)
core/auth     AuthManager          (== AuthManager.swift: magic-link/OTP/demo/refresh)
              SecureStore          (== KeychainHelper.swift)
core/model    UserProfile, Pick…   (== Core/Models/*.swift)
feature/*     root, auth, home, portfolio, picks, news, account, paywall
ui/theme      Theme.kt             (brand palette from iOS asset catalog)
```

## Build (headless — no Android Studio required)
Toolchain is a no-sudo local install:
- JDK 17 → `~/Library/Java/jdk-home`
- Android SDK → `~/Library/Android/sdk` (platform 34 + build-tools 34.0.0)

```sh
cd android
JAVA_HOME=~/Library/Java/jdk-home ANDROID_HOME=~/Library/Android/sdk \
  ./gradlew :app:assembleDebug
```
APK lands in `app/build/outputs/apk/debug/`.

## Milestones
- **M1 — Shell + Auth** ✅ — app shell, 4-tab nav, `ApiClient`,
  `AuthManager` (magic-link + OTP + demo-login + refresh), encrypted token store,
  `vectorialdata://auth` deep link, Account tab (identity + sign out + delete account).
- **M2 — Picks + Home** ✅ — Home dashboard (`/api/portfolio/snapshot`, Vectorial-vs-S&P
  chart from `/api/portfolio/history`, "TU PORTAFOLIO" personal card `?view=personal`,
  quick stats + latest pick + market status), Picks feed (`/api/picks`,
  PENDIENTES/HISTORIAL), pick detail (`/api/picks/research/{ticker}`: mom-override
  one-liner, "LO IMPORTANTE" pills, accordions, dividends), decision flow + buy sheet
  (`/api/picks/{n}/decision`, default investment). Weekly digest deferred to M5 (its only
  entry point is a push). Paywall/upsell hands off to web until M6 (Play Billing).
- **M3 — Portfolio** — positions, allocation, dividends, portfolio history chart.
- **M4 — News** — `/api/news` list + detail.
- **M5 — Push (FCM)** — device registration (`/api/notifications/register-device`,
  `platform=android`). **Backend gap:** add an FCM sender branched by platform
  (today only `src/lib/apns.ts` exists).
- **M6 — Billing** — Google Play Billing + subscription verify.
  **Backend gap:** add a Play-purchase verification endpoint (today `/api/iap/verify`
  is Apple-JWS-only).
- **M7 — i18n (es/en/pt), Play Store assets, release signing, submission.**

## Backend deltas Android needs (tracked, not yet built)
1. **FCM push sender** — branch `device_tokens.platform` in the notification cron/senders.
2. **Play Billing verify endpoint** — Google Play Developer API receipt validation.
3. ~~**Magic-link Android branch**~~ ✅ done — `magic-link/route.ts` emits
   `vectorialdata://` for `client === "ios" | "android"`.
