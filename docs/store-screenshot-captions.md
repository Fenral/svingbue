# Store screenshot captions — Flightglass v1

The committed upload set lives in `appstore/` and is regenerated with
`npm run shots` (`scripts/store-screenshots.mjs`). Apple uses five 1290 × 2796 portrait
screenshots. Google Play uses the matching five 1080 × 1920 portrait screenshots in
`appstore/play/`; its feature graphic is 1024 × 500.

Use these one-line captions in the order shown by `appstore/index.html`:

| Apple / Play file | Surface | Caption (alt / promo text) |
|---|---|---|
| `01.png` | Range / Outcome | **Replay the setup. Compare the outcome.** — Range keeps a modelled setup and its flight values together. |
| `02.png` | Mechanics Lab | **Trace cause to strike. Watch flight respond.** — Impact or Arc Inputs update contact and six outcomes. |
| `03.png` | Flightglass Guide | **Ask a precise golf question.** — Get a short answer, evidence and model limits. |
| `04.png` | Home | **See how the numbers connect.** — One model connects impact, launch and flight. |
| `05.png` | Interactive onboarding | **Learn by changing one number.** — Watch launch, spin loft and backspin move together. |
| `feature-graphic.png` (Play only) | Mechanics Lab | **Flightglass. See why it flew.** — Trace cause to strike and watch flight respond. |

Before upload, compare this file with `appstore/index.html`, verify every image
against the release candidate, and confirm the current store specifications.
If required sizes change, update the output dimensions in
`scripts/store-screenshots.mjs` and regenerate with `npm run shots`.
