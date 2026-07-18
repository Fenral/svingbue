# STRIKEARC · IMPACT-KAMERA · ARBEIDSORDRE

**Referanse-artefakt:** `strikearc-kamera-final.html` (mocken ER spec-en for UI-atferd; mock-fysikken er throwaway).
**Konsept i én linje:** Én scene, tre kamerastasjoner. Input stilles i planene (TOP, SIDE), output leses i FLIGHT. Utfall måles opp i planet der de oppstår.

**Kjøreregler:** Én økt = én fersk Claude Code-kjøring med angitt modell og effort. Eneste artefakt som bæres mellom økter (utover koden) er `docs/systemkontrakt.md`, som Økt A produserer. Ved eskaleringsutløser: stopp økten, ikke improviser — tilbake til Fable.

---

## 1 · ØKTPLAN

| Økt | Modell | Effort | Omfang |
|---|---|---|---|
| A | Fable | Høy | Integrasjonsarkitektur + docs/systemkontrakt.md |
| B | Sonnet | Høy | Kamerasystem: scrub + projeksjonsblending |
| C | Sonnet | Medium | Paneler, slidere, chips, stepper, pin |
| D | Sonnet | Høy | Annotasjonslaget (måleregler) |
| E | Fable | Medium-høy | Motorbinding + ekstremverdi-policy |
| F | Fable (fersk kontekst) | Høy | Dommer, 1× med evidenskrav |

**Økt A — Fable, høy.** Kartlegg eksisterende StrikeArc-kodebase (Impact-skjerm, 3D-visning, tokensystem, motor-API). Beslutt: kamerasystem-tilnærming (se utløser i B), state-modell for stasjonsskalar + parametre, hvor annotasjonslaget bor, ekstremverdi-policy (se §4). Skriv `docs/systemkontrakt.md`: API-flater mellom økter, navngitte tokens, filstruktur, beslutningslogg. Liten i tokens — beslutningene forplanter seg overalt.

**Økt B — Sonnet, høy.** Scrub-gest (vertikal drag = kontinuerlig skalar 0–2, snap ved slipp), segmentknapper som animerer dit, blending mellom perspektiv (FLIGHT), side-orto og topp-orto. **Kritisk teknisk risiko:** mocken lerper *projiserte 2D-punkter* — i en ekte renderer kan riktig svar være kamerainterpolasjon (posisjon/FOV/projeksjon) i stedet. docs/systemkontrakt.md skal ha valgt tilnærming. **Eskaleringsutløser:** hvis Sonnet må *redesigne* tilnærmingen (ikke bare implementere den) → stopp, tilbake til Fable.

**Økt C — Sonnet, medium.** Stasjonspaneler med kollaps-grabber, slidere, outcome-grid med ALL METRICS-toggle og gruppehopp, speed-stepper, Pin-pill, stats-blokk med flip. Mekanisk og token-tungt — verst tenkelig Fable-bruk. **Eskaleringsutløser:** avvik fra docs/systemkontrakt.md-flater.

**Økt D — Sonnet, høy.** Hele §3 som ren port fra mocken. Reglene er ferdigspesifisert med tallterskler — null designskjønn tillatt. **Eskaleringsutløser:** enhver situasjon der en regel er tvetydig → noter, ikke gjett.

**Økt E — Fable, medium-høy.** Bytt mock-fysikk mot ekte motor for alle 12 outcome-verdier + banegeometri. Implementer ekstremverdi-policy fra docs/systemkontrakt.md. Verifiser tverrgående korrekthet (samme tall i chips, annotasjoner og stort tall).

**Økt F — Fable, fersk kontekst, høy.** Dommer per §6. Får kun: docs/systemkontrakt.md, denne ordren (§3 + §5), bygget. Ikke chat-historikk, ikke mål.

---

## 2 · LÅSTE DESIGNBESLUTNINGER (normative)

