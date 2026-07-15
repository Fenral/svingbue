# Flightglass portrait front-page directions

Date: 2026-07-15
Scope: three portrait-native, non-shipping front-page prototypes at 430×932 and 375×812. The production `index.html` is unchanged.

## Reference read

The Mobbin pass focused on portrait composition, sports information hierarchy and immediate product entry. It informed structure, not visual copying.

- [Premier League — tailored welcome](https://mobbin.com/screens/8d0982cd-7d1e-4546-b126-81d7c6b6c1dc): one clear next action and a full-screen sports world.
- [Apple Sports — welcome](https://mobbin.com/screens/72f10207-f706-47ad-961e-1319a71ab76b): a compact promise with unusually disciplined vertical hierarchy.
- [Apple Sports — home and onboarding](https://mobbin.com/screens/8bcd65f3-b866-433c-be74-e201ac5ecb82): live sports information becomes the visual identity instead of surrounding decoration.
- [Apple News — sports](https://mobbin.com/screens/46a8b585-e0b9-4389-9f84-afa2b88c3680): editorial scale and strong topic grouping in a narrow viewport.
- [theScore — sports entry](https://mobbin.com/screens/623c95a3-4b98-4d71-b18f-cffde6c759cf): dense sports utility remains legible through strict prioritisation.
- [Strava — interests](https://mobbin.com/screens/a823d247-6e4c-49da-8307-80417f9fc59e): direct tactile selection without generic card-dashboard styling.

Flightglass deliberately rejects stacked authentication, empty welcome slogans, interchangeable gradients and decorative dashboards. Each direction proves the product before asking the golfer to navigate.

## Direction 1 — Night Ladder

File: `home-portrait-1.html`

A floodlit range becomes a vertical flight corridor. Range, Outcome, Lab and Academy occupy distinct depths, so navigation reads as moving through the product world rather than opening a menu.

Strongest quality: cinematic atmosphere and instant golf context without sacrificing direct links.

Principal risk: the photographic field needs disciplined contrast across future crops.

## Direction 2 — Shot Spine

File: `home-portrait-2.html`

One live trajectory is the page's spine. A draggable ember exposes height, distance and side while destinations sit at causal stations along the shot. Pointer truth updates immediately; assistive announcements are deliberately debounced.

Strongest quality: the navigation itself demonstrates what Flightglass explains.

Principal risk: the high information density must remain carefully tuned on smaller devices.

## Direction 3 — Aperture

File: `home-portrait-3.html`

A large circular instrument frames one changing truth. Range, Outcome, Lab and Academy are radial modes; tap, swipe and arrow keys all select the mode, while one contextual action remains dominant.

Strongest quality: the most ownable silhouette and the calmest first impression.

Principal risk: the radial model is less conventional and must keep its explicit interaction cue.

## Independent acceptance result

The locked repository rubric was judged independently, then scored by `scripts/derive-score.mjs`; no score was assigned by the concept author.

The independent concept judge also scored each direction across five distinct
dimensions. These comparative scores are separate from the locked manifest
result below and were not forced to the requested 95+ aspiration.

| Direction | Visual hierarchy | Product truth | Native feel | Brand fit | Accessibility/runtime | Overall |
|---|---:|---:|---:|---:|---:|---:|
| Shot Spine | 96 | 98 | 98 | 98 | 98 | **97.5** |
| Aperture | 93 | 90 | 96 | 99 | 98 | **94.6** |
| Night Ladder | 95 | 92 | 90 | 96 | 98 | **93.8** |

- Manifest-derived set score: **96.3 / 100 — SHIPPBAR**.
- Critical failures: **0**.
- Blind comparison: the new portrait version won **6 of 6** anonymous current-versus-baseline pairs.
- Only remaining finding: `EV-TYPO-04`, a non-critical shared-token issue because `sa-p3.css` defines three font families rather than the locked two-family convention. Fixing the shared production token file was outside this non-shipping concept scope.

## Verification evidence

- 36/36 layout and interaction cases passed across three directions, two portrait sizes, Chromium and WebKit, normal motion, reduced motion and 130% text.
- 12 axe-core scans reported zero critical and zero serious findings.
- No browser errors, x/y overflow, clipped essential content, target overlaps or visible targets below 44 px.
- Shot Spine passed pointer, keyboard and ARIA checks; Aperture passed every radial click, swipe and arrow-key mode.
- The authoritative 240-event performance run measured p95 at 0.2 ms in Chromium and 0 ms in WebKit.
- All 12 direct reduced-motion captures were complete and nonblank.
- 24 independent approved-baseline regression pairs stayed below the 0.1% threshold; maximum change was 0.018714%.
- Focused portrait source tests passed 2/2; WebKit passed 41/41; brand verification passed.
- The current Flightglass lockup is used throughout. No account wall, generated imagery, protected physics change or Academy storage-key change was introduced.

## Recommendation

Advance **Shot Spine** as the product-defining direction: it turns Flightglass's causal explanation into the first interaction. Keep **Night Ladder** as the cinematic brand route and **Aperture** as the quieter, most iconic instrument route. Production selection remains an owner decision; none of the studies changes the shipping home page.
