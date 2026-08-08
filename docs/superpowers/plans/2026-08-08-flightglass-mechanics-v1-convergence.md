# Flightglass Mechanics v1 Convergence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` task-by-task and `superpowers:dispatching-parallel-agents` only for disjoint worktrees. Preserve the RED → GREEN order and commit each cohesive slice.

**Goal:** Converge the completed Mechanics Lab into the exact PR #18 release candidate so Flightglass v1 has one sellable, non-coaching cause→strike→flight instrument while retaining the native shell, access policy, release boundary and exact-SHA evidence controls.

**Architecture:** `impact-studio.html` remains the compatibility route and internal `studio` route id, but its visible product is Mechanics Lab. The pure `impact-mechanics-model.js` composes the unchanged flight and rigid-arc authorities behind mutually exclusive Impact Inputs and Arc Inputs. The PR #18 shell, native-only access, RevenueCat, analytics, Guide handoff and release tooling wrap that instrument. `scripts/copy-web.mjs` remains the only native/Vercel packaging authority and gains the complete recursive Mechanics closure.

**Tech Stack:** Static HTML/CSS/ES modules, Node test runner, Playwright Core (Chromium and WebKit), Canvas, Capacitor 7, RevenueCat, GitHub Actions and Vercel CLI/evidence API.

---

## Locked baseline and boundaries

- Integration base: `origin/agent/page-overview` at `08a47a3350a3634ca06223bc5e80ef225b08bec0`.
- Mechanics source: `agent/mechanics-mvp-codex` at `9339a5b5ebe5e637ba15986451ee4be6932cf2cc`.
- Seven known conflicts: `.impeccable/design.json`, `DESIGN.md`, `PRODUCT.md`, `design/mocks/impact-studio.html`, `docs/flightglass-autopilot/COORDINATION.md`, `impact-studio.html`, `scripts/impact-studio-browser.test.mjs`.
- Protected physics remain byte-identical: `impact-flight.js`, `swing-parameters-and-impact.js`, `diagnose-engine.js`, `diagnose-engine-v2.js`.
- Protected IDs remain exact: `no.strikearc.app`, App Store `6768449250`, all three `strikearc_pro_*` products and existing `strikearc.academy.*` keys.
- Academy Voice and Android remain v2. No personal swing, diagnosis, coaching, accounts, PWA, cloud sync or new physics enters this plan.

## Product contract

| Surface | One job in v1 |
|---|---|
| Home | Explain the product map and lead first to Mechanics Lab. |
| Mechanics Lab | Own both complete cause → strike → flight chains. |
| Range / Outcome | Replay flight and compare model states as a support surface, not a duplicate explainer. |
| Guide | Answer predefined questions and hand one bounded experiment to Mechanics or Range. |

Impact Inputs owns Face Angle, Club Path, Attack Angle and Dynamic Loft → Start, Curve, Launch, Backspin, Apex and Carry. Club Speed is a visibly held 90 mph reference. Arc Inputs owns Low Point X, Low Point Height (`lowPoint.z`), Swing Direction and Swing Plane → Contact, Attack Angle and Club Path → the same flight instrument. Arc handoff changes only Attack and Path.

## Definition of Done map

- **Product:** both chains update synchronously; Home/onboarding/Guide tell the same truth; browser preview stays free and native access remains first-guided-free then Pro.
- **Integration:** all seven conflicts are resolved intentionally; root/`www` closure includes every Mechanics module; dead Studio imagery and repository internals do not ship.
- **Design:** all four required viewports and both modes pass normal/reduced-motion review; no 44 px, focus, clipping, overflow, runtime, console or resource criticals; one detector run and one fresh reviewer end in `PASS`.
- **Release:** protected diffs/IDs stay clean; local and GitHub exact-SHA Level C pass; a verified non-production Vercel preview and immutable attestation exist.
- **External:** RevenueCat, signed TestFlight, sandbox transactions, physical-iPhone rows, moderated sessions, GitHub Pages containment, production promotion and App Store submission remain fail-closed until real evidence and the owner's consolidated authorization exist.

### Task 1: Lock convergence with RED contracts

**Files:**
- Create: `scripts/mechanics-v1-product-contract.test.mjs`
- Modify: `scripts/v1-app-contract.test.mjs`
- Modify: `scripts/web-release-contract.test.mjs`
- Modify: `scripts/orientation-lock.test.mjs`
- Modify: `scripts/phase4-paywall-browser.test.mjs`
- Modify: `scripts/flightglass-change-gate.test.mjs`
- Modify: `scripts/native-release-contract.test.mjs`
- Modify: `scripts/store-release-contract.test.mjs`
- Modify: `package.json`

