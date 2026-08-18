import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const EXPECTED_SURFACES = [
  'home-ready', 'onboarding-opening-intro', 'onboarding-live-step-3',
  'onboarding-map-step-4', 'connections', 'range-outcome-default',
  'range-input-change-input', 'range-side', 'range-top', 'studio-face',
  'studio-dtl', 'studio-strike', 'guide-browse', 'guide-answer-backspin',
  'guide-lab', 'paywall', 'support', 'terms', 'privacy'
];

export function loadManifest(file) {
  return JSON.parse(readFileSync(file, 'utf8'));
}

export function validateFixture(fixture, surfaceId = 'surface') {
  const errors = [];
  if (!fixture || typeof fixture !== 'object' || Array.isArray(fixture)) {
    return [`${surfaceId}: fixture is required`];
  }

  const storage = fixture.storage ?? [];
  const actions = fixture.actions ?? [];
  if (!Array.isArray(storage)) errors.push(`${surfaceId}: fixture storage must be an array`);
  if (!Array.isArray(actions)) errors.push(`${surfaceId}: fixture actions must be an array`);

  if (Array.isArray(storage)) {
    storage.forEach((entry, index) => {
      const number = index + 1;
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
        errors.push(`${surfaceId}: fixture storage ${number} must be an object`);
        return;
      }
      if (!['local', 'session'].includes(entry.area)) errors.push(`${surfaceId}: fixture storage ${number} has invalid area`);
      if (typeof entry.key !== 'string' || !entry.key) errors.push(`${surfaceId}: fixture storage ${number} requires a key`);
      if (typeof entry.value !== 'string') errors.push(`${surfaceId}: fixture storage ${number} requires a string value`);
    });
  }

  if (Array.isArray(actions)) {
    actions.forEach((action, index) => {
      const number = index + 1;
      if (!action || typeof action !== 'object' || Array.isArray(action)) {
        errors.push(`${surfaceId}: fixture action ${number} must be an object`);
        return;
      }
      if (!['click', 'wait'].includes(action.type)) {
        errors.push(`${surfaceId}: fixture action ${number} must use click or wait`);
        return;
      }
      if (action.type === 'click' && (typeof action.selector !== 'string' || !action.selector)) {
        errors.push(`${surfaceId}: fixture action ${number} click requires a selector`);
      }
      if (action.type === 'wait' && (!Number.isInteger(action.ms) || action.ms < 0 || action.ms > 5000)) {
        errors.push(`${surfaceId}: fixture action ${number} wait requires 0-5000 integer ms`);
      }
    });
  }
  return errors;
}

