# Mechanics Lab design finish evidence

Status: **PASS**
Scope: the Mechanics Lab product UI through fix batch `6a9ecf717cec17413dbb9ed4117136842e5746bf` and the refreshed tracked captures in `c47113bb23a3fb274277fe869dea925a6fa0a928`.

This is the durable design-finish record for the v1 Mechanics instrument. It
records the bounded detector and independent-review loop; it is not an
instruction to run either step again. Release identity and deploy evidence stay
in the exact-SHA release gate and PR execution record.

## Bounded detector record

- Detector invocations: **exactly `1`**.
- Detector rerun after fixes: **No**.
- Command used for the single invocation:

  ```powershell
  node C:\Users\siver\.agents\skills\impeccable\scripts\detect.mjs --json impact-studio.html impact-studio.css design/mocks/impact-studio.html index.html jarvis.html
  ```

The findings were resolved as one token-system batch. The detector was not used
as a polish loop.

| Before | After | Why |
| --- | --- | --- |
| Literal black and alpha values `#000`, `.85`, `.9`, `.92`, `.96` | `--mechanics-black-absolute`, `--mechanics-black-focus`, `--mechanics-black-contact`, `--mechanics-black-depth`, `--mechanics-black-float` | Name each optical job and keep the Mechanics material system auditable. |
| Literal radii `2px`, `3px`, `10px`, `14px` | `--mechanics-radius-indicator`, `--mechanics-radius-track`, `--mechanics-radius-compact`, `--mechanics-radius-switch` | Preserve deliberate geometry roles instead of anonymous one-off values. |
| `8px` and `9px` UI text | `--mechanics-type-floor: 10px` | Keep compact annotations readable without changing the information hierarchy. |
| Unnamed `11px`, `12px`, `14px`, `22px` sizes | `--mechanics-type-detail`, `--mechanics-type-control`, `--mechanics-type-compact-data`, `--mechanics-type-touch-data` | Make the compact and touch typography hierarchy explicit and reusable. |

The mapped token implementation landed in `23906099d5d229bd12b16ce3fb81aac92439ed08`.

## Independent finish review

The first provenance-blind finish review returned **CHANGES** with three
material findings. All three were closed in one fix batch; there was no
piecemeal polish loop.

| Before | After | Why |
| --- | --- | --- |
| Compact Arc omitted the fixed reference context. | Compact Arc explicitly shows `7-iron · 90 mph`. | Derived attack/path and strike need their bounded reference to remain interpretable. |
| Three Canvas annotations rendered at `8px`. | All three Canvas UI annotations render at the documented `10px` minimum. | Keep instrument labels legible across compact viewports. |
| Portrait instrument diagrams could flow behind the lower evidence region. | The instrument is structurally bounded above Cause Trace/trajectory evidence, with compact inputs arranged as a `2 × 2` control grid. | Preserve the causal diagram and live evidence simultaneously without clipping or overlap. |

One fix-batch commit: `6a9ecf717cec17413dbb9ed4117136842e5746bf`
(`fix(mechanics): keep compact evidence visible`).

The same independent reviewer then returned **PASS**. In the anonymous pair
checks, pair 1 winner was **A** and pair 2 winner was **B**; the current
candidate won both comparisons.

| Review dimension | Score |
| --- | ---: |
| Product fit | 98 |
| Causal legibility | 96 |
| Hierarchy | 94 |
| Responsive integrity | 95 |
| Accessibility | 96 |
| Brand specificity | 97 |
| Non-generic craft | 96 |

All critical requirements were green: the UI is a product-specific causal
instrument; both input authorities provide live outcomes; the compact layouts
retain evidence; interaction remains keyboard-accessible and reduced-motion
safe; and the copy explains mechanics without coaching or personal-golf
claims. No material design finding remains open.

## Durable visual and runtime evidence

Tracked product evidence:

- [Mechanics onboarding capture](../assets/onboarding/studio.webp)
- [Current five-screen store contact sheet](../appstore/contact-sheet.png)

GitHub Actions run
[`31234474478`](https://github.com/Fenral/svingbue/actions/runs/31234474478)
captured the reviewed UI at source checkpoint
`5f335b52cc6fd9fd0e2f79bdea3a392ed316806c`. Its immutable artifact
[`flightglass-v1-release-evidence-31234474478`](https://github.com/Fenral/svingbue/actions/runs/31234474478/artifacts/9014962682)
has digest
`sha256:d8b70ab0b334e2fb18d741db3ae20764fa33a6450e5e512ff37b5795a1ca22c3`.
The artifact contains 32 Mechanics images: Chromium and WebKit, four viewports,
Impact/Arc modes, and normal/reduced motion. Representative artifact paths are:

- `change-gate/impact-studio/chromium--932x430--normal--delivery.png`
- `change-gate/impact-studio/chromium--932x430--normal--arc.png`
- `change-gate/impact-studio/webkit--430x932--reduced--delivery.png`
- `change-gate/impact-studio/webkit--430x932--reduced--arc.png`

The CI images are generated evidence and intentionally are not duplicated as
tracked repository binaries. A later release candidate must obtain its own
exact-SHA gate; this historical run is not represented as proof for a newer
commit.

The executable browser contract in
`scripts/impact-studio-browser.test.mjs` additionally verifies every visible
Mechanics control through Playwright role and accessible-name resolution. It
uses keyboard traversal in both Impact and Arc modes and checks actual computed
`:focus-visible` state plus a visible outline or box-shadow treatment. Those
checks run across the same eight viewport/motion scenarios in both Chromium
and WebKit.