- [ ] Add a source contract that requires Mechanics to be the sole explanatory authority, keeps internal route/access identifiers, rejects coaching language, requires shell/paywall/access/analytics hooks and forbids `lockLandscape()`/rotate overlays.
- [ ] Require `impact-studio.css`, `impact-mechanics-model.js` and `geometry-controller.js` in root/`www`; require the legacy `www/assets/impact-studio` directory to be absent.
- [ ] Require native `unlockOrientation()` and adaptive shell orientation while retaining portrait/landscape manifest support.
- [ ] Point guided paywall completion at a stable Mechanics control and preserve consume-after-commit, second-use paywall and purchase-resume assertions.
- [ ] Require Level C classification for model/controller semantics and make `verify:v1:release` transitively run the Mechanics model contract.
- [ ] Run the focused RED set:

```powershell
node --test scripts/mechanics-v1-product-contract.test.mjs scripts/v1-app-contract.test.mjs scripts/web-release-contract.test.mjs scripts/orientation-lock.test.mjs scripts/flightglass-change-gate.test.mjs scripts/native-release-contract.test.mjs scripts/store-release-contract.test.mjs
```

Expected: failures name missing Mechanics DOM/modules, adaptive orientation, package closure and new release-script linkage—not syntax or harness errors.

- [ ] Commit only tests/scripts metadata:

```powershell
git add package.json scripts/mechanics-v1-product-contract.test.mjs scripts/v1-app-contract.test.mjs scripts/web-release-contract.test.mjs scripts/orientation-lock.test.mjs scripts/phase4-paywall-browser.test.mjs scripts/flightglass-change-gate.test.mjs scripts/native-release-contract.test.mjs scripts/store-release-contract.test.mjs
git commit -m "test(v1): lock mechanics convergence" -m "Co-Authored-By: Codex <noreply@openai.com>"
```

### Task 2: Merge Mechanics history and resolve all seven conflicts

**Files:** the seven known conflicts plus auto-merged Mechanics additions and `config/flightglass-surfaces.json`.

- [ ] Create the rollback unit with `$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'` and copy every planned shipping/runtime/doc file into `.sa-backups/mechanics-v1-convergence-$stamp/`.
- [ ] Run `git merge --no-ff --no-commit agent/mechanics-mvp-codex` once. Do not abort.
- [ ] Resolve HTML/mock from the Mechanics hierarchy, then graft PR lifecycle hooks; resolve tests from the Mechanics contract using PR's Chromium/WebKit/evidence harness; merge Product/Design instead of taking either side wholesale.
- [ ] Preserve only the `mechanics-mvp` manifest insertion from Mechanics while retaining current PR Home/Paywall entries.
- [ ] Prove no markers remain:

```powershell
git diff --check
rg -n "^(<<<<<<<|=======|>>>>>>>)" .impeccable/design.json DESIGN.md PRODUCT.md design/mocks/impact-studio.html docs/flightglass-autopilot/COORDINATION.md impact-studio.html scripts/impact-studio-browser.test.mjs
git ls-files -u
```

Expected: no marker match and no unmerged index entries.

- [ ] Commit the intentional merge with the required trailer.

### Task 3: Implement the hybrid Mechanics runtime in an isolated worker worktree

**Files:**
- Modify: `impact-studio.html`
- Modify: `impact-studio.css`
- Modify: `design/mocks/impact-studio.html`
- Modify: `sa-app-shell.js`
- Modify: `sa-orientation.js`
- Modify: `scripts/impact-studio-browser.test.mjs`
- Modify: `scripts/orientation-lock.test.mjs`
- Modify: `scripts/phase4-paywall-browser.test.mjs`

- [ ] Add the early transition guard, favicon, canonical shell/paywall CSS, `data-sa-route="studio"`, access/IAP/analytics and shell/orientation modules to the Mechanics document.
- [ ] On `?guided=experiment`, authorize before activation, open Arc Inputs, consume only after a changed control commits, emit only allowlisted non-personal events and resume after purchase.
- [ ] Keep filename/id/access/event compatibility; show `Mechanics`/`Mechanics Lab` visibly.
- [ ] Add native-safe `unlockOrientation()` and set shell Studio orientation to unrestricted; remove rotate/inert behavior for Mechanics.
- [ ] Repair responsive layout: keep the three-region cause/effect chain at 812×375, reserve shell-nav height in landscape and lift the portrait facts/telemetry lower-third above the nav.
- [ ] Expand browser cases to 932×430, 812×375, 430×932 and 375×812 in both modes and both motion settings, Chromium and WebKit; verify 44 px targets, keyboard focus, labels, live outcomes, shell overlap and zero errors.
- [ ] Commit from the worker branch and cherry-pick into convergence.

