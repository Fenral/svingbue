# Flightglass / StrikeArc — Growth, Automation & Realistic-Revenue Strategy

*Prepared 2026-07-21 as an autonomous strategy pass answering nine owner
questions. This document **builds on** — it does not replace — the two prior
strategy artifacts:*

- *`docs/monetization-strategy.md` (pricing, paywall, value-expansion — 2026-07-10)*
- *`docs/marketing-films-higgsfield.md` (the ad-film universe — 2026-07-10)*

*Where those already decided something (e.g. 99/399/999 pricing, Academy
tier-1 free, "Diagnose my shot" as first value-expansion build), this document
treats it as settled and layers the **growth + automation + earnings** analysis
on top.*

**Currency:** modelled at ≈ 10 NOK / USD (round, for math). All NOK figures are
incl. VAT (Norwegian App Store convention).

**"En million":** unless stated otherwise, the primary reading is **1,000,000
NOK per year in net revenue** (≈ $95–100k/yr ≈ ~8k USD MRR). The much harder
**$1,000,000/yr** reading (≈ 10.5M NOK) is called out separately where it
matters — it is a different league (see Q6).

**The honest frame the owner set, kept throughout:** we do **not** pull external
shots off TV, we do **not** measure the user's real swing, we do **not** coach
technique. What we have is *an honest physics engine that explains why the ball
flew.* Every recommendation below stays inside that lane. That constraint is not
a weakness to hide — it is the single thing no competitor is doing, and the whole
strategy is built on making it legible.

---

## TL;DR (read this, skip the rest if busy)

1. **The product is good; the problem is distribution and retention, not the
   engine.** Nothing below asks you to change physics. The million-kroner
   question is answered by two things: (a) a content flywheel that runs itself,
   and (b) turning a one-time "aha" into a reason to come back.
2. **Demand is real and searchable.** "Why do I slice / why does my ball go
   right" is the single most common question in amateur golf, and off-course /
   casual golf (the curious, tech-friendly audience) is up 40%+ since 2019. You
   are aimed at a growing pool, not a shrinking one.
3. **One production → everywhere.** The whole marketing plan is: make the app
   *produce its own content* (shareable shot-cards + Diagnose clips), enhance
   and caption it with one AI tool, and fan it out to TikTok + Reels + Shorts
   from one scheduler. This is 80% of the automation win.
4. **Earnings, honestly:** 1M NOK/yr net is achievable but puts you in roughly
   the **top ~5% of newly launched subscription apps** (only 4.6% reach $10k
   MRR in two years). It is a *top-5%-execution* goal, not a *default outcome*.
   $1M USD/yr is top ~1% and needs either a genuine viral engine or paid scale.
5. **The biggest blocker is not the app — it's that there is still no native
   iOS/Android project in the repo,** so there is nothing to *acquire installs
   into* yet. Shipping the store presence is the gate everything else waits on.
6. **Retention low-hanging fruit exists** and is cheap because the engine and
   Academy XP scaffolding already exist: shareable shot-cards, Diagnose-my-shot,
   streaks/certification, seasonal "why your ball dies in October" packs.
7. **Pro-grade polish is a solved, buyable problem in 2026** (Rive/Lottie
   motion, Superwall paywalls, Mobbin patterns, and the Figma/Higgsfield MCP
   tools already wired into this environment). "Test and see what sticks" is the
   correct instinct — the section on Q9 turns it into a concrete kit.

---

## Q1 — What are people actually searching for in golf (social + search)?

**🎯 Målbilde:** a validated list of high-intent "curiosity" phrases and the 5
content formats that win in the golf niche, each mapped to an app surface, so
every piece of content has a job.

### What the evidence says

