# App Review notes — Flightglass

Bundle ID: `no.strikearc.app`

App Store Connect Apple ID: `6768449250`

Paste the block below into the version's **App Review Information → Notes** in
App Store Connect. This text is metadata, not part of `codemagic.yaml`.
Codemagic uploads an authorized build to TestFlight; an operator still selects
the build, attaches the first subscription products and submits the version for
review in App Store Connect.

## Reviewer notes (ready to paste)

```text
REVIEWER NOTES — FLIGHTGLASS

PURPOSE
Flightglass is an interactive explainer for launch-monitor-style golf numbers.
Mechanics Lab lets the user choose one of two four-input authorities. Impact
Inputs are Face Angle, Club Path, Attack Angle and Dynamic Loft. Arc Inputs are
Low Point X, Low Point Height, Swing Direction and Swing Plane. Contact, Attack,
Path and six modelled flight outcomes update as one causal instrument. Range
supports replay/comparison, and Guide opens predefined explanations.
Flightglass is not a launch-monitor connection, swing
scanner, technique diagnosis or measurement of the user's own shot.

DEVICE AND ORIENTATION
- Minimum supported iOS version: 16.4.
- This v1 binary is for iPhone only.
- Home, Range/Outcome and Guide are portrait-first.
- Mechanics Lab adapts to portrait and landscape without a forced-rotation
  overlay; the controls, Cause Trace and six outcomes remain available in both.

ACCOUNT, DATA AND CONNECTIVITY
- No account, sign-in or demo credentials are required.
- The interactive golf models and guided answers run locally after install.
- Internet access is required only for StoreKit/RevenueCat purchase and restore
  operations.
- The app does not accept free-text questions and does not use generative AI.

FREE TIER AND PRO GATES
- Range includes 10 distinct free comparisons. A comparison counts only when
  a changed setup is completed with "Pin comparison"; repeats do not consume
  the allowance. The 11th distinct comparison opens Flightglass Pro.
- Guide includes five unique guided answers per local calendar day. Opening a
  sixth different answer that day opens Flightglass Pro.
- Mechanics Lab includes one free guided experiment. Starting a second guided
  experiment opens Flightglass Pro. Unguided Mechanics exploration remains
  available.
- These access counters are enforced only in the native app. The browser is a
  non-consuming evaluation preview.
- No paywall appears on cold launch or before the reviewer has received value.

QUICKEST WAY TO REACH THE PAYWALL
1. Open Guide from the bottom navigation.
2. Open six different guided questions.
3. The sixth unique answer opens the same Flightglass Pro paywall used by the
   other protected value moments.

IN-APP PURCHASES
- strikearc_pro_monthly — auto-renewable subscription, 1 month
- strikearc_pro_annual — auto-renewable subscription, 1 year
- Monthly and Annual are the only products offered to new customers. Prices are
  localized StoreKit prices and no percentage-savings claim is shown.
- strikearc_pro_lifetime is a legacy non-consumable retained only so existing
  owners can restore the same `pro` entitlement. It is not offered or displayed
  to new customers.
- Restore Purchases is available on the paywall and from Home. It runs only
  after the reviewer activates it; the app never restores automatically on
  launch.
- Terms of Use and Privacy Policy are available in-app without purchase. The
  public Support URL below also requires no purchase or account.

LEGAL AND SUPPORT
Privacy Policy: https://svingbue.vercel.app/privacy.html
Terms of Use: https://svingbue.vercel.app/terms.html
Support: https://svingbue.vercel.app/support.html
Contact: sivertskotvold@gmail.com
```

## Pre-submission checklist — external/account work

- [ ] Confirm App Store marketing version `1.0.0` is available on the existing
      record, or update `package.json` deliberately before the build.
- [ ] Configure one persistent Apple Distribution certificate and matching
      `IOS_APP_STORE` provisioning profile for `no.strikearc.app`. Confirm the
      workflow reuses it and neither revokes team certificates nor creates a
      new certificate for every build.
- [ ] Create the Codemagic environment group `revenuecat-flightglass` and add
      `REVENUECAT_IOS_PUBLIC_SDK_KEY` with the Flightglass public `appl_` key.
      Do not replace committed source placeholders and do not store the value in
      Git.
