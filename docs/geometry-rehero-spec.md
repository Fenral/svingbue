# GEOMETRY RE-HERO — back to the core (binding spec, 2026-07-11)

**Owner's diagnosis (Sivert, interview 2026-07-11):** the 3D geometry drifted the wrong way. The oldest version (reference: `Apper/inspirasjon til bye/` — NOT to be copied, it captures the *purpose*) was functionally right: you SEE live how plane / swing direction / low point create PATH and ATTACK. The chase for looks (face-zoom, impact 3D detail) pulled the module away from that core.

## Interview verdicts (all binding)
1. **The lost core** = immediacy (every drag → big legible change, no playback needed) + the **delivery arrow through the ball** (attack and path ARE the arrow, not a number beside it) + the number/image coupling (verdict + ATTACK/PATH one glance from the scene). Scene *simplicity* was NOT chosen — today's observatory scene survives.
2. **Architecture: RE-HERO in the current scene.** No demolition. The armillary/club/star-floor stays; hierarchy changes.
3. **Face-zoom / impact-3D: PARKED.** All code stays (facezoom.js, FIX N machinery) but NO UI trigger fires it — no auto cut-in, no hint, no freeze choreography. Optional `?facezoom=1` dev flag may re-enable for later revival.
4. **Animation: CONTINUOUS LOOP.** The club circles the arc calmly, forever (like the old version), pausable with the existing control. No play-once ceremony as the default grammar.
5. **Arrow honesty: 1:1 exact angles, but BIG.** Legibility comes from length/thickness/color — never angle exaggeration.
6. **Numbers: today's readout content, but fully live during drag** — with ATTACK + PATH typographically dominant inside it (largest, mono, param-hues attack `#4DE8D2` / path `#6FC6FF`), adjacent to the strike verdict. The rest (band pct, tip, ball-closeup) demotes one step. (Guards the Q1 coupling verdict against readout dilution.)
7. **FX: quiet loop, respond on change.** The loop itself is clean geometry — NO per-pass divots/flash. When a slider value settles (changed), the NEXT impact pass plays the full band-correct strike response ONCE, then quiet again. The scene answers your question, then goes back to breathing.

## Implementation
- **Delivery arrow (geo3d/delivery.js) becomes the scene's hero and its single ember element** (`#FF8A4D` = live engine truth): length grown to pass visibly THROUGH the ball (~1.0–1.2 m total, extending slightly behind and well ahead), thicker shaft + cone, ember emissive; keep the existing ground projection (path-cyan, low alpha) for the path component. Direction stays exactly `normalize(tangentAt(thetaAtImpact(state)))` — 1:1, no gain. Always visible; brightens during drag (existing causal pulse); hidden never (loop no longer hides it — the old FIX-3 "hide during playback" rule is dropped since the loop is the resting state).
- **Ember budget:** the arrow takes the scene's ember slot; if emberRim light or contact markers currently read as ember at rest, dim them to stay ≤3.
- **Live-during-drag:** everything already live (arc/plane/lowpoint/arrow via applyLive) stays; additionally ATTACK/PATH chips and the strike verdict (band + pct) must update continuously during drag, not on settle.
- **Continuous loop (geo3d/timeline.js):** default state = calm loop of the existing swing timeline (repeat forever, slightly slower base tempo, linear-ish — no dramatic slow-mo window), pause/resume via the existing control. Slider drag does NOT stop the loop (old behavior); the arc/plane/arrow restyle live under the moving club.
- **FX-on-change:** parameter settle (existing settle detection) arms ONE full band-correct impact response (divot/spray/flash per band table) on the next impact pass; then disarmed. No FX otherwise.
- **Face-zoom parking:** remove cut-in call from the loop path, hide the hint chip, keep files; `?facezoom=1` restores the old trigger for dev.
- **Battery/native guards:** loop pauses on `document.hidden`; after ~8 quiet loop rounds with zero interaction → freeze at address pose and return to render-on-demand (invalidate); any pointer/slider/keyboard interaction resumes the loop. renderCount assertions updated: grows while looping, static after idle freeze.

## Laws (unchanged)
Engine files byte-identical. Landscape-only. Relative imports (WKWebView). `checkAlign3d` passes. sceneData live region announces on settle (never per-frame). P3 tokens. Reduced-motion: loop does NOT auto-run — static address pose, arrow + numbers fully live on drag (immediacy preserved without motion).

## Verification (headless, 900×470 + 844×390)
1. Arrow visibly crosses the ball in FACE and DTL screenshots; measured screen length ≥ ~15% of viewport width.
2. Drag `s_dir` → arrow yaw + PATH chip change mid-drag (screenshot diff + numeric assert vs deriveImpact); drag `s_lpx` → ATTACK likewise.
3. After a slider settle: exactly ONE FX burst on the next impact pass, then none for 2 full loop rounds.
4. No face-zoom cut-in across 3 loop rounds; `?facezoom=1` restores it.
5. renderCount: increasing during loop; static ≤1.5 s after the idle freeze kicks in; resumes on interaction.
6. 0 console errors both viewports; checkAlign3d pass; reduced-motion pass (no auto-loop, drag still live).

— Fable 5, from the owner interview 2026-07-11
