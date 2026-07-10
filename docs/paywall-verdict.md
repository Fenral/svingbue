# Paywall — Fable verdict (2026-07-10)

**Judged:** `paywall-mock.html` live at 932×430 + 812×375 (screenshots read back). **Status: the money screen is TWO generations behind** — old prices (59/149/349 vs the locked 99/399/999) and the pre-P3 teal identity. The persuasion *skeleton* is right; everything it wears is wrong. One focused implementation pass fixes it — this list is that pass.

## What the bones get RIGHT (keep, do not redesign)
- The architecture: left = the moment ("You've played your 10 free shots") + concrete unlocks; right = 3 tiers, annual pre-selected with hero badge; one full-width CTA; fineprint + Restore/Terms/Privacy present.
- The decoy logic (monthly rendered small/muted), lifetime as the subscription-averse catcher, NO fake trial, NO fake ratings, dismissible ×. The voice of the headline states a fact, not a punishment. All of this survives.

## MUST (blocks production)
1. **[pay-01] Prices.** kr 59/149/349 → **kr 99 / 399 / 999** in the tier rows AND the JS CTA labels (`labels = {...}` ~line 267). Savings math changes: 99×12 = 1188 vs 399 → **"Save 66%"** (79% is now a lie). Lifetime sub: "Pay once — yours forever" stays.
2. **[pay-02] Full P3 repaint.** Kill every `--cyan`; consume sa-p3.css. Plates = `--plate`/`plate-solid`, radii per SYS-07, type roles per SYS-01: prices in IBM Plex Mono tabular (17px/600), tier names Inter 14/600, headline display role. This is the LAST teal surface in the app once geometry ships.
3. **[pay-03] Colour law on the money screen.** Ember budget ≤3: (a) the **Unlock Pro CTA** — the screen's single hot action (ember border+text on plate, per the diagnose CTA pattern — not a solid ember slab); (b) **"10 free shots"** in the headline — it is the user's own live data; (c) the selected tier's **price**. Everything else demotes: radio + BEST VALUE badge → violet secondary chrome; the five green checkmarks → `--muted` glyphs with `--ink` text (five green ticks read as infomercial, calm ink reads as instrument).
4. **[pay-04] Glued text (screenshot-proven bug).** "MonthlyBilled every month" / "AnnualSave 79% vs monthly" / "LifetimePay once" — name and sub render with zero gap. Stack them (name 14px over sub 11px `--muted`, 2px gap) or gap ≥8px inline. Acceptance: no two text runs touch at either viewport.
5. **[pay-05] Fit the lock viewports.** At 430h the card scrolls and the closing tagline clips; at 375h the legal row sits on the fold. Must render complete without page scroll at 932×430 AND 812×375: remove the dev banner at production (+30px), compress the left column's vertical rhythm, fineprint to one line ≤10px… no — fineprint stays ≥10px (V-floor law): shorten the string instead ("Auto-renews until cancelled in Settings.").
6. **[pay-06] Close × placement + behavior.** At 812 it crowds the Monthly row's price corner — inset it to the card's safe corner (12px), 44px hit, `.sa-focus` ring, and define behavior: returns to the locked instrument state (never exits, never grants shots). Keyboard: Esc = same.

## SHOULD (the difference between "fixed" and "convincing")
7. **[pay-07] The anchor line (from the strategy doc — currently missing entirely).** One quiet `--muted` line under the tiers: *"A year of understanding — less than half of one lesson."* Honest (399 vs 650–1000 NOK/lesson), Apple-safe, and it is the single strongest sentence this screen can carry.
8. **[pay-08] Say what stays free.** One line under the bullets: *"Diagnose and Academy Fundamentals stay free. Forever."* Goodwill + matches the locked model; the wall stops feeling like a trap.
9. **[pay-09] Annual framing.** Hero row gains "≈ kr 33/mo" as the small line — honest arithmetic that makes 399 feel like the obvious choice next to 99/mo.
10. **[pay-10] Bullets in instrument voice, max 4.** Rewrite feature-speak: `Unlimited shots — keep asking why` · `Every parameter, unlocked` · `Ghosts, face-zoom, full 3D replay` · `One instrument. Every ball-flight law.` (the current 5th merges).
11. **[pay-11] States.** Tier rows get pressed (scale .97/bg white .06) + `.sa-focus`; CTA label already swaps per selection (keep) but must re-announce via one polite live region; radio visual ≥22px inside 44px hit.
12. **[pay-12] The backdrop earns its place.** The faint dashed arc becomes one real, static ember trace (engine-solved, drawn once, very low alpha) rising behind the tiers — the product physically present at the moment of payment. Cheap, quiet, ties money to instrument.

## COULD
13. **[pay-13] Context line on arrival** (`from=diagnose`: "Your diagnosis is free. Replaying and fixing it is Pro." — already specified in diagnose v2 §8; wire when gating ships).
14. **[pay-14] Purchase-complete beat:** no confetti — the ember tracer fires ONCE across the paywall and carries you back into the unlocked instrument. Celebration = the product itself.

**Execution note:** one Opus pass implements pay-01..12 (queued behind the showcase per owner's sequencing); Sonnet re-checks against this list (each item has a measurable acceptance). RevenueCat/IAP wiring is separate (production port). Verdict artifact is durable — no Fable needed at execution.

— Fable 5