export function validateManifest(manifest, root) {
  const errors = [];
  const warnings = [];
  const viewportIds = new Set(Object.keys(manifest.viewports || {}));
  const surfaces = Array.isArray(manifest.surfaces) ? manifest.surfaces : [];
  const ids = surfaces.map((surface) => surface.id);

  if (manifest.version !== 1) errors.push('manifest.version must equal 1');
  if (manifest.brand !== 'Flightglass') errors.push('manifest.brand must equal Flightglass');
  if (new Set(ids).size !== ids.length) errors.push('surface ids must be unique');
  if (ids.join('|') !== EXPECTED_SURFACES.join('|')) {
    errors.push(`surface order must be ${EXPECTED_SURFACES.join(', ')}`);
  }

  for (const [id, viewport] of Object.entries(manifest.viewports || {})) {
    if (!Number.isInteger(viewport.width) || !Number.isInteger(viewport.height)) {
      errors.push(`viewport ${id} must have integer width and height`);
    }
    if (!['portrait', 'landscape'].includes(viewport.orientation)) {
      errors.push(`viewport ${id} has invalid orientation`);
    }
  }

  for (const surface of surfaces) {
    if (!surface.label) errors.push(`${surface.id}: label is required`);
    if (surface.baselineScore !== null && !Number.isFinite(surface.baselineScore)) {
      errors.push(`${surface.id}: baselineScore must be a number or null`);
    }
    if (!Number.isFinite(surface.targetScore) || surface.targetScore < 90) {
      errors.push(`${surface.id}: targetScore must be at least 90`);
    }
    if (!surface.primaryJob) errors.push(`${surface.id}: primaryJob is required`);
    if (!Array.isArray(surface.viewportIds) || surface.viewportIds.length === 0) {
      errors.push(`${surface.id}: viewportIds are required`);
    } else {
      for (const id of surface.viewportIds) {
        if (!viewportIds.has(id)) errors.push(`${surface.id}: unknown viewport ${id}`);
      }
    }
    if (!Array.isArray(surface.requiredSelectors) || surface.requiredSelectors.length === 0) {
      errors.push(`${surface.id}: requiredSelectors are required`);
    }
    if (surface.requiredSelectorsByMotion !== undefined) {
      if (!surface.requiredSelectorsByMotion || typeof surface.requiredSelectorsByMotion !== 'object'
        || Array.isArray(surface.requiredSelectorsByMotion)) {
        errors.push(`${surface.id}: requiredSelectorsByMotion must be an object`);
      } else {
        for (const [motion, selectors] of Object.entries(surface.requiredSelectorsByMotion)) {
          if (!['normal', 'reduced'].includes(motion)) {
            errors.push(`${surface.id}: requiredSelectorsByMotion has invalid mode ${motion}`);
          }
          if (!Array.isArray(selectors) || selectors.some(selector => typeof selector !== 'string' || !selector)) {
            errors.push(`${surface.id}: requiredSelectorsByMotion.${motion} must contain selectors`);
          }
        }
      }
    }
    if (!Array.isArray(surface.references) || surface.references.length === 0) {
      errors.push(`${surface.id}: references are required`);
    }
    errors.push(...validateFixture(surface.fixture, surface.id));

    const routeFile = String(surface.route || '').split(/[?#]/)[0];
    if (!routeFile || !existsSync(resolve(root, routeFile))) {
      errors.push(`${surface.id}: route file does not exist: ${routeFile}`);
    }
    for (const reference of surface.references || []) {
      if (!existsSync(resolve(root, reference))) {
        errors.push(`${surface.id}: reference does not exist: ${reference}`);
      }
    }
    if (surface.sourceType !== 'shipping') {
      errors.push(`${surface.id}: sourceType must equal shipping`);
    }
  }

  return { errors, warnings };
}

export function evaluateSnapshot(snapshot) {
  const critical = [];
  const improvements = [];
  const failedResourceUrls = new Set((snapshot.resourceErrors || []).map((error) => error.url));
  const independentConsoleErrors = (snapshot.consoleErrors || []).filter((error) => {
    const url = typeof error === 'string' ? '' : error.url;
    return !url || !failedResourceUrls.has(url);
  });

  if (!Number.isFinite(snapshot.httpStatus) || snapshot.httpStatus < 200 || snapshot.httpStatus >= 400) {
    critical.push(`HTTP status ${snapshot.httpStatus ?? 'missing'}`);
  }
  if (independentConsoleErrors.length) {
    critical.push(`${independentConsoleErrors.length} console error(s)`);
  }
  if (snapshot.pageErrors?.length) {
    critical.push(`${snapshot.pageErrors.length} page error(s)`);
  }
  if (snapshot.resourceErrors?.length) {
    critical.push(`${snapshot.resourceErrors.length} failed resource request(s)`);
  }
  if ((snapshot.horizontalOverflowPx || 0) > 1) {
    critical.push(`${snapshot.horizontalOverflowPx}px horizontal overflow`);
  }
  if (snapshot.missingSelectors?.length) {
    critical.push(`missing required selector(s): ${snapshot.missingSelectors.join(', ')}`);
  }
  if (snapshot.clippedText?.length) {
    improvements.push(`${snapshot.clippedText.length} potentially clipped text element(s)`);
  }
  if (snapshot.smallTargets?.length) {
    improvements.push(`${snapshot.smallTargets.length} interactive target(s) below 44 px`);
  }

  return { critical, improvements };
}

export function countBlockingFindings(report, mode) {
  if (mode !== 'verify') return 0;
  return report.results.reduce((total, result) =>
    total + result.critical.length + result.improvements.length, 0);
}

export function normalizeResourceErrors(errors = []) {
  const byUrl = new Map();
  for (const error of errors) {
    const existing = byUrl.get(error.url);
    if (!existing || (existing.status === 0 && error.status > 0)) {
      byUrl.set(error.url, error);
    }
  }
  return [...byUrl.values()];
}

export function shouldIgnoreResourceFailure(url = '') {
  try {
    return new URL(url).pathname === '/favicon.ico';
  } catch {
    return false;
  }
}

export function reportFileStem(mode, surfaceIds = []) {
  return surfaceIds.length
    ? `${mode}--${surfaceIds.join('+')}-report`
    : `${mode}-report`;
}

function titleCase(value) {
  return value
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function renderMarkdownReport(report) {
  const lines = [
    '# Flightglass UX audit',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    `Mode: **${report.mode}**`,
    '',
    '| Surface | Viewport | Score target | Critical | Improvements | Evidence |',
    '|---|---|---:|---:|---:|---|'
  ];

  for (const result of report.results) {
    const name = result.label || titleCase(result.surfaceId);
    const baseline = Number.isFinite(result.baselineScore) ? result.baselineScore : 'unscored';
    lines.push(
      `| ${name} | ${result.viewportId} | ${baseline} -> ${result.targetScore} | ${result.critical.length} | ${result.improvements.length} | [screenshot](${result.screenshot}) |`
    );
  }

  lines.push('', '## Findings', '');
  for (const result of report.results) {
    const name = result.label || titleCase(result.surfaceId);
    lines.push(`### ${name} / ${result.viewportId}`, '');
    if (!result.critical.length && !result.improvements.length) {
      lines.push('- No automated findings.');
    } else {
      for (const finding of result.critical) lines.push(`- **Critical:** ${finding}`);
      for (const finding of result.improvements) lines.push(`- Improvement: ${finding}`);
    }
    for (const failure of result.snapshot?.resourceErrors || []) {
      lines.push(`- Evidence: ${failure.status} ${failure.url}${failure.error ? ` (${failure.error})` : ''}`);
    }
    lines.push('');
  }

  return `${lines.join('\n')}\n`;
}
