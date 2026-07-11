# APP STORE MOCKS — the plan (Fable, 2026-07-12, pre-expiry directive)

**Owner's two requirements:** (1) BLIKKFANG — stop the thumb in search results. (2) «Følelsen av noe nytt» — this must not read as another golf app. Everything else: Fable's call. This document IS those calls — binding creative direction; production may be executed by any model against it.

## 0 · The one idea
Every golf app on the store is **daylight, grass-green, white cards, a smiling dude in a polo**. StrikeArc's screenshots are **night**. An ultraviolet observatory where your golf shot is the only heat. The newness isn't claimed in copy — it's visible in one glance of color alone: violet-black sky, one ember streak. That IS the blikkfang strategy: in a row of green-and-white thumbnails, we are the black card with a comet.

## 1 · Store mechanics that shape the set
- Search results show ~2.5 PORTRAIT screenshots but only ~1 landscape → **shots 1–3 are portrait marketing canvases** (even though Impact/3D are landscape apps — the landscape UI is composed INSIDE the portrait canvas as an angled/floating device).
- Sizes: **1290×2796** portrait / **2796×1290** landscape (6.9"/6.7" master; Apple scales down). Exact pixels — Apple rejects ±1px.
- Up to 10 slots; we ship **8** (density beats padding).
- Locale: **Norwegian headlines, English UI in the shots** (audience = den nysgjerrige norske golferen; UI-språket er produktet). `en` locale later re-uses the canvases with translated headlines.
- No star-ratings shown (own law: not before 50+ reviews). No device hands, no stock golfers, no fake TrackMan claims.

## 2 · Canvas system (all 8 share it — the set must read as ONE poster series)
- Background: the dusk ramp `#0A0818 → #241B44` + faint star-dust + a horizon glow LOW in frame (the range at night). Film grain 2–3 %.
- Headline: **Fraunces** (the serif voice), ink `#EDEAF7`-white, 2–4 words, top of canvas, generous air. Subline: Inter, muted violet, ONE short sentence, only where it earns its place.
- Device: iPhone frame with the real UI (real pixels captured via the Playwright rig, never redrawn). Portrait shots may float/tilt the device (≤6°) with a soft violet ambient shadow; landscape UI sits in a landscape-held frame inside the portrait canvas.
- Warm-light law applies to the CANVAS: exactly ONE ember element per shot (usually inside the UI itself — the comet, the CTA, the START HERE). Gold only as annotation. If the UI already carries ember, the canvas chrome stays cold.
- Continuity device («noe nytt», felt): a faint dashed **ember flight-path thread runs through the whole set** — it enters shot 1 at the tee, arcs across each canvas edge-to-edge in sequence, and LANDS in shot 8. Swiping the gallery = watching one shot fly. No golf app has done their gallery as a single ball flight.

## 3 · The 8 shots (order = the story: hook → instrument → understanding → mastery)
| # | Orientering | UI-kilde | Headline (NO) | Komposisjon / poeng |
|---|---|---|---|---|
| 1 | Portrett | home-mock (parabelen) | **«Golf, etter mørkets frembrudd.»** | BLIKKFANGET. Nesten ren scene: natthimmelen, konstellasjons-navigasjonen, ball-gløden nederst. Ingen device-ramme — appen ER plakaten (UI full-bleed). Tee-enden av ember-tråden starter her. |
| 2 | Portrett | impact.html mid-flight (landskap-frame, tiltet) | **«Se hvorfor ballen gjør som den gjør.»** | Kometen fryst mid-flukt over skumringsrangen, TOTAL-tallet glødende. Sub: «Ekte fysikk. Ingen gjetting.» |
| 3 | Portrett | geometry-window-mock | **«Modellér treffet ditt.»** | 2D-vinduet native portrett i ramme; Pure-verdikt synlig; treffball-inset og ±20-slideren viser INSTRUMENT, ikke video-kurs. |
| 4 | Landskap | geometry.html (todelingen) | **«Mikroskopet for svingen din.»** | Mikroskop-panelet + den stille scenen — gull-målene og verdikt-fargen bærer. Dette skuddet selger «noe nytt» til de som sveiper dypt. |
| 5 | Portrett | academy.html (treet) | **«Lær instrumentet. 24 leksjoner.»** | Natthimmel-treet med START HERE-gløden; rank-stigen i header synlig (Rookie). |
| 6 | Portrett | academy-lesson-v2-mock S1 | **«Lek med ekte fysikk.»** | Spin Lab: 7 128 rpm ember, sliderne, mission-pillen. Sub: «Dra — modellen svarer live.» |
| 7 | Portrett | diagnose… **UTGÅR i v1** → impact ghosts/Data-pill | **«Sammenlign. Forstå. Gjenta.»** | Ghost-lab: to flukter over rangen (ember + ghost-violet), Data-pillen synlig — øve-loopen. |
| 8 | Portrett | paywall-fri verdi: outcome/impact landing + «try it»-kortet fra hjem | **«Kveldens drill venter.»** | Ember-tråden LANDER her (ballen i ro ved landingsmerket). Avslutter serien varmt + inviterende. Ingen priser i screenshots (paywall selges aldri i galleriet). |

Icon-note (samme leveranse): app-ikonet må matche skudd 1 (arc-merket + ember-ball på violet-sort) — sjekk kontrast på liten størrelse.

## 4 · Produksjonsrigg (bygges post-Fable, mot denne planen)
1. `tools/appstore-shots/` : én HTML-mal per skudd (canvas 1290×2796 @1x-px) som (a) legger bakteppe/headline/tråd, (b) iframer/embedder den EKTE siden i riktig viewport, eller kompositerer et forhåndsskutt UI-bilde.
2. Playwright-riggen (chromium-1223-mønsteret): steg 1 skyter rå UI i eksakt device-piksler (portrett 1290×2796 ÷3 = 430×932@3x ✓; landskap 2796×1290 ÷3 = 932×430@3x ✓); steg 2 skyter malsiden i full størrelse. `deviceScaleFactor` så Apple-målene treffes EKSAKT (assert px i riggen).
3. States settes deterministisk (localStorage-seeds, slider-verdier per skudd — gjenbruk seedene fra verifiseringsriggene; skudd 2 fryses via RM eller seek).
4. Akseptkriterier: eksakte piksler · én ember per canvas · null trunkering i headlines (375-loven gjelder ikke her, men 2-linjers maks) · tråden kontinuerlig over settet (kant-posisjoner definert i malen) · settet lest i rekkefølge = én flukt.

## 5 · Ikke i scope for skuddene
Diagnose (ute av v1) · priser/paywall · stjerner/anmeldelser · «#1»-claims · foto av mennesker. Higgsfield-filmene (App Preview-video) er egen leveranse etter dette settet — skudd 1-komposisjonen gjenbrukes som filmens åpningsbilde.

— Fable 5, siste tjeneste før utløp. Blikkfanget er natten; det nye er at galleriet selv er ett golfslag.
