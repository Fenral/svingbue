# Changelog

All notable changes to Flightglass are recorded here.

## [1.0.0] - Unreleased

### Added

- A V1 Home that opens the app as a focused navigation surface without a
  persistent bottom menu.
- A four-step, launch-monitor-focused onboarding that teaches the product with
  real app views rather than collecting personal golf data.
- Flightglass Guide: button-led Browse, Answer and interactive Lab paths with
  no free-text dependency.
- A secondary Connections instrument that visualizes how shot parameters
  influence one another.
- Native subscription readiness for Monthly NOK 99 and Annual NOK 499, with a
  protected hidden Lifetime compatibility product.

### Changed

- Academy is excluded from V1 and remains historical V2 work.
- Range presents Outcome, Side and Top as live views of the same five inputs.
- Impact Studio presents Face On, Down the Line and Strike as one compact
  landscape instrument.
- Support, Terms and Privacy are registered V1 surfaces and share the app's
  accessible touch-target rules.

### Fixed

- Range tracer annotations now avoid the shot-summary panel, one another and
  viewport edges across supported phone widths.
- Studio controls no longer collide with navigation on compact landscape
  screens.
- Range output semantics and Studio slider labels now expose the correct
  accessible roles and names.
- Reduced-motion Studio renders a stable final frame instead of continuing the
  ambient canvas animation.

### Verification status

- The 2026-08-18 UX baseline covers 19 registered states and 76 captures with
  zero critical findings and zero design-floor findings.
- The release is not yet accepted. Exact-SHA CI/preview, the final complete V1
  release gate, moderated onboarding, physical-iPhone store flows and signed
  Codemagic/TestFlight evidence remain required before publication.
