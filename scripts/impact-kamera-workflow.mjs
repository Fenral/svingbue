export const meta = {
  name: 'impact-kamera',
  description: 'Kjører Økt B–F av design/orders/impact-kamera.md autonomt, med ordrens modellruting og eskaleringsregel.',
  whenToUse: 'Når systemkontrakten er godkjent og Økt B–F skal kjøres uten mikro-godkjenninger.',
  phases: [
    { title: 'B · Kamerasystem', detail: 'Sonnet høy — scrub + projeksjonsblending', model: 'sonnet' },
    { title: 'C · Paneler', detail: 'Sonnet medium — kontroller mot selector-flaten', model: 'sonnet' },
    { title: 'D · Annotasjoner', detail: 'Sonnet høy — måleregler + enhetstester', model: 'sonnet' },
    { title: 'E · Motorbinding', detail: 'Fable — ekte motor + ekstremverdi-policy', model: 'fable' },
    { title: 'F · Dommer', detail: 'Fable fersk kontekst — evidenskrav', model: 'fable' },
  ],
};

// ── Ordrens kjøreregler, kodet ──────────────────────────────────────────────
// - Eneste artefakt som bæres mellom økter (utover koden) er docs/systemkontrakt.md.
// - Ved eskaleringsutløser: økten stopper, og oppgaven kjøres om igjen på Fable.
//   Ordren sier "tilbake til Fable" — det er automatisert her, ikke overlatt til
//   en Sonnet-økt som skal vurdere sin egen kompetansegrense.
// - Dommeren (F) får aldri buildernes kontekst, mål eller score. Egen agent =
//   fersk kontekst per konstruksjon.

const WORKTREE = 'C:/Users/SkotvoldSivertSende/OneDrive - IdrettsKontor/Dokumenter/Golfapp/svingbue-impact-kamera';
const KONTRAKT = 'docs/systemkontrakt.md';
const ORDRE = 'design/orders/impact-kamera.md';
const MOCK = 'design/mocks/impact-kamera.html';

const OKT_SCHEMA = {
  type: 'object',
  required: ['status', 'summary', 'files', 'checks'],
  properties: {
    status: { type: 'string', enum: ['done', 'escalate'] },
    summary: { type: 'string', description: 'Hva som faktisk ble gjort. Ingen løfter, ingen score.' },
    files: { type: 'array', items: { type: 'string' }, description: 'Filer endret/opprettet.' },
    checks: {
      type: 'array',
      description: 'Kontroller som ble kjørt, med ekte resultat. Tom liste hvis ingen ble kjørt.',
      items: {
        type: 'object',
        required: ['cmd', 'result'],
        properties: {
          cmd: { type: 'string' },
          result: { type: 'string', enum: ['pass', 'fail', 'not-run'] },
          detail: { type: 'string' },
        },
      },
    },
    escalation: {
      type: 'object',
      description: 'Kun når status=escalate.',
      properties: { reason: { type: 'string' }, blocking: { type: 'string' } },
    },
    unverified: { type: 'string', description: 'Hva som IKKE er verifisert. Vær eksplisitt.' },
  },
};