- Dusk-universet (lilla/gull/oransje). Warm light rule: én oransje fokal per skjerm — her: aktiv bane + komet. Solid chip = kontroll, dashed chip = avlesning, ingen unntak.
- Semantiske farger via tokensystemet: face rød, path blå, attack rosa, dyn loft fiolett, speed/launch varm-rav. Ingen hardkodede fargeverdier utenfor tokens (jf. tidligere audit-funn: 11 hardkodede amber).
- Stasjoner: `TOP · SIDE │ FLIGHT` med divider. Aktiv TOP/SIDE = lilla (input), aktiv FLIGHT = gull (output). Paneltitler: `INPUT · DIRECTION PLANE` / `INPUT · LAUNCH PLANE` (lilla) / `OUTCOME · READ` (gull).
- Oppstart: land i TOP via animert kamerareise fra bak ballen (~0,5 s). Default: face +2.0, path 0.0, attack +3.0, dyn loft 24, speed 130, én forhåndspinnet ghost.
- Slider-hierarki: FACE øverst i TOP, DYN LOFT øverst i SIDE (dominant kontroll øverst). Ranges: face/path ±15°, attack ±15°, dyn loft 0–50°.
- Speed: global oransje stepper-pill under toppbaren, synlig i alle stasjoner. Tap ±1 mph; hold auto-repeat (400 ms delay, 90 ms intervall, ±5 etter 10 repetisjoner); horisontal scrub på tallet ±1 per 6 px; clamp 30–150.
- Pin: «⊙ Pin»-pill topp høyre, alle stasjoner. Ghosts maks 3 (eldste ut). Δ-linje vs forrige pin: carry-diff + kurve-diff («more/less curve»).
- Stort tall øverst = **CARRY** (side-avvik under, oransje). NB: bevisst divergens fra dagens 3D-visning som viser TOTAL stort — harmoniser eller lock divergensen i Økt A.
- FLIGHT-panel: mini-rad `TOTAL · APEX · CURVE · BALL SPEED` + `ALL METRICS ▾` som folder ut tre grupper à fire (årsak → mekanisme → form → resultat):
  - `DIRECTION · TOP →` Launch dir · Spin axis · Curve · Side
  - `LAUNCH · SIDE →` Launch ang · Spin loft · Backspin · Land ang
  - `DISTANCE` Smash · Ball speed · Carry · Total
  Gruppeheadere med pil er tappbare → kamerahopp til stasjonen. Chip-nivå-forklaringer hører til Academy (Goal→Model→Truth→Controls), IKKE her.
- Kortet har kollaps-grabber; stasjonsknappene forblir synlige i kollapset tilstand.
- All produktcopy engelsk.

---

## 3 · ANNOTASJONSSYSTEM (normative regler — Økt D)

**Grammatikk:** lengde = målelinje med perpendikulære endeticks; vinkel = hårstrekbue (1 px, ~50 % alpha) med perpendikulær bakketick der buen møter grunnlinjen; alt får nøyaktig én etikett. Måle-etiketter i ravfamilien (`#eec07a`-token). Ingen glyf-ikoner (↘ o.l.) noensinne.

**TOP (fader inn ved stasjonsskalar > ~1,25):**
- Kurve-sjikt: gradient-fylt flate mellom stiplet startlinje og faktisk bane, alpha stigende mot landing; forsterkes i hot-state.
- Avviks-ticks ved 35/60/80 % av flighten (viser t²-vekst — spinn virker over tid).
- Retningsbue ved ballen (r 26 m), uten etikett. «Launch dir ±X.X°»-etikett ligger på startlinjen ved ~52 % av carry.
- Kurvemål ved z = carry (fra startlinjens endepunkt til landing). Skjules når |curve| < 3 m.
- Offline-brakett ved z = carry + 12, fra target-linjen til landing-x.

**SIDE (bell rundt skalar 1):**
- Launch-bue r 24 m, Land-bue r 18 m — samme ravfarge, ord i etiketten («Launch 17.4°», «Land 26°»), begge pulser med attack/loft.
- Apex = gulldot på banens **visuelle** topp (skjermrom-minimum over blend-verdier, IKKE world-apex-indeks) + «Apex X m»-etikett i samme stil. Ingen vertikal dimensjonslinje.
- Høydeguider 20/40 m (stiplede) som referanse.

**Etikettplassering — deterministisk kaskade, i denne rekkefølgen:**
1. Målespenn < 74 px → etikett ved ytre ende, horisontalt forskjøvet (halv bredde + 10 px).
2. Midtpunkt i stats-keep-out (x < 246 px, y 88–356 px) OG stats står til venstre → etikett ved indre (høyre) ende.
3. Ellers → midtpunkt, 15 px over linjen.
Deretter: kollisjonsregister per frame, vertikal nudge vekk fra overlapp, maks 3 iterasjoner, fast tegnerekkefølge (grid → bane-etiketter → mål-etiketter). Ingen jitter under morfing.

**TARGET:** verdensanker (z≈228) i FLIGHT/SIDE. I TOP glir etiketten til rett over målestakken: y = max(112, offline-linje-y − 16); fader ut når klaringen < ~18 px (lang carry). Den stiplede linjen består alltid.

**Stats-flip (dataene viker for skuddet):** stasjonsskalar > 1,1 og side < −28 m → blokken flytter til høyre, høyrejustert under Pin. Skalar < 0,9 eller side > −14 m → tilbake venstre. Hysteresebåndet er obligatorisk.

**Hot-state (kausalitetspuls):** face/path → retningsbue + kurve-elementer; speed → kurve-sjikt (700 ms etter stepper/scrub); attack/loft → Launch/Land-buer. Aktivt element: alpha opp, strek tykkere, glow.

**Komet:** kontinuerlig langs aktiv bane, ~2,9 s syklus + pause. `prefers-reduced-motion` → av.

---

## 4 · MOTORBINDING (Økt E)

- Mock-konstantene (lineær d-plane, smash-/spin-formler) er throwaway. Ekte motor eier: launch dir, spin axis, curve, side, launch ang, spin loft, backspin, land ang, smash, ball speed, carry, total + banegeometri.
- **Beslutning som MÅ tas i Økt A og stå i docs/systemkontrakt.md:** attack ±15° og dyn loft 0–50° er instrumentområde utover det fysisk mulige. Policy: (a) clamp motor-output stille, eller (b) eksplisitt «utenfor fysisk område»-tilstand i UI. Ikke overlat dette til Økt E-improvisasjon.
- Samme tallkilde overalt: chip, annotasjon og stort tall skal aldri kunne divergere (én selector per verdi).

