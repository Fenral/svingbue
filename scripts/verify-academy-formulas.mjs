#!/usr/bin/env node
/**
 * FORBIDDEN-FORMULA VERIFIER — Academy content
 *
 * The 3-D spin engine deleted four fitted expressions. Every one of them was
 * taught, by name and with worked numbers, across the Academy corpus. Purging
 * them once is not enough: the strings are short, quotable and easy to
 * reintroduce from memory or from an old mock. This verifier makes the purge a
 * standing gate instead of a one-time sweep.
 *
 * DEAD SIGNATURES (all removed from impact-flight.js):
 *   curve   = carry² · spinAxis / 12000          -> curve now comes from RK4 integration
 *   spinAxis= clamp(1.5·(face − path), ±38°)     -> axis is now exact D-plane geometry
 *   backspin= spinLoft · ballSpeed · 1.8         -> spin is now Penner rolling-at-separation
 *   backspin range 1,500–9,000 rpm               -> the 1500 floor no longer exists
 *
 * SCOPE: shipping Academy content only — academy.html, academy-*-content.js,
 * academy-*-model.js. Deliberately NOT scanned:
 *   - scripts/*.test.mjs   tests legitimately assert the old values are gone
 *   - *-mock.html          design references, not routed
 *   - impact-presentation.html  a declared frozen standalone export
 *
 * Exit 0 = clean. Exit 1 = a dead formula is back in shipping content.
 * Run: node scripts/verify-academy-formulas.mjs
 */
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, basename } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/* Each rule carries the replacement doctrine, so a failure tells the next
   author what to write instead — not just that they are wrong. */
