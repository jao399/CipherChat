import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();

const checks = [
  {
    path: 'apps/api/src/config.ts',
    markers: [
      'validateApiConfigForRuntime',
      'DATABASE_URL is required in production',
      'REDIS_URL is required in production',
      'INTERNAL_JOB_TOKEN must be at least 32 characters',
      'ALLOW_INSECURE_DEV_SIGNATURES must not be enabled in production',
      'DEVICE_SIGNATURE_VERIFIER must be set to ed25519 in production',
      'CORS_ORIGIN must be a production origin',
    ],
  },
  {
    path: 'apps/api/src/server.ts',
    markers: [
      'validateApiConfigForRuntime(config)',
    ],
  },
  {
    path: 'apps/api/src/config.test.ts',
    markers: [
      'keeps development configuration flexible for local UI work',
      'requires production persistence, Redis, strong internal token, and Ed25519 verification',
      'accepts a production configuration with required dependencies and strong secret settings',
    ],
  },
  {
    path: 'docs/architecture/phase-39-production-secret-environment-validation.md',
    markers: [
      'Production startup blockers',
      'Secret strength',
      'Environment separation',
      'Rotation plan',
    ],
  },
];

let failures = 0;

for (const check of checks) {
  const content = readFileSync(join(root, check.path), 'utf8');
  console.log(`Checking ${check.path}`);

  for (const marker of check.markers) {
    if (!content.includes(marker)) {
      console.error(`FAIL - missing marker: ${marker}`);
      failures += 1;
    } else {
      console.log(`PASS - ${marker}`);
    }
  }
}

if (failures > 0) {
  console.error(`\n${failures} production-config check(s) failed.`);
  process.exit(1);
}

console.log('\nProduction secret and environment validation controls are present.');
