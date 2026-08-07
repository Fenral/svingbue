# Flightglass store listing — v1 release pack

This document is the copy-and-configuration source for the native v1. It does
not authorize upload by itself. Always compare the listing against the exact
TestFlight/AAB candidate before submission.

## Protected identity and public URLs

| Field | Value |
|---|---|
| Product name | Flightglass |
| Apple bundle ID | `no.strikearc.app` |
| App Store Connect Apple ID | `6768449250` |
| RevenueCat entitlement | `pro` |
| Monthly product | `strikearc_pro_monthly` |
| Annual product | `strikearc_pro_annual` |
| Legacy restore-only product | `strikearc_pro_lifetime` |
| Support URL | `https://svingbue.vercel.app/support.html` |
| Privacy URL | `https://svingbue.vercel.app/privacy.html` |
| Terms URL | `https://svingbue.vercel.app/terms.html` |
| Contact email | `sivertskotvold@gmail.com` |

The public marketing landing page is deferred. Do not use a nonexistent
`landing.html` URL. The root web app may be supplied as an optional marketing
URL only after the owner confirms it is the intended public destination.

## App Store — English metadata

### Name

```text
Flightglass
```

### Subtitle

```text
See why golf shots fly
```

### Promotional text

```text
Change the delivery numbers, watch the outcome respond, inspect impact geometry, and find a clear guided explanation — all in one interactive golf model.
```

### Description

```text
See why it flew.

Flightglass makes launch-monitor-style golf numbers visible. Change the five delivery inputs and see the modelled outcome respond immediately — then inspect the geometry or open a guided explanation when you want to understand why.

OUTCOME
Explore club speed, face angle, club path, attack angle and delivered loft. See launch, spin, direction, curve, height and distance update live.

IMPACT STUDIO
Move from ball flight to cause. Inspect the swing arc, low point, contact zone and where the club is modelled to meet the ground.

FLIGHTGLASS GUIDE
Start with a specific predefined question instead of a blank chat box. Follow a clear answer, supporting values and a bounded interactive model. Guide distinguishes what the shipping model can calculate from what would need measurement, calibration or a future model.

BUILT TO UNDERSTAND, NOT DIAGNOSE
Flightglass is an educational deterministic model. It does not connect to a launch monitor, measure your swing, analyse video, prescribe coaching or claim that a modelled setup is personal or optimal.

FREE TO EXPLORE
Use the core model, complete the learning tour, try one guided Studio experiment, make 10 distinct Outcome comparisons and open five unique guided answers per day. Flightglass Pro unlocks unlimited comparisons and guided exploration.

No account is required. The models run locally after install. Purchases are handled securely by the App Store and can be restored at any time.
```

### Keywords

```text
golf,launch monitor,ball flight,club path,face angle,attack angle,spin loft,impact,carry
```

### What's New — version 1.0.0

```text
Flightglass v1 introduces the live Outcome model, Impact Studio, the guided Flightglass Guide, and a short learning tour that connects launch-monitor-style inputs to ball flight.
```

### Classification starting point

| Field | Proposed value | Owner/store action |
|---|---|---|
| Primary category | Sports | Confirm in App Store Connect |
| Secondary category | Education | Optional; confirm positioning |
| Content rights | Does not contain third-party content | Reconfirm screenshot/assets ownership |
| Age rating | Complete the questionnaire truthfully; no mature content exists in the current app | Store computes the rating |
| Digital Services Act status | Declare trader/non-trader status truthfully | Required account-level decision for EU distribution |
| App price / tax category | Free app; configure the correct tax category | Confirm before review |
| Availability / release mode | Select countries and manual, automatic or phased release deliberately | Owner decision before submission |
| Export compliance | Match the binary's non-exempt-encryption declaration | Confirm on the selected build |
| Copyright | `© 2026 Sivert Skotvold` | Confirm preferred legal display |
| Marketing URL | Leave blank for v1 | Landing page is deferred |

Do not describe Flightglass as a launch monitor, measurement device, fitting
tool, AI coach or personalised recommendation system.

## Subscription metadata

The store controls price and currency. Do not hardcode a savings percentage in
metadata. The visible app paywall must show the localized StoreKit prices.

