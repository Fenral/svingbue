export function createVoiceTargetRegistry() {
  const targets = new Map();
  return {
    register(id, target) {
      if (typeof id !== 'string' || !id || targets.has(id)) throw new TypeError(`Duplicate or invalid voice target: ${id}`);
      if (!target || typeof target.setEmphasis !== 'function' || typeof target.clear !== 'function') throw new TypeError(`Invalid voice target: ${id}`);
      targets.set(id, target); return () => targets.delete(id);
    },
    unregister(id) { targets.delete(id); },
    resolve(id) { return targets.get(id) || null; },
    clearAll() { for (const target of targets.values()) target.clear(); }
  };
}

export function createAcademyVoiceSync({ registry, reducedMotion = () => false, setTimer = setTimeout, clearTimer = clearTimeout, onDiagnostic = () => {} } = {}) {
  let timers = [];
  let token = 0;
  let current = null;
  const stop = () => {
    token += 1; timers.forEach(clearTimer); timers = []; current?.clear?.(); current = null; registry?.clearAll?.();
  };
  const start = cue => {
    stop(); const run = token;
    for (const beat of [...(cue?.beats || [])].sort((a,b) => a.atMs - b.atMs)) {
      timers.push(setTimer(() => {
        if (run !== token) return;
        current?.clear?.(); current = registry?.resolve?.(beat.targetId);
        if (!current) { onDiagnostic({ code:'target-unavailable', cueId:cue?.cueId, targetId:beat.targetId }); return; }
        current.setEmphasis({ kind:beat.emphasis, reducedMotion:Boolean(reducedMotion()) });
      }, beat.atMs));
    }
    return run;
  };
  const restart = cue => start(cue);
  const destroy = () => stop();
  return { start, stop, restart, destroy };
}
