# StrikeArc Home — Creative Front-Page Research

**For:** the design director synthesizing 3-4 buildable home-screen concepts
**Identity anchor:** "Ultraviolet Ember" — a cold ultraviolet night driving-range world where one ember-orange ball/tracer is the only living hot element. Landscape. WKWebView/Capacitor + vanilla HTML/JS/canvas (**no React**). GSAP available.
**Owner's ask (verbatim intent):** "a much more creative front page that is NOT the classic list of buttons. A blend of motion and buttons that is uncommon. Dig for apps that do something UNNATURAL."

This document collates and de-duplicates the 5-lens sweep into **mechanic families**. Each find describes exactly *what the unusual mechanic is* (how motion and interactive targets blend), *why it works (or fails)*, and a one-line *port thought*. **No concept synthesis is offered here** — that is the design director's job downstream.

> **Source note:** The raw handoff JSON was truncated mid-lens-4, so the sweep's own verbatim a11y guardrail list did not survive into my input. The "Non-negotiable guardrails" section below is therefore reconstructed from WCAG 2.2, Apple HIG, the project's own memory rules (OKLCH re-validate, text-inside-canvas, English-only), and the specific failure modes each mechanic in this doc implies. Treat it as the canonical guardrail floor, not a quotation.

---

## Mechanic Family A — World-as-menu (you *arrive at a place*, you don't read a list)

The environment itself is the navigation. Depth, distance, and camera movement do the hierarchy work a card stack normally does with size/position — but it reads as a world, not a UI. This is the single richest vein for StrikeArc, because "a night range" is already a place.

**A1 — Tolan: companion-on-a-tiny-planet home**
- *Mechanic:* No list, no tab bar. The whole home screen IS a small 3D planet in a starfield with the companion standing on it. Tap-drag orbits the camera; other people live on their own planets on visible concentric orbit rings; a "+" sits on an empty ring as the add affordance. The 4 core actions are a soft floating pill low in the frame — deliberately an afterthought under the "real" content.
- *Why it works:* Converts "here are your features" into "here is a place, and here is who lives there." Depth (starfield → rings → planet → character) carries hierarchy without any menu chrome; orbit rings solve multi-entity navigation with zero menus.
- *Port thought:* Make the ember ball the "planet" — it sits alone on the dark range, camera orbits/tilts with one drag; the 4 data modules become satellites drifting on faint orbit rings, so pulling up a stat = drawing a moon closer, not tapping a card.

**A2 — Alto's Odyssey/Adventure: title screen as a live vignette**
- *Mechanic:* The title screen is the game engine already running behind the logo — the character auto-skis on a real physics loop, parallax layers drift, day/night/aurora lighting cycles in real time. There is no seam between "menu" and "game": tapping Play just eases the camera from wide-idle framing into gameplay framing on the same continuous run.
- *Why it works:* Kills the biggest tell of a "menu" — stillness. A static hero image reads as marketing; a quietly, continuously alive background reads as a world that exists independent of you. Front-loads the entire pitch (motion, mood, scale) in the first 100ms with zero copy.
- *Port thought:* Never let Home sit idle-static — keep one ember tracer arcing lazily down the range on a slow ambient loop even before any session starts; floodlights breathe, haze drifts — so Home is legibly "the range, running, waiting for you," not a splash screen with buttons on top.

**A3 — Monument Valley: level-select nodes are tiny playable monuments in the real engine**
- *Mechanic:* The chapter picker is not thumbnails — each level is a miniature, slowly-rotating structure rendered in the *exact same* isometric engine, same void, same lighting/audio. Choosing one flies the camera toward and *into* that structure; it grows from "distant object in the menu-void" to "the level you're standing inside" in one continuous move, never a hard cut.
- *Why it works:* Because the menu items are literal tiny instances of the real thing (not icons *of* it), the boundary between browsing and playing dissolves. The camera move does the page-transition's cognitive work but reads as travel through one coherent space.
- *Port thought:* Represent each mode (Range/Diagnose/Academy/History) as a small physical structure at a different distance down the dark range — a lit mat, a target green, a stat obelisk — in the same night-UV engine; selecting one flies the camera out to it and the mode "opens" by arrival, not by cut.

