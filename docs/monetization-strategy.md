# StrikeArc — Monetization & Go-to-Market Strategy

*Decision-ready synthesis of three research streams (Competitors · Channels · Market). Senior product-strategy read. Nothing here is committed — the "Open Decisions" section at the end lists the five calls only you can make.*

*Prepared 2026-07-10. Currency assumptions: 1 USD ≈ 9.8 NOK, 1 EUR ≈ 11.4 NOK. Prices shown incl. VAT where NOK is used (Norwegian App Store convention).*

---

## Executive Summary (read this, skip the rest if busy)

**The single most important finding, and all three research streams agree on it: StrikeArc is priced roughly one-third to one-tenth of what the evidence supports.** Your locked Annual (149 NOK ≈ $15) is the *cheapest annual price in the entire competitive set researched* — cheaper than the cheapest true golf comp (Garmin at 4×), cheaper than the closest category comp (Awesome Golf at ~6–10×), cheaper than every "understanding/education" product in golf (TrackMan University, DECADE, Sportsbox all price 7–13×+ higher), and a fraction of a single golf lesson (650–1,000 NOK in Norway). The audience pivot to the *curious learner* does **not** argue for cheaper — the evidence base for monetizing *understanding* (DECADE, TrackMan University, Brilliant) skews **richer** than trackers, because it reads as coaching-adjacent value. Curiosity-first changes your *language and onboarding friction*, not your price point.

**What I recommend you change:**
1. **Reprice the ladder up** to Monthly **99 NOK / Annual 399 NOK / Lifetime 999 NOK** ($9.99 / $39.99 / $99.99 — clean Apple tiers). Still under every pro-tool comp, still under Brilliant/TrackMan University, still cheaper than one lesson. This is the conservative end of the evidenced range (350–650 NOK annual); test upward later.
2. **Make Academy's first skill-tree tier free forever** — it is your top-of-funnel curiosity hook ("why does my ball slice?") and your de-facto trial. Gate Academy *depth* + certification into Pro. Do **not** spend the scarce 10-shot currency on Academy.
3. **Keep** the hard 10-shot usage gate on the *instruments* (Ball Flight / Outcome) — this is the one part of the locked model the evidence strongly confirms (hard paywall ≈ 10.7% median D35 conversion vs 2.1% freemium).
4. **Keep** the 3-tier structure and the Lifetime tier — golfers specifically reward "buy once, no subscription," and Lifetime doubles as your seasonality hedge.
5. **Resolve the no-trial question by not needing one**: free Academy tier + 10 free shots *is* the trial. No timed Pro trial on the paid tiers.

**Go-to-market:** run the free/earned playbook first (ASO + repurposed IG/TikTok/YT Shorts + MyGolfSpy forum→editorial + TestFlight-seeded reviews). The only paid channel that fits your spend culture is Apple Search Ads long-tail at $5–10/day. Time the **big paid push (ad films) for pre-season Feb–April 2027**, not mid-summer now — but launch the store listing whenever it's ready and seed reviews through the off-season. StrikeArc has a quiet seasonality advantage: *understanding* is a winter-indoor activity, potentially counter-seasonal to on-course tools.

**Biggest strategic risk:** "understanding" is a *want, not a need* — the aha can be a one-time hit. Your retention insurance is the value-expansion roadmap (below), led by a **"Diagnose my shot" reverse mode** and **shareable shot-cards** — the first turns curiosity into repeat use, the second turns every user into a distribution node.

---

## 1. Positioning & Price Anchor

### What StrikeArc actually competes with

StrikeArc is **category-rare to the point of having no direct pricing precedent** (Competitors §2). Every golf-tech comp researched needs an *input device* to produce value: a launch monitor plugged in (Awesome Golf), a wearable/sensor (Arccos, Shot Scope, HackMotion, Sportsbox), a camera-captured real swing (V1, GolfForever), or a facility partnership (TrackMan). *TrackMan's own consumer app is free precisely because it's inert without hardware.* StrikeArc — a paid, standalone, no-input simulator that teaches ball-flight cause-and-effect from adjustable parameters, wrapped in a 21-lesson curriculum — sits in a gap.

That means there is no single anchor. There are **two**, and StrikeArc has one foot in each:

