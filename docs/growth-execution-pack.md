# Flightglass / StrikeArc — Execution Pack

*Companion to `docs/growth-automation-strategy.md`. That document decides
**what** and **why**; this one is **what to do, in order**. Everything here is
ready-to-run: a critical path to the first install, twelve ready-to-shoot content
scripts, a 90-day runbook, and the automation stack as a checklist. No shipping
code or protected physics is changed by this document.*

Prepared 2026-07-21.

> **⚠️ v1.1 corrections applied (see `docs/growth-strategy-addendum.md`).** After a
> deep-research + red-team pass, three sequencing changes override the original
> runbook below: (1) **build shareable shot-cards FIRST** (Days 1–30) — the free
> aha should output a watermarked card, because the emitted artifact is the viral
> mechanism; (2) **add a micro-creator seed** (~$1.5–2k to one golfer who slices)
> as the **first paid dollar**, Day 31–60, ahead of scaling self-produced volume;
> (3) treat **store-live as ~60–90 days out** (platform bringup + Phase 8 gates +
> device passes + App Store review + a 2–3-week pre-launch TestFlight seeding
> window) and **gate paid spend on "store-live with reviews," not a calendar
> date.** The runbook below has been updated to match.

---

## Part 1 — The critical path to the first install (unblock Q6 #1)

Nothing in the growth plan can start until there is an app in a store to install.
The web app is live (`svingbue.vercel.app`), but per `STATUS.md` the repo still
has **no `ios/` or `android/` platform project**, and the readiness audit flags
real gate items. This is the first domino. Detailed plans already exist — this is
the *sequence* that ties them together.

| Step | Action | Reference already in repo | Gate |
|---|---|---|---|
| 1 | Close the native-readiness P0/P1 gaps (esp. `impact.html` sub-44px touch targets in the 40px top strip; `index.html` safe-area on zone labels) | `docs/native-readiness-2026-07-02.md` | 44px targets + safe-area pass |
| 2 | Create the iOS platform project (`cap add ios`), wire RevenueCat entitlement `pro` + the three `strikearc_pro_*` product IDs | `NATIVE.md`, `capacitor.config.ts`, `sa-iap.js`, `codemagic.yaml` | `cap sync ios` clean |
| 3 | Create the Android platform project (`cap add android`) | `PLAN-android-platform-bringup.md` | `cap sync:android` clean |
| 4 | Build + sign via Codemagic → **TestFlight** | `codemagic.yaml` | TestFlight build installable |
| 5 | Run the Phase 8 convergence gates on the packaged build (brand, UX, physics fixtures, reviewer/legal paths, store screenshots) | master plan §7 Phase 8, `docs/PLAN-store-screenshots-playwright.md` | 8/8 gates green |
| 6 | Human device pass (the gates STATUS.md holds open): 5-min drag perf, VoiceOver, reduced-motion, audio-route | STATUS.md "Human checkpoints remaining" | Owner sign-off |
| 7 | Submit to App Store + Play; open a **public TestFlight link 2–3 weeks before** so seeded reviews land at launch | `monetization-strategy.md §4` | Live listing + first reviews |

**Målbilde:** a signed build in TestFlight within the first work block, a live
App Store + Play listing with ≥10 seeded reviews at launch. Until step 7, every
krone and hour spent on acquisition has nowhere to land — so this path is P0 and
strictly precedes the content engine going paid.

**Sequencing note:** you *can* start filming content (Part 2) against the live
**web app** now, in parallel — the web build is the content studio even before the
native store listing exists. Organic content has value as audience-building
before launch; just don't spend on paid acquisition until there's a store page.

---

## Part 2 — Twelve ready-to-shoot content scripts

Format for all: **9:16 vertical, 12–20s, captions burned in, muted-safe, Night
Range grade (cold violet, one ember element).** Record real UI from the live app.
Hook is on-screen in the first 1.5s. Post identically to TikTok + Reels + Shorts.

Each script: **Hook → Beats → CTA.** "REC" = screen-record this surface.

