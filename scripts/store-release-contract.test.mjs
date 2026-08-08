import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = relativePath => readFileSync(join(ROOT, relativePath), 'utf8');

function codeBlockAfter(markdown, heading) {
  const start = markdown.indexOf(heading);
  assert.notEqual(start, -1, `missing heading: ${heading}`);
  const remainder = markdown.slice(start + heading.length);
  const nextHeading = remainder.search(/\r?\n#{1,6}\s/);
  const headingSection = remainder.slice(0, nextHeading < 0 ? remainder.length : nextHeading);
  const match = headingSection.match(/```text\r?\n([\s\S]*?)\r?\n```/);
  assert.ok(match, `missing text block after: ${heading}`);
  return match[1].trim();
}

function tableCells(line) {
  return line.split('|').slice(1, -1).map(cell => cell.trim());
}

async function assertImage(relativePath, width, height, { opaque = false } = {}) {
  const path = join(ROOT, relativePath);
  assert.equal(existsSync(path), true, `${relativePath} is missing`);
  const metadata = await sharp(path).metadata();
  assert.equal(metadata.width, width, `${relativePath} width`);
  assert.equal(metadata.height, height, `${relativePath} height`);
  if (opaque) {
    assert.equal(metadata.hasAlpha, false, `${relativePath} must not contain alpha`);
    assert.equal(metadata.channels, 3, `${relativePath} must be opaque RGB`);
  }
}

test('the public support surface covers purchase recovery and local-data rights', () => {
  const support = read('support.html');
  assert.match(support, /<title>Support\s*[—-]\s*Flightglass<\/title>/);
  assert.match(support, /Restore purchases/i);
  assert.match(support, /cancel a subscription/i);
  assert.match(support, /Deleting Flightglass does not cancel an active subscription/i);
  assert.match(support, /local preferences stay on the device/i);
  assert.match(support, /href="\.\/terms\.html"/);
  assert.match(support, /href="\.\/privacy\.html"/);
  assert.match(support, /href="mailto:[^"?\s]+@[^"?\s]+(?:\?[^"\s]*)?"/i);
});

test('the store pack describes current v1 without claiming Academy or an Android release', () => {
  const listing = read('docs/store-listing.md');
  assert.match(listing, /Outcome model/i);
  assert.match(listing, /Mechanics Lab/i);
  assert.match(listing, /Flightglass Guide/i);
  assert.match(listing, /marketing landing page is deferred/i);
  assert.match(listing, /Android remains a separate release track/i);
  assert.match(listing, /https:\/\/svingbue\.vercel\.app\/support\.html/);
  assert.doesNotMatch(listing, /Impact Studio/i);
  assert.doesNotMatch(listing, /24 lessons|Academy is included|signed Android release/i);
});