const RULES = [
  {
    id: 'curve-divisor',
    pattern: /\/\s*12000\b/g,
    says: 'the deleted closed-form curve law (carry² · spinAxis / 12000)',
    instead: 'Curve comes from integrating the flight under drag and Magnus lift. There is NO closed-form curve formula in the engine, so no lesson may state one. Teach the behaviour: same axis tilt, longer flight -> disproportionately more curve.',
  },
  {
    id: 'axis-gain',
    /* Both the clamped form and the bare gain — the corpus writes it both ways.
       `clamp\(\s*1\.5` alone was too greedy: the engine's real smash intercept
       is 1.544034…, so `clamp(1.5440 − 0.003379·spinLoft …)` — the CORRECT
       formula — tripped this rule and the gate blocked the fix it was asking
       for. The digit boundary now excludes a longer number, and requireNearby
       keeps the match anchored to axis language. */
    pattern: /clamp\s*\(\s*1\.5(?![0-9])|1\.5\s*[×x·*]\s*\(?\s*(the\s+)?face/gi,
    requireNearby: /axis|face.?to.?path|tilt|curve|sidespin/i,
    says: 'the deleted fitted spin-axis gain (1.5 x face-to-path)',
    instead: 'Spin axis is the tilt of (velocity x faceNormal) from horizontal. Face-to-path sets its direction; loft and attack set how strongly the same gap tilts it.',
  },
  {
    id: 'axis-clamp',
    /* ±38, +/-38, +-38, "engine ceiling 38°", "clamped to 38" — all the same lie. */
    pattern: /±\s*38|\+\/?-\s*38|38\s*°?\s*(ceiling|clamp|cap|max|limit)|clamped\D{0,24}38/gi,
    says: 'the deleted ±38° spin-axis clamp',
    instead: 'There is no axis clamp. The tilt is exact geometry.',
  },
  {
    id: 'spin-product',
    pattern: /spinLoft\s*[×x*·]\s*(f\.)?ballSpeed|\|spinLoft\|\s*[×x*·]\s*ballSpeed/gi,
    says: 'the deleted fitted spin product (spinLoft x ballSpeed x k)',
    instead: 'Total spin is the rolling-at-separation magnitude from club speed and true 3-D spin loft; backspin = totalSpin * cos(spinAxis).',
  },
  {
    id: 'spin-k-constant',
    pattern: /[×x*]\s*1\.8\b(?![\d])/g,
    says: 'the deleted spinK constant 1.8',
    instead: 'The single exposed calibration is spinCal = 1.065 inside the engine. No lesson should quote a spin multiplier.',
    /* 1.8 is a common number; only flag it where the surrounding line also
       talks about spin, so an unrelated 1.8 (a ratio, a scale) does not trip. */
    requireNearby: /spin|backspin|rpm|ballSpeed/i,
  },
  {
    id: 'spin-floor-range',
    pattern: /1,500\s*[-–—]\s*9,000|1500\s*[-–—]\s*9000/g,
    says: 'the deleted 1,500-9,000 rpm range (there is no floor)',
    instead: 'Spin goes continuously to zero with spin loft. Only the 9,000 rpm display ceiling remains.',
  },
  {
    /* Registered BEFORE the landing/apex migration, not after. Smash taught
       the lesson: this gate reported "0 hits" while five literal 1.46 - 0.004
       sat in the file it had just scanned, because nobody had registered the
       corpse. Register first, then migrate — the gate becomes a tripwire
       instead of a promise. */
    id: 'landing-four-term',
    pattern: /45\s*\+\s*\(\s*spinLoft|\(\s*launchAngle\s*[-−]\s*14\s*\)|\(\s*apex\s*[-−]\s*30\s*\)/g,
    says: 'the deleted four-term landing law (45 + (spinLoft−25)·0.5 + (launchAngle−14)·0.6 + (apex−30)·1.0)',
    instead: 'landingRaw = 52.8 − 41.5·exp(−|signedVerticalSpinLoft|/10.9). ONE driver. The engine exposes landingLaunchTerm and landingApexTerm as exactly 0 — launch, apex and club speed do not touch landing angle at all. The curve saturates below 52.8°, so any cited value at or above it (54.35, 57.2, 60) is unreachable by every input. Note this is the one place where signedVerticalSpinLoftDeg IS the operative quantity — unlike spin loft itself, where spinLoft3DDeg is. Do not generalise from that lesson to this one.',
  },
  {
    id: 'apex-saturation-law',
    pattern: /44\s*[·*x×]\s*\(\s*1\s*[-−]\s*e\^|apex_?TAU|apex_?max\s*=\s*44|0\.45\s*[-−–]\s*1\.35/gi,
    says: 'the deleted apex saturation law (44 yd hard ceiling, TAU 85 mph, apexLaunchFactor clamped 0.45–1.35)',
    instead: 'apex = (0.13006·ballSpeed + 0.007999·ballSpeed·launch) · sqrt(clamp(launch/10,0,1)). No saturation and no ceiling: 76.62 yd is reachable at 130 mph club speed with 60° of dynamic loft, 74% above the claimed cap. apexLaunchFactor is an exposed diagnostic ratio (apex ÷ apexBallSpeedTerm), never a clamped input — it measures 3.7997 in that same delivery.',
  },
  {
    /* Added 2026-07-28, after this gate printed "0 hits — no deleted engine
       formula in shipping Academy content" while five literal `1.46 - 0.004`
       sat in the file it had just scanned. Smash was never on the list, so the
       gate certified a false statement — worse than having no gate, because a
       human read the green and believed it.

       The lesson is the denylist's own: it can only catch what somebody
       remembered to add. Adding smash closes today's hole; it does not make the
       list complete. Treat a green result here as "none of the eleven named
       corpses are visible", never as "the content is correct". The executable
       registry in verify-engine-claims.mjs is the mechanism that scales. */
    id: 'smash-linear-law',
    pattern: /1\.46\s*[-−]\s*0\.004|smashEff\s*=\s*clamp\(\s*1\.46/g,
    says: 'the deleted linear smash law (1.46 − 0.004 · spinLoft)',
    instead: 'smashEff = clamp(1.544034400161688 − 0.0033788247838473073·spinLoft − 0.00006496570484201677·spinLoft², 1.15, 1.52). It is quadratic, the ceiling is 1.52 (not 1.42) and is only reached below 6.34° of spin loft, and the 1.15 floor needs 56.1° — unreachable in practice. Note the two laws CROSS near 43°: the dead one reads high below that and low above it, so a stale number can look plausible in either direction.',
  },
  {
    id: 'smash-phantom-ceiling',
    /* 1.42 is only wrong when it is presented as the model's clamp. The bare
       number is a legitimate smash reading, so require nearby clamp language. */
    pattern: /1\.42/g,
    says: 'the deleted 1.42 smash ceiling (the engine clamps at 1.52)',
    instead: 'SMASH_MAX is 1.52 (impact-flight.js:104). A flush iron strike does not sit against the ceiling — the ceiling is only touched below 6.34° of spin loft, which is driver territory.',
    requireNearby: /clamp|ceiling|cap\b|maximum|caps? at|limit/i,
  },
  {
    /* Fifth dead signature, added 2026-07-28. The recalibration replaced the
       saturating power-law carry fit with a monotone quadratic. The old form
       survived the first purge because it lived in content files rather than
       in the engine, and because academy-carry-content.test.mjs asserted it
       was PRESENT — a green gate defending the deleted physics. */
    id: 'carry-power-law',
    pattern: /\^\s*1\.389|\/\s*210\s*\)\s*\^\s*6/g,
    says: 'the deleted saturating carry fit (0.232 · v^1.389 ÷ [1 + (v/210)^6])',
    instead: 'Carry is carryBallSpeedFit = 0.9205937574433162·v + 0.004072298666112809·v², scaled by sqrt(clamp(launch/10,0,1)) below 10° launch. There is no denominator, no saturation and no high-speed rollover — d(carry)/dv is positive for every v ≥ 0 by construction. Teach that each extra mph of ball speed buys MORE carry, not less, and never quote a turnover speed.',
  },

  /* ── PROSE FORMS ──────────────────────────────────────────────────────────
     The rules above catch the formulas as written. They do NOT catch the same
     physics stated in words, which is how most of the corpus actually taught
     it — "grows with carry squared", "every degree adds 1.5° of tilt". A purge
     that only chases symbols leaves the lessons contradicting themselves, with
     a corrected `why` sitting next to an uncorrected `weight`. Found the hard
     way: the first sweep reported clean while four such strings were still live. */
  {
    id: 'quadratic-curve-prose',
    /* Hyphenated and possessive forms escaped the first version of this rule and
       kept four strings alive through two passes. */
    pattern: /carry[\s-]*squared|square\s+of\s+carry|carry'?s?\s*²|carry\s*\^\s*2|quadratic/gi,
    says: 'the deleted quadratic-curve law stated in prose',
    instead: 'Do not reach for the vocabulary at all — naming the square invites the reader to believe it. Teach the behaviour with measured multipliers instead: hold the axis tilt fixed and lengthen the flight, and 1.79x the carry buys 4.34x the curve where multiplying the carry ratio by itself would predict only 3.21x. Proof must be SINGLE-VARIABLE (same club, same gap, same tilt, speed alone) — a cross-club pair moves tilt too and proves nothing.',
    requireNearby: /curve|bend|offline|amplif/i,
    /* Refusing the law is not stating it. Without this, the rule flagged its own
       recommended replacement and every pass that followed the advice failed. */
    exempt: /faster than|more than|outgrows|rather than|not\s+\w*\s*quadratic|never|no closed-form|(would\s+)?predicts?|deleted|refut|understates?/i,
  },
  {
    id: 'axis-gain-prose',
    /* Deliberately narrow: "path +1.5°" is a legitimate delivery value, not the
       gain. Only flag 1.5 where it is being applied TO a gap or produces tilt. */
    pattern: /1\.5\s*°?\s*(of|per)\s+(axis\s+)?tilt|adds?\s+1\.5\s*°|1\.5\s*[×x·]\s*(the\s+)?(face|gap|face-to-path)|tilts?\s+(it\s+)?1\.5\s*°/gi,
    says: 'the deleted 1.5x spin-axis gain stated in prose',
    instead: 'There is no fixed gain. Measured at loft 30: a 2° gap tilts 3.172°, 6° tilts 9.428°, 8° tilts 12.471° — close to but not 1.5x, and loft-dependent (the same 6° gap tilts a loft-11 driver 22.974° but a loft-50 wedge 4.803°).',
    requireNearby: /axis|tilt|spinAxis|face-to-path/i,
  },
  {
    id: 'phantom-cap',
    pattern: /60\s*%\s*of\s+carry|0\.6\s*[·*×]\s*carry|55\s*%\s*of\s+carry/gi,
    says: 'a curve/offline cap that does not exist in the engine',
    instead: 'There is no curve cap and no offline cap. offline = carry*sin(startDirection) + curve, uncapped.',
  },
];

function targets() {
  const files = ['academy.html'];
  for (const name of readdirSync(ROOT)) {
    if (!name.endsWith('.js')) continue;
    if (!name.startsWith('academy-')) continue;
    if (!/-(content|model)\.js$/.test(name)) continue;
    files.push(name);
  }
  return files;
}

function lineOf(text, index) {
  return text.slice(0, index).split('\n').length;
}

const hits = [];
for (const file of targets()) {
  let raw;
  try { raw = readFileSync(join(ROOT, file), 'utf8'); } catch { continue; }

  /* Block comments are blanked before matching, with newlines preserved so the
     reported line numbers stay true. A file that explains WHY it does not use a
     dead formula must be able to name it — academy-flight-height-descent-model.js
     documents exactly that, and tripped this gate for saying so. Third time
     today a checker flagged its own documentation; verify-dialog-inertness.mjs
     carries the same fix and the same reasoning.

     Line comments are left alone on purpose: `//` lives inside URLs and regex
     literals, and blanking them naively would eat real code. The cost is that a
     dead formula hidden in a `//` comment still trips the gate — which is the
     safe direction to be wrong in. */
  const text = raw.replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ''));
  const lines = text.split('\n');
  for (const rule of RULES) {
    rule.pattern.lastIndex = 0;
    let m;
    while ((m = rule.pattern.exec(text)) !== null) {
      const line = lineOf(text, m.index);
      if (rule.requireNearby && !rule.requireNearby.test(lines[line - 1] ?? '')) continue;
      /* Long minified JSON lines: show a window around the hit, not the line. */
      const from = Math.max(0, m.index - 60);
      const excerpt = text.slice(from, m.index + m[0].length + 60).replace(/\s+/g, ' ').trim();
      /* A sentence that names the dead law in order to REJECT it is correct
         teaching, not contamination. Judge the local window, not the whole line. */
      if (rule.exempt && rule.exempt.test(text.slice(Math.max(0, m.index - 90), m.index + m[0].length + 90))) continue;
      hits.push({ file, line, rule, match: m[0], excerpt });
    }
  }
}

if (hits.length === 0) {
  console.log('verify-academy-formulas: 0 hits — no deleted engine formula in shipping Academy content.');
  console.log(`  scanned ${targets().length} file(s) against ${RULES.length} dead signatures.`);
  process.exit(0);
}

console.error(`verify-academy-formulas: ${hits.length} FORBIDDEN FORMULA HIT(S)\n`);
const byRule = new Map();
for (const h of hits) {
  if (!byRule.has(h.rule.id)) byRule.set(h.rule.id, []);
  byRule.get(h.rule.id).push(h);
}
for (const [id, group] of byRule) {
  const { says, instead } = group[0].rule;
  console.error(`── ${id} (${group.length}) — ${says}`);
  console.error(`   TEACH INSTEAD: ${instead}`);
  for (const h of group) {
    console.error(`   ${h.file}:${h.line}  «${h.match}»`);
    console.error(`      …${h.excerpt}…`);
  }
  console.error('');
}
console.error('The engine no longer computes any of the above. Shipping content must not teach them.');
process.exit(1);
