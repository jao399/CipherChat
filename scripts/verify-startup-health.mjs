import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();

const checks = [
  {
    path: 'apps/api/src/startup/runtimeHealth.ts',
    markers: [
      'probeApiRuntimeHealth',
      'ensureStartupDependencies',
      'connection_failed',
      'not_configured',
    ],
  },
  {
    path: 'apps/api/src/startup/gracefulShutdown.ts',
    markers: [
      'createGracefulShutdown',
      'closing',
      'shutdown failed',
    ],
  },
  {
    path: 'apps/api/src/server.ts',
    markers: [
      'ensureStartupDependencies',
      'createGracefulShutdown',
      "shutdown('SIGTERM')",
    ],
  },
  {
    path: 'apps/api/src/worker.ts',
    markers: [
      'ensureStartupDependencies',
      'createGracefulShutdown',
      "shutdown('SIGTERM')",
    ],
  },
  {
    path: 'apps/api/src/routes/apiRoutes.test.ts',
    markers: [
      'reports unavailable dependencies with safe readiness reasons',
      'connection_failed',
    ],
  },
  {
    path: 'docs/architecture/phase-40-startup-health-hardening.md',
    markers: [
      'Startup dependency checks',
      'Readiness reasons',
      'Graceful shutdown',
      'Deploy smoke test',
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
  console.error(`\n${failures} startup-health check(s) failed.`);
  process.exit(1);
}

console.log('\nStartup health hardening controls are present.');