const felles = `
ARBEIDSKATALOG (absolutt, bruk den i ALLE fil- og shellkall — cd dit først):
  ${WORKTREE}
Dette er en dedikert git-worktree på gren agent/impact-kamera. Ikke jobb i noen
annen svingbue-mappe; søskenmappene tilhører andre økter.

Repo: svingbue (statisk web-app, ingen bundler). Les FØRST, i denne rekkefølgen:
  1. ${KONTRAKT}  — systemflatene. Bindende. Avvik fra en flate her er en eskaleringsutløser.
  2. ${ORDRE}     — din økts avsnitt + §2 (låste designbeslutninger) + §5 (evidenskrav).
  3. ${MOCK}      — referanse for UI-ATFERD. Mock-fysikken og mockens project() er throwaway.
  4. CLAUDE.md    — repoets kontrollregime. Start-gaten gjelder deg.

Harde grenser:
  - impact-flight.js er skrivebeskyttet (fysikk, CLAUDE.md-låst).
  - swing-parameters-and-impact.js og geo3d/* er urørt (eies av geometry.html).
  - www/* er generert av scripts/copy-web.mjs — aldri håndrediger.
  - Ingen hardkodede fargeverdier i nye filer. Alt via --q-*-tokens.
  - Ingen nye avhengigheter. Ingen bundler.
  - Ikke push. Ikke deploy. Commit lokalt er greit.

Før du redigerer: npm run verify:change -- --dry-run --file <fil> (per planlagt fil).
Etter siste edit: npm run verify:change. Rapporter ekte resultat i checks[] — også fail.
Et grønt tall er ikke bevis for at noe virker. Rapporter unverified[] ærlig.

ESKALERINGSREGEL: hvis du må REDESIGNE tilnærmingen fremfor å implementere den,
eller en flate i ${KONTRAKT} ikke bærer, eller en regel i ordren er tvetydig:
returner status='escalate' med escalation.reason. Ikke gjett. Ikke improviser.
Å stoppe der er riktig svar, ikke en fiasko.
`;

async function kjorOkt({ id, title, model, effort, oppdrag }) {
  const prompt = `${felles}\n\nDU KJØRER: ${title}\n\n${oppdrag}`;

  let r = await agent(prompt, {
    label: `okt-${id.toLowerCase()}`,
    phase: title,
    model,
    effort,
    schema: OKT_SCHEMA,
  });

  if (!r) {
    log(`⚠ Økt ${id}: agenten døde eller ble hoppet over. Stopper kjeden.`);
    return null;
  }

  // Ordren: "Ved eskaleringsutløser: stopp økten, ikke improviser — tilbake til Fable."
  if (r.status === 'escalate') {
    log(`↑ Økt ${id} eskalerte: ${r.escalation?.reason ?? 'ingen grunn oppgitt'} → kjører om på Fable.`);
    const r2 = await agent(
      `${prompt}\n\nDENNE ØKTEN ER ESKALERT. En tidligere kjøring stoppet med:\n` +
        `"${r.escalation?.reason ?? ''}"\n` +
        `Blokkering: "${r.escalation?.blocking ?? ''}"\n\n` +
        `Du har mandat til å løse designspørsmålet det stoppet på, innenfor flatene i ` +
        `${KONTRAKT}. Endrer du en flate i kontrakten: oppdater ${KONTRAKT} i samme slengen ` +
        `og skriv beslutningen inn i beslutningsloggen (§9) med begrunnelse og evidens. ` +
        `Kontrakten skal fortsatt kun inneholde verifiserbar systemvirkelighet — ikke planer.`,
      { label: `okt-${id.toLowerCase()}-fable`, phase: title, model: 'fable', effort: 'high', schema: OKT_SCHEMA },
    );
    if (!r2) return null;
    r = r2;
  }

  const failed = (r.checks ?? []).filter(c => c.result === 'fail');
  log(`✓ Økt ${id}: ${r.files?.length ?? 0} filer, ${(r.checks ?? []).length} kontroller` +
      (failed.length ? `, ${failed.length} FEILET` : ''));
  return r;
}

// ── Kjeden. Sekvensiell: hver økt bygger på forrige økts kode i samme worktree.
const resultater = {};

resultater.B = await kjorOkt({
  id: 'B', title: 'B · Kamerasystem', model: 'sonnet', effort: 'high',
  oppdrag: `Bygg kamerasystemet: impact-camera.js + tegneløkken i impact.html.

Les ${KONTRAKT} §10 — den lister eksakt hva du trenger derfra, punkt for punkt.
Kort: ekte kamerarigg (STATIONS/rigAt/buildBasis/project), orbit rundt scenens
anker, perspektiv→ortho via kontinuerlig orthoK, canvas 2D erstatter #svgDir/
#svgHt/#fScene, verden er meter i Z-up (+X nedslag, +Y høyre, +Z høyde).

Scrub-gest: vertikal drag = kontinuerlig skalar 0–2, snap til nærmeste stasjon
ved slipp. Segmentknapper animerer dit. Oppstart: land i TOP via kamerareise fra
bak ballen (~0,5 s).

Mockens project() (linje 266–272) lerper projiserte 2D-punkter. Det er referanse
for HVOR kameraet står ved hver stasjon, aldri for metoden. Å lerpe projiserte
punkter er utenfor kontrakten.

A11y arves uendret: scenen er aria-hidden="true", #fCarryLive forblir eneste
live-region, etiketter i DOM (ikke i canvas).

Bruker ikke Outcome-selectoren ennå? Da stubber du den i impact-outcome.js med
signaturen fra ${KONTRAKT} §3.3 — Økt E bytter innmaten, ikke flaten.`,
});