### Task 4: Close packaging, risk routing and recursive ESM contracts in a second worker worktree

**Files:**
- Modify: `scripts/copy-web.mjs`
- Modify: `scripts/v1-app-contract.test.mjs`
- Modify: `scripts/web-release-contract.test.mjs`
- Modify: `scripts/lib/flightglass-change-gate.mjs`
- Modify: `scripts/flightglass-change-gate.test.mjs`
- Modify: `scripts/native-release-contract.test.mjs`
- Modify: `package.json`

- [ ] Add the three direct Mechanics files to the allowlist and parity lists; preserve every transitive engine/shell/payment dependency already present.
- [ ] Remove the eight unused `assets/impact-studio/*.png` files from the v1 artifact allowlist while leaving source assets untouched for historical mocks.
- [ ] Require recursive module closure and 404/private boundaries for docs, mocks, scripts, tools, repository config, Academy, Geometry and Three.js.
- [ ] Add `test:studio:contracts` and ensure `test:studio`/`verify:v1:release` cannot skip model, geometry or browser evidence.
- [ ] Map CSS to Level B and model/controller semantics to Level C without changing existing Vercel-preview classification.
- [ ] Run:

```powershell
npm run copy-web
node --test scripts/v1-app-contract.test.mjs scripts/web-release-contract.test.mjs scripts/native-release-contract.test.mjs scripts/flightglass-change-gate.test.mjs
```

Expected: all tests pass; new files are byte-identical; `www/assets/impact-studio` is absent.

- [ ] Commit from the worker branch and cherry-pick into convergence.

### Task 5: Reconcile product, onboarding, Guide and release truth in a third worker worktree

**Files:**
- Modify: `PRODUCT.md`, `DESIGN.md`, `.impeccable/design.json`, `TECH_SPEC.md`, `DECISIONS.md`
- Modify: `docs/FLIGHTGLASS-CLAUDE-CODE-MASTER-PLAN.md`
- Modify: `index.html`, `sa-home.js`, `jarvis.js`, `sa-paywall.js`, `support.html`, `terms.html`
- Modify: `scripts/capture-onboarding-visuals.mjs`, `scripts/store-screenshots.mjs`, `config/image-provenance.json`
- Modify: `NATIVE.md`, `docs/store-listing.md`, `docs/app-review-notes.md`, `docs/phase2-onboarding-uat.md`, `docs/phase2-phone-checklist.md`

- [ ] Make Mechanics the sole causal explainer and Range/Outcome support surfaces everywhere; preserve the fixed Delivered Loft onboarding demonstration as one bounded example.
- [ ] Rename visible Studio wording to Mechanics while retaining internal `studio` compatibility names and the Guide `?guided=experiment` link.
- [ ] Describe both Mechanics authorities, same six outcomes, adaptive orientation, native-only access, restore-only Lifetime and non-coaching boundaries in product/legal/store copy.
- [ ] Merge the global Guide/app-shell design contract with the shipped Ultraviolet Ballistics Bench tokens/components; make `.impeccable/design.json` match and remove stale sidecar status.
- [ ] Update capture/store generators to wait for the Mechanics DOM; do not fabricate screenshot data.
- [ ] Run product/source contracts, `git diff --check` and the added-secret scan; commit and cherry-pick.

### Task 6: Generate real assets and close focused functional gates

**Files generated or refreshed:** `assets/onboarding/studio.webp`, `appstore/` screenshots/gallery/contact sheet, ignored UX evidence under `outputs/`.

- [ ] Run `npm run shots:onboarding`; update provenance only to the exact default Mechanics engine state, then run `npm run verify:images`.
- [ ] Run `npm run shots`; inspect actual diffs and commit only current-product store artifacts.
- [ ] Run focused suites:

```powershell
npm run test:studio
npm run test:phase4:chromium
npm run test:phase4:webkit
npm run verify:v1
npm run test:web-release
npm run test:native-release
npm run test:store-release
npm run test:engine
npm run brand:verify
```

Expected: Mechanics/phase4/v1/package/store suites pass; engine remains at least 72/72; protected diff is empty.

