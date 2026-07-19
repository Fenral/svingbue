const freeze = value => Object.freeze(value);

export const PERSPECTIVE_GRID_LANES = freeze([-60, -30, 30, 60]);

export const VIEW_PARAMETERS = freeze({
  flight: freeze(['face', 'path', 'dynLoft', 'attack', 'speed']),
  top: freeze(['face', 'path', 'speed']),
  side: freeze(['dynLoft', 'attack', 'speed']),
});

const DEFINITIONS = freeze({
  face: freeze({ key: 'face', label: 'Face angle', chip: 'Face', min: -15, max: 15, step: 0.1, unit: '°' }),
  path: freeze({ key: 'path', label: 'Club path', chip: 'Path', min: -15, max: 15, step: 0.1, unit: '°' }),
  dynLoft: freeze({ key: 'dynLoft', label: 'Dynamic loft', chip: 'Dyn. loft', min: 0, max: 50, step: 0.1, unit: '°' }),
  attack: freeze({ key: 'attack', label: 'Attack angle', chip: 'Attack', min: -15, max: 15, step: 0.1, unit: '°' }),
  speed: freeze({ key: 'speed', label: 'Club speed', chip: 'Speed', min: 30, max: 150, step: 1, unit: ' mph' }),
});

export function stationName(station) {
  const snapped = Math.max(0, Math.min(2, Math.round(Number(station) || 0)));
  return snapped === 0 ? 'flight' : snapped === 1 ? 'side' : 'top';
}

export function parametersForStation(station) {
  return VIEW_PARAMETERS[stationName(station)];
}

export function chooseActiveParameter(view, current) {
  const allowed = VIEW_PARAMETERS[view] || VIEW_PARAMETERS.flight;
  return allowed.includes(current) ? current : allowed[0];
}

export function parameterDefinition(key) {
  const definition = DEFINITIONS[key];
  if (!definition) throw new RangeError(`Unknown Impact parameter: ${key}`);
  return definition;
}

export function formatParameterValue(key, value) {
  const definition = parameterDefinition(key);
  const number = Number(value);
  if (key === 'speed') return `${Math.round(number)}${definition.unit}`;
  const magnitude = Math.abs(number).toFixed(1);
  const sign = key === 'dynLoft' || number === 0 ? '' : number > 0 ? '+' : '−';
  return `${sign}${magnitude}${definition.unit}`;
}
