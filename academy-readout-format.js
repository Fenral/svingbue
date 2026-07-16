// Instrument law 11 (EV-TYPO-03): one formatter owns every visible value —
// U+2212 minus, en-US thousand grouping, unit suffixes. Visible text only:
// accessible names, aria-valuetext and live announcements keep plain
// language because AT punctuation settings may drop U+2212 entirely.
export const MINUS = '−';

const GROUPED = new Intl.NumberFormat('en-US', { maximumFractionDigits: 3 });

export function formatNumber(value) {
  const magnitude = GROUPED.format(Math.abs(value));
  return value < 0 ? `${MINUS}${magnitude}` : magnitude;
}

export function formatValue(value, unit = '') {
  return `${formatNumber(value)}${unit}`;
}

export function formatSigned(value, unit = '') {
  return `${value >= 0 ? '+' : MINUS}${GROUPED.format(Math.abs(value))}${unit}`;
}

// Spoken register (EV-NAT-03): assistive technology gets plain words — the
// sign as "minus" (U+2212 can be dropped by AT punctuation settings) and the
// unit spelled out. Visible text keeps the instrument glyphs above.
const SPOKEN_UNITS = { '°': 'degrees', ' mph': 'miles per hour', ' rpm': 'rpm', ' m': 'metres' };

export function speakValue(value, unit = '') {
  const words = SPOKEN_UNITS[unit] ?? unit.trim();
  const magnitude = GROUPED.format(Math.abs(value));
  return `${value < 0 ? 'minus ' : ''}${magnitude}${words ? ` ${words}` : ''}`;
}
