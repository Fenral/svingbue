/* academy-feature-flags.js — S1: feature-flagg-register for Academy-experiences.
   Ett flagg per experience-id; utelatt id = PÅ (default-on, flagg brukes til å
   holde uferdige flater av). Konsumeres ved mount i experiencen selv. */
export const ACADEMY_FEATURE_FLAGS = Object.freeze({
  'strike-depth': true, /* Contact Height — S1 mønsterbevis, PÅ */
});
export const featureEnabled = id => ACADEMY_FEATURE_FLAGS[id] !== false;
