import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();

function readJson(path) {
  return JSON.parse(readFileSync(join(root, path), 'utf8'));
}

function hasCommand(command, args = ['--version']) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: 'ignore',
  });

  return result.status === 0;
}

function pushCheck(checks, ok, label, detail) {
  checks.push({ ok, label, detail });
}

const packageJson = readJson('package.json');
const appJson = readJson('app.json');
const easJson = readJson('eas.json');
const expo = appJson.expo ?? {};
const developmentProfile = easJson.build?.development ?? {};

const checks = [];
const warnings = [];

pushCheck(
  checks,
  Boolean(packageJson.dependencies?.['expo-dev-client']),
  'expo-dev-client dependency is installed',
  'Required for native development-client verification.',
);
pushCheck(
  checks,
  Boolean(packageJson.dependencies?.['@op-engineering/op-sqlite']),
  'OP-SQLite dependency is installed',
  'Required for the SQLCipher encrypted local database adapter.',
);
pushCheck(
  checks,
  packageJson['op-sqlite']?.sqlcipher === true,
  'OP-SQLite SQLCipher flag is enabled',
  'Expected package.json op-sqlite.sqlcipher=true.',
);
pushCheck(
  checks,
  expo.scheme === 'cipherchat',
  'Expo URL scheme is stable',
  'Expected app.json expo.scheme=cipherchat.',
);
pushCheck(
  checks,
  Boolean(expo.ios?.bundleIdentifier),
  'iOS bundle identifier is configured',
  'Required before EAS iOS builds.',
);
pushCheck(
  checks,
  Boolean(expo.android?.package),
  'Android package name is configured',
  'Required before EAS Android builds.',
);
pushCheck(
  checks,
  Array.isArray(expo.plugins) && expo.plugins.includes('expo-secure-store'),
  'expo-secure-store plugin is configured',
  'SecureStore must be available to provision local keys.',
);
pushCheck(
  checks,
  developmentProfile.developmentClient === true,
  'EAS development profile builds a development client',
  'Expected eas.json build.development.developmentClient=true.',
);
pushCheck(
  checks,
  developmentProfile.android?.buildType === 'apk',
  'Android development build produces an APK',
  'APK output is easiest for emulator/manual QA installation.',
);
pushCheck(
  checks,
  developmentProfile.ios?.simulator === true,
  'iOS development profile targets simulator builds',
  'Expected eas.json build.development.ios.simulator=true.',
);

if (!hasCommand('eas')) {
  warnings.push('EAS CLI is not available in PATH. Use npx eas or install eas-cli before cloud build verification.');
}

if (!hasCommand('adb', ['devices'])) {
  warnings.push('Android platform tools are not available in PATH. Add adb before local emulator install verification.');
}

if (!existsSync(join(root, 'android'))) {
  warnings.push('No android/ native project directory is present, which is expected for a managed Expo app before prebuild.');
}

if (!existsSync(join(root, 'ios'))) {
  warnings.push('No ios/ native project directory is present, which is expected for a managed Expo app before prebuild.');
}

const failures = checks.filter((check) => !check.ok);

console.log('CipherChat development-client configuration verification');
for (const check of checks) {
  console.log(`${check.ok ? 'PASS' : 'FAIL'} - ${check.label}`);
  if (!check.ok) {
    console.log(`       ${check.detail}`);
  }
}

if (warnings.length > 0) {
  console.log('\nEnvironment warnings:');
  for (const warning of warnings) {
    console.log(`WARN - ${warning}`);
  }
}

if (failures.length > 0) {
  console.error(`\n${failures.length} development-client configuration check(s) failed.`);
  process.exit(1);
}

console.log('\nDevelopment-client configuration is ready for EAS build verification.');
