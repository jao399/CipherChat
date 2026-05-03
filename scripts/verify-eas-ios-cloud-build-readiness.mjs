import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();

async function readJson(relativePath) {
  return JSON.parse(await readFile(path.join(root, relativePath), 'utf8'));
}

function pass(label, detail) {
  console.log(`[eas-ios] PASS ${label}: ${detail}`);
}

function fail(label, detail) {
  console.error(`[eas-ios] FAIL ${label}: ${detail}`);
  failures += 1;
}

let failures = 0;

const [packageJson, appJson, easJson, iosEvidence] = await Promise.all([
  readJson('package.json'),
  readJson('app.json'),
  readJson('eas.json'),
  readFile(path.join(root, 'docs/release/ios-sqlcipher-evidence.md'), 'utf8'),
]);

const expo = appJson.expo ?? {};
const build = easJson.build ?? {};
const preview = build['ios-device-preview'];
const testflight = build['ios-testflight'];

if (easJson.cli?.version) {
  pass('EAS CLI version constraint', easJson.cli.version);
} else {
  fail('EAS CLI version constraint', 'eas.json must require an EAS CLI version');
}

if (expo.ios?.bundleIdentifier) {
  pass('iOS bundle identifier', expo.ios.bundleIdentifier);
} else {
  fail('iOS bundle identifier', 'app.json expo.ios.bundleIdentifier is required for EAS iOS builds');
}

if (packageJson.dependencies?.['@op-engineering/op-sqlite'] && packageJson['op-sqlite']?.sqlcipher === true) {
  pass('SQLCipher native dependency config', '@op-engineering/op-sqlite with package.json op-sqlite.sqlcipher=true');
} else {
  fail('SQLCipher native dependency config', 'OP-SQLite and op-sqlite.sqlcipher=true are required');
}

if (preview?.extends === 'preview' && preview?.distribution === 'internal' && preview?.ios?.simulator === false) {
  pass('iOS device preview profile', 'ios-device-preview extends preview and builds an internal device artifact');
} else {
  fail('iOS device preview profile', 'ios-device-preview must extend preview, use internal distribution, and set ios.simulator=false');
}

if (
  preview?.env?.EXPO_PUBLIC_CIPHERCHAT_API_MODE === 'mock' &&
  preview?.env?.EXPO_PUBLIC_CIPHERCHAT_RELEASE_EVIDENCE === 'true'
) {
  pass('iOS device preview env', 'mock mode with Release Evidence controls enabled');
} else {
  fail('iOS device preview env', 'ios-device-preview must enable mock mode and Release Evidence controls');
}

if (testflight?.extends === 'preview' && testflight?.distribution === 'store' && testflight?.ios?.simulator === false) {
  pass('iOS TestFlight profile', 'ios-testflight builds a store-signed device artifact');
} else {
  fail('iOS TestFlight profile', 'ios-testflight must extend preview, use store distribution, and set ios.simulator=false');
}

if (
  testflight?.env?.EXPO_PUBLIC_CIPHERCHAT_API_MODE === 'mock' &&
  testflight?.env?.EXPO_PUBLIC_CIPHERCHAT_RELEASE_EVIDENCE === 'true'
) {
  pass('iOS TestFlight env', 'mock mode with Release Evidence controls enabled');
} else {
  fail('iOS TestFlight env', 'ios-testflight must enable mock mode and Release Evidence controls');
}

if (/Evidence status:\s*missing/.test(iosEvidence) && /Blocking status:\s*blocking-before-production/.test(iosEvidence)) {
  pass('iOS evidence honesty', 'iOS SQLCipher evidence remains missing/blocking until runtime verification passes');
} else {
  fail('iOS evidence honesty', 'ios-sqlcipher-evidence.md must remain missing/blocking until a real iOS runtime pass is recorded');
}

if (!String(packageJson.scripts?.['verify:eas-ios-cloud-build'] ?? '').includes('verify-eas-ios-cloud-build-readiness.mjs')) {
  fail('package script', 'verify:eas-ios-cloud-build must run this static readiness check');
} else {
  pass('package script', 'verify:eas-ios-cloud-build is configured');
}

if (
  String(packageJson.scripts?.['eas:ios:device-preview'] ?? '').includes('ios-device-preview') &&
  String(packageJson.scripts?.['eas:ios:testflight'] ?? '').includes('ios-testflight') &&
  String(packageJson.scripts?.['eas:ios:submit-latest'] ?? '').includes('submit --platform ios --latest')
) {
  pass('EAS convenience scripts', 'iOS device preview, TestFlight build, and latest submit commands are configured');
} else {
  fail('EAS convenience scripts', 'package.json must expose iOS device preview, TestFlight build, and submit scripts');
}

if (failures > 0) {
  console.error(`[eas-ios] ${failures} EAS iOS cloud build readiness check(s) failed.`);
  process.exit(1);
}

console.log('[eas-ios] EAS iOS cloud build configuration is ready. Runtime SQLCipher evidence is still blocking.');
