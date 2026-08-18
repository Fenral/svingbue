# RevenueCat + App Store access and verification plan

**Current as of:** 2026-08-09
**Scope:** Flightglass iOS (`no.strikearc.app`, Apple ID `6768449250`)
**Recommendation:** let Codex operate through narrowly scoped invitations or an already-authenticated browser session. Do **not** send an Apple password, two-factor code, RevenueCat secret key, signing certificate, or `.p8` file in chat.

## Completion record

- App Store Connect: Monthly NOK 99 and Annual NOK 499 exist in one localized
  subscription group; Paid Apps Agreement and tax are active.
- RevenueCat: Apple app, valid IAP credentials, `pro`, the default
  Monthly/Annual Offering and hidden `strikearc_pro_lifetime` compatibility
  mapping are configured.
- Codemagic: `revenuecat-flightglass` contains the protected public iOS key.
- Deliberately absent: the optional RevenueCat App Store Connect API key. Manual
  product configuration is complete, so this does not block transactions.
- Still open: blocked Apple payout account, exact-candidate TestFlight archive,
  native purchase/cancel/error/subscription restore, and App Review screenshots.

## 1. What is already fixed in the repository

The shipping contract is already encoded in [`NATIVE.md`](../NATIVE.md), [`sa-iap.js`](../sa-iap.js), and [`codemagic.yaml`](../codemagic.yaml):

| Item | Required value |
|---|---|
| Bundle ID | `no.strikearc.app` |
| Monthly product | `strikearc_pro_monthly` |
| Annual product | `strikearc_pro_annual` |
| Hidden compatibility ID | `strikearc_pro_lifetime` — no buyer cohort; never offered |
| RevenueCat entitlement | `pro` |
| Paywall | Monthly and Annual only, fetched from RevenueCat's current Offering |
| Release SDK key | The Apple public RevenueCat key beginning `appl_` |

