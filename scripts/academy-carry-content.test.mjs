import test from'node:test';import assert from'node:assert/strict';import{CARRY_CONTENT as C,CARRY_CUES as V}from'../academy-carry-content.js';const all=JSON.stringify(C),words=t=>t.trim().split(/\s+/).length;
test('identity aliases prerequisite and six surfaces are exact',()=>{assert.equal(C.experienceId,'carry');assert.deepEqual(C.conceptIds,['carry','total']);assert.deepEqual(C.prerequisiteExperienceIds,['speed-transfer']);assert.deepEqual(C.surfaces.map(x=>x.id),['mission','range','influence','boundary','mastery','result']);});
test('four knowledge tasks and mandatory equal-Carry transfer are frozen',()=>{assert.equal(C.masteryTasks.length,5);assert.ok(C.masteryTasks.slice(0,4).every(x=>x.kind==='choice'));assert.equal(C.masteryTasks[4].mandatory,true);assert.match(C.masteryTasks[4].prompt,/183\.70–183\.90.*127\.50–127\.75.*8°.*9 yd.*6°.*1\.5 yd/);});
/* Was: 'whole Carry denominator and real-world bridge remain visible', which
   asserted the saturating power-law fit WAS present. That fit was deleted from
   impact-flight.js by the 3-D spin recalibration; carry is now a monotone
   quadratic in ball speed with no denominator and no high-speed rollover. The
   green assertion made this gate protect the wrong physics against correction,
   so it is inverted: the formula must now stay OUT. The real-world bridge is
   still true and is still required. */
test('the deleted power-law Carry fit stays out of shipping content',()=>{assert.doesNotMatch(all,/\^\s*1\.389|\/\s*210\s*\)\s*\^\s*6/,'Dead Carry fit: 0.232 x v^1.389 / [1 + (v/210)^6]. The engine now uses carryBallSpeedFit = 0.9205937574433162*v + 0.004072298666112809*v^2 -- no exponent, no denominator, no rollover, and d(carry)/dv > 0 for all v >= 0 by construction. Teach the behaviour (every extra mph buys MORE carry, not less), never a closed form that no longer exists.');assert.match(all,/launch and spin materially shape Carry.*Ball-Speed-only fitted estimate/i);});
test('seven sheets preserve equal elevation illustrative Total clearance and sources',()=>{assert.deepEqual(Object.keys(C.sheets),['carry','realCarry','total','roll','clearance','equal','sources']);for(const phrase of['equal-elevation','not a turf, slope or stopping prediction','205-yard carry requirement','TrackMan'])assert.match(all,new RegExp(phrase,'i'));});
/* 'more speed shortens' was the fifth myth's claim text, and asserting it kept
   the deleted high-speed turnover alive: the myth taught users to reason about
   a model boundary the recalibration removed. The myth now states the false
   belief and the explanation refutes it from the monotone fit, so the anchor
   moves to the refutation rather than the dead premise. */
test('five myths preserve current fit and physical-boundary truth',()=>{assert.equal(C.myths.length,5);for(const phrase of['Launch and Backspin drive','ball stops','predicts my course','always the useful','starts costing carry'])assert.match(all,new RegExp(phrase,'i'));assert.match(all,/There is no turnover/i);});
test('seven voice cues stay inside shared word and semantic target contracts',()=>{assert.equal(V.cues.length,7);for(const cue of V.cues){assert.ok(words(cue.text)>=12&&words(cue.text)<=24);assert.ok(cue.beats.every(beat=>beat.targetId&&!/[.#\[]/.test(beat.targetId)));}});
test('explanatory copy never fabricates current launch spin environment or course physics',()=>{const positive=JSON.stringify({surfaces:C.surfaces,steps:C.rangeSteps.map(({choices,...x})=>x),stages:C.influenceStages,sheets:C.sheets});assert.doesNotMatch(positive,/optimal launch|spin window bonus|Backspin (drives|changes) current Carry|measured turf roll|predicts (my|your) course|driver simulation|wedge simulation|environment control/i);});
