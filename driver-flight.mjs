/**
 * DRIVER FLIGHT — reference implementation for Flightglass engine extension.
 * Physical 2D point-mass integrator (drag + Magnus lift + spin decay).
 * The launch/spin optimum EMERGES from aero — no fitted ridge.
 *
 * Source tags (per "no constant changes blind"):
 *   ballistics constants (m, d, rho, g)      — SOURCED (physical)
 *   cd0=0.275, cd2=0.686, cl1=2.2,
 *   clmax=0.49, tau=24.2                     — engine-derived (calibrated vs
 *                                              ref:TrackMan optimal launch&spin,
 *                                              AoA 0°, max carry; see harness)
 *   driver preset: smash 1.48                — ref:TrackMan (typical driver)
 *                  spinK 0.93 rpm/(°·mph)    — engine-derived (NOT the 0.6 TODO
 *                                              guess; derived from this model's
 *                                              optimum at 105 mph via
 *                                              spin = spinLoft·ballSpeed·spinK)
 * Acceptance status: 8/9 club speeds inside ±150 rpm / ±1° of ref:TrackMan.
 * v=125 spin sits +178 rpm (28 over tolerance): the emergent locus is flat
 * (~2680 rpm) where TrackMan tilts to ~2500. Closing it needs published
 * Cd/Cl(Re, S) golf-ball tables — Fable work order, not parameter fudging.
 */
export const DRIVER_K = { cd0:0.275, cd2:0.686, cl1:2.2, clmax:0.49, tau:24.167 };
export const DRIVER_PRESET = { smash:1.48, spinK:0.93 };
const LAUNCH_LOFT_W = 0.62, LAUNCH_ATTACK_W = 0.25; // SOURCED (existing engine)

export function carryYd(ballMph, launchDeg, spinRpm, k = DRIVER_K){
  const m = 0.04593, d = 0.04267, A = Math.PI*d*d/4, rho = 1.225, g = 9.81;
  const la = launchDeg*Math.PI/180;
  let vx = ballMph*0.44704*Math.cos(la), vy = ballMph*0.44704*Math.sin(la);
  let x = 0, y = 0, t = 0;
  const r = d/2, dt = 0.01, w0 = spinRpm*2*Math.PI/60;
  while (y >= 0 && t < 15){
    const w = w0*Math.exp(-t/k.tau);
    const sp = Math.hypot(vx, vy), S = w*r/sp;
    const Cd = k.cd0 + k.cd2*S*S, Cl = Math.min(k.clmax, k.cl1*S);
    const q = 0.5*rho*A*sp;
    const ax = (-Cd*q*vx - Cl*q*vy)/m, ay = (-Cd*q*vy + Cl*q*vx)/m - g;
    const vx2 = vx + ax*dt/2, vy2 = vy + ay*dt/2;
    const sp2 = Math.hypot(vx2, vy2), S2 = w*r/sp2;
    const Cd2 = k.cd0 + k.cd2*S2*S2, Cl2 = Math.min(k.clmax, k.cl1*S2);
    const q2 = 0.5*rho*A*sp2;
    x += vx2*dt; y += vy2*dt;
    vx += (-Cd2*q2*vx2 - Cl2*q2*vy2)/m*dt;
    vy += ((-Cd2*q2*vy2 + Cl2*q2*vx2)/m - g)*dt;
    t += dt;
  }
  return x/0.9144;
}

/* Delivery-space entry point, mirrors solveFlight's driver path */
export function solveDriverCarry({ clubSpeed, dynamicLoft, attackAngle = 0 }){
  const ballSpeed = clubSpeed*DRIVER_PRESET.smash;
  const launchAngle = LAUNCH_LOFT_W*dynamicLoft + LAUNCH_ATTACK_W*attackAngle;
  const spinLoft = dynamicLoft - attackAngle;
  const backspin = Math.max(1200, spinLoft*ballSpeed*DRIVER_PRESET.spinK);
  return { ballSpeed, launchAngle, spinLoft, backspin,
           carry: carryYd(ballSpeed, launchAngle, backspin) };
}

/* Optimum = carry-weighted centroid of the plateau (within 0.3 yd of max) */
export function optimalWindow(ballMph, k = DRIVER_K){
  let max = -1; const pts = [];
  for (let a = 7; a <= 19; a += 0.25) for (let s = 1600; s <= 3600; s += 25){
    const c = carryYd(ballMph, a, s, k); pts.push([a, s, c]); if (c > max) max = c;
  }
  let wa = 0, ws = 0, W = 0, sLo = 1e9, sHi = -1e9;
  for (const [a, s, c] of pts) if (c >= max - 0.3){
    const w = c - (max - 0.3); wa += a*w; ws += s*w; W += w;
    if (s < sLo) sLo = s; if (s > sHi) sHi = s;
  }
  return { launch: wa/W, spin: ws/W, spinLo: sLo, spinHi: sHi, carry: max };
}
