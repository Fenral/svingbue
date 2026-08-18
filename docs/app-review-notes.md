# App Review notes — Flightglass

Bundle ID: `no.strikearc.app`

App Store Connect Apple ID: `6768449250`

Paste the block below into the version's **App Review Information → Notes** in
App Store Connect. This text is metadata, not part of `codemagic.yaml`.
Codemagic uploads an authorized build to App Store Connect. TestFlight beta
review is a separate, default-off build input; an operator still selects the
build, attaches the first subscription products and submits the version for
review in App Store Connect.

## Reviewer notes (ready to paste)

```text
REVIEWER NOTES — FLIGHTGLASS

PURPOSE
Flightglass is an interactive explainer for launch-monitor-style golf numbers.
It lets the user change five delivery inputs, see the modelled outcome update,
inspect impact geometry, and open predefined guided explanations. It is not a
launch-monitor connection, swing scanner, coaching diagnosis or measurement of
the user's own shot.

DEVICE AND ORIENTATION
- Minimum supported iOS version: 16.4.
- This v1 binary is for iPhone only.
- Home, Outcome and Guide are portrait-first. Impact Studio uses landscape so
  the complete swing arc and contact zone remain readable.
- Flightglass shows an explicit rotation prompt when a view needs the other
  orientation.

ACCOUNT, DATA AND CONNECTIVITY
- No account, sign-in or demo credentials are required.
- The interactive golf models and guided answers run locally after install.
- Internet access is required only for StoreKit/RevenueCat purchase and restore
  operations.
- The app does not accept free-text questions and does not use generative AI.

FREE TIER AND PRO GATES
- Outcome includes 10 distinct free comparisons. A comparison counts only when
  a changed setup is completed with "Pin comparison"; repeats do not consume
  the allowance. The 11th distinct comparison opens Flightglass Pro.
- Guide includes five unique guided answers per local calendar day. Opening a
  sixth different answer that day opens Flightglass Pro.
- Impact Studio includes one free guided experiment. Starting a second guided
  experiment opens Flightglass Pro. Unguided Studio exploration remains
  available.
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
- No Lifetime plan is offered, displayed or submitted in v1.
- Restore Purchases is available on the paywall and from Home.
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
- [x] Create the Codemagic environment group `revenuecat-flightglass` and add
      `REVENUECAT_IOS_PUBLIC_SDK_KEY` with the Flightglass public `appl_` key.
      Do not replace committed source placeholders and do not store the value in
      Git.
- [x] In App Store Connect, generate or reuse an active In-App Purchase Key.
      Upload its `.p8` file and Issuer ID to the Flightglass App Store app in
      RevenueCat, then require RevenueCat to report valid credentials. This is
      separate from the public `appl_` SDK key and must never enter the app or
      Git. Capacitor Purchases 11.x requires this store credential.
      RevenueCat reports valid credentials. Its optional App Store Connect API
      key is absent; products and prices were configured manually, so this is
      not a transaction blocker.
- [x] Configure the RevenueCat entitlement exactly as `pro`.
- [x] Configure the default current Offering with Monthly and Annual packages using the
      exact protected product IDs. Both must grant `pro`.
- [x] Keep the hidden `strikearc_pro_lifetime` RevenueCat compatibility ID
      mapped to `pro` and outside the Offering. The owner confirmed no buyer
      cohort exists.
- [x] Create Monthly at NOK 99 and Annual at NOK 499 in one localized App Store
      subscription group, with display names and descriptions inside Apple's
      limits.
- [ ] Upload an App Review Screenshot from the final native paywall for each
      product.
- [ ] For the first auto-renewable subscription review, add the subscription
      group and both products to the same submission as the v1 binary. Do not
      attach or submit the hidden Lifetime compatibility ID.
- [x] Confirm Paid Apps Agreement and tax are active.
- [ ] Resolve the Apple banking alert: the payout account is currently blocked
      and Apple reports a returned payout.
- [ ] Complete the age-rating questionnaire, Digital Services Act status,
      app price/tax category, availability, release mode and export-compliance
      answer against the exact selected build.
- [ ] Start the Codemagic `ios-testflight` workflow manually on the exact green
      release commit with TestFlight beta review left off. Record its build
      number and successful signing identity; opt into beta review only after
      the native/store gates below are complete.
- [ ] On a native sandbox build, complete one Monthly or Annual purchase and
      verify purchase, cancellation and restore behavior.
- [x] Record the owner's 2026-08-09 confirmation that no Lifetime buyers exist.
      Keep the protected product attached to `pro`; if a historic transaction
      is later discovered, its native restore proof becomes mandatory.
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
| Home → Outcome | Five inputs update modelled outcomes live |
| Home → Studio | Explicit landscape transition; swing arc remains visible |
| Home → Guide | Guided buttons only; no text field |
| Sixth unique Guide answer | Pro paywall opens after demonstrated value |
| Purchase cancel | User returns to the protected action without false unlock |
| Successful purchase | `pro` unlocks and the interrupted action resumes |
| Restore Purchases | Existing subscription or Lifetime `pro` unlocks |
| Terms / Privacy / Support | Public pages open successfully without purchase |
