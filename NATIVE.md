# Flightglass — Native (iOS) packaging

This folder is **both**:

1. The live static web app served by Vercel at `svingbue.vercel.app`
   (root-served — `index.html`, `geometry.html`, `impact.html`, and every
   sibling dev/mock HTML file, `vendor/`, `assets/`, `geo3d/`, etc. stay
   exactly where they are for that purpose. Nothing about that changes.)
2. The source for a Capacitor-wrapped **native iOS app**, built and shipped
   to TestFlight entirely by Codemagic (cloud Mac) — this machine is
   Windows, so nothing native-Xcode-shaped is ever generated or run here.

- **App ID:** `no.strikearc.app` (retains the existing app record, ASC Apple
  ID `6768449250`; the external store-name update is a separate release step;
  supersedes the React/Vite
  `strikearc-3.0` build on TestFlight — decided 2026-07-03)
- **App name:** Flightglass
- **Apple Team ID:** `PL9G26C26C`
- **ASC API key:** reuses the existing `ryddy-asc-key` (Key ID `JQVPW4D944`)

## How the two uses coexist (`www/` approach)

Capacitor needs a `webDir` to bundle into the native binary. Pointing it at
the repo root would ship every throwaway mock (`app-mock-*.html`,
`*-glass.html`, `design-system-*.html`, `club-calibration.html`, etc.) inside
the App Store build, which we don't want. Instead:

- `scripts/copy-web.mjs` (`npm run copy-web`) assembles a **disposable**
  `www/` folder containing only: `index.html`, `geometry.html`,
  `impact.html`, every top-level `*.js`/`*.css`, and the `vendor/`,
  `assets/`, `geo3d/` directories. It deletes and recreates `www/` on every
  run, so it's always a clean, current mirror of the shipping pages.
- `capacitor.config.ts` sets `webDir: 'www'` — Capacitor only ever sees that
  clean copy, never the repo root.
- `www/` is gitignored; it's a build artifact, not source.
- The Vercel deployment is untouched — it still serves the repo root
  directly and knows nothing about `www/`, Capacitor, or any of this.

## Why there's no `ios/` folder here

`npx cap add ios` requires Xcode/macOS tooling that doesn't exist on
Windows. That step runs **only** on Codemagic's `mac_mini_m2` instance, as
the first scripted step of the `ios-testflight` workflow in
`codemagic.yaml`. The generated `ios/` project is never committed — every
CI run regenerates it from scratch, then:

1. Patches `ios/App/App/Info.plist` for landscape-only orientation +
   display name (`scripts/ios-landscape.mjs`).
2. Generates app icons/launch images from `resources/icon.png` /
   `resources/splash.png` via `npx @capacitor/assets generate --ios`.
3. Runs `npx cap sync ios` + `pod install`.
4. Sets the build number, signs, archives, and publishes to TestFlight.

## Files in this scaffold

| File | Purpose |
|---|---|
| `package.json` | Capacitor CLI + core/ios/android/app/haptics/screen-orientation deps, `copy-web`/`sync`/`sync:android` scripts |
| `capacitor.config.ts` | `appId`, `appName`, `webDir: 'www'`, no live-reload server |
| `scripts/copy-web.mjs` | Assembles `www/` (allowlist HTML + dirs, denylist mocks/tooling) |
| `scripts/ios-landscape.mjs` | Patches `Info.plist` post-`cap add ios` (landscape-only, full screen, display name) |
| `resources/icon.svg`, `resources/icon.png` (1024²) | App icon source (cyan swing-arc + ball on near-black field) |
| `resources/splash.svg`, `resources/splash.png` (2732²) | Launch screen source |
| `codemagic.yaml` | `ios-testflight` workflow: npm ci → copy-web → cap add ios → plist patch → assets generate → cap sync → pod install → build number → sign → build ipa → publish to TestFlight |
| `.gitignore` | Ignores `node_modules/`, `www/`, generated `ios/` artifacts, build outputs |

## Android (debug APK via GitHub Actions)

Mirrors the iOS approach: the `android/` platform dir is **never
committed** — `.github/workflows/android-debug.yml` regenerates it fresh on
every push to `main` (`npx cap add android`), then:

1. Patches `android/app/src/main/AndroidManifest.xml` for landscape-only
   (`android:screenOrientation="sensorLandscape"` on `.MainActivity`) via
   `scripts/android-landscape.mjs`.
2. Generates icons/splash from `resources/` (`--assetPath resources` —
   required because the repo root's `assets/` dir is the tool's default).
3. Builds an **unsigned debug APK** (`gradlew assembleDebug`) and uploads it
   as the `strikearc-android-debug` artifact (14-day retention).

Deliberately out of scope until launch: keystore signing, Play Console
listing, release publish (Sivert-only external steps). iOS CI stays on
Codemagic; Android CI is GitHub Actions to keep Codemagic minutes for iOS.

## Setup status (2026-07-03) — nothing manual left

Because this build **takes over the existing `no.strikearc.app` record**,
every account-side resource already exists — there are no manual Apple or
Codemagic setup steps remaining:

1. ✅ **ASC API key integration** — reuses the existing team-level
   `ryddy-asc-key` (Key ID `JQVPW4D944`), already connected under Codemagic
   → Team settings → Integrations → Developer Portal. `codemagic.yaml`
   references it by name only; no secrets live in this repo.
2. ✅ **GitHub repo connected** — `Fenral/svingbue` added as an iOS app in
   Codemagic.
3. ✅ **App ID `no.strikearc.app`** — already registered under team
   `PL9G26C26C` (created for strikearc-3.0).
4. ✅ **App Store Connect app record** — already exists (Apple ID
   `6768449250`; store-name metadata is updated separately). Automatic signing
   (`fetch-signing-files … --create`) refreshes the cert/profile each run.
5. **Trigger the `ios-testflight` workflow** — push to `main` (auto-trigger)
   or start it manually from the Codemagic dashboard.

The build number is set to **one above the latest TestFlight build** on the
record (queried live via `get-latest-testflight-build-number`), so the
native build always registers as the newest one for testers regardless of
strikearc-3.0's separate build counter.

Everything (dependency install, `www/` assembly, iOS project generation,
orientation/display-name patch, export-compliance answer, icon/splash
generation, pod install, build numbering, cert-quota maintenance, code
signing, archive, and TestFlight upload) is fully automated by
`codemagic.yaml`.
