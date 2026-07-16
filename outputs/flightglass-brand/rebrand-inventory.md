# Flightglass rebrand inventory

## Replace in shipping surfaces

`index.html`, `academy.html`, `appstore/index.html`, `sa-firstrun.js`,
`sa-paywall.js`, `privacy.html`, `terms.html`, `capacitor.config.ts`,
`scripts/ios-landscape.mjs`, workflow labels, native icon, splash, favicon and
logo assets.

## Preserve for compatibility

- Bundle ID: `no.strikearc.app`
- App Store Connect ID: `6768449250`
- RevenueCat product IDs: `strikearc_pro_*`
- Existing `strikearc.*` localStorage keys

## External release dependencies

- NIPO/EUIPO/WIPO exact and confusing-similarity review
- Domain registration decision
- App Store and Google Play product-name metadata update
- RevenueCat dashboard display labels may change; product IDs do not

## Verification evidence

- Timestamped rollback copy: `.sa-backups/flightglass-brand-20260713-081516`
- Deterministic SVG build: `npm run brand:build`
- Source and compatibility gate: `npm run brand:verify`
- Clean native web bundle: `npm run copy-web`; no exact legacy visible-name
  match remains in `www/`
- HTTP browser smoke passed for Home, Academy, Privacy and Terms with no console
  or page errors
- Real-size, monochrome, mask, grayscale and Range-hierarchy proof captured in
  `outputs/flightglass-brand/identity-proof.png`
- Every allowed remaining old-name match is classified in
  `outputs/flightglass-brand/legacy-name-audit.md`

## Implementation status

- [x] Shipping web name replaced
- [x] Academy and marketing-support name replaced
- [x] Native display name replaced
- [x] Vector and raster assets generated
- [x] Compatibility identifiers preserved
- [x] Real-size identity proof captured and visually inspected
- [ ] Trademark clearance completed externally
- [ ] Domain acquired externally
- [ ] App Store / Google Play metadata renamed externally
