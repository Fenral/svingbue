const LEVEL_ORDER = Object.freeze({ A: 1, B: 2, C: 3 });
const SECRET_PATTERN = /AKIA[0-9A-Z]{16}|gh[pousr]_[A-Za-z0-9]{30,}|sk_(?:live|test)_[A-Za-z0-9]{16,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|(?:password|client_secret|api[_-]?key|access[_-]?token)\s*[:=]\s*["'][^"']{16,}["']/i;

const SHIPPING_ROUTES = Object.freeze([
  'index.html',
  'impact.html',
  'geometry.html',
  'academy.html'
]);

const CONTROL_FILES = new Set([
  'AGENTS.md',
  '.gitignore',
  'package.json',
  'docs/IMPLEMENTERING-TIL-KONTROLL-PROSESS.md'
]);

const LEVEL_C_PATTERNS = [
  [/^impact-flight\.js$/, 'golf physics'],
  [/^swing-parameters-and-impact\.js$/, 'swing geometry physics'],
  [/^capacitor\.config\.ts$/, 'native application identity'],
  [/^sa-iap\.js$/, 'billing and protected products'],
  [/^codemagic\.ya?ml$/, 'store release workflow'],
  [/^package-lock\.json$/, 'dependency lock'],
  [/^\.github\/workflows\//, 'CI/release workflow'],
  [/^(?:ios|android)\//, 'native platform source'],
  [/^scripts\/(?:copy-web|android-landscape|ios-landscape)\.mjs$/, 'native packaging'],
  [/^\.vercel$/, 'deployment configuration']
];

function normalized(path) {
  return String(path || '').trim().replaceAll('\\', '/').replace(/^\.\//, '');
}

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort();
}

export function containsPotentialSecret(text) {
  return SECRET_PATTERN.test(String(text || ''));
}

export function inspectTextIntegrity(text) {
  const findings = [];
  String(text || '').split(/\r?\n/).forEach((line, index) => {
    if (/[ \t]+$/.test(line)) findings.push({ line: index + 1, reason: 'trailing whitespace' });
    if (/^(?:<<<<<<< |=======|>>>>>>> )/.test(line)) {
      findings.push({ line: index + 1, reason: 'unresolved merge marker' });
    }
  });
  return findings;
}

function routesFor(file) {
  if (file === 'index.html' || file === 'scripts/home-night-ladder.test.mjs'
      || /^assets\/range-night-/.test(file)) return ['index.html'];
  if (file === 'impact.html' || file === 'impact-flight.js') return ['impact.html'];
  if (file === 'swing-parameters-and-impact.js') return ['geometry.html', 'impact.html'];
  if (file === 'geometry.html' || /^geo3d\//.test(file)) return ['geometry.html'];
  if (file === 'academy.html') return ['academy.html'];
  if (/^(?:privacy|terms)\.html$/.test(file)) return [file];
  return [];
}

function analyzeFile(file) {
  for (const [pattern, reason] of LEVEL_C_PATTERNS) {
    if (pattern.test(file)) {
      return { level: 'C', reason, tags: ['milestone'], routes: routesFor(file) };
    }
  }

  if (file === 'scripts/flightglass-browser-spot.mjs') {
    return {
      level: 'B',
      reason: 'cross-browser runtime harness',
      tags: ['browser-gate', 'control-system'],
      routes: []
    };
  }

  if (CONTROL_FILES.has(file)
      || /^scripts\/(?:lib\/)?flightglass-change-gate(?:\.test)?\.mjs$/.test(file)) {
    return {
      level: 'B',
      reason: 'quality-control system',
      tags: ['control-system'],
      routes: []
    };
  }

  if (/^sa(?:-[\w-]+)?\.(?:css|js)$/.test(file)
      || /^assets\/flightglass-/.test(file)) {
    return {
      level: 'B',
      reason: 'shared browser runtime or identity',
      tags: ['browser', 'shared-ui'],
      routes: [...SHIPPING_ROUTES]
    };
  }

  const routes = routesFor(file);
  if (routes.includes('index.html') && routes.length === 1) {
    return {
      level: 'A',
      reason: 'single tested Home surface',
      tags: ['browser'],
      routes
    };
  }
  if (routes.length) {
    return {
      level: 'B',
      reason: 'shipping route without a dedicated contract suite',
      tags: ['browser'],
      routes
    };
  }

  if (/^docs\//.test(file) || /\.md$/i.test(file)) {
    return { level: 'A', reason: 'documentation only', tags: ['documentation'], routes: [] };
  }

  if (/\.html$/i.test(file)) {
    return {
      level: 'B',
      reason: 'browser page without a named risk profile',
      tags: ['browser'],
      routes: [file]
    };
  }

  if (/\.(?:css|js|mjs|ts|json|svg|png|jpe?g|webp)$/i.test(file)) {
    return {
      level: 'B',
      reason: 'unmapped source or asset; fail safe to shared risk',
      tags: ['shared-ui'],
      routes: [...SHIPPING_ROUTES]
    };
  }

  return { level: 'A', reason: 'non-runtime file', tags: [], routes: [] };
}

export function classifyChanges(inputFiles = []) {
  const allFiles = uniqueSorted(inputFiles.map(normalized));
  const ignoredEvidenceFiles = allFiles.filter((file) => file.startsWith('outputs/'));
  const files = allFiles.filter((file) => !file.startsWith('outputs/'));
  const reasons = [];
  const routes = [];
  const tags = [];
  let level = 'A';

  for (const file of files) {
    const analysis = analyzeFile(file);
    if (LEVEL_ORDER[analysis.level] > LEVEL_ORDER[level]) level = analysis.level;
    reasons.push({ file, level: analysis.level, reason: analysis.reason });
    routes.push(...analysis.routes);
    tags.push(...analysis.tags);
  }

  return {
    level,
    files,
    ignoredEvidenceFiles,
    routes: uniqueSorted(routes),
    tags: uniqueSorted(tags),
    reasons
  };
}

export function resolveRequestedLevel(detectedLevel, requestedLevel, options = {}) {
  const detected = String(detectedLevel || '').toUpperCase();
  const requested = requestedLevel ? String(requestedLevel).toUpperCase() : detected;
  if (!LEVEL_ORDER[detected]) throw new Error(`Unknown detected level: ${detectedLevel}`);
  if (!LEVEL_ORDER[requested]) throw new Error(`Unknown requested level: ${requestedLevel}`);

  const downgraded = LEVEL_ORDER[requested] < LEVEL_ORDER[detected];
  const reason = String(options.reason || '').trim();
  if (downgraded && !options.allowDowngrade) {
    throw new Error(`Risk downgrade ${detected} -> ${requested} requires --allow-downgrade and --reason.`);
  }
  if (downgraded && reason.length < 20) {
    throw new Error('A risk downgrade reason must contain at least 20 characters.');
  }

  return {
    detectedLevel: detected,
    effectiveLevel: requested,
    downgraded,
    reason: downgraded ? reason : ''
  };
}

function control(id, bin, args, label) {
  return { id, bin, args, label, display: [bin, ...args].join(' ') };
}

function nodeControl(id, args, label) {
  return control(id, 'node', args, label);
}

function testControl(id, file, label) {
  return nodeControl(id, ['--test', file], label);
}

function browserControl(id, engine, routes) {
  const args = ['scripts/flightglass-browser-spot.mjs', '--engine', engine];
  for (const route of routes) args.push('--route', route);
  return nodeControl(id, args, `${engine} runtime spot`);
}

export function buildCommandPlan(assessment) {
  const level = assessment.effectiveLevel || assessment.level;
  const routes = uniqueSorted(assessment.routes || []);
  const tags = new Set(assessment.tags || []);

  if (level === 'C') {
    return [
      testControl('gate-contract', 'scripts/flightglass-change-gate.test.mjs', 'Risk-gate contract'),
      testControl('home-contract', 'scripts/home-night-ladder.test.mjs', 'Home contract'),
      browserControl('chromium-spot', 'chromium', SHIPPING_ROUTES),
      browserControl('webkit-spot', 'webkit', SHIPPING_ROUTES),
      nodeControl('native-copy', ['scripts/copy-web.mjs'], 'Native web package')
    ];
  }

  if (level === 'A') {
    if (!routes.length) return [];
    return [
      testControl('home-contract', 'scripts/home-night-ladder.test.mjs', 'Home contract'),
      browserControl('chromium-spot', 'chromium', routes)
    ];
  }

  if (level !== 'B') throw new Error(`Unsupported gate level: ${level}`);

  if (tags.has('browser-gate')) {
    return [
      testControl('gate-contract', 'scripts/flightglass-change-gate.test.mjs', 'Risk-gate contract'),
      browserControl('chromium-spot', 'chromium', ['index.html']),
      browserControl('webkit-spot', 'webkit', ['index.html'])
    ];
  }

  if (tags.has('control-system') && !tags.has('browser') && !tags.has('shared-ui')) {
    return [testControl('gate-contract', 'scripts/flightglass-change-gate.test.mjs', 'Risk-gate contract')];
  }

  const selectedRoutes = routes.length ? routes : [...SHIPPING_ROUTES];
  return [
    testControl('home-contract', 'scripts/home-night-ladder.test.mjs', 'Home contract'),
    browserControl('chromium-spot', 'chromium', selectedRoutes),
    browserControl('webkit-spot', 'webkit', selectedRoutes)
  ];
}

export const CHANGE_GATE_LEVELS = Object.freeze({ ...LEVEL_ORDER });
export const CHANGE_GATE_ROUTES = SHIPPING_ROUTES;