- [ ] In App Store Connect, generate or reuse an active In-App Purchase Key.
      Upload its `.p8` file, Key ID and Issuer ID to the Flightglass App Store
      app in RevenueCat, then require RevenueCat to report valid credentials. This is
      separate from the public `appl_` SDK key and must never enter the app or
      Git. Capacitor Purchases 11.x requires this store credential.
- [ ] Configure the RevenueCat entitlement exactly as `pro`.
- [ ] Configure the current Offering with Monthly and Annual packages using the
      exact protected product IDs. Both must grant `pro`.
- [ ] Keep `strikearc_pro_lifetime` mapped to `pro` for existing-owner restore,
      but do not expose it as a package for new customers.
- [ ] Create or verify Monthly and Annual in App Store Connect. Put them in one
      localized subscription group, keep their display names at 30 characters
      or fewer and descriptions at 45 characters or fewer, and upload an App
      Review Screenshot from the final native paywall for each product.
- [ ] For the first auto-renewable subscription and first subscription-group
      review, add the group and both products to the same new app-version
      submission as the v1 binary. Preserve the legacy Lifetime product outside
      the new-customer Offering.
- [ ] Confirm Paid Apps Agreement, tax and banking are active.
- [ ] Complete the age-rating questionnaire, Digital Services Act status,
      app price/tax category, availability, release mode and export-compliance
      answer against the exact selected build.
- [ ] Start the Codemagic `ios-testflight` workflow manually on the exact green
      release commit. Record its build number and successful signing identity.
- [ ] On the exact TestFlight build, use Apple's sandbox environment to complete
      one Monthly or Annual purchase and verify purchase, cancellation and
      user-triggered restore behavior. Restore must not run automatically on
      launch.
- [ ] Restore an actual existing Lifetime entitlement and capture the evidence.
- [ ] Complete the physical-iPhone smoke checklist and the moderated onboarding
      gate. Automated browser checks do not replace these human/native gates.
- [ ] Upload the final current-product screenshots in the order documented in
      `docs/store-listing.md`; do not use the legacy StrikeArc/Academy gallery.
- [ ] Confirm Privacy, Terms and Support all return HTTP 200 over HTTPS. Do not
      submit while `https://svingbue.vercel.app/support.html` returns 404.
- [ ] Create and inspect an exact-commit Vercel preview before promotion. Record
      its deployment ID and URL; merging `main` does not deploy this CLI-linked
      project automatically.
- [ ] Disable, redirect or mark the stale public GitHub Pages Academy gallery
      `noindex`; it is deferred v2 content and cannot represent Flightglass v1.
- [ ] Complete App Privacy answers using the current binary and RevenueCat
      configuration. Recheck every answer if analytics, accounts or a new SDK is
      introduced.
- [ ] Paste the reviewer-notes block above, select the build, add review contact
      details and provide an active review phone number.
- [ ] Before merging, require the GitHub `verify` check through branch
      protection/rulesets, or explicitly record the green run and do not bypass
      it. A workflow file by itself does not prevent an unverified merge.

## Official owner references

- [Apple required app and version properties](https://developer.apple.com/help/app-store-connect/reference/app-information/required-localizable-and-editable-properties)
- [Apple first subscription submission](https://developer.apple.com/help/app-store-connect/manage-submissions-to-app-review/submit-an-in-app-purchase)
- [Apple In-App Purchase metadata and review screenshot](https://developer.apple.com/help/app-store-connect/reference/in-app-purchases-and-subscriptions/in-app-purchase-information/)
- [RevenueCat Apple In-App Purchase Key](https://www.revenuecat.com/docs/service-credentials/itunesconnect-app-specific-shared-secret/in-app-purchase-key-configuration)
- [RevenueCat public versus secret API keys](https://www.revenuecat.com/docs/projects/authentication)

## Expected reviewer paths

Before submission, test these paths on the exact TestFlight candidate:

| Path | Expected result |
|---|---|
| First launch → Not now | Home is usable without account or payment |
| Home → Range / Outcome | A modelled setup and its outcomes remain available for replay/comparison |
| Home → Mechanics Lab | Both authorities update strike and flight in portrait and landscape |
| Home → Guide | Guided buttons only; no text field |
| Sixth unique Guide answer | Pro paywall opens after demonstrated value |
| Purchase cancel | User returns to the protected action without false unlock |
| Successful purchase | `pro` unlocks and the interrupted action resumes |
| Restore Purchases | Existing subscription or Lifetime `pro` unlocks |
| Terms / Privacy / Support | Public pages open successfully without purchase |