- **The slice is the centre of gravity.** For a right-handed golfer the slice is
  *the most common miss in all of golf*, and "why do I slice / why does my ball
  go right / how to stop slicing" is the dominant beginner-to-mid question. The
  physics answer — *clubface direction vs. club path at impact* — is **exactly
  what your engine draws live.** The single most-searched frustration in golf is
  a frustration your product was built to explain. ([golf.com](https://golf.com/instruction/why-most-golfers-slice-ball/),
  [caddiehq](https://www.caddiehq.com/resources/why-do-golfers-slice-the-ball))
- **Adjacent high-intent curiosity phrases:** "ball flight laws" / "new ball
  flight laws," "draw vs fade," "why does my ball balloon," "why is my driver so
  much higher than my irons," "what is spin loft," "why do I hit it fat/thin,"
  "why does the ball go further in summer." Each maps to a specific Academy
  lesson or Range parameter you already have.
- **Short-form golf content wins on a hook-first structure.** The formats that
  earn watch-through and shares in the golf niche: **skill/So-that's-why demos,
  before/after, myth-busters, challenges, and funny/relatable "you know this
  feeling."** The hook (first 1–2s) is what stops the scroll; jargon in the hook
  kills it. ([hooked.so golf trends](https://www.hooked.so/trends/tiktok/golf),
  [tiktok #golfviral](https://www.tiktok.com/tag/golfviral))
- **The audience is broadening in your favour.** Off-course/casual golf
  (Topgolf, simulators, ranges) added ~19M US participants and is up >40% since
  2019 — a younger, more phone-native, more *curious-but-not-expert* audience
  than traditional club golfers. ([NGF](https://www.ngf.org/short-game/golf-participation-growing-diversifying/))
- **Seasonality is real** (Apr–Oct peak in your markets) but *understanding* is
  plausibly counter-seasonal — people who can't play in winter still want to
  know why they slice. This is a genuine, measurable edge (see Q6/Q7).

### Content pillars (each phrase → a surface → a format)

| Search intent (the hook) | App surface that answers it | Format |
|---|---|---|
| "Why does my ball go right?" | Diagnose → Range face/path | Myth-buster / diverging-lines reveal |
| "Draw vs fade — what's the difference?" | Range face/path lens | Before/after split |
| "Why is my driver so much higher?" | Academy: Delivered Loft & Launch | "So *that's* why" demo |
| "Why does the ball fly further in summer?" | Academy: Air Density | Seasonal explainer |
| "Can you hit down and take no divot?" | Strike Window / Low Point | Counter-intuitive myth-buster (Film 3) |
| "What actually causes a slice?" | Diagnose reverse mode | Interactive "answer your own shot" |

**Do:** put the *curiosity phrase* in the hook, the caption, the thumbnail and
the ASO keyword field. **Then** teach the precise term (path, face, spin loft)
in one line *after* the hook lands. Nothing dumbed down — entry-language at
discovery, precision everywhere else. (This is the exact rule already set in
`monetization-strategy.md` §4 ASO; it applies identically to content.)

---

## Q2 — How can the project resonate more, *realistically*?

**🎯 Målbilde:** one sentence of positioning that a stranger repeats correctly
after 5 seconds; the 3 things only *we* can honestly own; and an explicit "not
this" list so effort doesn't leak into features that break the honesty moat.

### The positioning, sharpened

Today the internal language drifts between "simulator," "instrument," and
"academy." To a curious golfer those are abstract. The resonant, honest sentence
is:

> **"Flightglass answers the one question every golfer asks — *why did it do
> that?* — with real physics, live, in your pocket."**

Everything else is a supporting claim, not the headline. You are **not** selling
a simulator (people don't want to *simulate*, they want to *understand*), and
**not** selling a launch monitor (you don't measure their swing — say so
proudly). You are selling **the answer to "why."**

### The three things only you can honestly own

1. **The honest engine.** Real, sourced physics with hedged language ("about 7
   in 10"). In a category full of AI-slop "coaches" and fake certainty, honesty
   *is* the differentiator. Lean into it: show the numbers, cite the model,
   never fake a result.
2. **Live cause → effect.** Drag a parameter, the flight changes *now*. This is
   viscerally satisfying and almost nobody in golf does it as a standalone,
   no-hardware toy. It is inherently good short-form content.
3. **"Answer your own shot" (Diagnose).** The reverse mode turns the #1 search
   phrase ("why do I slice?") into an interactive tool. This is the single
   feature that most increases resonance because it *meets the user at their
   exact question.*

### The "not this" list (protect the moat)

- ❌ **External shots off TV / broadcast tracer** — correctly ruled out by the
  owner. It breaks the honesty frame (you'd be implying you measured something
  you didn't), it's a licensing and engineering swamp, and it competes with
  TopTracer/Toptracer-class hardware you can't beat. Skip permanently.
- ❌ **Measuring the user's real swing** (camera/sensor) — pulls you into the
  Arccos/Sportsbox hardware war and dilutes "we teach the physics."
- ❌ **Technique coaching / drills** — owner boundary; also turns you into every
  other instruction app. Stay the *physics teacher*, not the swing coach.

**Where "resonate more" actually comes from:** not new capability — *legibility*
of the capability you have. The engine is already good (STUDIO-GRADE Home,
complete Academy). The gap is that nobody outside the repo has *seen* it. Q3–Q4
are the answer to that.

---

## Q3 — Which social media, and how?

**🎯 Målbilde:** one primary content engine, one owned funnel, one credibility
beachhead — with a clear job and cadence for each, all feedable from a single
monthly production batch.

### Channel roles (not "be everywhere," be deliberate)

| Tier | Channel | Job | Cadence |
|---|---|---|---|
| **Primary engine** | **Short-form vertical video → TikTok + Instagram Reels + YouTube Shorts** | Acquisition. One reel, posted identically to all three, triples reach for one production. This is the highest-leverage lever and it's currently unpulled. | 3–5×/week |
| **Owned funnel** | **Email/waitlist + link-in-bio** | Convert watchers into a list you own (algorithm-proof). Seed launch reviews. | Continuous capture; email at launch + seasonal |
| **Credibility beachhead** | **Reddit (r/golf, r/golftips), MyGolfSpy / GolfWRX forums, Norwegian PGA DMs** | Trust + earned media. Post the *explainer*, not the app. MyGolfSpy elevates member posts to its front page weekly. | 1 genuine value post/week |
| **Support/SEO** | **YouTube long-form (occasional) + a simple blog** | Own the "why do I slice" search result long-term; a home for the interactive web app. | 1–2×/month |
| **Deferred** | X/Threads/Facebook | Auto-crosspost only (free via scheduler). Don't invest attention. | Automated only |

### The "how" that matters

- **The app is the content studio.** The cheapest, most on-brand content is the
  product itself: the ember tracer bending live, the Diagnose reveal, an Academy
  diagram animating. **Shareable shot-cards** (Q8) turn every user into a
  content node — this is why that feature is a *marketing* investment, not just a
  retention one.
- **One look, instant recognition.** The `marketing-films-higgsfield.md`
  "Night Range Universe" (cold-violet floodlights, one ember element per frame)
  means the feed recognises you in 0.5s. Keep that discipline across *all*
  organic posts, not just the paid films.
- **Muted-first.** Feeds autoplay silent; every post must work with captions
  burned in and no sound.
- **Norway-first for trust, global for scale.** Home-market PGA pros and Norwegian
  golf communities are easier first believers; the content itself is English so
  it scales.

---

## Q4 — How do I make the marketing as close to fully automatic as possible?

**🎯 Målbilde:** a "set-and-mostly-forget" stack where **one batch production day
per month + ~20 min/week of review** keeps a daily multi-platform presence, ASO
experiments, long-tail paid search, and lifecycle messaging all running. Below is
the concrete stack, what each piece automates, its cost, and what deliberately
stays manual.

### The automation ladder (top = do first, cheapest ROI)

**Rung 1 — Make the product generate the content (near-zero marginal cost).**
- **In-app shareable shot-cards / clips** (build item, Q8): the app renders a
  beautiful ember-tracer card or 5s clip the user (and you) can post. This is the
  content supply that makes everything below run without a videographer.
- Batch-render a library of engine clips (Range bends, Diagnose reveals, Academy
  diagrams) once, reuse for months.

**Rung 2 — Enhance + caption automatically.**
- **Submagic (~$20/mo)** or **OpusClip (~$15/mo)**: auto-captions, auto-b-roll,
  dynamic zooms, hook detection. Submagic is the better fit (it *enhances* a
  short clip you already have); OpusClip shines if you ever cut long video into
  many shorts. ([submagic vs opusclip](https://www.ngram.com/blog/opus-clip-vs-submagic))
- **Higgsfield** (already on the owner's subscription): the atmospheric "Night
  Range" b-roll and the ad films. Use for hero/paid creative, not daily volume.

**Rung 3 — Schedule + fan out to every platform from one place.**
- **Postiz** (open-source; **free self-hosted**, or ~$23–29/mo hosted) or
  **Metricool** (free tier; paid from ~$25/mo) or **Buffer** (free 3 channels;
  $6/channel/mo). All cross-post one video to TikTok + Reels + Shorts + X +
  Facebook on a schedule. **Recommendation: Metricool free tier or Postiz
  self-hosted to start** — both do the core job at zero cost.
  ([postiz pricing](https://postplanify.com/postiz-pricing),
  [metricool](https://metricool.com/schedule-tiktok-videos/),
  [buffer](https://buffer.com/tiktok))
- A month of posts scheduled in one sitting = daily presence with zero daily
  work.

**Rung 4 — ASO experiments run themselves (free, compounding).**
- **Apple Custom Product Pages** + **Google Play Store Listing Experiments**:
  free, built-in A/B tests of icon/screenshots/copy. Turn on day one; they
  compound 20–40% conversion gains with no ongoing effort.
- Optional paid ASO intelligence: AppTweak / Sensor Tower (expensive; defer).

**Rung 5 — Paid, but automated and tiny.**
- **Apple Search Ads** long-tail, $5–10/day, on curiosity terms ("why do I
  slice"). Apple's own automation handles bidding. This is the *one* paid channel
  that fits a solo/zero-culture budget (~150–300 NOK/mo — flagged in
  `monetization-strategy.md` as needing explicit OK; it exceeds the 100 NOK
  autonomous cap).
- **Meta Advantage+ / TikTok automated app campaigns:** powerful but need
  $1–3k/mo to exit the learning phase. **Defer to pre-season 2027** and only
  after an organic hook is validated (per the films plan).

**Rung 6 — Lifecycle + reviews on autopilot.**
- **Push/lifecycle:** OneSignal (generous free tier) or Customer.io for
  "come back and diagnose your range session" / seasonal nudges. Tasteful,
  low-frequency (Q7/Q8).
- **Review prompts:** RevenueCat / native SKStoreReviewController fired after the
  *aha* moment, automatically. Reviews are the cold-start unlock (Q6).
- **Glue:** Zapier/Make/n8n (or a tiny script) to, e.g., auto-post every new
  in-app shot-card to the scheduler queue.

### What STAYS manual (on purpose)

- **The hook and the idea.** AI can caption and schedule; it can't (reliably)
  invent the one curiosity hook that stops the scroll. Batch-write 20 hooks in
  one sitting monthly.
- **Community replies.** Reddit/forum trust dies if automated. 20 min/week, human.
- **Reading the data** and re-pointing the engine at whatever earns *watch-
  through* (completion, not likes).

### The monthly rhythm (this is the whole job)

> **1 batch day/month:** render 12–20 shot-cards/clips from the app → run through
> Submagic → write 20 hooks → schedule a month of TikTok/Reels/Shorts in
> Metricool/Postiz → queue 4 forum/Reddit value posts. **~20 min/week:** reply to
> comments, glance at which post won, boost the winner. **Quarterly:** refresh ASA
> keywords + CPP/screenshot test.

That converts marketing from a daily anxiety into a scheduled, mostly-automated
system a solo founder can actually sustain — which matters, because the #1 hidden
risk (per the monetization doc) is that the content cadence silently dies.

---

## Q5 — Potential earnings: scenarios

**🎯 Målbilde:** a transparent model you can argue with, four scenarios from Floor
to Breakout, and the *one or two levers* that move each.

### The model (all figures illustrative, net of a 15% store cut)

Assumptions, deliberately conservative and hybrid (freemium hook + hard 10-shot
gate, per the locked model):

- **Blended install → paid conversion: 4%.** Between open-freemium (~2.2% median)
  and hard-paywall (~12.1% median) — a hybrid lands in between, discounted for a
  cold-start niche app. ([RevenueCat/PaywallPro benchmarks](https://dev.to/paywallpro/global-subscription-app-conversion-benchmarks-3c75))
- **Blended net revenue per new payer, year 1: ≈ 380 NOK.** A mix of monthly
  (churns after a few months), annual (399 NOK hero), and some lifetime (999),
  minus the 15% store cut.
- **Renewal/carry-over from prior cohorts: modelled as +~25%** on top of new-cohort
  revenue once you have a base.

| Scenario | Installs / yr | New payers (4%) | New-payer net | + renewals | **≈ Net revenue / yr** | What it requires |
|---|---:|---:|---:|---:|---:|---|
| **Floor** | 10,000 | 400 | 152k NOK | — | **~170k NOK** | Store listing live, ASO only, no engine spinning |
| **Base** | 40,000 | 1,600 | 608k NOK | +150k | **~750k NOK** | Content flywheel working 3–5×/wk + ASA long-tail |
| **Upside** | 120,000 | 4,800 | 1.82M NOK | +500k | **~2.3M NOK** | One or two organic hits/quarter + validated paid |
| **Breakout** | 400,000 | 16,000 | 6.1M NOK | +1.9M | **~8M NOK (~$800k)** | A genuine viral loop (shot-cards) + funded paid scale |

### The single most important sensitivity

**Conversion and price move revenue more than installs, and they're cheaper to
move.** Going from 4% → 6% conversion, or nudging annual 399 → 499 (both testable
in weeks via Superwall A/B), is worth more per unit effort than grinding installs
from 40k → 60k. **Instrument price and paywall from day one** (Q9 tooling) — it's
the highest-ROI experiment you have.

### Reality check (so the numbers stay honest)

- To clear **1M NOK/yr net** you need roughly the **Base-plus** zone: ~55–70k
  installs/yr (~5k/mo) at 4%, *or* fewer installs at 6–8% conversion. That is a
  real, reachable target — but only if the content engine actually spins.
- **1M NOK/yr ≈ ~$8k MRR ≈ top ~5% of all newly launched subscription apps**
  (only 4.6% reach $10k MRR in two years). Reachable, not automatic.
- **$1M USD/yr** (Breakout) is **top ~1%** and realistically needs a funded paid
  engine *and* a viral loop. Treat it as the stretch dream, not the plan.

---

## Q6 — What is stopping us from generating over a million in the coming years?

**🎯 Målbilde:** the five real constraints, ranked, each with its unlock — so
effort goes where the bottleneck actually is.

Ranked by how much they gate the outcome:

### 1. There is no native app to acquire installs into yet. *(Hardest gate.)*
The repo has a Capacitor scaffold but **no `ios/` or `android/` platform
project** (STATUS.md confirms `cap sync` can't package; native archive, signing,
store submission all remain open). Everything in Q3–Q5 assumes an install target
that doesn't exist yet. **Unlock:** create the iOS (and Android) platform
projects, wire RevenueCat, pass the Phase 8 gates, and ship to TestFlight → App
Store. Until this exists, marketing has nowhere to send people. *This is the
first domino.*

### 2. Cold-start invisibility.
A zero-review niche app is nearly invisible in store search. **Unlock:** the
TestFlight-seeded-reviews playbook (reviews landing *at* launch), earned media
(MyGolfSpy), and — above all — the content engine (Q3–Q4) that acquires
independent of the algorithm.

### 3. "Understanding" is a want, and the aha can be a one-time hit.
The core risk from the monetization doc: users learn *why they slice* once, then
leave. A subscription needs a *reason to return.* **Unlock:** the retention
features in Q7/Q8 — Diagnose-after-every-range-session, streaks, seasonal packs.
If retention of *activated* users can't clear ~10–15% at W4, the business is a
lifetime-purchase utility, not a subscription (and should be priced/marketed as
one).

### 4. Solo-founder bandwidth.
The plan only works if the content cadence survives. **Unlock:** the automation
stack (Q4) exists specifically to make one person's output look like a team's.
Batch, schedule, automate — or channel #1 silently dies.

### 5. Price left on the table + un-run experiments.
Underpricing (the old 149 ladder) and never A/B-testing means leaving the easiest
revenue unclaimed. **Unlock:** ship at 99/399/999, then let Superwall/RevenueCat
run price and paywall tests continuously.

**What is *not* the blocker:** the engine, the design quality, or the honesty
positioning. Those are assets. The blockers are all *distribution and
retention* — which is good news, because they're addressable with the plan above
rather than a rebuild.

---

## Q7 — Is this a "download and test" app, or something people will *use*?

**🎯 Målbilde:** an honest classification and the specific design changes that
move it from novelty toward habit.

### Honest read: today it leans "download, get the aha, churn."

The core experience is a *revelation* ("oh — *that's* why it slices"). Revelations
are powerful for acquisition and word-of-mouth but finite for retention: once you
understand it, the reason to reopen weakens. Left as-is, the natural shape is a
spike of delight → a shareable moment → gradual drop-off. That's a real product
(and it sells lifetime tiers well), but it's not yet a *habit.*

### The levers that turn revelation into recurring use

1. **A reason tied to a recurring real-world event.** Golfers hit balls at the
   range regularly. **"Diagnose my shot" after every bad session** gives a
   standing reason to open the app that recurs as often as they play. This is the
   single biggest retention lever and it reuses the engine.
2. **Progression that isn't finite.** Academy XP, streaks, "Ball Flight
   Certified" — Duolingo-style habit scaffolding. The XP system already exists.
3. **Fresh content that expires.** Seasonal packs ("why your ball dies in
   October," "the summer flyer") give a calendar reason to return and are
   counter-seasonal marketing gold.
4. **Tasteful notifications.** Not "come back!" spam — "It got cold. Here's what
   4°C does to your carry." Value-first, low-frequency.

### The verdict to hold

Design it as **"a tool you consult"** (like a weather app for your ball flight),
not "a game you're addicted to." The realistic honest target is
**consult-monthly-to-weekly**, not daily. That's enough to sustain an annual
subscription *if* the Diagnose loop and seasonal content give the recurring
trigger. Measure W4 retention of *activated* users as the truth signal (target
10–15%+); if it holds through winter, you have a subscription — if it doesn't,
lean into Lifetime and price accordingly.

---

## Q8 — Low-hanging retention features (that also grow the app)

**🎯 Målbilde:** a prioritized backlog of ≤6 features scored by *effort ×
retention/acquisition impact*, every one inside the honest physics lane and
mostly reusing systems that already exist. **These are recommendations, not
changes** — the shipping app is under strict release gates and I have not touched
it.

| # | Feature | Effort | Why it retains / grows | Build note |
|---|---|---|---|---|
| **1** | **Shareable shot-cards / clips** | Low–med | Every user becomes a content node → feeds Q3–Q4 for free. Acquisition *and* a reason to create. | Render existing Canvas to image/video. Highest growth-per-effort. |
| **2** | **"Diagnose my shot" reverse mode** | Med | The #1 search phrase made interactive; a recurring reason to open after every range session. Strongest single retention lever. | Invert existing engine + new UI. Already the owner's chosen first build. |
| **3** | **Streaks + "Ball Flight Certified"** | Low–med | Duolingo habit loop; shareable badge = social proof. | XP/badge scaffolding already exists in Academy. |
| **4** | **Seasonal / condition packs** (wind, cold, altitude) | Med | Calendar reason to return; counter-seasonal marketing. | Wind/altitude params already exist; package as content. |
| **5** | **"Your bag" club-gapping / club-vs-club** | Med–high | "Why's my driver so much higher?" — return-visit curiosity. | New presets + club data on the existing engine. |
| **6** | **Home-screen widget + tasteful push** | Low–med | Ambient presence; a daily physics micro-fact or "cold today → −X m carry." | Native widget; low frequency, value-first. |

**Recommended order:** 1 → 2 → 3, then 4–6 as content/retention capstones. 1 and
2 are the acquisition+retention core; 3 ties the Academy-gating model together.
This mirrors and reinforces the value-expansion ranking already in
`monetization-strategy.md §7` — the new emphasis here is that **#1 (shot-cards)
should be treated as a marketing-infrastructure investment**, built early,
because it's what makes the Q4 automation engine self-feeding.

---

## Q9 — External tools / skills / solutions for big-studio-grade polish

**🎯 Målbilde:** a concrete, buyable "pro-polish kit" mapped to specific surfaces,
plus the automation/design tools *already wired into this environment* — so
"test and see what sticks" becomes a short, deliberate shopping list instead of
open-ended wandering.

Your instinct ("it's a bit test-and-see right now") is correct — that *is* how
2026 indie app-craft works. The difference between amateur and big-studio feel is
now mostly **buyable**, and it comes down to four things: **motion, paywall,
patterns, and store presentation.**

### The pro-polish kit

| Need | Tool | Cost | What it buys you |
|---|---|---|---|
| **Motion / micro-interactions** | **Rive** | Free–$ | Real-time, interactive, GPU-accelerated animations with state machines — the thing that most separates premium from amateur feel. Perfect for the ember tracer, transitions, empty states. ([Rive guide](https://medium.com/@uianimation/rive-animation-for-app-development-the-ultimate-2025-guide-8869fe52e43c)) |
| **Lighter animations** | **Lottie / LottieFiles** | Free–$ | Figma → After Effects → tiny code-friendly JSON animations. Great for loaders, celebrations, onboarding. ([lottie vs rive](https://lottiefiles.com/blog/lottie-animations/lottiefiles-or-rive)) |
| **Paywall that converts + A/B tests** | **Superwall** (on top of RevenueCat) | $49/mo starter; charges only on paywall-attributed revenue | No-code drag-and-drop paywall editor + mature A/B testing. Lets you test price/copy/layout weekly without shipping a build. RevenueCat alone is fine to start; add Superwall when optimizing. ([revenuecat vs superwall](https://www.buildmvpfast.com/blog/revenuecat-vs-superwall-vs-adapty-in-app-subscription-indie-2026)) |
| **UI pattern reference** | **Mobbin** | Free–$ | Thousands of real production screens to copy patterns from — how the pros solve onboarding, paywalls, empty states. (Already used in `docs/mobbin-ux-laering.md`.) |
| **Design system + assets** | **Figma** + SF Symbols + Apple HIG | Free–$ | Consistent tokens, native iconography, native feel. Figma MCP is wired into this environment. |
| **Multisensory finish** | **Haptics + sound layering** | Free (Capacitor Haptics already a dependency) | 2026 premium apps layer touch + haptics + sound. You already ship `@capacitor/haptics` and a sound kit is specced in the films doc. |
| **Store screenshots / preview videos** | AppLaunchpad / Previewed / Rotato | Free–$ | Polished, framed store assets. Screenshot 1 drives ~60% of install decisions. |
| **Atmospheric hero media** | **Higgsfield** (owner subscription; MCP wired here) | Existing | The Night Range Universe films/b-roll. |

### Tools already available in *this* environment (no new signup)

The MCP servers connected to this session directly cover most of Q4/Q9:
**Higgsfield** (image/video/audio generation, virality prediction, auto-clipping,
shorts studio), **Figma** (design-to-code and back), **Vercel** (the web app is
already deployed there), **Supabase/Stripe** (if you ever add a web funnel). You
don't need to assemble the toolchain from scratch — a large part of it is one
authorization away.

### The honest "test and see" protocol

Don't buy all of it. The order that gives the most visible polish per krone:

1. **Superwall/RevenueCat paywall A/B** — directly moves revenue, week one.
2. **Rive on the 3 highest-traffic moments** (the tracer reveal, the Diagnose
   result, the Academy mastery celebration) — where polish is most *seen*.
3. **Store assets** (AppLaunchpad + a Higgsfield hero video) — the shopfront.
4. Everything else only if a specific surface still feels amateur after 1–3.

**One caution:** motion and effects serve the truth, never decorate it — your own
law 6 ("no AI-slop, no arbitrary gradients, no decorative glassmorphism"). Rive
should make the *ember trace* feel alive, not add glow for glow's sake. Polish
that fights the honesty positioning is negative polish.

---

## Appendix A — 30-day starter content calendar (fill the Q4 engine)

One production batch fills this. Post identically to TikTok + Reels + Shorts.

| Day | Hook (curiosity-first) | Surface shown | Format |
|---|---|---|---|
| 1 | "Your ball goes right for ONE reason." | Range face/path | Diverging-lines reveal |
| 3 | "Same swing speed. 27 metres apart. Here's why." | Diagnose / Carry Side | Before/after |
| 5 | "You can hit down hard and take NO divot." | Strike Window / Low Point | Myth-buster |
| 8 | "Why is your driver so much higher than your 7-iron?" | Delivered Loft & Launch | "So that's why" |
| 10 | "Draw or fade? Watch the face move." | Range face lens | Satisfying live drag |
| 12 | "Describe your slice. The app shows you why." | Diagnose reverse mode | Interactive demo |
| 15 | "Why does the ball fly further in summer?" | Air Density | Seasonal explainer |
| 17 | "High and short isn't lack of power. It's loft." | Spin Loft / Backspin | Myth-buster |
| 19 | "The 'over the top' myth, measured." | Geometry / Path | Counter-intuitive |
| 22 | "What actually is spin loft?" | Academy: Backspin | 20-second lesson |
| 24 | "Your pull-hook is NOT what you think." | Start Line / Face-Path | Myth-buster |
| 26 | "Cold morning? Here's your carry, minus X metres." | Air Density | Seasonal / topical |
| 29 | "Every shot has a reason. See yours." | Brand / product montage | The app ad (Film 2 cut) |

*(Interleave 2–3 forum/Reddit value posts and 1 email/week.)*

---

## Appendix B — ASO metadata (refined from monetization-strategy.md §4)

Lead the *discovery layer* with curiosity language; keep precision in the body.

- **iOS name (≤30):** `StrikeArc: Why Your Ball Flies` *(or keep `StrikeArc: Ball
  Flight` — A/B via Custom Product Pages)*
- **Subtitle (≤30):** `See why your ball curves`
- **Keywords (100, comma-sep, no spaces):**
  `slice fix,why ball slices,ball flight,golf physics,draw,fade,stop slicing,ball flight laws,spin,attack angle`
- **Category:** Sports (primary) · Education (iOS secondary — less-crowded shelf
  for Academy)
- **Screenshot 1:** the outcome hook ("See exactly why your ball slices") over
  real ember-tracer UI — not a feature label.
- **Turn on** Apple Custom Product Pages + Google Play Store Listing Experiments
  on day one.

---

## Appendix C — The revenue model, exposed

To let the owner stress-test Q5, the Base scenario in one line:

```
Net revenue ≈ (installs/yr × conv%) × net-per-payer + carry-over renewals
Base       ≈ (40,000 × 0.04)       × 380 NOK        + ~150k
           ≈  1,600 payers          × 380            + 150k   ≈ 758k NOK/yr net
```

Levers, by ROI-per-effort (highest first): **paywall/price A/B → conversion →
retention/renewal → installs.** The first three are cheap to test (Superwall);
installs are the expensive grind. Optimize in that order.

---

## Appendix D — Sources

- Slice as #1 amateur question: [golf.com](https://golf.com/instruction/why-most-golfers-slice-ball/), [caddiehq](https://www.caddiehq.com/resources/why-do-golfers-slice-the-ball)
- Golf short-form formats/hooks: [hooked.so](https://www.hooked.so/trends/tiktok/golf), [tiktok #golfviral](https://www.tiktok.com/tag/golfviral)
- Golf participation / off-course growth: [National Golf Foundation](https://www.ngf.org/short-game/golf-participation-growing-diversifying/)
- Golf simulator market size: [Fortune Business Insights](https://www.fortunebusinessinsights.com/golf-simulator-market-110374)
- Subscription conversion (hard paywall vs freemium), category benchmarks: [RevenueCat State of Subscription Apps 2025](https://www.revenuecat.com/state-of-subscription-apps-2025), [PaywallPro/DEV](https://dev.to/paywallpro/global-subscription-app-conversion-benchmarks-3c75), [Business of Apps](https://www.businessofapps.com/data/app-subscription-trial-benchmarks/)
- Revenue concentration (17.3% reach $1k MRR, 4.6% reach $10k MRR in 2 yrs): [SaaStr summary of RevenueCat](https://www.saastr.com/the-top-10-learnings-from-revenuecats-state-of-subscription-apps-how-115000-mobile-apps-deliver-16b-in-revenue-whats-working-whats-quietly-killing-growth/), [Subscription Insider](https://www.subscriptioninsider.com/article-type/news/revenuecat-data-shows-subscription-app-growth-concentrating-at-the-top)
- 18Birdies scale (~$15.9M/yr, 1M+ members): [scoringzone](https://www.scoringzone.net/blog/18birdies-review.html), [Sensor Tower profile](https://app.sensortower.com/overview/892700751)
- Scheduling/cross-post tools: [Postiz](https://postplanify.com/postiz-pricing), [Metricool](https://metricool.com/schedule-tiktok-videos/), [Buffer](https://buffer.com/tiktok)
- AI clip/caption tools: [OpusClip vs Submagic](https://www.ngram.com/blog/opus-clip-vs-submagic)
- Paywall tooling: [RevenueCat vs Superwall vs Adapty](https://www.buildmvpfast.com/blog/revenuecat-vs-superwall-vs-adapty-in-app-subscription-indie-2026)
- Motion/polish tooling: [Rive 2025 guide](https://medium.com/@uianimation/rive-animation-for-app-development-the-ultimate-2025-guide-8869fe52e43c), [Lottie vs Rive](https://lottiefiles.com/blog/lottie-animations/lottiefiles-or-rive), [motion design tools](https://www.todaymade.com/blog/best-tools-for-motion-design)

---

*This document recommends; it does not commit and it changed no shipping code or
protected physics. The five owner decisions in `monetization-strategy.md §8`
remain the governing calls; this pass adds the growth, automation, earnings and
polish layers around them.*