**A4 — Duolingo: mascot standing on the "you-are-here" node of a winding board-game path**
- *Mechanic:* Progress isn't a bar or a completed-lessons list — it's a physical winding trail across a 3D-ish landscape, locked nodes greyed ahead, the mascot standing on your current position. Scrolling Home = walking up the path, camera panning past scenery milestones.
- *Why it works:* Replaces an abstract progress metric with a spatial journey metaphor everyone knows from childhood board games — "how far along am I" becomes "where am I standing," instantly legible without numbers.
- *Port thought:* Turn session history into a winding tracer-trail across the range that the camera flies along on scroll — each past session is a lit waypoint (an old ember tracer frozen in the grass), current ball standing at the trail's end — replacing a chronological list with a walk back through your own night.

**A5 — Bump: fog-of-war scratch-map that must be physically uncovered**
- *Mechanic:* A section of the map home is covered by a "Scratch Map" overlay with a countdown ("Unlocks in 20:12:12") and an "X% explored" chip — you wait/scratch to reveal territory, turning the map into a collectible gated surface instead of always-fully-visible data.
- *Why it works:* Deliberately *hiding* information (against the usual instinct to expose everything) creates anticipation and a reason to return — scratch-lottery psychology on a utility home screen.
- *Port thought:* Gate deeper stats/badges behind a fog-of-war overlay on a small night-range minimap — each real session scrapes back a patch of darkness where the ball landed, so "explored range" becomes a growing visible trophy, not a stats page.

**Implementability (Family A):** Best as a **2.5D parallax world**, not a real 3D engine. Layered DOM/CSS `transform: translate3d` parallax planes + one `<canvas>` for the live ember tracer hits 60fps easily in WKWebView; reserve Three.js/WebGL only if genuine 3D orbit is required (A1/A3), and even then keep poly counts trivial. Camera-fly-in (A3) = a single GSAP tween of `scale`/`translate` on the world container, `pointer-events:none` during flight. Ambient loop (A2) = one lightweight rAF driving the tracer + CSS keyframe drift on backdrop layers. Fog-of-war (A5) = a canvas mask with `globalCompositeOperation='destination-out'`, persisted to `localStorage`/filesystem so scratched territory survives relaunch. Landscape: keep the horizon low and let depth run left-to-right into the frame.

---

## Mechanic Family B — Hero-object anatomy IS the tab bar (tap the part, not a label)

One valuable object sits center-stage; its own physical zones deep-link to features. Navigation by spatial/anatomical memory instead of label-reading.

**B1 — Gran Turismo / Forza "menu car"**
- *Mechanic:* Your car sits on a rotating pedestal under studio light. Swiping rotates it; tapping a *physical zone* deep-links — hood → engine tuning, wheel → tires, body → paint/livery. The car is simultaneously the trophy shot and the entire navigation surface.
- *Why it works:* Collapses "look at your thing" and "configure your thing" into one gesture vocabulary, using spatial memory ("the wheel is tires") learned once instead of scanning a list every time. The UI reads as a *shrine* to the object, which makes the object feel valuable.
- *Port thought:* Put the club (or ball) on a lit tee-pedestal as the actual hub — touch the clubhead for club data/loft, the ball for flight/session history, the tee/ground for range settings — the equipment's own geometry becomes the four "cards."

**Implementability (Family B):** Easiest and most accessible as **DOM/SVG invisible tap-zones absolutely positioned over the rendered object** (each ≥44×44pt, each with an `aria-label`). If the hero is drawn on canvas, use manual bounding-box hit-tests or an offscreen color-picking buffer. Rotation = drag→`rotateY` on an SVG/CSS layer or a pre-rendered sprite sequence; no physics engine needed. Landscape: object center-frame, zones sized generously since a landscape thumb reach is wide but shallow.

---

## Mechanic Family C — Orbital / radial constellation (targets orbit a light or float at depth)

Interactive targets are arranged on rings or in a depth-field around a focal point, animated by physics or summoned by a gesture — the anti-rail.

