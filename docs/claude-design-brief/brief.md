# DESIGN BRIEF — Rebuild the "Backspin" lesson as a NATIVE-feeling mock

**You are asked to produce a MOCK (visual design / HTML mock, portrait 430×932) of ONE lesson — "Backspin" — from StrikeArc Academy, reimagined to feel like a native iOS learning app instead of a scrolling website article.**

## The product in two sentences
StrikeArc is a premium golf ball-flight instrument app (dark "Ultraviolet Ember" identity — a cold ultraviolet night where one ember-orange element is the only heat). The Academy is its learning module: 21 physics lessons with engine-live interactive diagrams, quizzes and XP — audience is the **curious golfer, not the expert**; real terminology is kept and taught, never dumbed down.

## The problem (owner's words)
Today's lesson page is **too text-heavy** and has a **"website feel"**: long scrolling article, paragraphs stacked under headings, quiz at the bottom. It reads like a well-styled blog post. It should feel like a **native app experience**: paced, card/surface-based, one idea at a time, thumb-driven, alive.

## What you receive in this folder
- `lesson-backspin.json` — the COMPLETE real content (structure: `parameter`, `oneLiner`, `whatItIs`, `components`, `howTheyConnect`, `hierarchy`, `misconceptions`, `wolframChecks` (physics-verified facts), `quiz` (5 items)). **All content is real and correct — reorganize/pace it freely, but do not change facts or terminology.**
- `current-backspin-top.png` / `-mid.png` / `-quiz.png` — screenshots of the page as it is TODAY (the thing to beat).

## Hard constraints (non-negotiable)
1. **Palette** (P3 "Ultraviolet Ember" tokens): bg `#07060C` · surface `#110D1C` · solid plate `#0D0A18` · ink `#F5F2FF` · muted `#A79FC7` · hairline `rgba(255,255,255,.10)` / strong `.30` · violet secondary `#9D8BFF` · **ember `#FF8A4D` = live data/celebration ONLY, max ~3 ember elements at rest** · XP/mastery gold `#FFD056` · good `#58E6A8` · bad `#FF7B8A` · param hues: face `#FF5C6B`, path `#6FC6FF`, attack `#4DE8D2`, loft `#B9A0FF`.
2. **Type roles:** ui = Inter · display = Space Grotesk (hero/headings) · data = IBM Plex Mono (numbers ONLY, tabular, U+2212 minus). Nothing below 10px.
3. **The interactive diagram is the soul** — the lesson has a live schematic where dragging Attack Angle / Dynamic Loft / Club Speed updates a big live backspin RPM readout (the RPM number is ember). Keep an interactive centerpiece; make it MORE prominent, not less.
4. **Precision is non-negotiable:** real terms (spin loft, dynamic loft, attack angle) stay and are taught inline at first use.
5. **Quiz = mastery:** 5 questions, mastery requires 4/5. Wrong answers teach (each distractor targets a misconception).
6. Portrait-first 430×932. Radii: 12 controls / 16 cards / 999 pills. Focus states visible; 44px hit targets; one polite live region; reduced-motion parity.

## What to break (this is the assignment)
- The scroll-article. Consider: **paced steppers** (one idea per card, sticky Next), **bottom sheets** for depth-on-demand (definitions, misconceptions), **the diagram as the hero surface** with teaching beats layered ONTO it rather than paragraphs above it, progressive disclosure instead of walls of text.
- Long paragraphs → split into: one bold claim + one supporting line + "show me" (the diagram demonstrates it live).
- The "website" chrome: headers-as-headings, visible scrollbars-of-text, footer-quiz. Native grammar instead: surfaces, sheets, snap points, haptic-feeling transitions.
- Keep TOTAL reading load per screen ≤ ~50 words; the full content still lives in the flow (paced or in sheets), nothing deleted.

## Success criteria
A golfer opens "Backspin", plays with the machine within 5 seconds, learns the spin-loft chain by DOING, and passes mastery — never feeling like they read an article. It should look like it shares an app with a premium dark instrument (think Apple Fitness levels of confidence), not like documentation.

## Deliverable
One portrait mock of the full Backspin lesson flow (screens or scrolling prototype), using the real content from `lesson-backspin.json`. Show: entry, the interactive hero, how the teaching beats pace, one bottom-sheet example, the quiz, and the mastery moment.
