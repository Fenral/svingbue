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
