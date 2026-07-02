# StrikeArc — Native (iOS) packaging

This folder is **both**:

1. The live static web app served by Vercel at `svingbue.vercel.app`
   (root-served — `index.html`, `geometry.html`, `impact.html`, and every
   sibling dev/mock HTML file, `vendor/`, `assets/`, `geo3d/`, etc. stay
   exactly where they are for that purpose. Nothing about that changes.)
2. The source for a Capacitor-wrapped **native iOS app**, built and shipped
   to TestFlight entirely by Codemagic (cloud Mac) — this machine is
   Windows, so nothing native-Xcode-shaped is ever generated or run here.

- **App ID:** `no.svingbue.app`
- **App name:** StrikeArc
- **Apple Team ID:** `PL9G26C26C`

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
| `package.json` | Capacitor CLI + core/ios/app/haptics/screen-orientation deps, `copy-web`/`sync` scripts |
| `capacitor.config.ts` | `appId`, `appName`, `webDir: 'www'`, no live-reload server |
| `scripts/copy-web.mjs` | Assembles `www/` (allowlist HTML + dirs, denylist mocks/tooling) |
| `scripts/ios-landscape.mjs` | Patches `Info.plist` post-`cap add ios` (landscape-only, full screen, display name) |
| `resources/icon.svg`, `resources/icon.png` (1024²) | App icon source (cyan swing-arc + ball on near-black field) |
| `resources/splash.svg`, `resources/splash.png` (2732²) | Launch screen source |
| `codemagic.yaml` | `ios-testflight` workflow: npm ci → copy-web → cap add ios → plist patch → assets generate → cap sync → pod install → build number → sign → build ipa → publish to TestFlight |
| `.gitignore` | Ignores `node_modules/`, `www/`, generated `ios/` artifacts, build outputs |

## What you (the user) still need to do manually

Nothing in this scaffold can create Codemagic/Apple Developer account
resources from a local machine — these are one-time setup steps in the
Codemagic dashboard and Apple Developer / App Store Connect:

1. **Create an App Store Connect API key integration named `app_store_connect`**
   in Codemagic (Team settings → Integrations → App Store Connect → add
   key, generated from App Store Connect → Users and Access → Integrations
   → App Store Connect API). `codemagic.yaml` references this integration
   by name only — no secret values live in this repo.
2. **Connect the `Fenral/svingbue` GitHub repo to Codemagic** (Add
   application → select the repo) so `codemagic.yaml` is picked up.
3. **Create the App ID `no.svingbue.app`** under Apple Developer Team
   `PL9G26C26C` (Certificates, Identifiers & Profiles → Identifiers), if it
   doesn't already exist — automatic signing can create the certificate/
   profile, but not the App ID itself.
4. **Create the App Store Connect app record** for `no.svingbue.app` (My
   Apps → "+" → New App, platform iOS, name "StrikeArc") — the TestFlight
   publish step needs this to exist before the first submission succeeds.
5. **Trigger the `ios-testflight` workflow** — push to `main`, or start it
   manually from the Codemagic dashboard — once 1–4 are done.

Everything else (dependency install, `www/` assembly, iOS project
generation, orientation/display-name patch, icon/splash generation, pod
install, build numbering, code signing, archive, and TestFlight upload) is
fully automated by `codemagic.yaml`.
