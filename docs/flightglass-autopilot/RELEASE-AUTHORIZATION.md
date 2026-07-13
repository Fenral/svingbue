# Flightglass release authorization

Owner approval: granted on 2026-07-13.

The owner explicitly authorizes the autonomous release workflow to:

- push the completed Flightglass work to GitHub;
- deploy the completed web build through Vercel;
- submit or publish the completed native app through the configured Apple and
  Google release workflows.

No second publication approval is required when every condition below is met.

## Mandatory release conditions

All Phase 8 gates must pass before any external publication. In particular:

- every named surface has a recorded score of 90+ with no critical failure;
- the complete test, brand, UX, native and store-reviewer workflows pass;
- the clean `www/` build is the artifact being released;
- the protected bundle, store, RevenueCat and Academy identifiers remain
  unchanged;
- release evidence and rollback information are recorded in `STATUS.md`.

## Boundaries

This approval does not authorize changing golf-physics outputs, protected
identifiers, production customer data, billing configuration or credentials.
It does not authorize purchasing services or exposing secrets. If credentials
are unavailable, a platform requires an irreversible account-level choice, or
the release target differs materially from Flightglass, stop and request the
minimum additional input.

GitHub, Vercel and store publication are release operations, never shortcuts
around local verification.
