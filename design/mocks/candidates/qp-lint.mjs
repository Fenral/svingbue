#!/usr/bin/env node
// Quiet Phosphor doctrine lint — 09-direction-3 §5 vakt 1, board addendum 1/5.
// Prosa håndhever ikke seg selv; denne gjør. Kjør: node design/mocks/candidates/qp-lint.mjs [fil...]
// Exit 1 ved brudd. Default-mål: qp-prototype.html.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const files = process.argv.slice(2).length ? process.argv.slice(2)
  : [join(here, 'qp-prototype.html')];

// [regex, forklaring]. Emisjonsregelen: lys kommer kun fra data.
const FORBIDDEN = [
  [/backdrop-filter/i, 'glassmorfisme er fjernet (QP §4.4.2)'],
  [/text-shadow/i, 'glød på DOM-tekst er forbudt (QP §4.4.4 — glow=0 i DOM)'],
  [/--secondary\b/, 'violet-tokenet er terminert som identitetsbærer'],
  [/#9D8BFF/i, 'P3-violet skal ikke forekomme'],
  [/#B9A0FF/i, 'P3-loft-lavendel hører ikke hjemme i sesjon 1-flatene (parameter-inks kun ved ko-visning)'],
  [/#FF8A4D/i, 'gammel ember — signalet er re-derivert til #F9A04A (H62)'],
  [/sa-bloom|sa-depth/i, 'depth/bloom-laget er slettet'],
  [/(linear|radial|conic)-gradient/i, 'gradienter er scenografi; elevasjon = g-trinn'],
  [/filter:\s*blur/i, 'blur er forbudt'],
  [/@keyframes|animation:\s*(?!none)/i, 'ingen ambient bevegelse; entry-koreografi = 0 s (animation:none er lovlig RM-kill)'],
];
// box-shadow er kun lovlig som inset dobbel ink-fokusring.
const BOX_SHADOW_OK = /box-shadow:\s*inset 0 0 0 1px rgba\(0,0,0,\.85\), inset 0 0 0 3px var\(--ink\)/;

// Chroma-vakt (grov, hex-basert): violet-familien H240–300 over lav chroma er forbudt i struktur.
// Implementert som eksplisitt hex-blokkliste over kjente P3-hues + generisk sjekk droppet
// (full OKLCH-parsing hører til byggevakten i implementeringsfasen; logget i 12 §2.1).

let fail = 0;
for (const f of files) {
  const src = readFileSync(f, 'utf8');
  const lines = src.split('\n');
  for (const [re, why] of FORBIDDEN) {
    lines.forEach((line, i) => {
      if (re.test(line)) { console.error(`FAIL ${f}:${i + 1} — ${why}\n  ${line.trim().slice(0, 110)}`); fail++; }
    });
  }
  lines.forEach((line, i) => {
    if (/box-shadow/.test(line) && !BOX_SHADOW_OK.test(line)) {
      console.error(`FAIL ${f}:${i + 1} — box-shadow kun lovlig som inset dobbel ink-fokusring\n  ${line.trim().slice(0, 110)}`);
      fail++;
    }
  });
  // Amber-budsjett (statisk tilnærming): tell klasser/attributter som gir amber i RO.
  // .live-forekomster i render-strenger teller per flate; her: sjekk at ingen flate-template
  // har >1 'live' + >1 'btn primary'. Grov, men fanger regresjon.
  const liveCount = (src.match(/'CARRY',true/g) || []).length;
  const primaryPerView = (src.match(/btn primary/g) || []).length;
  if (primaryPerView > 3) { console.error(`FAIL ${f} — flere primærhandlinger enn flater (${primaryPerView})`); fail++; }
  if (liveCount > 3) { console.error(`FAIL ${f} — mer enn ett amber hero-tall per flate`); fail++; }
}
if (fail) { console.error(`\nqp-lint: ${fail} brudd.`); process.exit(1); }
console.log(`qp-lint: PASS (${files.length} fil(er), ${FORBIDDEN.length + 1} regler)`);
