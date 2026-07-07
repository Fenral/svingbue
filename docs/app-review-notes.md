# App Review notes — StrikeArc (no.strikearc.app, Apple ID 6768449250)

Paste the block below into **App Store Connect → StrikeArc → the version being
submitted → App Review Information → Notes**. (This is set per-version in the
ASC web UI — it is NOT part of codemagic.yaml; the CI publishing block at
codemagic.yaml:191-198 only submits builds to TestFlight.)

```
REVIEWER NOTES — StrikeArc

ORIENTATION
- The app is LANDSCAPE-ONLY by design (it is a swing/ball-flight instrument).
  Hold the device in landscape; in portrait a "Rotate your phone to landscape"
  prompt is shown.

ACCOUNT
- No account, sign-in, or demo credentials are required. All features work
  offline after install.

FREE TIER / PAYWALL
- The app is free for the first 10 played shots (a "shot" = playing a ball
  flight on the "See the Shot" screen or playing a swing on the "Swing
  Geometry" screen). After 10 shots, a hard paywall offers StrikeArc Pro.

HOW TO REACH THE PAYWALL IMMEDIATELY (tester shortcut)
1. From the home menu, open either instrument screen ("See the Shot" or
   "Swing Geometry").
2. PRESS AND HOLD the round "?" Help button for about 2 seconds
   ("See the Shot": top-right corner; "Swing Geometry": right-hand control
   rail). The paywall opens directly.
   With VoiceOver on: double-tap and hold the "?" button for about 2 seconds.
3. This shortcut only opens the same paywall screen normal users see at the
   10-shot limit — it does not alter pricing, entitlements, or the purchase
   flow.

IN-APP PURCHASES (RevenueCat + StoreKit)
- strikearc_pro_monthly  — auto-renewable subscription, 1 month
- strikearc_pro_annual   — auto-renewable subscription, 1 year
- strikearc_pro_lifetime — non-consumable (one-time)
- "Restore Purchases", Terms of Use (EULA) and Privacy Policy links are in the
  paywall's bottom row.
```

## Pre-submission checklist (Sivert — outside this repo)
- [ ] Create the RevenueCat "StrikeArc" project and replace the placeholder
      keys in sa-iap.js:42-43 (`appl_REPLACE_ME` / `goog_REPLACE_ME`). Until
      then the paywall shows fallback prices (kr 59 / 149 / 349) and purchase
      taps show "Purchase didn't complete — please try again." — fine for
      TestFlight, NOT for App Store review.
- [ ] Create the three IAP products in ASC with the exact product IDs above
      and attach them to the SAME version submission as the binary (first-time
      IAPs are reviewed together with the app version).
- [ ] Paste the notes block above into App Review Information → Notes.
- [ ] Paid Apps Agreement must be Active (Agreements, Tax, and Banking).
- [ ] Optional: add a beta group to codemagic.yaml publishing
      (commented stub at codemagic.yaml:195-197) — unrelated to review notes.