if (resultater.B) resultater.C = await kjorOkt({
  id: 'C', title: 'C · Paneler', model: 'sonnet', effort: 'medium',
  oppdrag: `Bygg panelene og kontrollene. Mekanisk port fra mocken — null designskjønn.

Stasjonspaneler med kollaps-grabber, slidere (FACE øverst i TOP, DYN LOFT øverst
i SIDE), outcome-grid med ALL METRICS-toggle og gruppehopp, speed-stepper,
Pin-pill, stats-blokk med flip.

Alle detaljer — ranges, stepper-timing, chip-semantikk, gruppeinndeling — står i
ordren §2. Følg dem bokstavelig.

Les ALLE tall fra selectOutcome(state) i impact-outcome.js. Kall aldri solveFlight
direkte. Multipliser aldri med YD2M. Avvik fra en flate i ${KONTRAKT} er en
eskaleringsutløser — ikke tilpass flaten til koden din.

A11y: dagens impact.html-kontroller har etablerte mønstre — aria-pressed på
toggles, :focus-visible på alt interaktivt, sr-only hjelpetekster, tilstand
aldri båret av farge alene (jf. "off-state is NOT colour-only"). Porten fra
mocken skal BEVARE disse mønstrene, ikke mockens (mocken har ingen). Slidere
er ekte <input type=range> med label, ikke div-er.`,
});

if (resultater.C) resultater.D = await kjorOkt({
  id: 'D', title: 'D · Annotasjoner', model: 'sonnet', effort: 'high',
  oppdrag: `Bygg annotasjonslaget: impact-annotate.js (ren transform → primitiver,
ingen DOM, ingen canvas-kall) + tegning i kalleren. Se ${KONTRAKT} §7.

Hele ordren §3 er din spec. Den er ferdigspesifisert med tallterskler — null
designskjønn tillatt. Er en regel tvetydig: noter det og eskaler. Ikke gjett.

Enhetstester er en del av leveransen, ikke en ettertanke:
  - Etikett-kaskaden (ordren S1): syntetiske geometricaser — kort spenn,
    venstreskudd i mellomsonen, normaltilfelle.
  - Stats-flip (ordren S2): automatisert sveip, ingen oscillering ved terskelen.
Testene ligger i scripts/*.test.mjs og kjøres med node --test (repoets konvensjon).`,
});

if (resultater.D) resultater.E = await kjorOkt({
  id: 'E', title: 'E · Motorbinding', model: 'fable', effort: 'high',
  oppdrag: `Bind mot ekte motor. Implementer impact-outcome.js ferdig per ${KONTRAKT} §3.3:
selectOutcome er eneste kaller av solveFlight og eneste sted yards→meter skjer.

Alle 12 outcome-verdiene finnes allerede i solveFlight — se ${KONTRAKT} §2.3 for
1:1-mappingen. Ingen ny fysikk skal skrives. impact-flight.js er skrivebeskyttet.

Implementer ekstremverdi-policyen fra ${KONTRAKT} §4 nøyaktig som besluttet:
physical.inDomain = (spinLoft > 0). Input klemmes aldri. Motorens interne klemmer
står urørt. Utvid ikke predikatet på eget initiativ.

Slett mock-fysikk-stubben. Verifiser tverrgående korrekthet: samme tall i chip,
annotasjon og stort tall — det er hele poenget med én selector.

Stort tall = CARRY (${KONTRAKT} §6). Total beholdes i mini-raden og
DISTANCE-gruppen. #fCarryLive sin annonseringstekst må si carry.

Kjør K5-grepet: null mock-signaturer igjen i produksjonskode. Rapporter ekte treff.`,
});