| Product | Reference name | Display name | Description |
|---|---|---|---|
| `strikearc_pro_monthly` | Flightglass Pro Monthly | Flightglass Pro Monthly | Unlimited Outcome, Guide and Studio access. |
| `strikearc_pro_annual` | Flightglass Pro Annual | Flightglass Pro Annual | Unlimited Outcome, Guide and Studio access. |
| `strikearc_pro_lifetime` | Legacy Flightglass Pro Lifetime | Keep the existing customer-facing metadata | Legacy non-consumable preserved only for existing-owner restore; do not expose it to new customers. |

Both current subscriptions and the legacy product must grant the exact
RevenueCat entitlement `pro`.

The two current descriptions are 43 characters. Keep every customer-facing
product display name at 30 characters or fewer and every product description at
45 characters or fewer. App Store Connect already displays the configured
duration and renewal terms; do not try to fit those into the description field.

Put Monthly and Annual in one subscription group, with a localized group
display name such as `Flightglass Pro`. For the first auto-renewable
subscription submission, add the subscription group and both subscriptions to
the same submission as the v1 app version. Upload an App Review Screenshot from
the final native paywall for each subscription. These screenshots are review
evidence, not the five public product-page screenshots.

### RevenueCat Apple credential contract

Two different Apple/RevenueCat credentials are required and must not be
confused:

1. The release build receives only the app-specific public RevenueCat SDK key
   beginning `appl_` through the protected Codemagic environment group.
2. The RevenueCat App Store app must also have an active Apple In-App Purchase
   Key (`.p8`) and Issuer ID uploaded in the RevenueCat dashboard, with its
   credential validator showing valid. This key never enters the app bundle or
   Git. RevenueCat requires it for Capacitor SDK 9.0.0 and newer; Flightglass
   currently ships `@revenuecat/purchases-capacitor` 11.x.

