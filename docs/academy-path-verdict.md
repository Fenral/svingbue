# Academy front page (Mastery Path) — Fable verdict (2026-07-11)

**Judged live** at 430×932 (`academy.html#/path`, fresh profile). Companion to `docs/academy-native-v2-spec.md` — the path redesign executes AFTER the v2 lesson template is approved, but these calls are settled now.

## 1 · Topic set (which lessons exist)
**Coverage is right for the lane** — delivery → ball → flight → environment, 21 lessons, zero technique/drill content (boundary holds). Two verdicts:
- **The known gap is LOW POINT** — the geometry module's core concept has no chapter. Already solved: `docs/academy-lowpoint-chapter-spec.md` adds 3 lessons (low-point → strike-depth → plane-coupling), gated behind Attack Angle. Set becomes 24. No other missing topics *within the lane*; resist additions beyond it.
- Environment tier (altitude/wind/temperature) gated behind Carry is correct — keep.

## 2 · Order (the real pedagogical finding)
**START HERE = Club Speed is the weakest possible opener for our audience.** The curious golfer's burning question is *"why does my ball curve?"* — that story lives in Face Angle → Club Path → (Spin Axis → Curve). Club Speed is the least curiosity-loaded fundamental; it opens the app's least interesting causal chain (speed→ball speed→carry).
**Verdict — reorder the Fundamentals tier to the shot's own story:**
`Face Angle (START HERE) → Club Path → Attack Angle → Dynamic Loft → Club Speed`
…so the derived unlocks deliver the slice payoff (Start Direction, Spin Axis, Curve) as EARLY as possible. This is an unlock-graph edit (prereq order), not new content. It aligns Academy's front door with Diagnose's front door — the whole app then opens on the same question.

## 3 · UI/UX punch list (tree view)
1. **[path-01] Six unlabeled icon buttons** under the header (sunrise/refresh/target/star/crosshair/compass): mystery chrome — fails congruence. Each gets a visible function + accessible name, or dies. Suspect ≥3 die.
2. **[path-02] Dependency-line spaghetti:** curves cross each other AND pass through cards at whisper-to-medium alphas — reads as noise, teaches nothing. Native fix (matches the polish-spec's relation-light): at rest, lines at ≤.08 alpha; tapping/focusing a card lights ONLY its own prereq/unlock threads (violet) and dims the rest. The graph becomes an instrument, not wallpaper.
3. **[path-03] Wall-of-locked:** the entire DERIVED tier renders as grey padlocks — demotivating scroll. Fix: the NEXT unlockable card(s) render semi-lit with "1 lesson away" energy; deeper locks collapse into a tier summary row ("8 lessons · unlocks after Spin Loft") that expands on tap.
4. **[path-04] Cards are text chips, not places:** add per-lesson identity — param-hue dot/micro-glyph (the hues already exist as law), a thin mastery ring on completed cards, XP value on unlockables. Cheap, big scanability gain.
5. **[path-05] Fold economy:** title + 40-word intro consumes ~35% of the first viewport before anything tappable. Compress to mission line + a real progress bar (0/24 with tier ticks); the long intro moves to a sheet.
6. **[path-06] Haptics (none today):** card tap = light · unlock moment = notify success (once per unlock) · tier complete = medium + the gold moment · no scroll ticks (HIG: no nav haptics).
7. **[path-07] Rank ladder in header:** "Level 1 · Apprentice · 0 XP" is the right skeleton — adopt the named 5-rank ladder from the v2 spec (§S5) so the header rank means something; gold reserved per SYS-15.
8. **[path-08] The unification opportunity (hold for later):** the app's new front page renders destinations as a constellation; the Mastery Path as a *star chart of lessons* (same sky grammar, lessons as stars, prereq threads as constellation lines) would fuse Academy into the Observatory world. Powerful but a full redesign — decide after the v2 lesson template lands. Items 1–7 are worth doing regardless and survive that redesign.

**Sequencing:** path-01..07 = one Opus pass after the v2 lesson mock is approved (they're independent of the template); §2's reorder ships with the lowpoint chapter's graph edit. path-08 = own decision later.

— Fable 5
