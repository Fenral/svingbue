/**
 * Flightglass Guide — frozen, guided v1 knowledge catalog.
 *
 * This module is intentionally data-only: no network, no free-text parser and
 * no lesson-system dependency. A renderer can navigate the catalog with
 * deterministic topic/question IDs, then bind a permitted lab to the existing
 * Range outcome adapter. Copy distinguishes a modelled relationship from a
 * real-world factor the current engine does not contain.
 */

const freeze = value => Object.freeze(value);
const list = values => freeze([...values]);

function topic(id, title, eyebrow, description, icon) {
  return freeze({ id, title, eyebrow, description, icon });
}

function question({
  id,
  topicId,
  prompt,
  tags,
  shortAnswer,
  bullets,
  truthTier,
  boundary,
  nextAction,
  metricIds,
  lab = null,
  gapClass = 'answer-now',
}) {
  return freeze({
    id,
    topicId,
    prompt,
    tags: list(tags),
    shortAnswer,
    bullets: list(bullets),
    truthTier,
    boundary,
    nextAction,
    metricIds: list(metricIds),
    lab: lab ? freeze({ ...lab, inputIds: list(lab.inputIds), outputIds: list(lab.outputIds) }) : null,
    gapClass,
  });
}

const directionLab = freeze({
  id: 'direction-lens',
  title: 'Test one direction input',
  inputIds: ['face', 'path'],
  outputIds: ['startDirection', 'spinAxis', 'curve', 'side'],
  defaultActiveInput: 'face',
});

const launchSpinLab = freeze({
  id: 'launch-spin-lens',
  title: 'Test one launch input',
  inputIds: ['dynLoft', 'attack', 'speed'],
  outputIds: ['launchAngle', 'spinLoft', 'backspin', 'apex', 'landingAngle'],
  defaultActiveInput: 'dynLoft',
});

const distanceLab = freeze({
  id: 'distance-lens',
  title: 'Test one distance input',
  inputIds: ['speed', 'dynLoft', 'attack'],
  outputIds: ['ballSpeed', 'smash', 'carry', 'total'],
  defaultActiveInput: 'speed',
});

export const GUIDE_TOPICS = list([
  topic('direction', 'Direction', 'Ball flight', 'Where the ball starts and how it bends.', '↗'),
  topic('impact', 'Impact', 'Strike window', 'Low point, contact and the delivery through the ball.', '◎'),
  topic('launch-spin', 'Launch & spin', 'Flight shape', 'Height, descent and the spin relationship in this model.', '◌'),
  topic('distance', 'Distance', 'Speed transfer', 'Ball speed, carry and total distance.', '⌁'),
  topic('conditions', 'Conditions', 'Outside the model', 'Weather and environment need a clearly labelled estimate.', '≈'),
  topic('model-limits', 'Model limits', 'Know the boundary', 'What the current inputs can and cannot establish.', '□'),
]);

