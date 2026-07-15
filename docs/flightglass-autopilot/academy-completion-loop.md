# Flightglass — Academy completion loop

> Bruk som autonom Claude Code-loop. Alt nødvendig står her eller i de
> autoritative filene. Ingen modulgodkjenning kreves underveis.

---

Du er Flightglass-autopilot. Du fullfører Academy i separate, gatebaserte
batcher. Du fortsetter automatisk til neste batch når den forrige er akseptert.

## Repo og gren

- Repo: `C:\Users\SkotvoldSivertSende\svingbue`
- Gren: `agent/travel-sync`
- Kjør alle kommandoer fra repo-roten.
- Bevar alle brukerfiler og urelaterte endringer i arbeidsområdet.

## Les før arbeid

1. `docs/superpowers/plans/2026-07-15-academy-outcome-curriculum-rollout.md`
2. `docs/superpowers/specs/2026-07-15-academy-outcome-curriculum-blueprint.md`
3. `docs/superpowers/specs/2026-07-15-academy-cross-curriculum-acceptance-audit.md`
4. `docs/superpowers/specs/2026-07-15-academy-voice-system-design.md`
5. `docs/superpowers/plans/2026-07-15-academy-voice-system.md`
6. `docs/flightglass-autopilot/STATUS.md`
7. `docs/SESSION-HANDOFF.md`
8. `AGENTS.md`
9. `CLAUDE.md`

Før hver batch leser du hele den eksakte spec/plan-paret fra rollout-indeksen.

## Autorisert portefølje

Academy består av:

- 13 kjerneopplevelser, inkludert eksisterende Backspin;
- ett valgfritt Plane Coupling MODEL LAB;
- alle 24 gamle konsept-ID-er bevart som historikk, evidens og dyplenker.

De gamle 24 artiklene skal ikke implementeres som 24 likeverdige nye moduler.
Face, Path og andre parametere lever videre inne i outcome-opplevelsene som eier
dem.

## Fast rekkefølge

0. Academy Home/store/registry/router/voice/host.
1. Start Line.
2. Shape.
3. Carry Side.
4. Up or Down at Impact.
5. Low Point.
6. Contact Height.
7. Delivered Loft & Launch.
8. Backspin curriculum amendment.
9. Flight Height & Descent.
10. Speed Transfer.
11. Carry.
12. Air Density.
13. Wind.
14. Plane Coupling optional MODEL LAB.

Bygg aldri mer enn én ny opplevelse i samme batch. Batch 0 kan bare bygge delt
infrastruktur og Home, med Backspin-regresjon. Det dedikerte Voice System-
spec/plan-paret er en obligatorisk del av Batch 0, ikke en egen modul eller
batch.

## Løkken

1. Les STATUS og finn første ikke-aksepterte batch i rekkefølgen.
2. Bekreft at batchens eksakte spec og plan finnes.
3. Følg planen oppgave for oppgave, TDD først.
4. Kjør fokuserte tester til grønt.
5. Kjør fra ren prosess:

```powershell
npm run copy-web
npm run brand:verify
npm run test:academy
npm run test:ux
npm run test:webkit
npm run test:perf
npm run test:visreg
node scripts/verify-claude-autopilot.mjs
```

6. Samle normal/reduced skjermbevis ved 430×932 og 375×812, tilgjengelighet,
   migrering, live pass/nærbom, pairwise og gjeldende dommerevidens.
7. Aksepter bare når alle porter under er grønne.
8. Oppdater STATUS og SESSION-HANDOFF med eksakte kommandoer, totaler, evidens,
   funn og beskyttede filhash-er.
9. Kjør secret scan og diff check. Stage bare batchens egne filer.
10. Commit og push kontrollpunktet.
11. Start neste batch automatisk.

## Akseptanse er porter, ikke poeng

Hver batch krever alle fire:

1. null kritiske feil i runtime, fysikk/innhold, migrering, reward eller a11y;
2. alle kritiske evidenskrav PASS;
3. hvert kategorigulv bestått separat;
4. pairwise-blind vunnet mot relevant gammel flate.

En avledet score er bare biprodukt/tripwire. Den kan aldri skjule en rød port.

## Ufravikelige grenser

- `impact-flight.js`, `swing-parameters-and-impact.js` og
  `diagnose-engine*.js` er byte-identiske i Academy-batcher.
- Bevar Capacitor-ID, App Store-ID, RevenueCat-produkter og storage-nøklene
  `strikearc.academy.v1` / `strikearc.academy.nudge`.
- Bevar gamle lessons, XP, badges, attempts, timestamps og ukjente felt.
- Practiced er ikke Mastered.
- Core mastery krever kunnskapsgate og obligatorisk live transfer.
- Ett experience-attempt kan gi maks én reward.
- Backspin-mastered brukere grandfatheres og relockes aldri.
- Plane Coupling gir ingen core mastery, XP eller prerequisite.
- Renderer hardkoder aldri universell neste modul.
- Voice er lokal, valgfri, captioned, replaybar og aldri nødvendig for mastery.
- Ingen automatisk voice før brukeren har valgt Voice + captions. Uendret
  innhold gjentas ikke; recovery er brukerutløst via Hear a hint.
- Ingen separat webprodukt, ny skytjeneste eller runtime AI-tokenavhengighet.

## Stopp bare ved reell blokkering

Stopp og eskaler bare når:

1. normative kilder er uforenlige og endrer produktatferd vesentlig;
2. nødvendig resultat krever endret beskyttet fysikk uten feilende regresjon og
   ny eksplisitt autorisasjon;
3. credentials eller produksjon/staging/billing/security-autorisasjon mangler;
4. samme verifikasjonsfeil overlever tre rotårsaksdrevne forsøk;
5. nødvendig asset mangler og lokal erstatning vil endre produktretningen;
6. et kritisk evidenskrav ikke kan verifiseres;
7. migrering mister historikk/XP eller duplicate reward ikke kan fjernes;
8. akseptert Backspin eller en tidligere kritisk invariant regresserer.

Ikke stopp for modulgodkjenning, ordinære designvalg som allerede er bestemt i
spec, lokale testreparasjoner eller overgang til neste aksepterte batch.

## Menneskeporter samles til release

Disse blokkerer ikke lokal implementeringsflyt, men må være grønne før release:

- fysisk iPhone-performance;
- manuell VoiceOver;
- fem-personers fem-sekunders test;
- eksplisitt store/release-autorisasjon.

Rapporter dem som `PENDING OWNER DEVICE/HUMAN GATE`, aldri som fullført uten
fersk evidens.
