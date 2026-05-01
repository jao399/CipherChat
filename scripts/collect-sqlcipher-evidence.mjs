import { readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const root = process.cwd();

async function readJson(relativePath) {
  const content = await readFile(path.join(root, relativePath), 'utf8');
  return JSON.parse(content);
}

function pass(label, detail) {
  console.log(`[sqlcipher-evidence] PASS ${label}: ${detail}`);
}

function info(label, detail) {
  console.log(`[sqlcipher-evidence] INFO ${label}: ${detail}`);
}

function needsEvidence(label, detail) {
  console.log(`[sqlcipher-evidence] NEEDS-EVIDENCE ${label}: ${detail}`);
}

const [packageJson, appJson, easJson] = await Promise.all([
  readJson('package.json'),
  readJson('app.json'),
  readJson('eas.json'),
]);

const expoConfig = appJson.expo ?? {};
const opSQLiteConfig = packageJson['op-sqlite'] ?? {};
const developmentProfile = easJson.build?.development ?? {};
const previewProfile = easJson.build?.preview ?? {};

console.log('CipherChat SQLCipher runtime evidence helper');
info('host', `${os.platform()} ${os.release()} ${os.arch()}`);

if (packageJson.dependencies?.['@op-engineering/op-sqlite']) {
  pass('@op-engineering/op-sqlite dependency', packageJson.dependencies['@op-engineering/op-sqlite']);
} else {
  needsEvidence('@op-engineering/op-sqlite dependency', 'dependency is missing from package.json');
}

if (opSQLiteConfig.sqlcipher === true) {
  pass('OP-SQLite SQLCipher build flag', 'package.json op-sqlite.sqlcipher=true');
} else {
  needsEvidence('OP-SQLite SQLCipher build flag', 'package.json op-sqlite.sqlcipher is not true');
}

if (packageJson.dependencies?.['expo-dev-client']) {
  pass('Expo development client dependency', packageJson.dependencies['expo-dev-client']);
} else {
  needsEvidence('Expo development client dependency', 'expo-dev-client is required for native runtime checks');
}

if (developmentProfile.developmentClient === true) {
  pass('EAS development profile', 'developmentClient=true');
} else {
  needsEvidence('EAS development profile', 'development profile is not configured as a development client');
}

if (previewProfile.android?.buildType === 'apk') {
  pass('EAS preview Android artifact', 'preview profile builds an installable APK');
} else {
  needsEvidence('EAS preview Android artifact', 'preview profile must build an installable APK for BlueStacks evidence');
}

if (previewProfile.env?.EXPO_PUBLIC_CIPHERCHAT_RELEASE_EVIDENCE === 'true') {
  pass('Preview release evidence flag', 'SQLCipher Runtime Check is visible in preview APKs');
} else {
  needsEvidence('Preview release evidence flag', 'preview profile must set EXPO_PUBLIC_CIPHERCHAT_RELEASE_EVIDENCE=true');
}

if (expoConfig.android?.package) {
  pass('Android package', expoConfig.android.package);
}

if (expoConfig.ios?.bundleIdentifier) {
  pass('iOS bundle identifier', expoConfig.ios.bundleIdentifier);
}

console.log('\nManual runtime evidence steps');
console.log('1. Build and install the Expo development client or release-candidate APK for the target config.');
console.log('2. For Android release-candidate evidence, prefer the EAS preview APK profile or an equivalent local release build with EXPO_PUBLIC_CIPHERCHAT_RELEASE_EVIDENCE=true.');
console.log('3. Open CipherChat on the installed Android or iOS client.');
console.log('4. Go to Settings > Development Evidence or Release Evidence > SQLCipher Runtime Check.');
console.log('5. Run the check and capture the pass/fail result.');
console.log('6. The check must report encrypted=true and schema v1 after writing, reading, and deleting a harmless deviceMetadata record.');
console.log('7. Attach screenshot/log output to docs/release/android-sqlcipher-evidence.md or docs/release/ios-sqlcipher-evidence.md.');
console.log('8. Do not capture message content, filenames, contact graph data, private keys, tokens, safety numbers, or decrypted identifiers.');

info(
  'runtime verification',
  'This script only checks static config and manual steps. Runtime evidence status is recorded in docs/release/android-sqlcipher-evidence.md and docs/release/ios-sqlcipher-evidence.md.',
);