// ── F · Dommer. Fersk kontekst per konstruksjon: egen agent, eget prompt.
// Får KUN kontrakten, ordrens §3 + §5, og bygget. Ikke chat-historikk, ikke mål,
// ikke hvem som bygget, ikke en score å sikte mot.
if (resultater.E) {
  log('Alle bygge-økter ferdige. Starter dommer med fersk kontekst.');

  resultater.F = await agent(
    `Du er dommer for Impact-kamera-skjermen i svingbue-repoet. Du har ikke bygget noe av dette.

Du får tre kilder, og bare disse:
  1. ${KONTRAKT} — systemflatene som gjelder.
  2. ${ORDRE} — les KUN §3 (annotasjonssystem) og §5 (evidenskrav). Ignorer resten av filen.
  3. Bygget selv: impact.html, impact-camera.js, impact-outcome.js, impact-annotate.js.

Vurder bygget mot §5 sine krav — K1–K6, S1–S9, G1–G2. Protokollen:

  - Maskinverifiserte krav (grep, unit-tester, instrumentert fps): kjør 1×.
    Rerun gir null informasjon.
  - Dommer-persiperte krav (visuelle audits, skjermopptak): består KUN med sitert
    evidens — konkret frame, skjermbilde eller filreferanse per bestått krav.
    Blindt "ser bra ut" uten evidens = IKKE bestått. Dette er ikke en formalitet.
  - Krav du ikke KAN verifisere i dette miljøet (fysisk iPhone, ekstern testperson):
    marker 'not-verifiable-here' og si hvorfor. Ikke gjett. Ikke anta pass.
  - Enkeltstående funn verifiseres manuelt før de teller.

Leveranseformat, i denne rekkefølgen:
  1. evidenssjekkliste (krav → pass/fail/not-verifiable + sitert evidens)
  2. kritiske defekter
  3. tier: NO-GO / SHIPPBAR / STUDIO-GRADE
  4. avledet score (1–100, kun som vektet sum av beståtte krav)
  5. funn etter alvorlighet
  6. tiltak

Ett kritisk krav feilet = NO-GO, uansett hva summen blir. Et tall overstyrer aldri
en kritisk defekt. Skriv rapporten til docs/impact-kamera-dommerrapport.md.`,
    {
      label: 'okt-f-dommer',
      phase: 'F · Dommer',
      model: 'fable',
      effort: 'high',
      schema: {
        type: 'object',
        required: ['tier', 'score', 'kritiskeDefekter', 'evidens'],
        properties: {
          tier: { type: 'string', enum: ['NO-GO', 'SHIPPBAR', 'STUDIO-GRADE'] },
          score: { type: 'number' },
          kritiskeDefekter: { type: 'array', items: { type: 'string' } },
          evidens: {
            type: 'array',
            items: {
              type: 'object',
              required: ['krav', 'resultat'],
              properties: {
                krav: { type: 'string' },
                resultat: { type: 'string', enum: ['pass', 'fail', 'not-verifiable-here'] },
                sitert: { type: 'string' },
              },
            },
          },
          rapport: { type: 'string' },
        },
      },
    },
  );
}

const f = resultater.F;
if (f) {
  log(`DOM: ${f.tier} (score ${f.score}) — ${f.kritiskeDefekter?.length ?? 0} kritiske defekter.`);
}

return {
  okter: Object.fromEntries(Object.entries(resultater).map(([k, v]) => [k, v?.summary ?? null])),
  dom: f ? { tier: f.tier, score: f.score, kritiske: f.kritiskeDefekter } : null,
  ikkeVerifiserbartHer: (f?.evidens ?? []).filter(e => e.resultat === 'not-verifiable-here').map(e => e.krav),
};