test('the release record names the exact evidence sink and a recoverable web baseline', () => {
  const record = read('docs/v1-release-record.md');
  const packageManifest = JSON.parse(read('package.json'));
  const ignore = read('.gitignore');
  assert.match(record, /release execution record is[\s\S]*GitHub PR #19/i);
  assert.match(record, /inherited[\s\S]*GitHub PR #18/i);
  assert.match(record, /3abbd4fcc65c939cc2d0e35ea03866add3540aa5/);
  assert.match(record, /c47113bb23a3fb274277fe869dea925a6fa0a928/);
  assert.doesNotMatch(record, /canonical exact-SHA record is[\s\S]{0,100}GitHub PR #18/i);
  assert.match(record, /final exact candidate SHA[\s\S]*PR #19 body[\s\S]*immutable evidence attestations/i);
  assert.match(record, /Mechanics Lab/);
  assert.match(record, /Range plus Phase 2: latest 67\/67/);
  assert.match(record, /release-evidence contracts: 204\/204/);
  assert.match(record, /full 40-character candidate commit/);
  assert.match(record, /Flightglass v1 release gate/);
  assert.match(record, /184140a2ff5834f23510662f8c442b8a8c03d36c/);
  assert.match(record, /dpl_BKJgyzjJWn1QtSFrtgFGKS7b69dv/);
  assert.match(record, /npm audit --prefix tools --audit-level=high/);
  assert.match(record, /clean checkout whose `HEAD` equals the PR head/);
  assert.match(record, /`pull_request` GitHub release-gate run[\s\S]*same PR base\s+and head SHAs/);
  assert.match(record, /flightglassCandidateSha=<40-char SHA>/);
  assert.match(record, /v13 deployment\s+API/);
  assert.match(record, /VERCEL_TOKEN/);
  assert.match(record, /VERCEL_AUTOMATION_BYPASS_SECRET/);
  assert.match(record, /authenticated, read-only\s+`vercel curl` checks/);
  assert.match(record, /prj_ghY32ypKS3kXfmTM3BCRzfl5ptqC/);
  assert.match(record, /--deploy[\s\S]*--confirm-preview-deploy <same-full-candidate-sha>/);
  assert.match(record, /--verify[\s\S]*--deployment-id <dpl_id>[\s\S]*--url <https:\/\/exact-preview\.vercel\.app>/);
  assert.match(record, /never passes `--prod`, `--target production`,\s+`--skip-domain`, `promote` or a token on the command line/);
  assert.match(record, /`\/codemagic\.yaml`[\s\S]*`\/package\.json`[\s\S]*`\/vercel\.json`[\s\S]*`\/scripts\/store-screenshots\.mjs`[\s\S]*`\/academy\.html`[\s\S]*`\/geometry\.html`[\s\S]*return 404/);
  assert.match(record, /outputs\/release-evidence\/vercel-preview/);
  assert.match(ignore, /^outputs\/release-evidence\/vercel-preview\/$/m);
  assert.equal(packageManifest.scripts['verify:v1:vercel-preview'], 'node scripts/vercel-preview-evidence.mjs');
  assert.match(packageManifest.scripts['test:release-evidence'], /vercel-preview-evidence\.test\.mjs/);
  assert.match(record, /public alias without Vercel authentication/);
  assert.match(record, /Merging `main` does not publish it/);
  assert.match(record, /Do not force-push or reset/);
  assert.match(record, /SOURCE CANDIDATE IN PROGRESS/);
  assert.match(record, /Gates that remain external/);
  assert.match(record, /Preview status[\s\S]*`PENDING`/i);
  assert.match(record, /neither `VERCEL_TOKEN` nor `VERCEL_AUTOMATION_BYPASS_SECRET`/i);
  assert.match(record, /One consolidated owner authorization[\s\S]*merge to `main`[\s\S]*App Store submission/i);
});

test('physical-iPhone evidence uses an immutable template and external attested working copy', () => {
  const checklist = read('docs/phase2-phone-checklist.md');
  const releaseRecord = read('docs/v1-release-record.md');
  const ignore = read('.gitignore');

  assert.match(checklist, /^Status:\s*\*\*PENDING/m);
  assert.match(checklist, /immutable `PENDING` template/i);
  assert.match(checklist, /outputs\/release-evidence\/phone/);
  assert.match(checklist, /--file\s+"\$phoneEvidenceRoot\/phone-release-evidence\.md"/);
  assert.match(checklist, /--evidence-root\s+\$phoneEvidenceRoot/);
  assert.match(checklist, /flightglass-phone-evidence-attestation-<candidate>-v<version>-b<build>\.json/);
  assert.match(checklist, /refuses to overwrite an existing attestation/i);
  assert.match(checklist, /SHA-256 payload binds the candidate, build,\s+verified GitHub run/i);
  assert.match(checklist, /link all three from PR #\d+/i);

  assert.match(releaseRecord, /immutable\s+`PENDING`\s+templates?/i);
  assert.match(releaseRecord, /--file <evidence-root>\/phone-release-evidence\.md/);
  assert.match(releaseRecord, /--evidence-root <evidence-root>/);
  assert.match(releaseRecord, /flightglass-phone-evidence-attestation-<candidate>-v<version>-b<build>\.json/);
  assert.match(releaseRecord, /cannot overwrite an earlier attestation/i);
  assert.match(releaseRecord, /completed record,\s+media\/logs\s+and attestation\s+remain external to the candidate/i);
  assert.match(releaseRecord, /linked in PR #19 before release\s+authorization/i);
  assert.match(ignore, /^outputs\/release-evidence\/phone\/$/m);
});

test('moderated onboarding evidence uses an immutable external attested working copy', () => {
  const checklist = read('docs/phase2-onboarding-uat.md');
  const releaseRecord = read('docs/v1-release-record.md');
  const ignore = read('.gitignore');

  assert.match(checklist, /immutable `PENDING` template/i);
  assert.match(checklist, /outputs\/release-evidence\/onboarding/);
  assert.match(checklist, /--file "\$flightglassEvidenceRoot\/onboarding-uat\.md"/);
  assert.match(checklist, /--evidence-root \$flightglassEvidenceRoot/);
  assert.match(checklist, /JSON attestation and matching `.sha256` checksum/i);
  assert.match(releaseRecord, /verify:v1:onboarding-evidence[\s\S]*--file <evidence-root>\/onboarding-uat\.md/);
  assert.match(releaseRecord, /onboarding-<candidate>-<build>\.attestation\.json/);
  assert.match(releaseRecord, /timing report that records the inner control's result and\s+duration/i);
  assert.doesNotMatch(releaseRecord, /verify:change[^`\n]*--no-report/);
  assert.match(ignore, /^outputs\/release-evidence\/onboarding\/$/m);
});

test('Apple metadata fits store field limits and retains every purchase credential gate', () => {
  const listing = read('docs/store-listing.md');
  const reviewNotes = read('docs/app-review-notes.md');
  const phoneChecklist = read('docs/phase2-phone-checklist.md');

  assert.ok([...codeBlockAfter(listing, '### Name')].length <= 30, 'App name exceeds 30 characters');
  assert.ok([...codeBlockAfter(listing, '### Subtitle')].length <= 30, 'Subtitle exceeds 30 characters');
  assert.ok([...codeBlockAfter(listing, '### Promotional text')].length <= 170, 'Promotional text exceeds 170 characters');
  assert.ok([...codeBlockAfter(listing, '### Description')].length <= 4000, 'Description exceeds 4000 characters');
  assert.ok(Buffer.byteLength(codeBlockAfter(listing, '### Keywords'), 'utf8') <= 100, 'Keywords exceed 100 bytes');

  const listingWithoutNameBlock = listing.replace(
    /(### Name\r?\n\r?\n)```text\r?\n[\s\S]*?\r?\n```/,
    '$1',
  );
  assert.throws(
    () => codeBlockAfter(listingWithoutNameBlock, '### Name'),
    /missing text block/,
    'a missing Name block must not silently validate the Subtitle block',
  );

  for (const productId of ['strikearc_pro_monthly', 'strikearc_pro_annual']) {
    const line = listing.split(/\r?\n/).find(candidate => tableCells(candidate)[0] === `\`${productId}\``);
    assert.ok(line, `${productId} metadata row is missing`);
    const [, , displayName, description] = tableCells(line);
    assert.ok([...displayName].length <= 30, `${productId} display name exceeds 30 characters`);
    assert.ok([...description].length <= 45, `${productId} description exceeds 45 characters`);
  }

  for (const source of [listing, reviewNotes, phoneChecklist]) {
    assert.match(source, /In-App Purchase Key/i);
    assert.match(source, /Key ID/i);
    assert.match(source, /Issuer ID/i);
  }
  for (const source of [listing, reviewNotes]) {
    assert.match(source, /App\s+Review Screenshot/i);
    assert.match(source, /subscription group/i);
  }
  assert.match(reviewNotes, /Digital Services Act/i);
  assert.match(reviewNotes, /support\.html` returns 404/i);
  assert.match(reviewNotes, /merging `main` does not deploy/i);
  assert.match(reviewNotes, /GitHub Pages Academy gallery/i);
  assert.match(phoneChecklist, /public Support URL over HTTPS/i);
  assert.match(phoneChecklist, /npm run verify:v1:phone-evidence/);
  assert.doesNotMatch(phoneChecklist, /Open Support, Privacy and Terms from the native/i);

  assert.match(listing, /first subscription group must ship with a new app version/i);
  assert.match(listing, /1290\s*\u00d7\s*2796/i);
  assert.match(listing, /opaque PNG or\s+JPEG\/JPG files with no alpha/i);
  assert.match(reviewNotes, /exact TestFlight build[\s\S]{0,120}sandbox environment/i);
  assert.match(reviewNotes, /never restores automatically on\s+launch/i);
});

test('the committed store gallery contains exactly five current upload candidates', async () => {
  for (let number = 1; number <= 5; number += 1) {
    const name = String(number).padStart(2, '0');
    await assertImage(`appstore/${name}.png`, 1290, 2796, { opaque: true });
    await assertImage(`appstore/play/${name}.png`, 1080, 1920, { opaque: true });
  }
  await assertImage('appstore/feature-graphic.png', 1024, 500, { opaque: true });

  for (let number = 6; number <= 9; number += 1) {
    const name = String(number).padStart(2, '0');
    assert.equal(existsSync(join(ROOT, 'appstore', `${name}.png`)), false,
      `legacy appstore/${name}.png must not remain an upload candidate`);
  }

  const gallery = read('appstore/index.html');
  const generator = read('scripts/store-screenshots.mjs');
  const onboardingGenerator = read('scripts/capture-onboarding-visuals.mjs');
  assert.doesNotMatch(gallery, /StrikeArc|Academy|24 lessons/i);
  assert.doesNotMatch(generator, /route:\s*['"](?:academy|geometry)\.html['"]/i);
  for (const route of ['index.html', 'impact.html', 'impact-studio.html', 'jarvis.html']) {
    assert.match(generator, new RegExp(route.replace('.', '\\.')));
  }

  const ids = [...generator.matchAll(/id:\s*'([^']+)'/g)].map((match) => match[1]);
  assert.deepEqual(ids.slice(0, 5), ['outcome', 'studio', 'guide', 'home', 'onboarding']);
  for (const [name, source] of [
    ['store screenshot generator', generator],
    ['onboarding capture generator', onboardingGenerator],
  ]) {
    const studio = source.match(/id:\s*['"]studio['"][\s\S]{0,400}?ready:\s*['"]([^'"]+)['"]/);
    assert.ok(studio, `${name} must declare a Studio compatibility capture`);
    assert.equal(studio[1], 'main.mechanics', `${name} waits for the stable Mechanics root`);
  }
  assert.match(generator, /eyebrow:\s*['"]MECHANICS LAB['"]/);
  assert.doesNotMatch(generator, /eyebrow:\s*['"]IMPACT STUDIO['"]/);
});

test('public support and legal pages respect safe areas and retain 44px navigation targets', () => {
  for (const page of ['support.html', 'privacy.html', 'terms.html']) {
    const source = read(page);
    assert.match(source, /viewport-fit=cover/, `${page} opts into safe-area viewport fitting`);
    assert.match(source, /(?:\.top|header\.top)\s*\{[\s\S]*?safe-area-inset-top[\s\S]*?safe-area-inset-right[\s\S]*?safe-area-inset-bottom[\s\S]*?safe-area-inset-left/, `${page} header protects every safe edge`);
    assert.match(source, /main\s*\{[\s\S]*?safe-area-inset-top[\s\S]*?safe-area-inset-right[\s\S]*?safe-area-inset-bottom[\s\S]*?safe-area-inset-left/, `${page} content protects every safe edge`);
    assert.match(source, /footer(?:\.page-foot)?\s*\{[\s\S]*?safe-area-inset-right[\s\S]*?safe-area-inset-bottom[\s\S]*?safe-area-inset-left/, `${page} footer protects side and home-indicator edges`);
    assert.match(source, /\.back[^}]*min-height:44px/, `${page} back target is at least 44px tall`);
    assert.match(source, /footer[^}]*a\s*\{[^}]*min-height:44px/, `${page} footer links are at least 44px tall`);
  }

  const support = read('support.html');
  assert.match(support, /\.quick-card\s*\{[^}]*min-height:112px/, 'support quick paths have generous touch targets');
  assert.match(support, /summary\s*\{[^}]*min-height:54px/, 'support FAQ controls have generous touch targets');

  for (const page of ['privacy.html', 'terms.html']) {
    const source = read(page);
    assert.match(source, /nav\.toc li a\s*\{[^}]*min-height:44px/, `${page} table-of-contents links are at least 44px tall`);
  }
});
