import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PERSPECTIVE_GRID_LANES,
  VIEW_PARAMETERS,
  chooseActiveParameter,
  formatParameterValue,
  parameterDefinition,
  parametersForStation,
  stationName,
} from '../impact-controls.js';

test('Flight owns a symmetric longitudinal ground grid', () => {
  assert.deepEqual(PERSPECTIVE_GRID_LANES, [-60, -30, 30, 60]);
});

test('owner-approved parameter matrix is exact', () => {
  assert.deepEqual(VIEW_PARAMETERS.flight, ['face', 'path', 'dynLoft', 'attack', 'speed']);
  assert.deepEqual(VIEW_PARAMETERS.top, ['face', 'path', 'speed']);
  assert.deepEqual(VIEW_PARAMETERS.side, ['dynLoft', 'attack', 'speed']);
  assert.deepEqual(parametersForStation(0), VIEW_PARAMETERS.flight);
  assert.deepEqual(parametersForStation(2), VIEW_PARAMETERS.top);
  assert.deepEqual(parametersForStation(1), VIEW_PARAMETERS.side);
});

test('station names preserve the camera scalar contract', () => {
  assert.equal(stationName(0), 'flight');
  assert.equal(stationName(1), 'side');
  assert.equal(stationName(2), 'top');
  assert.equal(stationName(1.51), 'top');
});

test('active input survives a lens change only when that lens allows it', () => {
  assert.equal(chooseActiveParameter('top', 'speed'), 'speed');
  assert.equal(chooseActiveParameter('side', 'attack'), 'attack');
  assert.equal(chooseActiveParameter('side', 'face'), 'dynLoft');
  assert.equal(chooseActiveParameter('top', 'dynLoft'), 'face');
});

test('all five controls bind directly to the single shot state', () => {
  assert.deepEqual(parameterDefinition('face'), {
    key: 'face', label: 'Face angle', chip: 'Face', min: -15, max: 15, step: 0.1, unit: '°'
  });
  assert.deepEqual(parameterDefinition('path'), {
    key: 'path', label: 'Club path', chip: 'Path', min: -15, max: 15, step: 0.1, unit: '°'
  });
  assert.deepEqual(parameterDefinition('dynLoft'), {
    key: 'dynLoft', label: 'Dynamic loft', chip: 'Dyn. loft', min: 0, max: 50, step: 0.1, unit: '°'
  });
  assert.deepEqual(parameterDefinition('attack'), {
    key: 'attack', label: 'Attack angle', chip: 'Attack', min: -15, max: 15, step: 0.1, unit: '°'
  });
  assert.deepEqual(parameterDefinition('speed'), {
    key: 'speed', label: 'Club speed', chip: 'Speed', min: 30, max: 150, step: 1, unit: ' mph'
  });
});

test('truth formatting uses tabular-friendly values and a real minus sign', () => {
  assert.equal(formatParameterValue('face', 2), '+2.0°');
  assert.equal(formatParameterValue('attack', -3.2), '−3.2°');
  assert.equal(formatParameterValue('dynLoft', 24), '24.0°');
  assert.equal(formatParameterValue('speed', 130), '130 mph');
  assert.doesNotMatch(formatParameterValue('path', -2), /-/);
});
