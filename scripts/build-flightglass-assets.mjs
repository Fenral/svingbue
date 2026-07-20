#!/usr/bin/env node
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as fontkit from 'fontkit';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ASSETS = join(ROOT, 'assets');
const RESOURCES = join(ROOT, 'resources');
const FONT = join(ROOT, 'vendor', 'fonts', 'SpaceGrotesk-Medium.woff2');

const INK = '#07060C';
const GLASS = '#F5F2ED';
const TRACE = '#FF8A4D';
const VIOLET = '#9D8BFF';

mkdirSync(ASSETS, { recursive: true });
mkdirSync(RESOURCES, { recursive: true });

const svg = (viewBox, body, label = 'Flightglass') =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" role="img" aria-label="${label}">${body}</svg>\n`;

function glassPlaneMark({
  a = TRACE,
  b = VIOLET,
  seam = GLASS,
  field = INK,
  point = true,
  micro = false
} = {}) {
  const seamWidth = micro ? 11 : 8;

  return `
  <g fill="none" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="90" cy="90" r="54" fill="${b}"/>
    <path d="M52,129 A54,54 0 0,0 139,68 L52,129 Z" fill="${a}"/>
    <path d="M52,129 L139,68" stroke="${seam}" stroke-width="${seamWidth}" stroke-linecap="butt"/>
    ${point && !micro ? `<circle cx="83" cy="108" r="4.2" fill="${field}" stroke="${seam}" stroke-width="3"/>` : ''}
  </g>`;
}

function outlinedWord(text, emSize = 40, colorOverrides = {}) {
  const font = fontkit.openSync(FONT);
  const run = font.layout(text);
  const scale = emSize / font.unitsPerEm;
  const tracking = 16;
  let cursor = 0;

  const paths = run.glyphs.map((glyph, index) => {
    const position = run.positions[index];
    const x = cursor + position.xOffset + (index === 6 ? 7 : 0);
    const y = position.yOffset;
    cursor += position.xAdvance + tracking;
    const fillAttr = colorOverrides[index] ? ` fill="${colorOverrides[index]}"` : '';
    return `<path d="${glyph.path.toSVG()}" transform="translate(${x.toFixed(2)} ${y.toFixed(2)})"${fillAttr}/>`;
  }).join('');

  return {
    width: cursor * scale,
    group: `<g transform="scale(${scale.toFixed(8)} ${(-scale).toFixed(8)})">${paths}</g>`
  };
}

const word = outlinedWord('flightglass', 40, { 5: TRACE, 9: VIOLET });
const lockupWidth = 72 + word.width;

writeFileSync(
  join(ASSETS, 'logo.svg'),
  svg('0 0 180 180', glassPlaneMark())
);

writeFileSync(
  join(ASSETS, 'flightglass-symbol-light.svg'),
  svg('0 0 180 180', glassPlaneMark({ a: GLASS, b: GLASS, seam: GLASS, field: INK }))
);

writeFileSync(
  join(ASSETS, 'flightglass-symbol-dark.svg'),
  svg('0 0 180 180', glassPlaneMark({ a: INK, b: INK, seam: INK, field: GLASS }))
);

writeFileSync(
  join(ASSETS, 'flightglass-mark-micro.svg'),
  svg('0 0 180 180', glassPlaneMark({ micro: true }), 'Flightglass')
);

writeFileSync(
  join(ASSETS, 'flightglass-wordmark.svg'),
  svg(`0 0 ${word.width.toFixed(2)} 48`,
    `<g fill="${GLASS}" transform="translate(0 34)">${word.group}</g>`)
);

writeFileSync(
  join(ASSETS, 'flightglass-lockup.svg'),
  svg(`0 0 ${lockupWidth.toFixed(2)} 56`, `
  <g transform="translate(-12 -12) scale(.44444444)">${glassPlaneMark()}</g>
  <g fill="${GLASS}" transform="translate(72 40)">${word.group}</g>`)
);

writeFileSync(
  join(RESOURCES, 'icon.svg'),
  svg('0 0 1024 1024', `
  <rect width="1024" height="1024" fill="${INK}"/>
  <g transform="translate(-46 -46) scale(6.2)">${glassPlaneMark()}</g>`)
);

const splashWordScale = 3.2;
const splashWordX = 1366 - (word.width * splashWordScale) / 2;
writeFileSync(
  join(RESOURCES, 'splash.svg'),
  svg('0 0 2732 2732', `
  <rect width="2732" height="2732" fill="${INK}"/>
  <g transform="translate(848.5 622.5) scale(5.75)">${glassPlaneMark()}</g>
  <g fill="${GLASS}" transform="translate(${splashWordX.toFixed(2)} 1650) scale(${splashWordScale})">${word.group}</g>`)
);

console.log('Built Flightglass SVG masters.');
