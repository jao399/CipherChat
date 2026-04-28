import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();

const checks = [
  {
    path: 'apps/api/src/operations/queueOperationsPolicy.ts',
    markers: [
      'retainedCompletedJobs',
      'retainedFailedJobs',
      'completedJobCleanupGraceMs',
      'failedJobCleanupGraceMs',
      'depthWarningThresholds',
      'evaluateQueueDepth',
      'removeOnComplete',
      'removeOnFail',
    ],
  },
  {
    path: 'apps/api/src/queue/jobQueue.ts',
    markers: [
      'getOperationalStats',
      'cleanupOperationalState',
      'queueOperationsPolicy',
      'queue.clean',
    ],
  },
  {
    path: 'apps/api/src/middleware/redisRateLimitStore.ts',
    markers: [
      'getOperationalStats',
      'rate-limit:*',
      'ttl-managed',
    ],
  },
  {
    path: 'apps/api/src/routes/maintenanceRoutes.ts',
    markers: [
      '/v1/internal/ops/queue',
      '/v1/internal/jobs/queue/cleanup',
      '/v1/internal/ops/redis/rate-limits',
    ],
  },
  {
    path: 'apps/api/src/operations/queueOperationsPolicy.test.ts',
    markers: [
      'defines retention options for every queue job type',
      'reports warnings when queue depth exceeds operational thresholds',
    ],
  },
  {
    path: 'apps/api/src/routes/apiPersistence.integration.test.ts',
    markers: [
      '/v1/internal/ops/queue',
      '/v1/internal/ops/redis/rate-limits',
    ],
  },
  {
    path: 'docs/architecture/phase-38-delivery-queue-redis-operations.md',
    markers: [
      'Delivery queue retention',
      'Redis operational visibility',
      'Operational routes',
      'Runbook',
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
  console.error(`\n${failures} queue-operations check(s) failed.`);
  process.exit(1);
}

console.log('\nDelivery queue and Redis operational controls are present.');
