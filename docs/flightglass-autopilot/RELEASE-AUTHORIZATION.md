# Flightglass release authorization

Owner approval: granted on 2026-07-13.

The owner authorized the autonomous release workflow to:

- push completed Flightglass work to GitHub;
- deploy the completed web build through Vercel;
- submit or publish the completed native app through configured Apple and
  Google release workflows.

For the Mechanics v1 convergence, the owner's later 2026-08-08 instruction
supersedes the historical no-second-approval rule. One consolidated owner
authorization is required immediately before merge to `main`, production
promotion, TestFlight upload, RevenueCat/App Store product changes, any real
purchase or paid external action, GitHub Pages containment, and App Store
submission. This authorization does not convert an unverified or externally
incomplete candidate into a releasable build.

## How the historical Phase 8 gate maps to v1

The original master plan calls the final global gate **Phase 8 — Convergence
and release QA**. The current v1 specification calls the native/store portion
**Phase 5 — Native release convergence**. Both names refer to one release
decision: all applicable global gates and all current v1 release conditions
must be green for the exact commit and native build being published.

The owner's explicit deferral of the public marketing landing page means that a
missing `landing.html` is not a native v1 release blocker. Support, Privacy,
Terms and store metadata remain required. This scope clarification does not
waive any product, payment, privacy, native-device or store requirement.

All Phase 8 gates must pass for the exact candidate before any authorized
production publication or store submission can begin.

## Mandatory release conditions

Before GitHub/Vercel production publication or store submission:

- the complete current v1 source, UX, accessibility, browser, orientation,
  native-package and protected-identifier gates pass on the candidate commit;
- the clean `www/` allowlist is the artifact packaged by Capacitor;
- bundle, store, RevenueCat product and Academy storage identifiers remain
  unchanged;
- protected golf-physics fixtures and hashes remain unchanged;
- the current App Store/Play metadata, screenshots, support URL, legal URLs and
  privacy declarations match the actual candidate;
- release evidence and rollback information are recorded.

Before native Apple submission, also require:

- a manually triggered, successful iPhone-only archive signed with reusable
  Apple Distribution assets;
- a valid build-time RevenueCat iOS public SDK key supplied outside Git;
- an active Apple In-App Purchase Key and Issuer ID validated by RevenueCat,
  stored only in App Store Connect/RevenueCat and never in the app bundle;
- Monthly and Annual products in the current Offering granting `pro`;
- legacy Lifetime still granting `pro` for existing-owner restoration;
- active agreements, tax and banking;
- native sandbox proof for purchase, cancellation/error and restore, including
  an existing Lifetime entitlement;
- the physical-iPhone smoke checklist and the moderated onboarding acceptance
  gate required by `TECH_SPEC.md`.

Android publication requires its own signed AAB, upload-key custody, Play
Console listing/data-safety answers, RevenueCat Android mapping and release
track proof. A debug APK is not release evidence.

## Boundaries

This approval does not authorize changing golf-physics outputs, protected
identifiers, production customer data, billing configuration or credentials.
It does not authorize purchasing services, exposing secrets, revoking team
certificates, or making irreversible account-level choices on the owner's
behalf.

If credentials or persistent signing assets are unavailable, a store requires
an irreversible owner choice, the release target differs materially from
Flightglass, or required human/native evidence is missing, stop at the release
boundary and request only the minimum external input.

GitHub, Vercel and store publication are release operations, never shortcuts
around verification.

The commit-agnostic candidate, CI and rollback contract is
`docs/v1-release-record.md`; PR #19 is the exact-SHA execution record. Its body
and immutable post-commit comment/GitHub artifact bind the final candidate.
PR #18 remains inherited source ancestry and is not the release authority.
