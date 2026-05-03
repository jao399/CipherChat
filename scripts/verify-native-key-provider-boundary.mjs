import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();

function read(path) {
  return readFileSync(join(root, path), 'utf8');
}

function fileExists(path) {
  return existsSync(join(root, path));
}

const checks = [
  {
    ok: fileExists('src/security/nativeSigningKeyProvider.ts'),
    label: 'native signing key provider descriptor exists',
  },
  {
    ok:
      read('src/security/nativeSigningKeyProvider.ts').includes('keyProtectionLevel') &&
      read('src/security/nativeSigningKeyProvider.ts').includes('android-keystore-non-exportable') &&
      read('src/security/nativeSigningKeyProvider.ts').includes('ios-secure-enclave-non-exportable') &&
      read('src/security/nativeSigningKeyProvider.ts').includes('prototype-securestore'),
    label: 'provider descriptor tracks non-exportable and prototype protection levels',
  },
  {
    ok:
      fileExists('src/security/nativeSigningKeyReadiness.ts') &&
      read('src/security/nativeSigningKeyReadiness.ts').includes('evaluateNativeSigningKeyReadiness') &&
      read('src/security/nativeSigningKeyReadiness.ts').includes('safeForDemo') &&
      read('src/security/nativeSigningKeyReadiness.ts').includes('safeForProduction'),
    label: 'readiness evaluator exposes demo and production safety results',
  },
  {
    ok:
      fileExists('src/security/nativeSigningKeyProvider.test.ts') &&
      fileExists('src/security/nativeSigningKeyReadiness.test.ts'),
    label: 'native signing key provider and readiness tests exist',
  },
  {
    ok: fileExists('docs/architecture/phase-87-native-non-exportable-key-provider-plan.md'),
    label: 'Phase 87 architecture plan exists',
  },
  {
    ok:
      read('docs/architecture/phase-87-native-non-exportable-key-provider-plan.md').includes(
        'SecureStore prototype keys are not enough for production',
      ) &&
      read('docs/release/production-blocker-burndown.md').includes(
        'Phase 87 improves the native key provider boundary',
      ) &&
      read('docs/security/security-acceptance-criteria.md').includes(
        'SecureStore prototype evidence must not satisfy production non-exportable-key requirements',
      ),
    label: 'docs keep SecureStore prototype keys outside production evidence',
  },
];

console.log('CipherChat native signing key provider boundary verification');
for (const check of checks) {
  console.log(`${check.ok ? 'PASS' : 'FAIL'} - ${check.label}`);
}

const failures = checks.filter((check) => !check.ok);
if (failures.length > 0) {
  console.error(`\n${failures.length} native key provider boundary check(s) failed.`);
  process.exit(1);
}

console.log('\nNative non-exportable key support remains gated until reviewed native evidence exists.');
