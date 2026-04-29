import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();

const checks = [
  {
    path: 'apps/api/Dockerfile',
    markers: [
      'NODE_ENV=production',
      'API_HOST=0.0.0.0',
      'EXPOSE 4000',
      'node", "apps/api/dist/server.js',
    ],
  },
  {
    path: '.github/workflows/release-smoke.yml',
    markers: [
      'workflow_dispatch',
      'docker build -f apps/api/Dockerfile',
      'npm run prisma:migrate:deploy',
      'npm run release:smoke',
      'docker logs cipherchat-api',
    ],
  },
  {
    path: 'scripts/release-smoke-test.mjs',
    markers: [
      '/health',
      '/ready',
      '/v1/internal/ops/queue',
      'RELEASE_SMOKE_TIMEOUT_MS',
    ],
  },
  {
    path: 'docs/architecture/phase-49-production-release-operations.md',
    markers: [
      'Production deployment',
      'Monitoring',
      'CI/CD',
      'Release smoke tests',
    ],
  },
  {
    path: 'docs/release/production-readiness-checklist.md',
    markers: [
      'API container image builds from `apps/api/Dockerfile`.',
      '`npm run release:smoke` passes against the deployed API.',
      'Release smoke workflow passes before promoting a backend build.',
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
  console.error(`\n${failures} release-operations check(s) failed.`);
  process.exit(1);
}

console.log('\nProduction release operations controls are present.');