---

## 5 · EVIDENSKRAV (låst nå, før arbeid starter)

**Kritiske — én feilet = NO-GO:**
- K1 Kamerascrub er kontinuerlig over skalar 0–2 og snapper til nærmeste stasjon ved slipp. *Verifikasjon: skjermopptak + logget skalarverdi.*
- K2 Segmenthopp TOP↔FLIGHT reiser visuelt gjennom sideplanet. *Skjermopptak.*
- K3 Chip-semantikk uten unntak: solid = kontroll, dashed = avlesning. *Visuell audit av samtlige chips.*
- K4 Alle farger via tokensystemet; grep etter hardkodede fargeverdier = 0 treff i nye filer. *Grep + kodegjennomgang.*
- K5 Ekte motor driver alle 12 outcome-verdier; ingen mock-konstanter i produksjonskode. *Grep etter mock-signaturer + kodegjennomgang.*
- K6 Scrub og slider-morf ≥ 55 fps på referanse-iPhone. *Instrumentert måling, ikke skjønn.*

**Shippbar:**
- S1 Etikett-kaskaden (74 px → ytre ende; keep-out → indre ende; ellers midtpunkt) er deterministisk. *Enhetstester med syntetiske geometricaser: kort spenn, venstreskudd i mellomsonen, normaltilfelle.*
- S2 Stats-flip: flytter ved side < −28 i TOP, returnerer ved > −14, ingen oscillering ved sveip over terskelen. *Automatisert sveip-test.*
- S3 TARGET følger målestakken og fader ved lang carry; linjen består. *Parametrisert test over carry-spennet.*
- S4 Speed: tap ±1, hold-akselerasjon til ±5, scrub ±1 per 6 px, clamp 30–150. *Manuell sjekkliste.*
- S5 Apex-dot ligger på banens visuelle topp for stasjonsskalar 0, 0.35, 0.7, 1.0, 1.35. *Skjermopptak ved fem blend-punkter.*
- S6 Gruppehopp fra outcome-headere lander i riktig stasjon. *Manuell.*
- S7 Pin/ghost: maks 3, Δ beregnes på carry + kurve, korrekt fortegn og «more/less». *Test.*
- S8 Kollaps-grabber fungerer i alle stasjoner; stasjonsknapper synlige i kollapset tilstand. *Manuell.*
- S9 `prefers-reduced-motion` deaktiverer komet og reduserer morfing. *Innstillingstest.*

**Studio-grade:**
- G1 Annotasjons-crossfade under scrub uten pop eller jitter — parvis blindsammenligning mot mock-opptak (mocken er navngitt referanseprodukt).
- G2 Ekstern 5-sek blindtest: uinnvidd person identifiserer input- vs output-stasjoner uten forklaring.

**Score:** 1–100 kun som avledet vektet sum av beståtte krav. Tall overstyrer aldri kritisk defekt.

---

## 6 · DOMMERPROTOKOLL (Økt F)

- Dommer får KUN: docs/systemkontrakt.md, §3 + §5 av denne ordren, og bygget. Ingen chat-historikk, ingen mål, ingen builder-kontekst.
- Kjør én dommerøkt. Maskinverifiserte krav (grep, unit-tester, instrumentert fps) 1× — rerun gir null informasjon.
- Dommer-persiperte krav (visuelle audits, skjermopptak) består kun med sitert evidens: konkret frame/skjermbilde per bestått krav. Blind pass uten evidens = ikke bestått.
- Krav som viser seg å kreve skjønn → kun det kravet vurderes 3×, løst ved parvis blindsammenligning mot mock-opptaket. Enkeltstående funn verifiseres manuelt før de teller.
- Leveranseformat, i denne rekkefølgen: evidenssjekkliste → kritiske defekter → tier (NO-GO / SHIPPBAR / STUDIO-GRADE) → avledet score → funn etter alvorlighet → tiltak.
- Ekstern validering (G2) kjøres av Sivert før release, etter SHIPPBAR-tier.

---

## 7 · LEVERANSER PER ØKT

- A: `docs/systemkontrakt.md` (kun verifiserbar systemvirkelighet: motor-API-flater, state-modell, filstier, tokens; skrives kun av arkitekturpass; overlapp med ordrer forbudt) + beslutningslogg (kameratilnærming, ekstremverdi-policy, carry/total).
- B: kamerasystem + scrub, demo-video av full skalar-reise.
- C: paneler/kontroller, koblet mot mock-fysikk-stub fra docs/systemkontrakt.md-flaten.
- D: annotasjonslag + enhetstester for etikett-kaskaden (S1) og stats-flip (S2).
- E: motorbinding, mock-stub slettet, K5-grep grønn.
- F: dommerrapport med sitert evidens + tier-beslutning.
