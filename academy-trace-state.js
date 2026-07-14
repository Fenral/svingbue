// Instrument law 12 (EV-MOT-02/03): the previous state dies like phosphor —
// at most two ghost traces with monotonically falling opacity, drawn only on
// the canvas trace, never on numbers. Under reduced motion the phosphor pair
// collapses to the single static comparison ghost (information, not motion),
// with no decay.
export const MAX_GHOSTS = 2;
export const GHOST_OPACITIES = Object.freeze([0.4, 0.16]);

export function pushSettledTrace(ghosts, settled) {
  if (!settled?.flight) return ghosts;
  return [settled, ...ghosts.filter((ghost) => ghost !== settled)].slice(0, MAX_GHOSTS);
}

export function ghostRenderPlan(ghosts, { reducedMotion = false } = {}) {
  const visible = ghosts
    .filter((ghost) => ghost?.flight)
    .slice(0, reducedMotion ? 1 : MAX_GHOSTS);
  return visible.map((trace, index) => ({
    trace,
    opacity: reducedMotion ? 1 : GHOST_OPACITIES[index],
    dashed: true
  }));
}
