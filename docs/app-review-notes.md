# App Review notes — Flightglass (`no.strikearc.app`, Apple ID `6768449250`)

Paste the block below into **App Store Connect → StrikeArc/Flightglass → the
version being submitted → App Review Information → Notes**. This is set per
version in the App Store Connect web UI; it is not part of `codemagic.yaml`.
The CI publishing block only submits builds to TestFlight.

```
REVIEWER NOTES — FLIGHTGLASS

DEVICE AND ORIENTATION
- The minimum supported iOS version is 16.4.
- Flightglass is designed for native phone use and supports its core flow in
  portrait. Home and Range use portrait; Studio uses landscape so the complete
  swing arc and contact zone remain readable. Guide is responsive. If a view
  needs the other orientation, the app presents an explicit rotation prompt.

ACCOUNT AND CONNECTIVITY
- No account, sign-in or demo credentials are required.
- The interactive golf models run locally after install. An internet connection
  is required only for StoreKit/RevenueCat purchase and restore operations.

FREE TIER / PRO GATES
- Range includes 10 distinct free comparisons. A comparison counts only when a
  changed setup is completed with "Pin comparison"; repeats do not consume the
  allowance. The 11th distinct comparison opens Flightglass Pro.
- Guide includes five unique guided answers per local calendar day. Opening a
  sixth different answer that day opens Flightglass Pro.
- Studio includes one free guided experiment. Starting a second guided
  experiment opens Flightglass Pro. Normal unguided Studio exploration remains
  available.
- No paywall appears on cold launch or before the reviewer has received value.

QUICKEST WAY TO REACH THE PAYWALL
1. Open Guide from the bottom navigation.
2. Open six different guided questions. The sixth unique answer opens the same
   Flightglass Pro paywall used by the other protected value moments.

IN-APP PURCHASES (RevenueCat + StoreKit)
- strikearc_pro_monthly — auto-renewable subscription, 1 month
- strikearc_pro_annual  — auto-renewable subscription, 1 year (recommended)
- The paywall offers Monthly and Annual only and displays localized store
  prices. It makes no percentage-savings claim.
- strikearc_pro_lifetime is a legacy non-consumable retained only so existing
  owners can restore the same `pro` entitlement. It is not offered to new
  customers and is not shown as a paywall tier.
- Restore Purchases is available both on the paywall and from the document icon
  on Home. Terms of Use and Privacy Policy are available in both locations.
```

## Pre-submission checklist (Sivert — outside this repo)

- [ ] Create/configure the RevenueCat Flightglass project with entitlement ID
      exactly `pro`, then replace `appl_REPLACE_ME` and `goog_REPLACE_ME` in
      `sa-iap.js` with the real public SDK keys. Until then native checkout and
      restore are deliberately unavailable and the build is not ready for App
      Review.
- [ ] Configure a current RevenueCat Offering containing Monthly and Annual,
      using the exact product IDs above, with both packages granting `pro`.
- [ ] Keep `strikearc_pro_lifetime` mapped to `pro` for restoration by existing
      owners, but do not expose it as a package for new customers.
- [ ] Create/verify the Monthly and Annual products in App Store Connect and
      attach the first-time IAPs to the same app-version submission as the
      binary. Preserve the legacy lifetime product for restore continuity.
- [ ] Complete a StoreKit sandbox purchase for Monthly or Annual and restore an
      existing lifetime entitlement on a native build before submission.
- [ ] Paste the reviewer-notes block above into App Review Information → Notes.
- [ ] Confirm the Paid Apps Agreement is Active under Agreements, Tax and
      Banking.
- [ ] Optional: add a beta group to the commented `codemagic.yaml` publishing
      stub. This is unrelated to the reviewer notes.