RevenueCat's model is Product → Entitlement → Offering. Monthly and Annual are
the only Apple products and the only packages in the current Offering. The
protected `strikearc_pro_lifetime` ID remains attached to `pro` only as a hidden
compatibility safeguard; the owner confirmed on 2026-08-09 that no buyer cohort
exists. It has no customer-facing StoreKit metadata and is not submitted to
Apple ([RevenueCat: Entitlements](https://www.revenuecat.com/docs/getting-started/entitlements), [RevenueCat: Offerings](https://www.revenuecat.com/docs/offerings/overview)).

## 2. Least-privilege access

### Recommended access for Codex

| Service | Access to grant | Do not grant | Why |
|---|---|---|---|
| App Store Connect | **App Manager**, restricted to the Flightglass app; no Reports and no Certificates, Identifiers & Profiles | Account Holder, Finance, or unrestricted Admin | App Manager can manage the app, subscriptions and TestFlight. Apple lets this role be app-scoped. Reports or Certificates access removes the app-specific restriction ([Apple roles](https://developer.apple.com/help/app-store-connect/reference/account-management/role-permissions), [Apple app access](https://developer.apple.com/help/app-store-connect/manage-your-team/edit-access-to-apps)). |
| RevenueCat | **Developer** collaborator on the Flightglass project | Project Owner or Administrator | Developer can edit app settings, integrations, Products, Entitlements and Offerings without aggregated financial data or the ability to generate RevenueCat secret keys ([RevenueCat collaborators](https://www.revenuecat.com/docs/projects/collaborators)). |
| Codemagic | Permission to view and start the Flightglass app's manual workflow | Organization billing/owner access | The repository already names the App Store Connect integration and manual `ios-testflight` workflow; no new Apple password is needed. |

Apple requires two-factor authentication for App Store Connect users. Use an invitation or a browser session you authenticate yourself; never share the Apple Account password or 2FA code ([Apple account overview](https://developer.apple.com/help/app-store-connect/manage-your-team/overview-of-accounts-and-roles/)).

### Tasks that remain Account Holder/Admin-only

1. The **Account Holder** must sign or renew the Paid Apps Agreement. The agreement must be active for sandbox IAP testing ([Apple: agreements](https://developer.apple.com/help/app-store-connect/manage-agreements/sign-and-update-agreements/), [Apple: IAP setup](https://developer.apple.com/help/app-store-connect/configure-in-app-purchase-settings/overview-for-configuring-in-app-purchases)).
2. An **Account Holder or Admin** must generate the Apple In-App Purchase key and any app-specific shared secret ([Apple: IAP key](https://developer.apple.com/help/app-store-connect/configure-in-app-purchase-settings/generate-keys-for-in-app-purchases/), [Apple: shared secret](https://developer.apple.com/help/app-store-connect/configure-in-app-purchase-settings/generate-a-shared-secret-to-verify-receipts)).
3. Banking and tax information contains legal/financial data and should be entered by the user. Apple allows Account Holder, Admin or Finance, but an Account Holder must approve banking changes initiated by the latter roles ([Apple: banking](https://developer.apple.com/help/app-store-connect/manage-banking-information/enter-banking-information/), [Apple: tax](https://developer.apple.com/help/app-store-connect/manage-tax-information/provide-tax-information)).
4. Only Account Holder/Admin can create a manual Apple Distribution certificate or App Store provisioning profile. Flightglass should reuse its existing persistent signing assets; do not create or revoke team-wide signing assets unless the archive proves they are missing ([Apple: certificates](https://developer.apple.com/help/account/create-certificates/certificates-overview), [Apple: App Store profile](https://developer.apple.com/help/account/provisioning-profiles/create-an-app-store-provisioning-profile)).

## 3. Apple credentials and RevenueCat configuration

### A. Required Apple In-App Purchase key

This key is mandatory for RevenueCat's StoreKit 2 transaction processing, including Capacitor 9+ ([RevenueCat: IAP key configuration](https://www.revenuecat.com/docs/service-credentials/itunesconnect-app-specific-shared-secret/in-app-purchase-key-configuration)).

Human Account Holder/Admin:

1. App Store Connect → **Users and Access → Integrations → In-App Purchase**.
2. Generate a dedicated key, download its `.p8` once, and copy its **Key ID** and **Issuer ID**.
3. In RevenueCat → Flightglass Apple app → **In-app purchase key configuration**, upload the `.p8`, enter Issuer ID, save, and require **Valid credentials**.
4. Store the only backup in a password manager/secret vault. If exposed or lost, revoke immediately and replace it. Apple permits only a one-time download and revoked keys cannot be reinstated ([Apple: IAP key security](https://developer.apple.com/help/app-store-connect/configure-in-app-purchase-settings/generate-keys-for-in-app-purchases/)).

The IAP key is account-wide and can be reused for apps in the same App Store Connect account. Upload it directly to RevenueCat; it must never enter Git, Codemagic, the app bundle, or chat ([RevenueCat: IAP key configuration](https://www.revenuecat.com/docs/service-credentials/itunesconnect-app-specific-shared-secret/in-app-purchase-key-configuration)).

### B. App-specific shared secret

Apple's legacy receipt-verification endpoint is deprecated, but RevenueCat still lists an app-specific shared secret when connecting an Apple app. Prefer the **app-specific** value rather than the account-wide primary secret ([RevenueCat: connect Apple](https://www.revenuecat.com/docs/projects/connect-a-store), [Apple: shared secrets](https://developer.apple.com/help/app-store-connect/configure-in-app-purchase-settings/generate-a-shared-secret-to-verify-receipts)).

Human Account Holder/Admin:

1. App Store Connect → Flightglass → **General → App Information → App-Specific Shared Secret → Manage**.
2. Generate/copy it and paste it directly into the Flightglass Apple app settings in RevenueCat.
3. Do not regenerate an existing secret casually: Apple says the old value becomes invalid and propagation can take up to 24 hours.

### C. App Store Connect API key (recommended, not required for transactions)

RevenueCat uses this key to import products/prices. Its official minimum is **App Manager**; upload the `.p8`, Issuer ID and Vendor Number in RevenueCat's **App Store Connect API** section ([RevenueCat: ASC API key](https://www.revenuecat.com/docs/service-credentials/itunesconnect-app-specific-shared-secret/app-store-connect-api-key-configuration)).

Important least-privilege constraint: an Apple **team API key applies to every app** and cannot be app-scoped. If used, create a dedicated App Manager key for RevenueCat; do not reuse the broad `ryddy-asc-key` signing/upload key named by `codemagic.yaml` ([Apple: App Store Connect API](https://developer.apple.com/help/app-store-connect/get-started/app-store-connect-api)). It is acceptable to skip this optional RevenueCat integration and configure/import products manually if cross-app team-key access is not acceptable.

### D. RevenueCat project

With the RevenueCat **Developer** collaborator role, Codex can complete and verify:

1. Apple app: `no.strikearc.app`; IAP credentials show valid.
2. Products: import the exact Monthly and Annual Apple IDs; retain the hidden
   RevenueCat-only Lifetime compatibility ID.
3. Entitlement: create/retain `pro`; attach Monthly, Annual and the hidden
   compatibility ID.
4. Current Offering: include only Monthly and Annual packages; mark it current.
   Lifetime remains outside the Offering and is never submitted for sale.
5. Copy the app-specific Apple **public SDK key** (`appl_…`) into the protected Codemagic variable `REVENUECAT_IOS_PUBLIC_SDK_KEY` in environment group `revenuecat-flightglass`.

RevenueCat explicitly says the SDK must use the platform-specific **public** key; `sk_` secret keys are server-only and must never be embedded in an app. A Test Store key must never ship to App Review ([RevenueCat: API keys](https://www.revenuecat.com/docs/projects/authentication), [RevenueCat: launch checklist](https://www.revenuecat.com/docs/test-and-launch/launch-checklist)). Flightglass does not need a RevenueCat secret key for this setup.

## 4. Signed TestFlight candidate — division of work

### Codex can do after access

1. Verify the exact Git commit is green and the RevenueCat/Codemagic variables are present.
2. Verify the App Store version train and exact protected identifiers.
3. Start the repository's manual `ios-testflight` workflow.
4. Monitor signing, archive validation, upload and Apple processing; fix code/build failures without changing product IDs.
5. Add the processed build to an internal TestFlight group and provide the exact build number and test matrix.

Apple permits build upload for Account Holder, Admin, App Manager or Developer. An archive is built first, then distributed through **TestFlight & App Store**; TestFlight builds are processed by Apple and remain testable for 90 days ([Apple: upload builds](https://developer.apple.com/help/app-store-connect/manage-builds/upload-builds/), [Apple: distribute archive](https://developer.apple.com/documentation/xcode/distributing-your-app-for-beta-testing-and-releases), [Apple: TestFlight](https://developer.apple.com/help/app-store-connect/test-a-beta-version/testflight-overview)).

### Human actions before the workflow

1. Confirm **Business → Agreements → Paid Apps = Active**, with banking and required tax forms complete.
2. Complete the one-time IAP key/shared-secret steps above, or stay present while Codex operates the authenticated browser and confirm 2FA yourself.
3. Confirm that the current Apple Distribution certificate and matching App Store profile may be reused. Do not send their private key through chat.

## 5. What the user must do for native sandbox proof

Allow **20–30 minutes of active testing** after Apple has processed the build; product changes may take up to one hour to propagate to sandbox ([Apple: sandbox overview](https://developer.apple.com/help/app-store-connect/test-in-app-purchases/overview-of-testing-in-sandbox/), [Apple: IAP configuration](https://developer.apple.com/help/app-store-connect/configure-in-app-purchase-settings/overview-for-configuring-in-app-purchases)). Codex can provide the checklist and inspect RevenueCat events, but only the human can confirm Apple's purchase sheets on the physical iPhone.

### One-time setup

1. Install TestFlight and the exact candidate build.
2. Create a dedicated Sandbox Apple Account in App Store Connect → **Users and Access → Sandbox**. Use an email address never used as an Apple Account. App Manager or Developer can create it ([Apple: create Sandbox account](https://developer.apple.com/help/app-store-connect/test-in-app-purchases/create-a-sandbox-apple-account/)).
3. On iPhone, sign into that account through **Settings → Developer → Sandbox Apple Account**. A TestFlight app automatically operates in sandbox; sandbox purchases cost nothing ([Apple: TestFlight IAP testing](https://developer.apple.com/help/app-store-connect/test-a-beta-version/testing-subscriptions-and-in-app-purchases-in-testflight)).

### Required evidence matrix

| Test | Human action on iPhone | Pass condition Codex/RevenueCat verifies |
|---|---|---|
| Monthly or Annual purchase | Open Flightglass paywall, select a live store plan, confirm Apple's sandbox purchase sheet | UI unlocks `pro`; transaction immediately appears for the sandbox customer in RevenueCat. |
| User cancellation | Start the other plan, then cancel/close Apple's purchase sheet | App remains usable and locked state is unchanged; cancellation is not shown as a technical error. |
| Store error/interruption | Settings → Developer → Sandbox Account → Manage; disable **Allow Purchases & Renewals** or enable **Interrupted Purchases**, then attempt purchase | App shows its recoverable error/pending state and never grants `pro`. Apple exposes these sandbox controls specifically for failure/interruption testing ([Apple: sandbox settings](https://developer.apple.com/documentation/storekit/testing-in-app-purchases-with-sandbox), [Apple: failing purchases](https://developer.apple.com/documentation/storekit/testing-failing-subscription-renewals-and-in-app-purchases)). |
| Subscription restore | Re-enable purchases, ensure the subscription is active, reinstall or clear app data, then tap **Restore Purchases** | `pro` returns and RevenueCat CustomerInfo contains the active entitlement. RevenueCat recommends a user-triggered restore path ([RevenueCat: restoring purchases](https://www.revenuecat.com/docs/getting-started/restoring-purchases)). |
| Conditional Legacy Lifetime restore | Only if a historic `strikearc_pro_lifetime` transaction is discovered, install the exact candidate where Lifetime is hidden and tap **Restore Purchases** | Lifetime never appears for sale, but `pro` becomes active and RevenueCat attributes it to the Lifetime product. |

The owner confirmed on 2026-08-09 that no Lifetime buyers exist. RevenueCat
still preserves the hidden non-consumable mapping outside Offering. If a real
historic transaction is later discovered, test it before review; do not create
a fake claim that a real customer migration was verified. Apple documents Test
Transactions for testing purchases made outside the app ([Apple: purchases
outside the app](https://developer.apple.com/documentation/storekit/testing-purchases-made-outside-your-app)).

To repeat subscription scenarios, use **Clear Purchase History**, sign out of
the Sandbox Apple Account to clear the device cache, and sign back in. If a
historic Lifetime buyer is ever discovered, preserve that account's history
until the conditional restore proof is recorded ([Apple: sandbox purchase history](https://developer.apple.com/documentation/storekit/testing-in-app-purchases-with-sandbox)).

## 6. Security handoff rule

Use one of these paths, in order of preference:

1. **Invitations:** App Store Connect App Manager (Flightglass only) + RevenueCat Developer + Codemagic project access.
2. **Authenticated browser:** the user signs in and completes 2FA; Codex operates only the named pages while the user is present for Account Holder actions.
3. **Never:** credentials pasted into chat, committed `.p8`/`.cer`/`.p12` files, a RevenueCat `sk_` key in client code, or sharing an Apple Account/password.

Revoke temporary collaborators after the signed candidate and configuration record are complete. Revoke and replace any credential immediately if it appears in chat, logs, Git, screenshots, or an app bundle.