**1. The Slice, in one line** *(pillar: acquisition)*
- Hook: `Your ball goes right for ONE reason.`
- Beats: REC Range → thumb drags FACE open, ember tracer bends right, live. Freeze. Two thin lines diverge from the ball (violet = path, ember = face). `That gap is the whole slice.`
- CTA: `See yours — free. StrikeArc.`

**2. Same speed, 27 metres apart** *(conversion)*
- Hook: `Same swing speed. Same carry. 27 metres apart.`
- Beats: two comets leave one tee — one flies the line, one curves into the dark. A sideways measuring line draws between the landing points. `It isn't strength. It's geometry.`
- CTA: `Find your fairway.`

**3. Hit down, no divot** *(credibility myth-buster)*
- Hook: `You can hit down HARD and take no divot.`
- Beats: REC Strike Window → raise low-point height, turf zone disappears while Attack stays steep-negative on screen. `Attack angle ≠ divot.`
- CTA: `The myths, measured. Free tier.`

**4. Why your driver flies higher** *(curiosity/education)*
- Hook: `Why is your driver so much higher than your 7-iron?`
- Beats: REC Academy Delivered Loft & Launch → same swing, change loft, watch launch/apex move. One-line answer.
- CTA: `Understand your bag.`

**5. Draw or fade — watch the face** *(satisfying visual)*
- Hook: `Draw or fade? Watch the face move.`
- Beats: REC Range face lens → slow drag face −2°→+2°, tracer morphs draw→straight→fade. No words until the end.
- CTA: `Bend it with your thumb.`

**6. Describe your slice, see why** *(the Diagnose hook)*
- Hook: `Describe your slice. The app shows you why.`
- Beats: REC Diagnose → 3 quick taps (slice / short / right) → ember reconstruction draws over a violet sketch.
- CTA: `Start from the shot you actually hit.`

**7. Why the ball flies further in summer** *(seasonal)*
- Hook: `Why does your ball fly further in summer?`
- Beats: REC Academy Air Density → move temperature, carry number climbs. `Warm air is thinner. Thinner air = less drag.`
- CTA: `The physics of your golf.`

**8. High and short = loft, not power** *(myth-buster)*
- Hook: `"I need more power." No — you need less loft.`
- Beats: REC Backspin / spin-loft → high weak balloon vs penetrating flight, same speed.
- CTA: `See the spin-loft chain.`

**9. Your pull-hook isn't over-the-top** *(nerd credibility)*
- Hook: `Your duck-hook is NOT over the top.`
- Beats: REC Start Line / face-path → the engine finding, one clean reveal.
- CTA: `StrikeArc Academy.`

**10. What actually is spin loft?** *(20-sec lesson)*
- Hook: `Spin loft — in 20 seconds.`
- Beats: REC Academy Backspin diagram animating; one definition line; one live example.
- CTA: `24 lessons. First one's free.`

**11. Cold morning carry** *(topical/seasonal, high shareability)*
- Hook: `It's 4°C. Here's what that costs your carry.`
- Beats: REC Air Density → set cold temp, carry drops by X metres, number ticking down.
- CTA: `Know your number.`

**12. Every shot has a reason** *(the brand ad / Film 2 cut)*
- Hook: `Every shot has a reason.`
- Beats: fast montage of REC surfaces (Range bend, Strike verdict, Diagnose reveal, Academy XP) over the Night Range grade.
- CTA: `StrikeArc — see why it flew.` + store badges.

> **Målbilde:** these twelve = ~3 weeks of daily posting from *one* filming
> session. Whichever earns the best **watch-through** (completion %, not likes)
> becomes the creative brief for the first paid ad in pre-season 2027.

---

## Part 3 — The 90-day runbook

Assumes the native app ships around Day 30–45. Phase the paid spend to *after*
the store page + seeded reviews exist.