See RevenueCat's current
[In-App Purchase Key configuration](https://www.revenuecat.com/docs/service-credentials/itunesconnect-app-specific-shared-secret/in-app-purchase-key-configuration)
and [public-key guidance](https://www.revenuecat.com/docs/projects/authentication).

## Google Play — English metadata

Android remains a separate release track; the current CI artifact is an
unsigned debug APK. Use this copy only after a signed AAB and Play release
configuration exist.

### App name

```text
Flightglass
```

### Short description

```text
Change golf delivery numbers and see why the modelled shot flew.
```

### Full description

Use the App Store description above. Remove the sentence that names “the App
Store” and replace its final sentence with:

```text
No account is required. The models run locally after install. Purchases are handled securely by Google Play and can be restored at any time.
```

### Play listing starting point

| Field | Proposed value | Owner/store action |
|---|---|---|
| App category | Sports | Confirm in Play Console |
| Tags | Golf | Select only tags available in the console |
| Contact email | `sivertskotvold@gmail.com` | Required |
| Website | `https://svingbue.vercel.app/support.html` | Use support until landing resumes |
| Privacy policy | `https://svingbue.vercel.app/privacy.html` | Required |

## Screenshot and creative order

Screenshots must show the current shipping product and truthful engine states.
Do not upload the legacy StrikeArc/Academy gallery.

Recommended five-image narrative:

| Order | Surface | Headline | What the image must prove |
|---:|---|---|---|
| 1 | Outcome | Change the numbers. See the outcome. | All five inputs and live outcome relationship |
| 2 | Impact Studio | See where impact happens. | Swing arc, Low Point and contact geometry |
| 3 | Guide | Ask a precise golf question. | Guided buttons, structured answer, no free text |
| 4 | Home | One model. Three ways to understand it. | Outcome, Studio and Guide as one app |
| 5 | Onboarding or Pro | Learn first. Go deeper when ready. | Product-understanding tour or value-before-price Pro gate |

Apple accepts one to ten screenshots per device class. For the iPhone-only v1,
use one current 6.9-inch portrait set at an accepted size such as 1290 × 2796;
include a truthful Studio composition inside the portrait marketing frame
rather than rotating the uploaded canvas. Verify the final sizes against
[Apple screenshot specifications](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications/).

Google Play requires a 1024 × 500 feature graphic and at least two screenshots;
four or more 1080-pixel phone screenshots are recommended. Keep the Play set
portrait 9:16 and verify the current rules in
[Google Play store listing requirements](https://support.google.com/googleplay/android-developer/answer/9866151?hl=en).

## Apple App Privacy — current v1 starting point

Apple requires the answers to cover Flightglass and every integrated third
party SDK. Use the final binary as authority and re-audit whenever a new SDK,
account system, remote analytics vendor or server sync is added. See
[Apple: Manage app privacy](https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy/)
and
[RevenueCat's Apple App Privacy guidance](https://www.revenuecat.com/docs/platform-resources/apple-platform-resources/apple-app-privacy).

For the current anonymous, no-account v1 with RevenueCat and no remote analytics
vendor, use this starting declaration:

| App Privacy type | Collected? | Linked to identity? | Tracking? | Purpose / note |
|---|---|---|---|---|
| Purchases → Purchase History | Yes | No, provided Flightglass keeps anonymous RevenueCat IDs and does not map them to identity | No | App Functionality and Analytics; purchase/entitlement/restore handling |
| Contact Info | No | — | No | No account, name, email or phone intake |
| User Content | No | — | No | Guided buttons only; no free-text submission or upload |
| Identifiers | No for the current configuration | — | No | Revisit if custom RevenueCat user IDs, accounts, advertising IDs or another identifying SDK are added |
| Usage Data | No | — | No | Current product events are local/no-op and not transmitted |
| Diagnostics | No from RevenueCat | — | No | Revisit if crash/performance telemetry is introduced |
| Location | No | — | No | No location permission or collection |

The “not linked” answer depends on the released configuration remaining
anonymous. If an account ID, email, custom RevenueCat user ID or identity
mapping ships, reassess the linked-data answer before submission.

## Google Play Data safety — current v1 starting point

Use the final Android binary as authority. RevenueCat's current guidance is at
[Google Play Data safety](https://www.revenuecat.com/docs/platform-resources/google-platform-resources/google-plays-data-safety).

Starting declaration for the current RevenueCat-only purchase flow:

| Data type | Collected | Shared | Ephemeral | Required | Purpose |
|---|---|---|---|---|---|
| Financial info → Purchase history | Yes | No, while no RevenueCat integrations export it | No | Yes for purchases/restore | App functionality and Analytics |

Additional answers:

- Data is encrypted in transit.
- Users cannot create an app account, so account deletion is not applicable.
- A user can request deletion of data associated with the anonymous RevenueCat
  identifier through the support email/page.
- Do not declare RevenueCat app activity or diagnostics unless the final SDK
  configuration or another integrated service actually collects them.
- Reassess “shared” if RevenueCat integrations, external analytics, advertising
  or another data recipient is enabled.

## Submission data still required from the owner

| Required item | Status |
|---|---|
| App Review contact first/last name | Owner input required |
| App Review contact phone number | Owner input required |
| Preferred public seller/copyright wording | Owner confirmation required |
| App Store category choices | Owner confirmation required |
| `1.0.0` version-train availability | Check in App Store Connect |
| Persistent Apple Distribution certificate/profile | Configure and prove in Codemagic |
| RevenueCat iOS public key and current Offering | Configure externally |
| RevenueCat Apple In-App Purchase Key + Issuer ID | Upload outside Git and confirm valid credentials |
| Subscription group, localizations and levels | Configure Monthly and Annual in one deliberate group |
| Subscription review screenshots | Capture from the final native paywall |
| Age rating, DSA status, app price/tax, availability and release mode | Complete in App Store Connect |
| Export-compliance answer | Confirm against the selected binary |
| Sandbox Monthly/Annual purchase evidence | Run on final native build |
| Existing Lifetime restore evidence | Run with an entitled existing-owner account |
| Agreements, tax and banking | Confirm active |
| Moderated onboarding results | Complete `docs/phase2-onboarding-uat.md` |
| Physical-iPhone release smoke | Record against exact TestFlight candidate |
| Google Play upload key/AAB/release track | Required only for Android launch |

## Final consistency check

Immediately before submission, verify:

- listing names match the visible app name Flightglass;
- screenshots show Home, Outcome, Impact Studio and Flightglass Guide from the
  release candidate, not Academy or legacy StrikeArc;
- no copy claims measurement, diagnosis, AI, personalisation or optimisation;
- subscription descriptions match the current Offering and entitlement;
- Monthly and Annual descriptions remain within Apple's 45-character limit;
- the RevenueCat Apple In-App Purchase Key and Issuer ID validate successfully;
- Privacy, Terms and Support return HTTP 200 over HTTPS;
- the privacy declarations still match every SDK in the final binary;
- reviewer notes match the actual free limits and navigation;
- release notes, version number and build number match the selected build.
