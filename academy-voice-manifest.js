export const ACADEMY_VOICE_PACK_ID = 'control-room-en-us-v1';
export const ACADEMY_VOICE_LOCALE = 'en-US';

const JOBS = new Set(['orient','cue','consequence','recovery']);
const TRIGGERS = new Set(['surface-entry','proof-first','mastery-first','recommendation-first','recovery-offer']);
const EMPHASIS = new Set(['outline','connector','trace','static-label']);
const INTERRUPTS = new Set(['route','foreground-loss','model-input']);
const AUTOMATIC = new Set(['surface-entry','proof-first','mastery-first','recommendation-first']);

export class AcademyVoiceManifestError extends TypeError {
  constructor(cue, rule) {
    super(`Academy voice cue ${cue?.cueId || 'unknown'} failed ${rule}`);
    this.name = 'AcademyVoiceManifestError';
    this.cueId = cue?.cueId || null;
    this.rule = rule;
  }
}

export function countCueWords(text) {
  return String(text || '').match(/[\p{L}\p{N}]+(?:[’'-][\p{L}\p{N}]+)*/gu)?.length || 0;
}

export function cueSignature(cue) {
  return [cue.packId, cue.locale, cue.cueId, cue.contentVersion].join(':');
}

const reject = (cue, rule) => { throw new AcademyVoiceManifestError(cue, rule); };
const plainClone = value => {
  if (typeof value === 'function') throw new TypeError('Academy voice manifests must be plain data');
  if (Array.isArray(value)) return value.map(plainClone);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key,item]) => [key, plainClone(item)]));
  return value;
};
const deepFreeze = value => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.values(value).forEach(deepFreeze); Object.freeze(value);
  }
  return value;
};

export function validateAcademyCue(cue) {
  if (!cue || typeof cue !== 'object' || Array.isArray(cue)) reject(cue, 'plain-object');
  if (typeof cue.cueId !== 'string' || !/^[a-z0-9][a-z0-9.-]+$/i.test(cue.cueId)) reject(cue, 'cue-id');
  if (!Number.isInteger(cue.contentVersion) || cue.contentVersion < 1) reject(cue, 'content-version');
  if (cue.packId !== ACADEMY_VOICE_PACK_ID) reject(cue, 'pack-id');
  if (cue.locale !== ACADEMY_VOICE_LOCALE) reject(cue, 'locale');
  if (!JOBS.has(cue.job)) reject(cue, 'job');
  if (!TRIGGERS.has(cue.trigger)) reject(cue, 'trigger');
  const words = countCueWords(cue.text);
  if (words < 12 || words > 24) reject(cue, 'word-budget');
  if (cue.asset != null && (typeof cue.asset !== 'string' || !/^assets\/audio\/academy\/[a-z0-9/_-]+\.m4a$/i.test(cue.asset)
    || /(?:^|\/)\.\.(?:\/|$)|^(?:[a-z]+:)?\/\//i.test(cue.asset))) reject(cue, 'local-asset');
  if (!Array.isArray(cue.beats) || cue.beats.length < 1 || cue.beats.length > 3) reject(cue, 'beat-count');
  let previous = -1;
  for (const beat of cue.beats) {
    if (!beat || typeof beat.targetId !== 'string' || !/^[a-z][a-z0-9-]*$/i.test(beat.targetId)) reject(cue, 'semantic-target');
    if (!Number.isFinite(beat.atMs) || beat.atMs < 0 || beat.atMs < previous) reject(cue, 'beat-time');
    if (!EMPHASIS.has(beat.emphasis)) reject(cue, 'emphasis');
    previous = beat.atMs;
  }
  if (cue.interruptions != null && (!Array.isArray(cue.interruptions) || cue.interruptions.some(item => !INTERRUPTS.has(item)))) reject(cue, 'interruptions');
  if (cue.job === 'recovery' && cue.autoplay) reject(cue, 'recovery-autoplay');
  if (['prompt','generation','provider','remoteUrl','selector','mastery'].some(key => key in cue)) reject(cue, 'forbidden-field');
  return { valid:true, signature:cueSignature(cue), words, automatic:cue.autoplay !== false && AUTOMATIC.has(cue.trigger) };
}

export function validateAcademyCueSet({ ownerId, cues, maxSignatures = 8 }) {
  if (typeof ownerId !== 'string' || !ownerId) throw new TypeError('Voice cue ownerId is required');
  if (!Array.isArray(cues) || cues.length > maxSignatures) throw new TypeError(`Academy voice owner ${ownerId} exceeds ${maxSignatures} signatures`);
  const ids = new Set(); const signatures = new Set(); const entries = new Set();
  for (const cue of cues) {
    const result = validateAcademyCue(cue);
    if (ids.has(cue.cueId)) reject(cue, 'duplicate-cue-id');
    if (signatures.has(result.signature)) reject(cue, 'duplicate-signature');
    const entryKey = `${cue.surfaceId || ownerId}:${cue.trigger}`;
    if (cue.trigger === 'surface-entry' && cue.autoplay !== false && entries.has(entryKey)) reject(cue, 'duplicate-surface-entry');
    ids.add(cue.cueId); signatures.add(result.signature); if (cue.trigger === 'surface-entry' && cue.autoplay !== false) entries.add(entryKey);
  }
  return { valid:true, ownerId, cueCount:cues.length, signatures:[...signatures] };
}

export function defineAcademyCue(cue) {
  const copy = plainClone(cue); validateAcademyCue(copy); return deepFreeze(copy);
}

export function defineAcademyCueSet(config) {
  const copy = plainClone(config); validateAcademyCueSet(copy);
  return deepFreeze({ ownerId:copy.ownerId, cues:copy.cues.map(defineAcademyCue) });
}
