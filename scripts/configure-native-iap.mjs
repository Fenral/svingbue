#!/usr/bin/env node

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const CONFIG_FILE = 'sa-iap-config.js';
export const PLACEHOLDER_KEYS = Object.freeze({
  ios: 'appl_REPLACE_ME',
  android: 'goog_REPLACE_ME',
});
export const KEY_ENV = Object.freeze({
  ios: 'REVENUECAT_IOS_PUBLIC_SDK_KEY',
  android: 'REVENUECAT_ANDROID_PUBLIC_SDK_KEY',
});

function expectedPrefix(platform) {
  return platform === 'ios' ? 'appl_' : platform === 'android' ? 'goog_' : '';
}

export function validPublicSdkKey(platform, value) {
  const prefix = expectedPrefix(platform);
  return Boolean(
    prefix
    && typeof value === 'string'
    && value.startsWith(prefix)
    && !value.includes('REPLACE_ME')
    && /^[A-Za-z0-9_]+$/.test(value)
    && value.length > prefix.length + 8,
  );
}

export function renderConfig(keys) {
  return `// Generated for the native package by scripts/configure-native-iap.mjs.\n`
    + `// RevenueCat public SDK keys are identifiers, not secret credentials.\n`
    + `export const REVENUECAT_PUBLIC_SDK_KEYS = Object.freeze({\n`
    + `  ios: ${JSON.stringify(keys.ios)},\n`
    + `  android: ${JSON.stringify(keys.android)},\n`
    + `});\n`;
}

export function configuredForPlatform(source, platform) {
  if (!expectedPrefix(platform) || typeof source !== 'string') return false;
  const match = source.match(new RegExp(`${platform}:\\s*['\"]([^'\"]+)['\"]`));
  return validPublicSdkKey(platform, match?.[1]);
}

export function configureNativeIap({
  platform,
  key,
  root = ROOT,
  checkOnly = false,
} = {}) {
  if (!expectedPrefix(platform)) {
    throw new Error('Expected --platform ios or --platform android.');
  }

  const target = join(root, 'www', CONFIG_FILE);
  if (!existsSync(target)) {
    throw new Error(`Native web package is missing ${CONFIG_FILE}; run npm run copy-web first.`);
  }

  if (checkOnly) {
    if (!configuredForPlatform(readFileSync(target, 'utf8'), platform)) {
      throw new Error(`${platform} RevenueCat public SDK key is missing from the native package.`);
    }
    return target;
  }

  if (!validPublicSdkKey(platform, key)) {
    throw new Error(
      `${KEY_ENV[platform]} is missing or invalid; refusing to create a purchase-disabled release build.`,
    );
  }

  const keys = { ...PLACEHOLDER_KEYS, [platform]: key };
  writeFileSync(target, renderConfig(keys), 'utf8');
  if (!configuredForPlatform(readFileSync(target, 'utf8'), platform)) {
    throw new Error(`Failed to inject the ${platform} RevenueCat public SDK key.`);
  }
  return target;
}

function parseArgs(argv) {
  const valueAfter = flag => {
    const index = argv.indexOf(flag);
    return index >= 0 ? argv[index + 1] : undefined;
  };
  return {
    platform: valueAfter('--platform'),
    checkOnly: argv.includes('--check'),
  };
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : '';
if (invokedPath === fileURLToPath(import.meta.url)) {
  try {
    const { platform, checkOnly } = parseArgs(process.argv.slice(2));
    const target = configureNativeIap({
      platform,
      checkOnly,
      key: platform ? process.env[KEY_ENV[platform]] : undefined,
    });
    console.log(`[native-iap] ${platform} configuration verified in ${target}.`);
  } catch (error) {
    console.error(`[native-iap] ${error.message}`);
    process.exitCode = 1;
  }
}
