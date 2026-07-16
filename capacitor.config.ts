import type { CapacitorConfig } from '@capacitor/cli';

// Flightglass (svingbue) — Capacitor config for the iOS native wrapper.
//
// IMPORTANT: this project's web assets are served TWO ways:
//   1. Vercel serves this folder's ROOT directly (svingbue.vercel.app) —
//      index.html/geometry.html/impact.html + their siblings stay exactly
//      where they are for that purpose. Do not move them.
//   2. Capacitor (native iOS/Android builds) serves a COPY assembled into
//      `www/` by `npm run copy-web` (scripts/copy-web.mjs). `webDir` below
//      points at that copy, never at the repo root, so the native shell never
//      sees the mock/dev-only HTML files that litter the root folder.
//      Android CI: .github/workflows/android-debug.yml (debug APK only).
//
// No live-reload `server.url` is configured on purpose — TestFlight/App
// Store builds must be fully self-contained (no dependency on a dev machine
// being reachable), so the app always loads the bundled `www/` contents.
const config: CapacitorConfig = {
  // Flightglass retains the existing app record (ASC Apple ID 6768449250,
  // team PL9G26C26C) — the native svingbue build supersedes the React/Vite
  // previous TestFlight build. The bundle id remains unchanged for continuity.
  appId: 'no.strikearc.app',
  appName: 'Flightglass',
  webDir: 'www',
  server: {
    androidScheme: 'https',
  },
  ios: {
    contentInset: 'never',
  },
};

export default config;
