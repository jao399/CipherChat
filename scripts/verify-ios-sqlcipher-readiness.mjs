import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();

function readJson(path) {
  return JSON.parse(readFileSync(join(root, path), 'utf8'));
}

function commandResult(command, args = ['--version']) {
  return spawnSync(command, args, {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
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
  'expo-dev-client is installed',
  'Native iOS SQLCipher verification requires an installed development client.',
);
pushCheck(
  checks,
  Boolean(packageJson.dependencies?.['expo-secure-store']),
  'expo-secure-store is installed',
  'The local database key must be provisioned through OS secure storage.',
);
pushCheck(
  checks,
  Boolean(packageJson.dependencies?.['@op-engineering/op-sqlite']),
  '@op-engineering/op-sqlite is installed',
  'The encrypted local database adapter depends on OP-SQLite.',
);
pushCheck(
  checks,
  packageJson['op-sqlite']?.sqlcipher === true,
  'OP-SQLite SQLCipher build flag is enabled',
  'Expected package.json op-sqlite.sqlcipher=true.',
);
pushCheck(
  checks,
  Boolean(expo.ios?.bundleIdentifier),
  'iOS bundle identifier is configured',
  'Expected app.json expo.ios.bundleIdentifier.',
);
pushCheck(
  checks,
  developmentProfile.developmentClient === true,
  'EAS development profile builds a development client',
  'Expected eas.json build.development.developmentClient=true.',
);
pushCheck(
  checks,
  developmentProfile.ios?.simulator === true,
  'EAS iOS development profile targets simulator builds',
  'Expected eas.json build.development.ios.simulator=true.',
);

if (process.platform !== 'darwin') {
  warnings.push(
    `iOS runtime verification requires macOS/Xcode. Current platform is ${process.platform}; configuration checks only.`,
  );
} else {
  const xcodebuild = commandResult('xcodebuild', ['-version']);
  pushCheck(
    checks,
    xcodebuild.status === 0,
    'Xcode command-line tools are available',
    'Install Xcode and select it with xcode-select before local iOS verification.',
  );

  const simctl = commandResult('xcrun', ['simctl', 'list', 'devices', 'booted']);
  pushCheck(
    checks,
    simctl.status === 0,
    'simctl is available',
    'xcrun simctl is required to install and inspect iOS simulator builds.',
  );

  if (!existsSync(join(root, 'ios'))) {
    warnings.push('No ios/ folder is present. Run npx expo prebuild --platform ios or use an EAS iOS simulator artifact.');
  }
}

const failures = checks.filter((check) => !check.ok);

console.log('CipherChat iOS SQLCipher readiness verification');
for (const check of checks) {
  console.log(`${check.ok ? 'PASS' : 'FAIL'} - ${check.label}`);
  if (!check.ok) {
    console.log(`       ${check.detail}`);
  }
}

if (warnings.length > 0) {
  console.log('\nEnvironment notes:');
  for (const warning of warnings) {
    console.log(`WARN - ${warning}`);
  }
}

if (failures.length > 0) {
  console.error(`\n${failures.length} iOS SQLCipher readiness check(s) failed.`);
  process.exit(1);
}

console.log('\niOS SQLCipher configuration is ready. Runtime verification must be completed on macOS/Xcode.');