### Days 1–30 — Build the machine (pre-launch)
- [ ] **Build shareable shot-cards FIRST** — make the free aha output a watermarked, repost-worthy card (render existing Canvas → image/video). This is the distribution engine; everything else feeds off it.
- [ ] Native critical path Part 1 steps 1–4 (get to TestFlight). *(Assume store-live is ~60–90 days out, not Day 30 — gate paid spend on "store-live with reviews.")*
- [ ] Film the 12 scripts against the **live web app** in one batch session — a *bridge* until the user-generated shot-card loop is live.
- [ ] Run clips through Submagic/OpusClip for captions + polish.
- [ ] Set up the scheduler (Metricool free or Postiz self-host); queue 3 weeks of posts.
- [ ] Stand up link-in-bio + email capture; convert existing IG followers to a waitlist.
- [ ] Open public TestFlight; recruit 30–50 engaged testers (r/TestFlight, IG, Norwegian golf communities).
- [ ] Draft ASO metadata + 2–3 Custom Product Pages (per Appendix B of the strategy doc).

### Days 31–60 — Launch (store live)
- [ ] Pass Phase 8 gates on the packaged build; human device sign-off.
- [ ] Submit to App Store + Play; ensure seeded reviews land at launch.
- [ ] Turn on Apple Custom Product Pages + Google Play Store Listing Experiments (free A/B).
- [ ] **First paid dollar: seed ONE golf micro-creator who slices** (~$1.5–2k, 50–300k followers) to show the engine diagnosing their own slice (Hook→conflict→product→payoff). Judge on cost-per-install; expect a normal, not viral, result.
- [ ] Start Apple Search Ads long-tail, $5–10/day, on "why do I slice"-class terms for high-*intent capture* (not discovery) *(needs owner OK — exceeds the 100 NOK autonomous cap)*.
- [ ] Post the 3 forum/Reddit value explainers (problem-first, answer with an engine shot-card — not the app link).
- [ ] Instrument analytics: "Aha Shot" activation event, paywall funnel, W1/W4 retention.
- [ ] Wire RevenueCat review-prompt after the aha; add OneSignal push for a first seasonal nudge.

### Days 61–90 — Optimize (learn + compound)
- [ ] Read watch-through data **weekly** (not monthly); double down on the 2–3 winning hooks, cut the rest.
- [ ] Ship **Diagnose reverse mode** (retention build #2, after shot-cards) — the recurring "consult after every range session" loop.
- [ ] Add Superwall (or RevenueCat Paywalls v2) and run the first **plan-architecture** A/B — annual-first / lifetime-forward, monthly de-emphasized, price tested *downward* toward the $8–15/mo band (**not** a price increase).
- [ ] Review the North-Star: Weekly Activated Returners. Decide subscription-vs-lifetime emphasis from the W4 retention signal.

> **Målbilde at Day 90:** store live with reviews; a self-running content queue;
> ≥ 3 validated hooks; a working paywall A/B; the first retention feature shipped;
> and clean activation/retention numbers to steer the pre-season 2027 paid push.

---

## Part 4 — Automation stack as a checklist

Adopt top-down; each rung compounds the ones below.

- [ ] **Content supply:** in-app shot-cards + a batch-rendered library of engine clips.
- [ ] **Enhance/caption:** Submagic (~$20/mo) *or* OpusClip (~$15/mo). Higgsfield for hero b-roll (existing sub).
- [ ] **Schedule/fan-out:** Metricool (free) *or* Postiz (free self-host) → TikTok + Reels + Shorts + X + FB.
- [ ] **ASO auto-tests:** Apple Custom Product Pages + Google Play Store Listing Experiments (free).
- [ ] **Paid (tiny, automated):** Apple Search Ads long-tail $5–10/day *(owner-approved recurring line)*.
- [ ] **Lifecycle:** OneSignal push (free tier) + auto review-prompts via RevenueCat.
- [ ] **Glue:** Zapier/Make/n8n to auto-queue each new shot-card into the scheduler.
- [ ] **Paywall optimization:** RevenueCat → add Superwall for no-code A/B when optimizing.
- [ ] **Stays manual (by design):** the hook idea, community replies, reading the data.

**The whole job, steady-state:** one batch day/month + ~20 min/week. That cadence
is the difference between the plan running and the plan quietly dying — the single
biggest solo-founder risk.

---

*Recommends and sequences only. Points to the existing normative plans
(`native-readiness-2026-07-02.md`, `PLAN-android-platform-bringup.md`,
`PLAN-store-screenshots-playwright.md`, master plan Phase 8) rather than
duplicating them. No protected identifier, physics engine, or shipping file was
changed by this document.*
