import test from 'node:test';
import assert from 'node:assert/strict';
import { createAcademyVoiceSync, createVoiceTargetRegistry } from '../academy-voice-sync.js';

test('semantic beat coordinator highlights one registered target at a time', () => {
  const registry = createVoiceTargetRegistry(); const events = []; const timers = [];
  const target = id => ({ setEmphasis:value => events.push(['set',id,value]), clear:() => events.push(['clear',id]) });
  registry.register('face-control', target('face')); registry.register('launch-ray', target('ray'));
  assert.throws(() => registry.register('face-control', target('duplicate')), /Duplicate/);
  const sync = createAcademyVoiceSync({ registry, reducedMotion:() => true, setTimer:(fn,ms) => { timers.push({ fn,ms,cancelled:false }); return timers.at(-1); }, clearTimer:timer => { timer.cancelled=true; } });
  sync.start({ cueId:'x', beats:[{ targetId:'face-control', atMs:0, emphasis:'outline' }, { targetId:'launch-ray', atMs:10, emphasis:'trace' }] });
  timers.filter(timer => !timer.cancelled).sort((a,b) => a.ms-b.ms).forEach(timer => timer.fn());
  assert.ok(events.some(event => event[0] === 'set' && event[1] === 'face' && event[2].kind === 'outline' && event[2].reducedMotion));
  assert.ok(events.some(event => event[0] === 'clear' && event[1] === 'face'));
  assert.ok(events.some(event => event[0] === 'set' && event[1] === 'ray'));
});

test('stop cancels late beats and missing targets only diagnose', () => {
  const registry = createVoiceTargetRegistry(); const timers = []; const diagnostics = [];
  const sync = createAcademyVoiceSync({ registry, setTimer:(fn,ms) => { const timer={fn,ms,cancelled:false}; timers.push(timer); return timer; }, clearTimer:timer => { timer.cancelled=true; }, onDiagnostic:value => diagnostics.push(value) });
  sync.start({ cueId:'missing', beats:[{ targetId:'missing-target', atMs:5, emphasis:'outline' }] });
  timers[0].fn(); assert.equal(diagnostics[0].code, 'target-unavailable');
  sync.start({ cueId:'late', beats:[{ targetId:'missing-target', atMs:5, emphasis:'outline' }] });
  sync.stop(); timers[1].fn(); assert.equal(diagnostics.length, 1);
});