### Task 7: Complete the single Impeccable/Emil visual loop

**Changed targets:** `impact-studio.html`, `impact-studio.css`, `design/mocks/impact-studio.html`, Home/onboarding/Guide surfaces affected by copy/assets.

- [ ] Capture one combined screenshot pass: four viewports × Impact/Arc × normal/reduced motion in Chromium and WebKit. Inspect every image, not only DOM measurements.
- [ ] Record Emil's required table `Before | After | Why` for hierarchy, control feedback, shell integration, responsive composition and truth labels.
- [ ] Run the detector exactly once:

```powershell
node C:\Users\siver\.agents\skills\impeccable\scripts\detect.mjs --json impact-studio.html impact-studio.css design/mocks/impact-studio.html index.html jarvis.html
```

- [ ] Fix all material detector findings in one batch without rerunning the detector.
- [ ] Send the original brief, direction contract, detector JSON, screenshots and craft floor to a fresh no-history reviewer. Apply material findings in one batch, recapture the same states and ask that same reviewer for final `PASS`.
- [ ] Commit visual corrections and reviewer evidence references.

### Task 8: Prove the exact candidate locally and in GitHub

- [ ] Update `docs/SESSION-HANDOFF.md`, `docs/flightglass-autopilot/STATUS.md`, `docs/v1-release-record.md` and coordination state with fresh counts and pending external gates. Preserve `08a47a3` preview tooling and mark PR #18 as the superseded baseline.
- [ ] Run the clean local candidate gate and audits:

```powershell
npm run verify:change -- --base origin/main --level C
npm audit --audit-level=high
npm audit --omit=dev --audit-level=high
npm audit --prefix tools --audit-level=high
```

- [ ] Verify clean tree, no conflict markers/TODOs/secrets, exact protected blobs and required co-author trailers.
- [ ] Push `agent/mechanics-v1-convergence`, open a new draft PR to `main`, record its number, then update canonical PR references and push the final exact SHA.
- [ ] Wait for `Flightglass v1 release gate`; require the workflow head/base to equal the PR exact SHA/base, download its evidence artifact and validate all three audit files.

### Task 9: Create and verify the exact-SHA Vercel preview

- [ ] Confirm ignored `.vercel/project.json` names project `prj_ghY32ypKS3kXfmTM3BCRzfl5ptqC`; confirm `VERCEL_TOKEN` and `VERCEL_AUTOMATION_BYPASS_SECRET` exist without printing either.
- [ ] Deploy only through the fail-closed command with candidate SHA repeated as confirmation:

```powershell
$candidateSha = git rev-parse HEAD
$baseSha = git merge-base HEAD origin/main
$greenRunId = gh run list --repo Fenral/svingbue --workflow "Flightglass v1 release gate" --branch agent/mechanics-v1-convergence --status success --limit 1 --json databaseId --jq '.[0].databaseId'
npm run verify:v1:vercel-preview -- --deploy --candidate $candidateSha --base $baseSha --run-id $greenRunId --confirm-preview-deploy $candidateSha
```

- [ ] Verify the immutable deployment ID/URL with the same tool. Require `READY`, non-production target, exact metadata, semantic Home/Mechanics/Range/Guide/Privacy/Terms/Support content and expected 404s for internals/deferred routes.
- [ ] Preserve the ignored JSON/SHA-256 attestation and link it from the draft PR/release record. Do not promote production.

### Task 10: Prepare the irreversible release boundary

- [ ] Reconcile current production and GitHub Pages baselines read-only; prepare exact rollback commands and containment plan.
- [ ] Produce candidate-bound RevenueCat/TestFlight/App Store/physical-iPhone/moderated-session checklists with no simulated PASS rows.
- [ ] Ask once for consolidated authorization immediately before main merge, production promotion, TestFlight upload, RevenueCat/App Store product mutations, live purchase, Pages containment and App Store submission.
- [ ] Keep the goal active until the real native/payment/device/human evidence exists; if credentials or humans block, request only the exact owner action.

## Self-review

- All user-named DoD sections A–G map to an executable task and evidence command.
- RED integration/package/orientation/access contracts precede the hybrid merge implementation.
- Runtime, packaging and product/docs ownership can run in isolated worktrees without overlapping files.
- No task changes protected physics, compatibility identifiers, Academy, Android or the existing fail-closed Vercel evidence implementation.
- Production, TestFlight, payment mutation and store submission remain behind one explicit owner gate.
