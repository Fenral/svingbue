# Flightglass front-page directions — 95+ concept loop

Date: 2026-07-15
Scope: three interactive, non-shipping front-page prototypes. No account layer is added: Flightglass remains instant-access and stores no personal login data.

## Reference read

The Mobbin pass was used for composition and entry hierarchy, not for visual copying:

- [On — Yours. On the move.](https://mobbin.com/screens/e49ff2f8-ce32-4bb5-9a59-600108709b23): product world occupies the screen before the small entry choices; the guest path keeps access immediate.
- [Fixtured — Your sports schedule](https://mobbin.com/screens/a7845abf-f835-493c-aa90-34c2c09141fa): the product promise is demonstrated as a real object before authentication choices.
- [The Athletic — editorial sports entry](https://mobbin.com/screens/e00172f6-8357-4e0a-b99a-0830050ab803): image, point of view and one sentence create a premium editorial threshold.
- [Premier League — tailored welcome](https://mobbin.com/screens/8d0982cd-7d1e-4546-b126-81d7c6b6c1dc): one dominant next step, with returning access visually secondary.
- [DAZN — content-first entry](https://mobbin.com/screens/2d175a9c-3771-4454-8f58-51fa902a712e): the user sees the content universe before being asked to act.

What Flightglass rejects from these references: stacked social-auth buttons, generic welcome copy, testimonial language and a blocking account decision. The useful lesson is that an entry screen should prove the product before asking for input.

## Direction 1 — Floodlights

File: `home-concept-1.html`

The night range is the navigation system. Ball Flight, Strike Window, Outcome, Academy and Diagnose are physical places at different depths. Selecting a destination is expressed as travel through the scene.

Why it is not generic: hierarchy comes from distance, light and geography rather than a card rail. The app is already running when it opens.

Primary risk: some labels cross a photographic field, so future production integration must preserve the current plate contrast and test every crop.

## Direction 2 — Summon

File: `home-concept-2.html`

One ember ball is the only hot element. Holding it—or using the explicit Menu control—summons the product destinations into orbit. The focused destination sits nearest the user and can swallow the screen on entry.

Why it is not generic: the home page begins as an object, not a page. Navigation is a physical reveal with a complete keyboard and reduced-motion fallback.

Primary risk: deliberate mystery can reduce first-use comprehension. The refined hint now names both interaction paths: `Hold to summon · or tap Menu`.

## Direction 3 — The Arc

File: `home-concept-3.html`

The user's last ball flight is both the hero and the control. The ball scrubs along the real trajectory while live height, distance and side values update; destinations sit at causal moments from strike to outcome.

Why it is not generic: content, control, explanation and navigation collapse into one truthful object. It demonstrates the core product without a headline.

Primary risk: it is the most product-specific direction and needs careful first-run fallback when no shot exists.

## Scorecard

Scores use the product's locked 100-point rubric. A score cannot override a critical failure.

| Criterion | Weight | Floodlights | Summon | The Arc |
|---|---:|---:|---:|---:|
| Hierarchy and density | 20 | 19 | 19 | 20 |
| Comprehension and causal learning | 15 | 14 | 12 | 15 |
| Interaction feedback and control | 15 | 14 | 15 | 15 |
| Distinctiveness and brand fit | 15 | 15 | 15 | 15 |
| Native/mobile feel | 10 | 10 | 9 | 9 |
| Accessibility and reduced-motion parity | 10 | 10 | 10 | 10 |
| Product value communication | 10 | 9 | 10 | 8 |
| Performance and runtime integrity | 5 | 5 | 5 | 5 |
| **Total** | **100** | **96** | **95** | **97** |

## Recommendation

Take **The Arc** forward as the product-defining direction. It earns the highest score because the golfer manipulates the actual thing Flightglass explains. Preserve **Floodlights** as the safer cinematic alternative and use **Summon** as a high-distinctiveness interaction study rather than the default first-run shell.

## Verification evidence

- Current Flightglass lockup used in all three prototypes.
- No horizontal overflow at 932×430 or 812×375.
- No console or page errors in the six normal-motion captures.
- Every visible destination/control measured at least 44 px high in both target viewports.
- Direct non-gesture navigation, keyboard semantics and reduced-motion branches remain present.
- No new generated imagery and no changes to physics, compatibility identifiers or Academy storage keys.