export const GUIDE_QUESTIONS = list([
  question({
    id: 'curve-right', topicId: 'direction',
    prompt: 'Why does the ball curve right?', tags: ['curve right', 'fade', 'slice', 'spin axis'],
    shortAnswer: 'In the current Range model, a rightward curve follows a rightward spin axis.',
    bullets: ['Face and path combine to create the launch direction and spin axis.', 'The live curve value describes the modelled lateral bend, not a body movement.', 'A small face or path change can alter both the start and the bend.'],
    truthTier: 'engine-calculated', boundary: 'This explains the modelled ball flight from delivery inputs; it does not identify the swing motion that created them.',
    nextAction: 'Open the face–path model', metricIds: ['faceAngle', 'clubPath', 'spinAxis', 'curve'], lab: directionLab,
  }),
  question({
    id: 'curve-left', topicId: 'direction',
    prompt: 'Why does the ball curve left?', tags: ['curve left', 'draw', 'hook', 'spin axis'],
    shortAnswer: 'In the current Range model, a leftward curve follows a leftward spin axis.',
    bullets: ['The face and path are read together, not as separate verdicts.', 'Start direction and curve are two different outputs.', 'The model updates the lateral bend as either face or path changes.'],
    truthTier: 'engine-calculated', boundary: 'This is a delivery-to-flight relationship only; the model cannot name a personal swing cause.',
    nextAction: 'Compare face and path', metricIds: ['faceAngle', 'clubPath', 'spinAxis', 'curve'], lab: directionLab,
  }),
  question({
    id: 'start-right', topicId: 'direction',
    prompt: 'Why does the ball start right?', tags: ['start right', 'push', 'face angle', 'launch direction'],
    shortAnswer: 'Start direction is mainly set by the delivered face in the current Range model.',
    bullets: ['Face angle has the strongest direct weighting on start direction.', 'Path still contributes, so the two inputs should be read together.', 'The start value is printed in degrees from the target line.'],
    truthTier: 'engine-calculated', boundary: 'The result is a modelled launch direction, not a measurement of alignment or aim.',
    nextAction: 'Move face angle first', metricIds: ['faceAngle', 'clubPath', 'startDirection'], lab: directionLab,
  }),
  question({
    id: 'start-left', topicId: 'direction',
    prompt: 'Why does the ball start left?', tags: ['start left', 'pull', 'face angle', 'launch direction'],
    shortAnswer: 'A delivered face left of target moves the modelled start direction left.',
    bullets: ['Face angle is the primary start-line input.', 'Club path remains visible because it adds a smaller directional influence.', 'Read the start marker before deciding whether the ball also curves.'],
    truthTier: 'engine-calculated', boundary: 'The model does not know where you aimed the club or body at address.',
    nextAction: 'Inspect the start marker', metricIds: ['faceAngle', 'clubPath', 'startDirection'], lab: directionLab,
  }),
  question({
    id: 'start-right-more-right', topicId: 'direction',
    prompt: 'Why does it start right and move farther right?', tags: ['push slice', 'starts right curves right', 'face path', 'right right'],
    shortAnswer: 'The model is showing a rightward start together with a rightward spin axis.',
    bullets: ['The launch marker shows the initial direction.', 'Spin axis and curve show the later bend.', 'Change one delivery input at a time to see which part of the flight moves first.'],
    truthTier: 'engine-derived', boundary: 'This labels the outcome pattern; it does not prove why your delivery arrived there.',
    nextAction: 'Separate start from curve', metricIds: ['startDirection', 'spinAxis', 'curve', 'faceAngle', 'clubPath'], lab: directionLab,
  }),
  question({
    id: 'start-left-more-left', topicId: 'direction',
    prompt: 'Why does it start left and move farther left?', tags: ['pull hook', 'starts left curves left', 'face path', 'left left'],
    shortAnswer: 'The model is showing a leftward start together with a leftward spin axis.',
    bullets: ['Start direction and curve are reported independently.', 'The face controls most of the initial direction in this model.', 'The face–path relationship determines the bending tendency.'],
    truthTier: 'engine-derived', boundary: 'The model cannot separate delivery from setup or identify a movement pattern.',
    nextAction: 'Compare the two direction outputs', metricIds: ['startDirection', 'spinAxis', 'curve', 'faceAngle', 'clubPath'], lab: directionLab,
  }),
  question({
    id: 'start-right-back-left', topicId: 'direction',
    prompt: 'Why does it start right and come back left?', tags: ['push draw', 'starts right curves left', 'draw', 'face path'],
    shortAnswer: 'The model is showing a rightward start with a leftward curve layer.',
    bullets: ['The launch marker is not the same as the landing point.', 'Face and path can produce a start and curve in different directions.', 'Read start, spin axis and curve as one sequence.'],
    truthTier: 'engine-derived', boundary: 'This is a current-input flight explanation, not proof of a repeatable on-course pattern.',
    nextAction: 'Trace the direction sequence', metricIds: ['startDirection', 'spinAxis', 'curve', 'side'], lab: directionLab,
  }),
  question({
    id: 'start-left-back-right', topicId: 'direction',
    prompt: 'Why does it start left and come back right?', tags: ['pull fade', 'starts left curves right', 'fade', 'face path'],
    shortAnswer: 'The model is showing a leftward start with a rightward curve layer.',
    bullets: ['The start marker records launch direction.', 'Curve is a separate lateral outcome.', 'The face and path controls let you test the relationship live.'],
    truthTier: 'engine-derived', boundary: 'The model does not account for impact location on the face or a player’s alignment.',
    nextAction: 'Test face–path separation', metricIds: ['startDirection', 'spinAxis', 'curve', 'side'], lab: directionLab,
  }),
  question({
    id: 'face-path', topicId: 'direction',
    prompt: 'What do face, path and face-to-path mean?', tags: ['face path', 'face to path', 'club path', 'face angle'],
    shortAnswer: 'Face is the delivered face direction; path is the club’s travel direction through impact.',
    bullets: ['The difference between face and path is used to model curvature tendency.', 'Face has the stronger weighting for the initial start direction.', 'Both values are delivery inputs, not judgements of a golf swing.'],
    truthTier: 'engine-derived', boundary: 'This is the engine’s simplified delivery definition; it does not measure every clubhead or ball interaction.',
    nextAction: 'See the live relationship', metricIds: ['faceAngle', 'clubPath', 'startDirection', 'spinAxis'], lab: directionLab,
  }),
  question({
    id: 'face-or-path-first', topicId: 'direction',
    prompt: 'Should I look at face or path first?', tags: ['face or path first', 'start line', 'curve', 'ball flight'],
    shortAnswer: 'Start with where the ball starts, then use face and path together to inspect the curve.',
    bullets: ['Start direction is the clearest first outcome in this model.', 'Face has the stronger start-line role.', 'Path becomes essential when you explain the bending layer.'],
    truthTier: 'engine-derived', boundary: 'This is a reading order for the model, not a universal instruction for changing technique.',
    nextAction: 'Read start before curve', metricIds: ['startDirection', 'faceAngle', 'clubPath', 'spinAxis'], lab: directionLab,
  }),
  question({
    id: 'fat-contact', topicId: 'impact',
    prompt: 'What does a fat strike show?', tags: ['fat shot', 'ground first', 'turf first', 'low point'],
    shortAnswer: 'A ground-first pattern means the low point is modelled behind the ball location.',
    bullets: ['Low point is the lowest part of the club’s arc.', 'The Strike Window shows ball-first or turf-first order from its geometry.', 'Attack and path can move the effective low point in that view.'],
    truthTier: 'geometry-calculated', boundary: 'The geometry view does not measure turf, lie or the actual strike on a clubface.',
    nextAction: 'Open the low-point model', metricIds: ['lowPoint', 'attackAngle', 'clubPath'], gapClass: 'bounded-model',
  }),
  question({
    id: 'thin-contact', topicId: 'impact',
    prompt: 'What does a thin strike show?', tags: ['thin shot', 'top', 'contact height', 'strike window'],
    shortAnswer: 'The Strike Window can show a modelled contact-height relationship at the ball.',
    bullets: ['Contact height describes the point-path height in the geometry view.', 'It is separate from face impact location.', 'Use it with the ball–turf sequence, not as a single verdict.'],
    truthTier: 'geometry-calculated', boundary: 'The current Range engine does not know the exact impact point on the clubface.',
    nextAction: 'Inspect contact height', metricIds: ['contactHeight', 'lowPoint', 'attackAngle'], gapClass: 'bounded-model',
  }),
  question({
    id: 'low-point', topicId: 'impact',
    prompt: 'Where should the club touch the ground?', tags: ['low point', 'ground contact', 'divot', 'entry exit'],
    shortAnswer: 'The geometry model shows where the club arc reaches its lowest point relative to the ball.',
    bullets: ['Ball-first and turf-first are sequence labels, not score labels.', 'Low point remains visible as the four delivery controls change.', 'The rendered contact zone is an amplified explanatory view.'],
    truthTier: 'geometry-calculated', boundary: 'The view is theoretical geometry and cannot predict an exact divot shape or turf response.',
    nextAction: 'Move low point live', metricIds: ['lowPoint', 'entry', 'exit', 'attackAngle'], gapClass: 'bounded-model',
  }),
  question({
    id: 'attack-angle', topicId: 'impact',
    prompt: 'What does a positive or negative attack angle mean?', tags: ['attack angle', 'up at impact', 'down at impact', 'angle of attack'],
    shortAnswer: 'Attack angle describes whether the club is travelling up or down at the ball in the model.',
    bullets: ['Its sign is visible directly in the delivery readout.', 'It contributes to the launch and spin-loft relationship.', 'In the geometry view it also changes the strike sequence.'],
    truthTier: 'engine-derived', boundary: 'The app does not prescribe one personal attack angle for every club or player.',
    nextAction: 'Change attack in the model', metricIds: ['attackAngle', 'spinLoft', 'launchAngle'], lab: launchSpinLab,
  }),
  question({
    id: 'ball-too-high', topicId: 'launch-spin',
    prompt: 'Why does the ball launch too high?', tags: ['too high', 'high launch', 'launch angle', 'dynamic loft'],
    shortAnswer: 'Delivered loft is the strongest direct launch input in the current Range model.',
    bullets: ['Attack angle also contributes to launch angle.', 'The launch and apex readouts update together but are not the same measure.', 'Read the live degrees before deciding what to test.'],
    truthTier: 'engine-calculated', boundary: 'The model cannot determine whether equipment, strike location or wind caused a high real-world flight.',
    nextAction: 'Move delivered loft', metricIds: ['dynamicLoft', 'attackAngle', 'launchAngle', 'apex'], lab: launchSpinLab,
  }),
  question({
    id: 'ball-too-low', topicId: 'launch-spin',
    prompt: 'Why does the ball launch too low?', tags: ['too low', 'low launch', 'launch angle', 'dynamic loft'],
    shortAnswer: 'Lower delivered loft or a different attack angle lowers the modelled launch angle.',
    bullets: ['Dynamic loft has the strongest direct launch weighting.', 'Attack angle remains a material secondary input.', 'Apex is a flight result, so verify launch first.'],
    truthTier: 'engine-calculated', boundary: 'The result does not establish a real strike, lie or club specification.',
    nextAction: 'Inspect launch first', metricIds: ['dynamicLoft', 'attackAngle', 'launchAngle', 'apex'], lab: launchSpinLab,
  }),
  question({
    id: 'ballooning', topicId: 'launch-spin',
    prompt: 'Why does the ball climb and lose distance?', tags: ['ballooning', 'high spin', 'apex', 'lost distance'],
    shortAnswer: 'The model can show a higher launch, apex and backspin relationship, but it does not prove a real-ball cause.',
    bullets: ['Spin loft is derived from delivered loft and attack in the current engine.', 'Backspin is a live output of that delivery relationship.', 'Carry remains an engine output and should be read alongside apex.'],
    truthTier: 'engine-derived', boundary: 'Current carry does not consume the displayed backspin directly, so this is not a proof that spin alone caused lost distance.',
    nextAction: 'Explore launch and spin', metricIds: ['spinLoft', 'backspin', 'launchAngle', 'apex', 'carry'], lab: launchSpinLab,
  }),
  question({
    id: 'dynamic-loft-spin-loft', topicId: 'launch-spin',
    prompt: 'What is dynamic loft and spin loft?', tags: ['dynamic loft', 'spin loft', 'delivered loft', 'backspin'],
    shortAnswer: 'Dynamic loft is delivered loft at impact; spin loft is the angle relationship between delivery and the face.',
    bullets: ['The current engine reports true 3D spin loft from its delivery state.', 'Vertical spin loft is also shown for its signed loft-minus-attack relationship.', 'Changing loft or attack updates the backspin output live.'],
    truthTier: 'engine-derived', boundary: 'The current engine does not offer a validated personal target band for spin loft or backspin.',
    nextAction: 'Run the spin relationship', metricIds: ['dynamicLoft', 'attackAngle', 'spinLoft', 'backspin'], lab: launchSpinLab,
  }),
  question({
    id: 'backspin', topicId: 'launch-spin',
    prompt: 'What changes the modelled backspin?', tags: ['backspin', 'spin rate', 'spin loft', 'rpm'],
    shortAnswer: 'The backspin output changes with the current delivered loft, attack and speed inputs.',
    bullets: ['Spin loft is the central relationship shown by the engine.', 'The model updates rpm as you change the delivery inputs.', 'Use the live delta to understand direction of change, not a universal target.'],
    truthTier: 'engine-calculated', boundary: 'The model excludes ball cover, grooves, moisture, lie and exact strike location.',
    nextAction: 'Try the backspin model', metricIds: ['backspin', 'spinLoft', 'dynamicLoft', 'attackAngle', 'clubSpeed'], lab: launchSpinLab,
  }),
  question({
    id: 'lost-carry', topicId: 'distance',
    prompt: 'Why is carry shorter than expected?', tags: ['lost carry', 'carry distance', 'distance loss', 'ball speed'],
    shortAnswer: 'Carry is a modelled outcome of the current launch, speed and direction state.',
    bullets: ['Ball speed is a direct engine output from club speed and smash.', 'Launch angle contributes to the flight shape used for carry.', 'Read carry and total separately because rollout is a separate result.'],
    truthTier: 'engine-calculated', boundary: 'The model cannot identify a real strike loss, ball condition, temperature or course surface from carry alone.',
    nextAction: 'Compare ball speed and carry', metricIds: ['clubSpeed', 'ballSpeed', 'smash', 'launchAngle', 'carry'], lab: distanceLab,
  }),
  question({
    id: 'ball-speed-smash', topicId: 'distance',
    prompt: 'What do ball speed and smash mean?', tags: ['ball speed', 'smash factor', 'speed transfer', 'club speed'],
    shortAnswer: 'Ball speed is the ball’s speed after impact; smash is the modelled ball-speed-to-club-speed ratio.',
    bullets: ['Club speed is an input and ball speed is an engine output.', 'Smash is a ratio, not a direct measure of centred strike.', 'Carry should be read after speed transfer, not instead of it.'],
    truthTier: 'engine-calculated', boundary: 'The current model does not use smash to determine face impact location or equipment quality.',
    nextAction: 'Move club speed live', metricIds: ['clubSpeed', 'ballSpeed', 'smash', 'carry'], lab: distanceLab,
  }),
  question({
    id: 'carry-total', topicId: 'distance',
    prompt: 'What is the difference between carry and total?', tags: ['carry total', 'rollout', 'distance', 'landing'],
    shortAnswer: 'Carry is distance through the air; total adds the modelled rollout after landing.',
    bullets: ['Carry ends at the landing point.', 'Total is useful only when you keep the model boundary in view.', 'Landing angle gives context for how the shot arrives, not a stopping guarantee.'],
    truthTier: 'engine-calculated', boundary: 'The total estimate does not know the actual turf firmness, slope or wind on your course.',
    nextAction: 'Compare carry and total', metricIds: ['carry', 'total', 'landingAngle', 'apex'], lab: distanceLab,
  }),
  question({
    id: 'altitude-temperature', topicId: 'conditions',
    prompt: 'How do altitude and temperature change distance?', tags: ['altitude', 'temperature', 'air density', 'weather distance'],
    shortAnswer: 'Lower air density can change a flight estimate, but the Range engine does not use live course conditions.',
    bullets: ['Air density is a separate estimate layer, not a hidden Range input.', 'A condition estimate needs clearly stated altitude and temperature.', 'Treat the current Range flight as a controlled reference.'],
    truthTier: 'heuristic-estimate', boundary: 'Without a location, weather source and club-specific validation, the app cannot give a precise on-course yardage adjustment.',
    nextAction: 'See the condition boundary', metricIds: ['carry', 'total', 'altitude', 'temperature'], gapClass: 'external-data',
  }),
  question({
    id: 'wind', topicId: 'conditions',
    prompt: 'How much will wind change this shot?', tags: ['wind', 'headwind', 'tailwind', 'crosswind'],
    shortAnswer: 'Wind can be shown as a labelled estimate, but it is not part of the five-input Range solve.',
    bullets: ['Wind direction and speed need their own explicit inputs.', 'A crosswind estimate sits after the base flight, not inside face and path.', 'Use the base flight first so the added estimate stays legible.'],
    truthTier: 'heuristic-estimate', boundary: 'The app cannot make a precise wind prediction without live conditions, ball data and a validated aerodynamic model.',
    nextAction: 'Read the wind boundary', metricIds: ['carry', 'curve', 'windSpeed', 'windDirection'], gapClass: 'bounded-model',
  }),
  question({
    id: 'gear-effect', topicId: 'model-limits',
    prompt: 'Can the model explain gear effect?', tags: ['gear effect', 'heel toe strike', 'bulge roll', 'driver'],
    shortAnswer: 'Not from the current five inputs alone; gear effect needs strike location and clubhead properties.',
    bullets: ['The shipping Range solve does not receive strike location on the face.', 'Clubhead bulge, roll and centre of gravity are not current inputs.', 'A bounded extension can model this only after those inputs are defined.'],
    truthTier: 'unsupported', boundary: 'Do not use the current face–path answer as a complete explanation of a heel or toe strike.',
    nextAction: 'Inspect model limits', metricIds: ['faceAngle', 'clubPath', 'spinAxis', 'curve'], gapClass: 'bounded-model',
  }),
  question({
    id: 'personal-club-fit', topicId: 'model-limits',
    prompt: 'Which club, shaft or ball is right for me?', tags: ['club fitting', 'shaft', 'golf ball', 'equipment'],
    shortAnswer: 'The current model cannot select equipment because it has no personal strike, delivery or product dataset.',
    bullets: ['The club label is not a separate physics calibration in the Range solve.', 'Equipment recommendations need measured delivery and product specifications.', 'A fitting answer requires external data, not a guessed engine result.'],
    truthTier: 'unsupported', boundary: 'The app should not recommend a club, shaft or ball from the current five inputs.',
    nextAction: 'Read what data a fitting needs', metricIds: ['clubSpeed', 'ballSpeed', 'launchAngle', 'backspin'], gapClass: 'external-data',
  }),
  question({
    id: 'body-fault', topicId: 'model-limits',
    prompt: 'What body movement caused this flight?', tags: ['swing fault', 'body movement', 'drill', 'cause'],
    shortAnswer: 'The current model can relate delivery to flight, but it cannot infer a body movement from a ball flight.',
    bullets: ['Different movements can produce similar face and path numbers.', 'The inverse problem is ambiguous even when a flight pattern looks familiar.', 'A video or motion system would still need a separate interpretation layer.'],
    truthTier: 'unsupported', boundary: 'The app deliberately does not infer a personal swing fault or prescribe a body change from this model.',
    nextAction: 'Trace delivery to flight', metricIds: ['faceAngle', 'clubPath', 'attackAngle', 'curve'], gapClass: 'reject-false-precision',
  }),
  question({
    id: 'personal-target', topicId: 'model-limits',
    prompt: 'What exact launch or spin number should I use?', tags: ['exact target', 'launch target', 'spin target', 'tour number'],
    shortAnswer: 'A single exact target is not supported by the current model without club, ball, strike and performance context.',
    bullets: ['The engine can show how one input changes its outputs.', 'A target band must state its club, ball speed, environment and source.', 'Use the live model for relationships before comparing an external reference.'],
    truthTier: 'external-reference', boundary: 'The app must not present a universal personal target from a five-input flight model.',
    nextAction: 'Explore the relationship', metricIds: ['launchAngle', 'backspin', 'landingAngle', 'clubSpeed'], gapClass: 'reject-false-precision',
  }),
]);

