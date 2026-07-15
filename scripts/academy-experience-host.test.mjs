import test from 'node:test';
import assert from 'node:assert/strict';
import { createAcademyExperienceHost } from '../academy-experience-host.js';

function fakeRoot(){return { innerHTML:'', querySelector(){return null;} };}

test('host destroys the previous renderer once and passes cloned state', () => {
  const root=fakeRoot(); let destroyed=0; const received=[];
  const host=createAcademyExperienceHost({ root, renderers:{ demo:input=>{received.push(input);return()=>{destroyed++;};} }, services:{} });
  const state={nested:{value:1}}; const definition={id:'a',title:'A',rendererKey:'demo'};
  host.mount({definition,state}); host.mount({definition,state});
  assert.equal(destroyed,1); assert.notEqual(received[0].state,state); assert.equal(Object.isFrozen(received[0]),true);
  host.destroy(); assert.equal(destroyed,2);
});

test('renderer submits mastery only through the supplied transaction service', () => {
  const root=fakeRoot(); const submitted=[]; let input;
  const host=createAcademyExperienceHost({ root, renderers:{demo:value=>{input=value;}}, services:{submitMastery:value=>submitted.push(value)} });
  host.mount({definition:{id:'a',title:'A',rendererKey:'demo'},state:{},conceptId:'face-angle'});
  input.submitMastery({attemptId:'one'}); assert.deepEqual(submitted,[{attemptId:'one'}]); assert.equal(input.conceptId,'face-angle');
});