| Anchor | Best comp | Price | What it anchors |
|---|---|---|---|
| **App-category** ("golf simulator app") | Awesome Golf | $14.99 / $159.99 / **$349.99 lifetime** (147 / 1,568 / 3,430 NOK) | The instrument half (Ball Flight, Outcome, Geometry) |
| **Curiosity-learning** ("interactive physics taught to non-experts") | Brilliant | $161.88/yr, $749.99 lifetime (1,586 / 7,350 NOK) | The Academy half |

### The honest verdict: you are closer to the lesson anchor than you think

Here is the argument you should sit with. **The Academy alone — 21 Wolfram-grounded interactive lessons with real tour benchmarks — is a credible substitute for a block of paid instruction, not a substitute for a $15 app.**

- TrackMan University charges **$195/yr (~1,900 NOK)** for *pure education content*, from a brand that otherwise sells $20K+ hardware. It chose to price its teaching layer richly rather than give it away, and it works as a standalone product (Market §d).
- DECADE — pure strategy/understanding, zero hardware — charges **$125–250** and has real traction (8,000 users, 20 of the world's top 100) (Market §d).
- One Norwegian golf lesson runs **650–1,000 NOK**; a 15-session TrackMan package runs **14,000–15,250 NOK** (Market §b). *A single lesson costs more than your entire locked Lifetime tier.*

So when you ask "app-price anchor or lesson-price anchor?" — the honest answer is **neither extreme; you belong in the wide gap between them, and you're currently sitting *below the app floor*.** You are not a $15 GPS utility (you teach), and you are not a 1,000-NOK lesson (self-serve software, no human labor, curiosity-first not TrackMan-literate). The evidenced landing zone is **roughly 3–6× your current annual** — meaningfully above the app-category floor, comfortably below the pro-tool and lesson ceilings. The curiosity-first audience justifies a *lower entry point than TrackMan's expert buyers*, not a lower price than a golf GPS app.

**Do not market against the lesson anchor, though — market against the app anchor and price against the lesson anchor.** Golfers will compare you to other *apps* on the shelf (that's the reference set in their head), so your store page must win the app comparison. But your internal pricing math should be calibrated to what the *value* is worth (a lesson block), which is why 399 NOK still looks like a steal to the buyer while being 2.7× more revenue to you.

---

## 2. Monetization Model Verdict (challenge/confirm each locked element)

| Locked element | Verdict | Evidence & reasoning |
|---|---|---|
| **Freemium → hard paywall** | ✅ **Confirm** | Hard paywall at a usage limit is the single best-evidenced choice in the whole model. Hard-paywall median D35 conversion ≈ **10.7% vs 2.1% for open freemium** (Competitors §4). Keep it. |
| **10 free "shots" usage gate** | ✅ **Confirm — but scope it to the instruments only** | Usage-gate → hard paywall maps to the "limit-hit" trigger, one of the four highest-converting paywall moments (Competitors §4). *Refinement given the app now has FOUR surfaces:* the gate should meter the **instruments** (Ball Flight, Outcome, Geometry manipulations), **not Academy**. Metering Academy with the same scarce currency would strangle the very curiosity funnel the audience pivot is chasing (Competitors §6). See Academy decision below. |
| **Layer a feature-gate on top** | ➕ **Add (low effort, high yield)** | Feature-gate *at moment-of-intent* converts 12–20%+ when it fires exactly as the user reaches for a premium capability (Competitors §4). Gate the high-"aha" comparison features specifically — **before/after trace comparison, ghosts, and the live "tune" session** — so the paywall can also fire the instant someone reaches for the wow feature, not only when the counter hits zero. This is additive to the shot counter, not a replacement. |
| **Tune session = 1 shot** | ✅ **Confirm, with one tweak** | A live-tune session is high-value engagement and reasonably "costs" one shot. Tweak: make the **first** tune session feel generous (it's often where the aha lands) — don't let a user burn their whole allowance before they've felt the magic once. Consider: first tune session is free/uncounted, subsequent ones = 1 shot. |
| **3 tiers (Monthly/Annual/Lifetime)** | ✅ **Confirm** | Three tiers with a monthly decoy, annual hero, and a real lifetime anchor is well-precedented — Awesome Golf and Brilliant both run exactly this shape (Competitors §1, §5). Keep the structure; reprice the numbers (§3). |
| **Annual as the "hero"** | ✅ **Confirm the role, ❌ challenge the price** | Annual-as-hero is correct. But 149 NOK is the *lowest annual price in the entire comp set* (Competitors §7) and sits at the extreme floor of the whole golf-app category (Market §b). This is almost certainly leaving money on the table with no upside — no evidence was found that low price wins trust in golf apps; the trust lever golfers reward is *"no forced subscription,"* which Lifetime already provides. Reprice (§3). |
| **59 NOK Monthly decoy** | ⚠️ **Reprice** | Undercuts *every* monthly comp found, including the cheapest (Sportsbox at $15/mo, 2.5× higher) (Competitors §7). A decoy works by making Annual look great; a too-cheap monthly weakens the contrast. Raise to ~99 NOK. |
| **349 NOK Lifetime** | ✅ **Keep the tier, reprice proportionally** | *Golf-specific evidence contradicts the general "lifetime cannibalizes" warning.* HackMotion and Shot Scope build entire go-to-market narratives around "no subscription, ever," and golfers reward it; Awesome Golf's lifetime is praised as "an amazing deal" (Competitors §5, Market §c). Lifetime is also your **seasonality hedge** — no "I'm paying through a winter I won't use it" objection (Market §e). Keep it, reprice to ~2.5× the corrected annual. |
| **NO trial** | ⚠️ **Challenge — then resolve it without a timed trial** | Trials are near-universal in this niche and *specifically boost LTV in Education & Health/Fitness* categories — and Academy is squarely Education-shaped (Competitors §6). But the hard-paywall data argues *against* a generic timed trial. **Resolution: your free Academy tier + 10 free shots already function as a generous, non-crippled try-before-buy.** Keep "no timed Pro trial," but stop calling the model "no trial" internally — the free Academy *is* the education-category trial the evidence wants, just structured as a permanent free tier instead of a countdown. |
| **RevenueCat, dual-store, entitlement "pro"** | ✅ **Confirm** | No evidence against; standard, correct. |

### THE big new decision: Academy's role

Academy did not exist when the model was locked, and the brief flags its role as undecided. This is the highest-leverage open question in the whole monetization design. Four options:

| Option | What it means | Verdict |
|---|---|---|
| **A. Academy fully free** (learn free, pay to *play* the instrument) | All 21 lessons free; monetize only the instruments | Too generous — gives away your single richest asset (the thing that rivals a lesson block) and leaves only the instruments to monetize. |
| **B. Academy partially gated** ⭐ | First skill-tree tier free forever; deeper lessons + mastery + certification gated into Pro | **RECOMMENDED.** |
| **C. Academy as a separate purchase** | One-time or separate SKU | Splinters the funnel, complicates RevenueCat/entitlements, and fights the "one Pro unlocks everything" simplicity. Skip. |
| **D. Academy fully inside Pro** | No free Academy; all gated behind paywall | Wastes the curiosity hook — the exact top-of-funnel the audience pivot exists to capture would be locked away. |

**Recommendation: Option B — Academy partially gated, dual-funnel.**

Reasoning:
- The audience pivot is explicitly toward *"why does my ball slice?"* curiosity. The free Academy tier **is** that hook — a genuinely useful, ungated on-ramp that costs a curious golfer nothing to fall into (Duolingo/Brilliant psychology: a free tier that's genuinely complete, not a demo — Competitors §1, §6).
- It creates a **dual-funnel paywall**: curiosity → free Academy lessons → "I want to try this myself" → instruments → hits the 10-shot wall → Pro. And separately: instrument users who want to go deeper → Academy mastery/certification → Pro. Two roads to the same paywall, from different intents (Competitors §6 recommends exactly this).
- Academy depth + certification become a **concrete Pro justification** beyond "more shots" — which matters because it converts Pro from "pay to keep playing" into "pay to master," a much stronger education-category value proposition (aligns with the richer pricing the understanding-product evidence supports).
- It threads the trial needle (above) without a countdown.

**Concrete gating line:** free = the first tier of the skill tree (the foundational "why the ball curves" lessons, engine-live diagrams, first quiz) + unlimited replay of those. Pro = the remaining ~15–18 lessons, badges/levels/XP beyond level 1, quizzes at depth, tour benchmarks, and the "Ball Flight Certified" certification. The free tier must be satisfying enough to share and to seed a review — not a teaser.

---

## 3. Pricing Recommendation

### Recommended tier table

| Tier | NOK (incl. VAT) | USD | EUR | Apple tier | Role |
|---|---|---|---|---|---|
| **Monthly** | **99** | $9.99 | €8.99 | Tier 10 | Decoy — makes Annual obvious |
| **Annual** ⭐ | **399** | $39.99 | €34.99 | Tier 40 | **Hero.** Frame: "99 × 12 = 1,188 → save 66%" |
| **Lifetime** | **999** | $99.99 | €89.99 | Tier 100 | Anchor + seasonality hedge |

These map cleanly to standard Apple/Google price tiers (round, impulse-legible), the same discipline that produced the original 59/149/349 — just moved up one full band into the evidenced zone. **Annual at 399 NOK is the *conservative* end of the evidenced range (350–650 NOK / $35–65, Competitors §7).** I recommend launching at 399 to protect conversion on a zero-review new app, then A/B testing 449/499 once you have baseline data. Lifetime at 999 is ~2.5× annual — above Awesome Golf's 2.2× ratio (which golfers praised) but below the general-SaaS "5×+" caution, a deliberate middle that preserves the "steal" psychology golfers reward without over-pulling revenue forward (Competitors §5).

*Do not stay at 149/349.* The only argument for it is a hypothetical "low price signals low quality / cheap = credible" — and the research found **no evidence** of a too-cheap penalty in golf apps, positive or negative (Market §c). That's a genuine unknown, not a reason. If you're nervous, the A/B in §5 resolves it empirically within weeks.

### What is free forever

- **Academy tier 1** (foundational lessons + engine-live diagrams + first quiz) — the curiosity hook.
- **10 instrument "shots"** across Ball Flight / Outcome / Geometry — the try-before-buy for the simulator.
- **First live-tune session** (uncounted) — guarantees every user feels the core aha at least once.

### What gates, and when

- **Hard gate:** 11th instrument shot → paywall (usage-limit trigger).
- **Feature gate (fires earlier for high-intent users):** reaching for before/after trace comparison, ghosts, or a *second* tune session → paywall at moment-of-intent.
- **Content gate:** Academy tier 2+ and certification → paywall from the learning side.

### Trial stance

No timed Pro trial. The free Academy tier + 10 shots + first free tune *is* the education-category trial. (If you later want to test a timed trial specifically on Academy — where trials boost LTV — do it as an isolated experiment, CC-required 7-day like Brilliant, not as a default.)

### Intro-pricing / launch-discount tactics

- **Founder's Lifetime** for the first cohort / first 60 days: **699 NOK** (30% off the 999 anchor), explicitly time-boxed and labelled "founder." Rewards early adopters (who also write your first reviews), pulls forward cash, and *does not permanently anchor the price low* — when it ends, 999 reads as the real price, not a hike (avoids the Arccos "bait-and-switch" resentment pattern — Market §c).
- **No standing discount on Annual.** Discounting the hero tier trains buyers to wait. Instead, use *seasonal promotional pricing* (below) as the lever.
- **Free lifetime codes** to 15–20 golf-tech reviewers and a handful of Norwegian PGA pros (marketing spend = zero; §4).

### Seasonality plays (Market §e)

Golf is sharply seasonal (April–Oct in your target markets). Concrete plays:
- **Annual push timing:** emphasize and promote Annual in **pre-season Feb–April** (New Year's-resolution + pre-season psychology, same as gyms). Selling a 12-month Annual in Aug/Sep means selling ~5 unused winter months up front — soft conversion and higher regret-churn.
- **Lifetime is the off-season offer:** in Nov–Mar, lead with Lifetime (no "paying through winter" objection).
- **StrikeArc's counter-seasonal edge (instrument this):** *understanding is an indoor winter activity.* Golfers who can't play in winter still want to learn why they slice. Academy + the instruments may hold engagement — or even spike — in the exact months a GPS/tracker app dies. This is a hypothesis worth measuring (A/B off-season conversion), and if it holds, it materially de-risks the seasonality cliff (§6). Market your winter content as winter content ("why your ball dies in October" — see value-expansion §7).

---

## 4. Marketing Plan — Phase 1 (launch → 1,000 users)

The cold-start reality: a brand-new app with zero reviews is nearly invisible in organic search regardless of keyword quality (Channels §a). So the first cohort comes from **earned + owned + seeded reviews**, and ASO is the *conversion layer* everything else points at — do it first, but don't expect it to *acquire* on its own in month one.

### Ranked channel sequence (with concrete first actions)

| # | Channel | Cost | First concrete action |
|---|---|---|---|
| 1 | **ASO fundamentals + Custom Product Pages + Play Listing Experiments** | ~free | Ship the metadata below. Build 2–3 CPPs (now rank in organic search) for distinct intents: "why do I slice" · "ball flight simulator" · "learn golf physics." Turn on Play Store Listing Experiments day one (free, compounding 20–40% conversion gains). |
| 2 | **Owned IG / TikTok / YT Shorts** (repurpose existing assets) | ~free | Finish shipping the **22 diagram posts** as feed content; interleave 2–3×/week Reels with curiosity hooks ("this is the *real* reason your ball curves"), not jargon. One reel script → post identically to IG + TikTok + YT Shorts (triples distribution for one production). This is your highest-leverage *unexecuted* lever (Channels §b, §e). |
| 3 | **MyGolfSpy forum → editorial / GolfWRX Instruction forum** | ~free | Post a genuine physics-explainer ("why the ball curves — the geometry, explained") as a forum contribution. MyGolfSpy elevates member posts to the main site weekly — realistic free earned-media on golf's most-trusted outlet (Channels §b3–b4). |
| 4 | **TestFlight + r/TestFlight + IG waitlist** | ~free | Convert the 66 IG followers to a waitlist via link-in-bio now; open a public TestFlight link **2–3 weeks before both-stores-live** so first reviews land at launch. 50 engaged testers > 500 inactive (Channels §d). Reviews matter more than keyword polish for cold-start. |
| 5 | **Small/mid golf-tech YouTube reviewers** | ~free (time) | Send free **lifetime** codes + a tight press kit to 15–20 "does this golf app actually work?"-tier channels (not Rick Shiels tier). One hit = hundreds of installs, zero cash (Channels §b6). |
| 6 | **Apple Search Ads — long-tail only** | **$5–10/day** | The *one* paid channel that fits your always-declared spend model. Bid only on long-tail curiosity terms ($0.25–0.40 CPT vs $2.50+ on head terms). Compounds with the ASO work (Channels §c). **Note: $5–10/day ≈ 150–300 NOK/mo — this exceeds the 100 NOK autonomous cap and is a standing spend, so it needs your explicit OK as a recurring line item.** |
| 7 | **Teaching-pro outreach, Norway-first** | ~free (time) | DM a handful of Norwegian PGA pros: "send this to explain to a student why they slice." Home-market trust is easier to earn than cold foreign outreach; harvest testimonials (Channels §b8). |
| 8 | **r/golf + golf subreddits, value-first only** | ~free | Share the diagram/explainer, not the app. Check each sub's self-promo rules in the sidebar first (Channels §b7). |
| 9 | **Meta / TikTok paid** | $$$ (approval-gated) | **Defer** until organic hooks are validated. Needs $1,000–3,000/mo to exit the learning phase — far above phase-1 justification and your cap. Not a phase-1 default (Channels §c). |

### How the existing IG pipeline + planned ad films slot in

1. **Now:** ship the 22 diagram posts + 2–3 curiosity Reels/week (asset exists, cost zero).
2. **Next:** produce the 4 storyboarded reels; cross-post identically to IG/TikTok/YT Shorts.
3. **Before spending a krone on Higgsfield ad films:** use whichever organic reel actually earns *watch-through* (completion, not likes) as the creative brief. Validate the hook with real audience data before committing paid production (Channels §e3).
4. **At the pre-season paid push (Feb–April 2027):** run the *validated* ad film as the paid creative (TikTok primary per CAC data), timed so TestFlight-seeded reviews are already on the store, ASA long-tail is already live, and CPPs are already indexed (Channels §e4). **This — not summer 2026 — is when the ad-film budget should fire.**

### ASO essentials (draft — test, don't lock blind)

- **Category:** Sports (primary, both stores — where golfers with ball-flight intent browse). iOS **secondary: Education** — surfaces Academy to a less-crowded shelf (Channels §a).
- **iOS app name (≤30 char):** `StrikeArc: Ball Flight` (22)
- **iOS subtitle (≤30 char):** `See why your ball curves` (24)
- **iOS keyword field (100 char, comma-sep, no spaces):**
  `slice fix,why ball slices,ball flight,golf physics,draw,fade,ball flight simulator,learn golf,attack`
- **Google Play title (≤30):** `StrikeArc: Ball Flight` · **short desc (≤80):** `See exactly why your golf ball slices, hooks, and curves — the physics, live.`
- **Screenshot 1 (drives ~60% of install decisions):** lead with the *outcome/curiosity hook* ("See exactly why your ball slices"), real in-app ember-tracer UI (Apple wants real UI, and yours is inherently striking) — not a feature label like "Ball Flight Visualizer" (Channels §a).
- **The precision constraint is satisfied here:** curiosity language lives in the *discovery layer* (keywords, captions, screenshot headlines — cheap to rank, matches real search intent); the exact terminology (attack angle, spin loft, path) stays fully present in the description body and in-app. Nothing dumbed down — entry-point language at discovery, precision everywhere else (Channels §a).

### Coach / B2B2C angle

Phase-1 posture: **testimonials, not a sales motion.** Norwegian PGA pros as the free-code beachhead (channel #7). The heavier B2B wedge — a "coach/range mode" and a "teaching layer for sim-center walk-ins" priced at $20–50/mo/bay (proven willingness-to-pay band vs E6 Connect / booking SaaS — Market §f) — is real but **unvalidated** (no evidence of specific demand for a ball-flight-education companion). Park it as a Phase-2 experiment gated on 10–20 direct operator/coach discovery calls. Academy is the natural B2B content wedge if you pursue it.

### Realistic budget bands (phase 1)

- **Core plan:** ~**0 NOK** cash (all free/earned/owned). Time is the cost.
- **+ ASA long-tail (recommended):** **150–300 NOK/mo** — flag as a declared recurring spend needing your OK (exceeds the 100 NOK autonomous cap).
- **Deferred / approval-gated:** Higgsfield ad-film production + TikTok/Meta paid push — **do not spend before pre-season 2027** and before the hook is organically validated. Treat as a separate, explicitly-approved budget line, not a phase-1 default.

---

## 5. North-Star + Metrics (instrument from day one)

### Activation = the first "aha"

Define activation precisely, because everything downstream keys off it. StrikeArc's whole thesis is *live cause → effect*. So:

> **Activation event ("Aha Shot"): in the first session, the user changes a parameter (chip drag / face / path / low-point drag) and observes the shot re-render** — i.e., they *manipulated the cause and saw the effect.* Secondary activation: completed the first free Academy lesson.

This is the single moment the product either lands or doesn't. Fire an analytics event on the first parameter-change-with-visible-shot-change, and treat "% of installs that reach Aha Shot in session 1" as your primary onboarding health metric. Target: **≥ 40%** (if onboarding can't get 40% of installs to one aha, fix onboarding before spending on acquisition).

### North-star metric

For a learning + understanding product monetized by subscription, the north star should couple *engagement* to *the aha*, not raw MAU:

> **North star: Weekly Activated Returners** — users who reached Aha Shot *and* returned in a given week. It captures the two things that must both be true for this business to work: the aha lands, and it's worth coming back for.

### Full day-one funnel to instrument

`Install → Onboarding complete → Aha Shot (activation) → 3+ sessions (habit) → 10-shot limit hit (paywall trigger) → Paywall view → Purchase → Renew`

Plus the parallel Academy funnel: `Free lesson 1 complete → shared/reviewed → Academy tier-2 paywall view → Purchase`.

### Conversion targets (from comps)

| Metric | Target (launch) | Stretch | Source/logic |
|---|---|---|---|
| Install → Aha Shot | 40% | 55% | Onboarding health floor |
| Install → paid (blended) | **3–6%** | 8–10% | Niche premium new app; hard-paywall median D35 ≈ 10.7% is the *ceiling* to grow toward, not the launch number (Competitors §4) |
| Paywall view → purchase | 5–10% | — | Standard hard-paywall band |
| Annual renewal | 40–55% | 60% | Typical annual renew rate |
| Tier mix | Annual ≥ 55% of new payers | — | Hero tier should dominate; if Monthly dominates, the decoy is mispriced |

### Churn expectations for seasonal golf (Market §e)

- **Monthly plan will churn hard in the off-season (Nov–Mar).** Expect a winter cliff on Monthly — this is *another* reason to steer buyers to Annual/Lifetime (which have no monthly cancel decision).
- **Annual churn concentrates at renewal**, timed to whenever the cohort bought — which is why pre-season Annual acquisition matters (renewal lands the next pre-season, when intent is high again).
- **Lifetime has no churn** — revenue pulled forward, seasonality-immune.
- **Instrument the counter-seasonal hypothesis:** track off-season vs in-season *activation* and *retention* separately. If understanding/Academy holds through winter, the seasonality risk is smaller than a tracker app's — a genuine, measurable competitive edge.

---

## 6. Risks & Kill-Criteria (top 5)

| # | Risk | Mitigation | Measurable kill / pivot signal |
|---|---|---|---|
| 1 | **"Understanding" is a want, not a need** — the aha is a one-time hit; users learn *why they slice* once, then leave. Understanding is finite in a way a per-round tracker is not. | Convert one-time aha into repeat use via the value-expansion roadmap (§7): "Diagnose my shot" (a reason to open the app after every bad range session), scenario packs, streaks/certification (Duolingo habit-loop). Academy skill-tree gives structured progression. | **W4 retention of *activated* users < 10–15%** AND Academy completion doesn't correlate with retention. → Pivot: lean toward Lifetime-only (accept it's a one-time-purchase utility, drop the subscription pretense), or pivot to B2B where the *repeat-use context* lives (coaches/venues who re-explain to new students). |
| 2 | **Seasonality cliff** — off-season revenue/engagement collapse. | Academy is plausibly counter-seasonal (winter indoor learning); emphasize Lifetime off-season; time Annual push to pre-season; ship winter-themed scenario content ("why your ball dies in October"). | **Off-season MAU drops > 60% AND doesn't recover by next pre-season.** → Pivot: Lifetime-first go-to-market, pause paid spend seasonally, double down on counter-seasonal winter-learning marketing. |
| 3 | **App Store cold-start invisibility** — zero-review new app can't be found. | TestFlight-seeded reviews landing at launch; earned media (MyGolfSpy); owned IG/Reels; CPPs indexed pre-launch. | **After 90 days, organic (non-paid, non-referral) installs < ~50/week** despite shipped ASO + content. → The free channels aren't enough: either accept ASA/paid (approval-gated) is mandatory, or the hook isn't landing — test new CPP/screenshot hooks before spending. |
| 4 | **No-hardware credibility** — "it's just a simulator/toy, not *my* real data." Audience may not trust a no-input teacher. | Wolfram-grounded physics, real tour benchmarks, precision terminology *taught* (correctness is the moat). Position as **teacher, not launch monitor** — explicitly don't compete on measuring *your* swing. "A physics engine, not a guess." | **Reviews/feedback cluster on "not real data / needs my swing."** → Sharpen positioning copy (lead harder on "understand the physics" vs "measure your shot"); if it persists past copy fixes, the standalone no-hardware value isn't landing — reconsider a lightweight optional data-import (camera/manual) *without* violating the no-technique-coaching boundary. |
| 5 | **Underpricing (and its inverse, low-price credibility risk)** — the locked price leaves money on the table; but there's an *unmeasured* risk that a higher price suppresses this curiosity-first audience, or that too-low signals low quality. | Launch at the repriced 399/999 (not 149/349); use the time-boxed Founder's Lifetime to reward early adopters without permanently anchoring low; A/B price from day one. | **A/B shows 399 converts materially worse than 149** (demand IS elastic here, contradicting the evidence) → step down toward ~299. **If conversion is price-insensitive** → test 449/499 upward. Either way the A/B resolves the "too cheap vs too dear" unknown empirically within weeks. |

*(Sixth risk to keep in your peripheral vision, not scored: solo-founder marketing bandwidth. The plan is deliberately free/earned-heavy precisely because it must run on one person's time. If the content cadence (2–3 Reels/week) can't be sustained, channel #2 — your highest-leverage lever — silently dies. Batch-produce.)*

---

## 7. Value Expansion — what else makes it worth paying for

**Hard boundary (owner):** no training programs, no technique instruction, no drills, no swing-change coaching. Everything below stays strictly in the **understanding + simulation** lane.

### Evaluation of candidates

Scored on **value-per-build-effort × audience-fit (curious learner) × monetization role**. Build effort assumes the physics engine already exists and most of these are new UI/content on top of it.

| Candidate | Build effort | Audience fit | Monetization role | Score |
|---|---|---|---|---|
| **1. "Diagnose my shot" reverse mode** — pick your observed ball flight (slice / pull-hook / thin / low bullet) → engine shows the likely delivery causes (path/face/attack/strike) | Moderate (invert existing engine + new UI) | ★★★★★ literally *"why does my ball slice?"* made interactive | Acquisition (the ASO hook, playable) **+** Retention (open it after every bad range session) | **Top** |
| **2. Shareable shot-cards** — export a beautiful ember-tracer card/clip ("I made my ball draw 15 yds — here's the physics") to IG/TikTok | Low–moderate (render existing canvas to image/video) | ★★★★☆ curious learners love sharing the aha | Acquisition engine — every user becomes a distribution node, feeds channel #2 directly | **Top** |
| **3. Scenario / condition packs** — wind / altitude / cold / rain ("why your ball dies in October") | Moderate (wind chip exists; extend params) | ★★★★★ pure curiosity, counter-seasonal | Premium-tier justification (discrete gated content) **+** counter-seasonal marketing | **High** |
| **4. Club-vs-club physics + gapping/trajectory library** — why a 7-iron ≠ a driver (new engine presets, per-club trajectory library) | Moderate–high (new presets + club data) | ★★★★☆ "why's my driver so much higher?" | Retention (reason to return) **+** premium | **High** |
| **5. Certification + seasonal challenges/streaks** — "Ball Flight Certified" shareable badge, streaks tied to Academy | Low–moderate (XP/badge/level scaffolding already exists) | ★★★★☆ Duolingo psychology, fits curiosity audience | Retention (habit loop) **+** premium (cert gated) **+** acquisition (shareable badge = social proof) | **High** |

### Ranked Top 5 (recommended build order)

1. **"Diagnose my shot" reverse mode** — build first. It *is* the audience hook ("why does my ball slice?") turned into an interactive tool, it doubles as a paywall trigger, and it's the strongest single answer to Risk #1 (gives a *recurring* reason to open the app). Reuses the engine.
2. **Shareable shot-cards** — build second (or in parallel; low effort). It's the cheapest growth lever you haven't pulled: turns the product itself into the top-of-funnel content machine your marketing plan depends on. Acquisition compounding.
3. **Scenario / condition packs** — first premium *content* pack. Justifies Pro beyond "more shots," and the "why your ball dies in the cold" angle is counter-seasonal marketing gold (directly de-risks Risk #2).
4. **Club-vs-club + gapping library** — deepens the "understand my bag" curiosity and adds return-visit value; slightly heavier build, so it follows the quick wins.
5. **Certification + streaks** — the retention/gamification capstone, cheap because the Academy XP/badge system already exists, and it ties the whole Academy-partially-gated model together (mastery = Pro = shareable proof).

**Runner-ups (deliberately not top 5):**
- *What-if tour-player deliveries (Rory's numbers vs yours)* and *famous-shots recreations* — great **marketing content** and good premium content packs, but build cost scales with the authored catalog (each shot is hand-made content). Use them as periodic content/social fodder, not core features.
- *Coach/range mode (two-person teaching screen, B2B2C)* — high strategic value *if* you pursue B2B, but heavier build + unvalidated demand (Market §f). Park as a Phase-2 wedge gated on operator discovery calls, not phase-1.

The Top-5 mix is deliberate: **#1–2 drive acquisition, #3–5 drive retention + premium justification** — exactly the two jobs (grow the funnel, keep them paying) the business needs, and every one stays inside the understanding+simulation lane.

---

## 8. Open Decisions for the Owner

*(Five clean either/or calls. Everything above is my recommendation; these are the ones where your judgment should override or confirm mine.)*

1. **Academy gating** — **(A)** First Academy tier FREE forever, depth + certification in Pro *(recommended)* · **(B)** Academy fully inside Pro.

2. **Annual price** — **(A)** Reprice Annual to **399 NOK** (Monthly 99 / Lifetime 999) *(recommended)* · **(B)** Keep the locked **149 NOK** ladder.

3. **Launch timing** — **(A)** Launch the store listing when ready + seed reviews through the off-season, fire the paid ad-film push in **pre-season Feb–April 2027** *(recommended)* · **(B)** Full launch *and* paid push now (mid-summer).

4. **Trial stance** — **(A)** No timed trial — free Academy tier + 10 shots *is* the trial *(recommended)* · **(B)** Add a 7-day Pro trial (CC-required, Academy-only experiment).

5. **First value-expansion build** — **(A)** "Diagnose my shot" reverse mode next *(recommended — the curiosity hook + retention)* · **(B)** Shareable shot-cards next *(the acquisition loop first)*.

---

*Sources are cited inline as (Competitors §x), (Channels §x), (Market §x), referring to the three research streams. This document recommends; it does not commit. — Opus, product strategy*
