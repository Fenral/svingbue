import { experienceById, ownerForConcept } from './academy-curriculum.js';

const HOME = Object.freeze({ view:'home', route:'#/academy' });

export function resolveAcademyRoute(hash, { lastSurfaceFor = () => 0 } = {}) {
  const value = typeof hash === 'string' && hash ? hash : '#/academy';
  if (value === '#/academy' || value === '#/path' || value === '#') return { ...HOME };
  if (value === '#/explore') return { view:'explore', route:'#/explore' };
  const legacy = value.match(/^#\/lesson\/([a-z0-9-]+)$/i);
  if (legacy) {
    const conceptId = legacy[1];
    const experienceId = ownerForConcept(conceptId);
    if (experienceId) return { view:'experience', experienceId, conceptId, surface:Math.min(5, Math.max(0, Number(lastSurfaceFor(experienceId)) || 0)), legacy:true };
    return { ...HOME, invalidHash:value, announcement:'That Academy lesson is not available.' };
  }
  const canonical = value.match(/^#\/experience\/([a-z0-9-]+)(?:\/surface\/([^/]+))?$/i);
  if (canonical) {
    const experienceId = canonical[1];
    if (!experienceById(experienceId)) return { ...HOME, invalidHash:value, announcement:'That Academy experience is not available.' };
    const requested = canonical[2];
    const surface = requested === undefined ? Number(lastSurfaceFor(experienceId)) || 0 : Number(requested);
    if (!Number.isInteger(surface) || surface < 0 || surface > 5) return { ...HOME, invalidHash:value, announcement:'That Academy surface is not available.' };
    return { view:'experience', experienceId, conceptId:null, surface, legacy:false };
  }
  return { ...HOME, invalidHash:value, announcement:'Academy returned to Home because that route was not recognized.' };
}

export function canonicalExperienceRoute(experienceId, surface) {
  if (!experienceById(experienceId)) return '#/academy';
  return Number.isInteger(surface) && surface >= 0 && surface <= 5
    ? `#/experience/${experienceId}/surface/${surface}` : `#/experience/${experienceId}`;
}