**C1 — Natural AI: dark-chrome objects orbiting a light source, summoned by press-and-hold**
- *Mechanic:* On pure black, glossy black 3D tiles hang collapsed mid-frame ("Press and hold anywhere"). On press they fan into a ring, orbiting a blinding white point-light like moons around a star, each catching a rim-light as it swings into place.
- *Why it works:* The gesture (press-and-hold, not tap) matches the payoff (a physical unfurling, not an instant screen swap) — it feels like *summoning*, not navigating. One light source does all the illumination, so the UI needs almost no chrome to read as 3D and premium; darkness + one light does the whole job.
- *Port thought:* The ember ball is already the app's one hot light — a press-and-hold on it fans the 4 data modules into a dark-chrome ring orbiting it, lit only by the ball's glow, instead of a permanent rail.

**C2 — watchOS honeycomb: physics zoom + tap-to-swallow**
- *Mechanic:* Circular icons in a spring-physics hex cluster; the crown continuously *scales* the whole cluster like a zoom lens (not discrete steps), icons nearer the crosshair magnifying more. Tapping doesn't push a screen — the icon expands and morphs to fill the frame, *swallowing* the transition into itself.
- *Why it works:* Continuous physics scaling feels analog/tactile, not app-like; the swallow transition preserves spatial continuity (you always know where you came from because the destination grew out of the icon's position).
- *Port thought:* Float the data elements as ember orbs at varying depths in the night sky above the range (a loose cluster, not a rail); a pinch/scroll zooms the whole cluster like a telescope, tapping an orb swells it to swallow the screen, then releases back to the constellation on close.

**C3 — Obsidian Graph View: force-directed physics graph as the navigation surface**
- *Mechanic:* Nodes connected by thin lines, physically simulated with user-exposed "Forces" sliders (center, repel, link, distance). Dragging any node displaces neighbors like a spring system; the graph settles and drifts on its own between touches.
- *Why it works:* Most apps hide their layout physics; this one makes the physics *the toy*. Tuning repel/center turns a passive visualization into something you "play" with no goal — memorable precisely because the payoff is pure satisfaction, not utility. (Cousin: **Cash App brand portal** — an infinite momentum/drift grid of icons you pan and zoom-to-scale, one canvas serving overview and detail.)
- *Port thought:* Tether the 4 metric chips to the ember ball with thin glowing threads behaving like a physics mobile — ambient sway, and dragging one pulls its thread taut and swings the others — so the "rail" is alive with zero extra taps.

**Implementability (Family C):** Very cheap. Orbit layout = position N elements on an ellipse via `transform: rotate(θ) translate(r)`, advance θ in one shared rAF or a looping GSAP tween. Press-hold fan-out (C1) = a GSAP timeline from collapsed → orbit positions. Physics graph/mobile (C3) for ~4-8 nodes = a hand-rolled verlet/spring integrator in a few lines, trivially 60fps — **do not pull in a heavy graph lib**. Zoom-to-swallow (C2) = GSAP `scale` on the tapped node to fill the viewport; keep the cluster as DOM so the swallow can hand off to a real detail view. Rim-lighting on a single light source (C1) is a radial-gradient + `mix-blend-mode` trick, not real lighting.

---

## Mechanic Family D — The object IS the control (direct manipulation; representation and control collapse)

The thing you care about *is* the input. You don't drag a proxy (a slider thumb) to change a separate picture — you drag the actual data object and everything morphs live. This is the "feels alive instead of chrome-around-a-chart" family, and it is where two Apple Design Award winners live.

**D1 — Moonlitt: single 3D moon + elliptical orbit ring as the whole home (2026 ADA — Interaction)**
- *Mechanic:* Home is one rendered moon inside a thin elliptical orbit line with a dotted trail. A vertical drag *anywhere* scrubs time minute-by-minute — the moon physically slides along its dotted path in real time, every readout (phase, angle, rise/set) morphing live. No scrubber widget: the celestial object itself IS the scrubber. (In the ADA build, the whole screen also acts as a compass — an arrow on the live sky points to where the moon physically is, using device heading.)
- *Why it works:* Fuses data-visualization and input-control into the same object — you drag the actual thing you care about, not a proxy. That collapse is what makes it feel alive. Learnable in <10s with zero onboarding copy because the compass reads instantly and the drag is one continuous channel for "when."
- *Port thought:* Let the ember ball's flight *arc* be the scrubber — dragging along the frozen tracer of a past swing scrubs the ball-flight (apex, curve, landing) frame-by-frame, launch/spin numbers updating at your fingertip; no separate replay bar.

**D2 — (Not Boring) Weather: one scrub-bar governs a whole 3D scene (ADA winner)**
- *Mechanic:* Every metric is its own interactive 3D model (a rendered scene, not an icon+number row). A single bottom scrub-bar is the ONLY navigation: dragging it scrubs the hours and the scene physically morphs — clouds move, the vane spins, numerals reshape like odometer digits — with a distinct click + haptic tick per hour. No tabs; swiping left/right swaps which 3D toy you scrub, not which "page."
- *Why it works:* Turns the classic data-card rail into ONE manipulable object with a single physical control that governs everything on screen at once. Direct manipulation over menu navigation: you drag time itself and watch consequences ripple. Minimal chrome forces total trust in the motion.
- *Port thought:* Replace the 4-card rail with one 3D ember-ball scene + a single scrub control — dragging scrubs through swing *phases* (address → impact → apex → landing), morphing club-path arc, ball-speed numerals, and spin viz live in the same cinematic scene.

**D3 — Withings Health Mate: the value IS a draggable object on a vertical rail**
- *Mechanic:* To set a target weight there's no stepper or number field — a single white bubble sits on a vertical rail, you drag it up/down, the number inside updates as you drag, with a tiny animated hand demoing the gesture on first view.
- *Why it works:* A minimal, single-purpose embodiment of a value — one object, one axis, one gesture, no surrounding chrome. The restraint is what makes it premium rather than gimmicky (it resists adding a graph or extra labels).
- *Port thought:* Drag an ember bubble up/down a vertical rail to set a pre-session target (ball-flight height or shot-shape bias) before starting — one thumb-drag against the night sky, replacing a settings-sheet toggle.

**D4 — MyDyson: radial angle dial mapped 1:1 to real device state** *(cousin of D3, radial variant)*
- *Mechanic:* To set oscillation you drag a handle around a pie-shaped radial dial that mirrors the fan's actual top-down sweep, with a live 3D fan head rotating in sync above it. The filled wedge literally IS the arc the fan will sweep.
- *Why it works:* The control's shape is isomorphic to the physical behavior it sets — zero translation cost between "what I'm dragging" and "what will happen." Turns a numeric setting (degrees) into an embodied spatial one.
- *Port thought:* Map club-face angle/path at impact to a radial dial the golfer drags, with the ember tracer bending live in the background as they drag — face-to-path becomes something you feel with a thumb, not two numbers.

**Implementability (Family D):** The cheapest family to make *feel* premium. Core = pointer-delta → a single value integrator per frame; the value parametrically drives a precomputed ball-flight arc (array of points) redrawn on the tracer canvas — no physics, just interpolation. Snap/settle on release via a CSS `linear()` spring string (compositor-thread, immune to canvas jank). Odometer-style numeral morphs (D2) = stacked digit strips translated by `transform`, or a canvas redraw. Device-heading compass (D1) needs `deviceorientation` — iOS 13+ requires an explicit permission prompt from a user gesture, so gate it and fall back to swing-data math if denied.

---

## Mechanic Family E — The screen IS one giant instrument / distilled centerpiece

Scale is the trick: make the control *massive* (or distill many metrics into one living object) so it stops reading as "a control on a screen" and starts reading as "the screen is a control." The most directly on-brand family for an *instrument* app.

**E1 — (Not Boring) Habits: the entire screen is one giant dial**
- *Mechanic:* Home isn't cards over a dial — the dial IS Home. A huge glowing sphere/knob fills almost the whole viewport, tick marks radiating around its rim like an analog gauge; date pills below are the only list-like element, deliberately minor.
- *Why it works:* By making the instrument massive instead of a corner widget, it becomes a bold, confident statement — "the screen is a control," not "a control on a screen."
- *Port thought:* Let Home BE one huge circular gauge (altimeter/compass-rose) with the ember ball dead-center as the needle's origin, ticks doubling as launch-angle/carry markers, and the 4 data modules living as small illuminated notches around the rim.

**E2 — Moog Model D / Minimoog iOS: one persistent skeuomorphic panel, no menu exists** *(cousin)*
- *Mechanic:* The whole app is a photoreal render of the synth's panel — every parameter is a knob/switch exactly where it sits on the hardware. No settings screen, no tabs, no drawer: everything is a control visibly present on the one panel you always see.
- *Why it works:* Signals "real instrument, not software with menus" through *completeness* — nothing hidden behind a hamburger, so the object feels honest and masterable; users build spatial muscle memory like a musician learns a hardware face.
- *Port thought:* Consider Home as one persistent flight-scope fascia — glowing analog dials for ball speed, launch angle, carry — where "exploring the menu" is just looking at the panel, since every stat has a permanent physical position.

**E3 — Opal: one synthesized "Focus Score" gem + collectible MileStones on Home** *(cousin)*
- *Mechanic:* Instead of a settings-style dashboard, Home surfaces one live synthesized number (a Focus Score distilled from many signals) plus gem-like MileStones that visually unlock on the home surface itself — not buried in a rewards tab.
- *Why it works:* Compressing many metrics into one emotionally legible number gives an instant read without parsing a dashboard; embedding collectibles on the main screen keeps progress motivating in the moment it matters.
- *Port thought:* Distill the many swing metrics into one glanceable "Strike Score" gem at the center of the scene that visibly re-cuts / catches light as sessions accumulate — one living centerpiece plus optional drill-down instead of the 4-metric rail.

**Implementability (Family E):** Use **SVG for the gauge face + tick marks** (scales crisply to any landscape size, never blurs like a raster gauge) and one `<canvas>` for the live ember center. Needle/wedge rotation = SVG/CSS `transform: rotate`. A "gem catching light" (E3) = a CSS conic/linear-gradient sweep animated across an SVG facet mask, or a cheap shader-in-canvas if you want caustics. This family has the *lowest* runtime cost of all — mostly static SVG with a couple of transformed elements — so it leaves maximum budget for the ember tracer.

---

## Mechanic Family F — Physical / tactile buttons (haptic detents, cranks, ambient surfaces)

Controls borrow literacy from real hardware — dials, wheels, cranks — so they teach themselves through familiarity with a non-phone object, with haptics doing the work text normally does.

**F1 — (Not Boring) Camera: haptic detent dial & tactile chrome**
- *Mechanic:* Exposure/focus/shutter are giant physical dials and a haptic scroll wheel — turning gives a real detent-click via haptics, the shutter visually presses in like a mechanical camera, and a custom typeface mimics stamped vintage-camera numerals.
- *Why it works:* Borrows literacy from film cameras, so controls feel graspable without labels — you already know how a dial "should" feel. Haptics carry the state a label would otherwise show.
- *Port thought:* Give mode-selection a real haptic detent-wheel (rotate Practice/Diagnose/Academy/History) instead of tabs — each stop clicks with a distinct haptic + the ember scene re-lights to match, so switching modes feels like turning an instrument dial.

**F2 — Playdate: crank-to-buy fill-and-tension gesture**
- *Mechanic:* A purchase button reads "Crank to buy" and visually FILLS as you crank, with resistance/tension increasing near confirmation — a physical gesture that "argues with itself" for suspense — while a plain second tap still works as an accessible fallback.
- *Why it works:* Replaces a binary tap-confirm with a continuous, effortful, reversible gesture, so committing feels *earned/physical*; because it's optional, it's delight for those who engage, never a barrier.
- *Port thought:* For committing to a session or saving a swing to the vault, replace the confirm-tap with a wind-up/charge gesture on the ember tracer (press-and-hold that "coils" the glow before release) — same tension-fill psychology, always with a plain-tap fallback.

**F3 — Teenage Engineering OP-1 / OP-Z: constraint architecture + color-memory** *(cousin)*
- *Mechanic:* Full synth/sampler power through exactly four knobs and one small screen; each major mode gets a solid consistent color, so users navigate by *color + position memory* rather than reading labels. Mono type and exposed-engineering finish signal "precision instrument."
- *Why it works:* Hick's Law — fewer simultaneous choices force faster decisions; pros report it's *faster* despite being more constrained. Color-coding turns "where am I in the menu tree" into a pre-verbal, peripheral-vision judgment.
- *Port thought:* Cut Home to a small fixed number of physical-feeling controls, each hard-mapped to a palette color, so returning users navigate by color-memory and hand position — reinforcing "instrument, not app."

**F4 — Nothing Phone Glyph Matrix: an ambient status strip that runs parallel to the main UI** *(cousin)*
- *Mechanic:* A tiny secondary LED surface (on the phone's back) cycles small glanceable "Glyph Toys" — a solar clock arc, a rotating contact dial, a level/spirit-bubble — with a two-gesture vocabulary: tap to cycle, hold to interact. A non-competing surface for ambient/status info.
- *Why it works:* Gives status info a dedicated surface so the primary screen stays clean, and turns idle moments into small delight. "Tap to cycle, hold to play" scales to many mini-tools without a menu.
- *Port thought:* Give the instrument a persistent ambient "glyph bezel" — a thin ember-lit ring/strip around the main scene (wind as a rotating dial, live club-selection glow, session streak as a pulse) that you tap to cycle and hold to expand, always visible but never competing with the 3D scene.

**Implementability (Family F):** Detent wheel (F1) = drag→rotation, snap to nearest detent via a `linear()` spring; fire a **Capacitor Haptics** impact on each detent-boundary crossing (note: iOS Safari/WKWebView *ignores* `navigator.vibrate` — you must route through the native Capacitor Haptics plugin, and the project already has `sa-haptics.js`). Crank/charge (F2) = press-hold progress driven by GSAP with a haptic intensity ramp; **must** ship a plain-tap fallback. Ambient strip (F4) = a thin always-on element animated with a CSS keyframe or a lightweight shared rAF; keep it cheap so it never steals frames from the tracer. Haptics are enhancement-only — degrade silently if disabled.

---

## Mechanic Family G — Boot / wake choreography & embodied entry ritual

A fixed, often non-interactive sequence establishes identity *before* any control appears — borrowing the emotional grammar of powering on a serious instrument rather than opening an app.

**G1 — Automotive cluster boot (Porsche Taycan / Rivian EV wake)**
- *Mechanic:* On power-on the cluster runs a fixed 2-3s non-interactive sequence — needles/light-arcs sweep zero→max and settle, the brand mark resolves out of the sweep, cabin lighting pulses once. No input is accepted during the window; it's pure choreography that doubles as a systems-check and a brand moment.
- *Why it works:* The *forced* non-interactivity is what sells it — because you can't skip it, it reads as the machine doing something real, not decoration. Borrows "powering on a cockpit," not "loading an app."
- *Port thought:* On launch, run a fixed ~2s "range coming online" sequence — floodlights kick on pole-by-pole down the range, distant target flags flare into ember pinpricks one at a time, UV haze settles — before the first control becomes tappable.

**G2 — Family (crypto wallet): backend events theatrically "settle into place"** *(cousin)*
- *Mechanic:* For rare/significant actions, instead of a spinner the app plays a crafted animation where elements (addresses, keys) visibly organize and settle themselves into place — turning an invisible backend event into a witnessed, memorable moment. Advanced controls appear only as they become relevant (progressive disclosure).
- *Why it works:* Most apps hide completion behind a spinner; showing the system do its work builds trust and converts a mundane technical step into an emotional beat worth remembering — critical for infrequent, high-stakes actions.
- *Port thought:* When a swing analysis finishes, don't fade in a result card — show the flight path *resolve*: the tracer's raw sensor points visibly organize into the final smooth arc, so the user watches their swing "arrive."

**G3 — One Sec: embodied friction ritual as the literal entry point** *(cousin)*
- *Mechanic:* Before a destination opens, One Sec inserts a mandatory *body* action instead of a menu — one visible deep breath (a gradient breathes in sync with haptic pulses) or physically rotating the phone three times before it unlocks.
- *Why it works:* Replacing a frictionless tap with a brief physical ritual forces conscious intent (peer-reviewed ~57% fewer compulsive opens) because the body participates, not just the thumb — and it makes entry feel deliberate.
- *Port thought:* Use a short embodied calibration ritual as the entry to a session — a "settle" beat where the ember's glow breathes with the phone held steady/level before capture arms — turning setup into a felt pre-shot routine that doubles as real sensor calibration.

**Implementability (Family G):** Pure **GSAP timeline** on launch; gate interaction with `pointer-events:none` until it completes. Zero sustained perf concern (one-time), but it **must** honor `prefers-reduced-motion` by collapsing to a short cut or static end-state, and must never block a returning user for more than ~2s. G3's "phone held steady/level" reads the IMU via `devicemotion` (same iOS permission-gesture caveat as D1). G2's "resolve" is a GSAP stagger from scattered points → arc path, reusing the tracer canvas.

---

## Mechanic Family H — Proximity / aim discovery (search, don't browse)

Metal-detector logic: the reward loop is *approaching* a target, not scanning a list. The empty space between destinations becomes purposeful.

**H1 — Zelda BOTW/TOTK: Sheikah Slate shrine-sensor**
- *Mechanic:* No shrine list. You hold up the Slate and walk; an audio ping + haptic pulse quicken in frequency as you near an undiscovered shrine (exactly like a metal detector) until it locks on. Map icons additionally change state (dim/orange = found-unfinished, blue = done), so the world surface doubles as a live progress readout.
- *Why it works:* Replaces browsing with *searching* — a quickening pulse is more physically satisfying than scanning a list, and it makes the space between destinations feel intentional rather than padding. "Menu state" is rendered as glowing marks in the world, so you never leave the world to check status.
- *Port thought:* Give the 4 data cards a live-range presence — place them as glowing yardage stakes that pulse faster (light + haptic) as the tracer's *predicted* landing nears them; you "discover" your carry-distance card by hitting close to it, not by tapping a tab. *(Frame-break cousin: CARROT Weather drops an AR data-orb into your real room casting real light/shadow, with personality attached to the resize gesture — the data escapes the screen entirely.)*

**Implementability (Family H):** Pulse = an interval whose frequency (and a scaling/opacity animation) maps to distance between the predicted-landing reticle and each stake; haptic quickening via Capacitor Haptics. Cheapest path uses the app's own swing/predicted-landing math (no sensors). True physical-aim (pointing the phone down the range) needs `deviceorientation` heading + the iOS permission gesture, plus a graceful non-heading fallback. AR (CARROT cousin) is out of scope for a WKWebView vanilla build — treat only as a spirit reference (borrow "data casts real light on the range ground" as a 2D lighting trick, not literal AR).

---

## Non-negotiable guardrails

*Reconstructed canonical floor (see Source note). Every concept the design director ships must clear all of these; they are pass/fail, not scored.*

1. **`prefers-reduced-motion` is mandatory, not optional.** Every ambient loop, parallax, orbit, physics drift, camera-fly-in, and boot sequence must have a reduced-motion branch that cuts to a static, fully-legible end-state. No information may be conveyed *only* by motion.
2. **No gesture-only affordances.** Every drag / press-hold / directional-swipe / scrub / crank interaction needs a discoverable non-gesture fallback (a visible control, a tap target, or a one-time coach mark). Snapchat-style directional swipes and press-hold fans especially require a first-run hint *and* a tappable equivalent.
3. **Hit targets ≥ 44×44 pt** (Apple HIG), including orbiting/moving elements. Freeze or enlarge the hit region as a moving target approaches; never require tapping a small fast-moving target.
4. **Hit-testing continues during motion.** Any moving element stays tappable mid-animation (tap-to-stop / grab-in-flight). Never gate interaction on `transitionend` — a mid-flight tap must inherit current position and velocity, never restart.
5. **Never encode information in color alone.** The UV palette is near-monochrome; pair ember/violet coding with shape, position, or label. Validate for color-blind safety.
6. **Contrast ≥ WCAG AA** for all text and critical readouts (4.5:1 body, 3:1 large) against the dark UV scene. **Re-validate contrast after any hue swap** — sRGB/OKLCH gamut clipping can mask luminance loss (project memory rule).
7. **Text stays inside the canvas/scene frame** — never clipped off-edge or placed outside the image (project memory rule). UI copy is **English only** (project memory rule).
8. **Vestibular safety.** Avoid large-field parallax/zoom that can trigger motion sickness; cap camera-fly-in distance and speed; the reduced-motion branch (guardrail 1) is the escape hatch.
9. **Haptics are enhancement, never the sole information channel.** Respect system settings; iOS WKWebView ignores `navigator.vibrate`, so route through Capacitor Haptics and degrade silently when unavailable.
10. **Sensor permissions must fail gracefully.** `deviceorientation` / `devicemotion` require an explicit iOS permission prompt from a user gesture; the home screen must remain fully functional (with a math/data fallback) if the user denies.
11. **60fps floor on the minimum target device, with the ember tracer rendering.** If a mechanic drops frames it fails. Budget the canvas/rAF for the ball + tracer only; offload all UI-chrome motion to the CSS compositor (`transform`/`opacity`/`linear()` springs).
12. **No essential action locked behind a delight/tension gesture** (crank/charge/ritual) without a plain-tap fallback — Playdate does this correctly.
13. **Entry choreography is skippable or short (≤ ~2s)** and never blocks a returning user from acting.
14. **Pause on background.** Continuous physics sims, camera feeds, and always-on ambient loops must stop on `visibilitychange` / backgrounding to protect battery and thermals.
15. **Accessible names on stylized targets.** Every interactive object — even a rendered ball, planet, or gauge notch — needs an `aria-label` / accessible name for screen readers.
16. **Landscape-first validation.** Re-check every guardrail in landscape; keep controls out of thumb-occluded zones and clear of the notch / Dynamic Island / home-indicator.

---

## GAP CRITIC — directions the sweep missed or under-explored

*Where the 5-lens sweep is thin. Flagged for the design director to deliberately probe, not because a find exists.*

1. **Audio / sonification is almost entirely absent.** Sound appears only as haptic-adjacent "clicks." Nothing explores *sound as an input or output channel*: a night-range instrument could sonify ball flight (a doppler whoosh, an apex chime, spin mapped to pitch), or make the home scene *audio-reactive* (ambient bed that swells on a good strike). For a cinematic night world, spatial/generative audio may be the single most underused "aliveness" lever — and it costs almost nothing on the render budget.

2. **Real-world-state reactivity is under-explored.** Moonlitt uses device *heading*, but nothing ties the home scene to the user's actual context — local time, real dusk→night transition, weather, or live range conditions. A "night range" that shifts with the user's genuine sunset, or pulls real wind to bend the ambient tracer, would deepen the world illusion far past a canned loop. Only CARROT gestures at real environment (via AR).

3. **Data-as-architecture (your numbers *build* the world) is missing.** The sweep shows data *as objects* (bubbles, gems, orbs) but never data literally *constructing the environment*: shot dispersion generating the range's terrain, session count thickening the skyline, consistency reshaping the range's geometry, scorch-marks accreting where you always miss. No procedural/generative environment driven by the user's own stats — arguably the most "unnatural" and personal direction available.

4. **Stillness / withholding / anticipation as a mechanic is thin.** The sweep is overwhelmingly motion-*additive*; only Bump (fog) and One Sec (friction) use *withholding*. For a "cold UV night" identity, deliberate emptiness — one breathing element, silence-then-event, a single ember in a vast dark — could read as *more* premium than busy orbits. Restraint is itself an uncommon move and was barely mined.

5. **Persistence / a home surface that *ages* with you is under-explored.** Duolingo's path and Bump's fog gesture at accreted history, but nothing treats the range as a *living record* that physically wears in — worn turf on your stock line, frozen ghost tracers of past greatest shots drifting in the background, the range remembering you between sessions. Home-as-memory, not home-as-dashboard.

6. **Momentum / inter-object physics between elements is hinted but not pursued.** Obsidian and the Cash App portal touch spring physics, but true *momentum transfer* — flick one data chip and it collides with and nudges the ball or swings its neighbors — is unexplored as a playful, tactile home substrate. Cheap to build, high on the "uncommon blend of motion and buttons" the owner asked for.

7. **Tilt / IMU-driven idle parallax is assumed but never named as a mechanic.** Several finds imply a "living" backdrop, but none explicitly use the phone's accelerometer so the *scene reacts to how you hold it* (holding the phone level settles the range; tilting shifts the UV light and parallax). In landscape, where the phone is already held two-handed and steady, this is a natural, low-cost source of aliveness the sweep skipped.

---

*End of research collation. Concept synthesis is intentionally omitted — that is the design director's next step.*
