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
const iosDevicePreviewProfile = easJson.build?.['ios-device-preview'] ?? {};
const iosTestflightProfile = easJson.build?.['ios-testflight'] ?? {};

async function readEvidenceStatus(relativePath) {
  try {
    const content = await readFile(path.join(root, relativePath), 'utf8');
    return {
      blocking: content.match(/Blocking status:\s*(.+)/)?.[1]?.trim() ?? 'unknown',
      evidence: content.match(/Evidence status:\s*(.+)/)?.[1]?.trim() ?? 'unknown',
    };
  } catch {
    return {
      blocking: 'missing-evidence-document',
      evidence: 'missing',
    };
  }
}

const [androidEvidence, iosEvidence] = await Promise.all([
  readEvidenceStatus('docs/release/android-sqlcipher-evidence.md'),
  readEvidenceStatus('docs/release/ios-sqlcipher-evidence.md'),
]);

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

if (developmentProfile.ios?.simulator === true) {
  pass('EAS iOS development target', 'development profile builds an iOS simulator client');
} else {
  needsEvidence('EAS iOS development target', 'development profile should declare ios.simulator=true for simulator evidence');
}

if (previewProfile.env?.EXPO_PUBLIC_CIPHERCHAT_RELEASE_EVIDENCE === 'true') {
  pass('EAS preview iOS evidence flag', 'preview profile exposes Settings > Release Evidence');
} else {
  needsEvidence('EAS preview iOS evidence flag', 'preview profile must expose Release Evidence for iOS release-candidate checks');
}

if (
  iosDevicePreviewProfile.distribution === 'internal' &&
  iosDevicePreviewProfile.ios?.simulator === false &&
  iosDevicePreviewProfile.env?.EXPO_PUBLIC_CIPHERCHAT_RELEASE_EVIDENCE === 'true'
) {
  pass('EAS iOS device preview profile', 'ios-device-preview builds an internal iPhone artifact with Release Evidence enabled');
} else {
  needsEvidence('EAS iOS device preview profile', 'ios-device-preview must build an internal iPhone artifact with Release Evidence enabled');
}

if (
  iosTestflightProfile.distribution === 'store' &&
  iosTestflightProfile.ios?.simulator === false &&
  iosTestflightProfile.env?.EXPO_PUBLIC_CIPHERCHAT_RELEASE_EVIDENCE === 'true'
) {
  pass('EAS iOS TestFlight profile', 'ios-testflight builds a store-signed iPhone artifact with Release Evidence enabled');
} else {
  needsEvidence('EAS iOS TestFlight profile', 'ios-testflight must build a store-signed iPhone artifact with Release Evidence enabled');
}

console.log('\nRecorded runtime evidence status');
info('Android SQLCipher evidence', `evidence=${androidEvidence.evidence}; blocking=${androidEvidence.blocking}`);
needsEvidence('iOS SQLCipher evidence', `evidence=${iosEvidence.evidence}; blocking=${iosEvidence.blocking}`);

console.log('\nManual runtime evidence steps');
console.log('1. Build and install the Expo development client or release-candidate APK for the target config.');
console.log('2. For Android release-candidate evidence, prefer the EAS preview APK profile or an equivalent local release build with EXPO_PUBLIC_CIPHERCHAT_RELEASE_EVIDENCE=true.');
console.log('3. Open CipherChat on the installed Android or iOS client.');
console.log('4. Go to Settings > Development Evidence or Release Evidence > SQLCipher Runtime Check.');
console.log('5. Run the check and capture the pass/fail result.');
console.log('6. The check must report encrypted=true and schema v1 after writing, reading, and deleting a harmless deviceMetadata record.');
console.log('7. Attach screenshot/log output to docs/release/android-sqlcipher-evidence.md or docs/release/ios-sqlcipher-evidence.md.');
console.log('8. Do not capture message content, filenames, contact graph data, private keys, tokens, safety numbers, or decrypted identifiers.');

console.log('\niOS next commands');
console.log('Simulator development-client path on macOS/Xcode:');
console.log('  npx eas build --profile development --platform ios --local');
console.log('  npx expo start --dev-client');
console.log('  xcrun simctl install booted <path-to-CipherChat.app>');
console.log('  xcrun simctl launch booted com.amgadalzomi.cipherchat');
console.log('Device/internal release-candidate path with EAS:');
console.log('  npx eas-cli@latest device:create');
console.log('  npm run eas:ios:device-preview');
console.log('  Install the resulting internal build on an enrolled iOS device.');
console.log('TestFlight path with EAS:');
console.log('  npm run eas:ios:testflight');
console.log('  npm run eas:ios:submit-latest');
console.log('  Install the TestFlight build on an enrolled tester iPhone.');
console.log('Then open CipherChat, complete the demo entry flow, open Settings > Release Evidence, run SQLCipher Runtime Check, and attach the pass/fail screenshot or logs to docs/release/ios-sqlcipher-evidence.md.');

if (os.platform() === 'win32') {
  needsEvidence(
    'iOS runtime host',
    'Current host is Windows. iOS runtime proof remains blocked until macOS/Xcode or an installed EAS iOS build is available.',
  );
}

info(
  'runtime verification',
  'This script only checks static config and manual steps. Runtime evidence status is recorded in docs/release/android-sqlcipher-evidence.md and docs/release/ios-sqlcipher-evidence.md.',
);