const topicById = new Map(GUIDE_TOPICS.map(entry => [entry.id, entry]));
const questionById = new Map(GUIDE_QUESTIONS.map(entry => [entry.id, entry]));

export function getGuideTopic(id) {
  return topicById.get(id) ?? null;
}

export function getGuideQuestion(id) {
  return questionById.get(id) ?? null;
}

/**
 * Guided filtering only. `tag` is matched against curated tags; it never
 * interprets user-entered prose or calls a remote model.
 */
export function listGuideQuestions({ topicId = null, questionId = null, tag = null } = {}) {
  if (topicId && !topicById.has(topicId)) return [];
  if (questionId) {
    const found = questionById.get(questionId);
    return found && (!topicId || found.topicId === topicId) ? [found] : [];
  }
  const normalizedTag = typeof tag === 'string' ? tag.trim().toLowerCase() : '';
  return GUIDE_QUESTIONS.filter(entry => (
    (!topicId || entry.topicId === topicId)
    && (!normalizedTag || entry.tags.some(candidate => candidate.includes(normalizedTag)))
  ));
}

/**
 * Capability status is intentionally terse for UI routing. It answers whether
 * the Guide can show a deterministic answer now, needs a bounded new model,
 * needs external data, or should refuse false precision.
 */
export function evaluateGuideCapability(questionId) {
  const entry = questionById.get(questionId);
  if (!entry) return freeze({ status: 'unknown', canAdd: false });
  const canAdd = {
    'answer-now': 'now',
    'bounded-model': 'bounded',
    'external-data': 'external',
    'reject-false-precision': 'no',
  }[entry.gapClass];
  return freeze({ status: entry.gapClass, canAdd, truthTier: entry.truthTier, labAvailable: Boolean(entry.lab) });
}
