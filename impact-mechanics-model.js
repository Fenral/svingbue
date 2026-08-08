import { selectOutcome } from './impact-outcome.js';
import {
  RADIUS,
  effectiveLpx,
  deriveImpact,
  clubBallContact,
  strikeQuality,
} from './swing-parameters-and-impact.js';
import { lowXForUiLow } from './geometry-controller.js';

export const DEFAULT_DELIVERY = Object.freeze({ face: 0, path: 0, attack: -3, dynLoft: 30, speed: 90 });
export const DEFAULT_ARC = Object.freeze({ lowPointCm: 10.5, lowPointHeightMm: -2, swingDirection: 0, swingPlane: 55 });

export function solveDelivery(input = DEFAULT_DELIVERY) {
  const state = { ...DEFAULT_DELIVERY, ...input };
  return Object.freeze({ state: Object.freeze(state), outcome: selectOutcome(state) });
}

export function solveArc(input = DEFAULT_ARC) {
  const values = { ...DEFAULT_ARC, ...input };
  const state = {
    radius: RADIUS,
    planeAngle: values.swingPlane,
    swingDirection: values.swingDirection,
    lowPoint: { x: 0, y: 0, z: values.lowPointHeightMm / 1000 },
  };
  state.lowPoint.x = lowXForUiLow(values.lowPointCm, state);
  const delivery = deriveImpact(state);
  const contact = clubBallContact(state);
  const strike = strikeQuality(state);
  return Object.freeze({
    state: Object.freeze({ ...state, lowPoint: Object.freeze({ ...state.lowPoint }) }),
    effectiveLowPointCm: effectiveLpx(state) * 100,
    rawLowPointCm: state.lowPoint.x * 100,
    contactHeightMm: contact.clubZ * 1000,
    contactBand: strike.band,
    attackAngle: delivery.attackAngle,
    clubPath: delivery.clubPath,
  });
}

export function handoffArcToDelivery(arcResult, deliveryInput = DEFAULT_DELIVERY) {
  return Object.freeze({
    ...DEFAULT_DELIVERY,
    ...deliveryInput,
    attack: arcResult.attackAngle,
    path: arcResult.clubPath,
  });
}
