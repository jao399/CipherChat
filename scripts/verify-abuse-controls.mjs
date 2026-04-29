import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();

const checks = [
  {
    path: 'apps/api/src/security/abusePolicy.ts',
    markers: [
      'maxFanoutRecipients',
      'maxHeaderCiphertextChars',
      'maxBodyCiphertextChars',
      'account-create',
      'device-challenge',
      'device-session',
      'account-discovery',
      'envelope-fanout',
      'prekey-claim',
      'prekey-top-up',
    ],
  },
  {
    path: 'apps/api/src/middleware/rateLimit.ts',
    markers: [
      'routeRateLimitPolicies',
      'findRoutePolicy',
      'routePathMatches',
      'keyPrefix',
    ],
  },
  {
    path: 'apps/api/src/routes/apiRoutes.test.ts',
    markers: [
      'throttles repeated account creation attempts per route policy',
      'throttles dynamic one-time prekey claim attempts per route policy',
      'throttles current-device prekey top-up attempts per route policy',
      'rejects encrypted fanout requests above the recipient-device cap',
      'rejects encrypted envelopes above the payload-size cap',
    ],
  },
  {
    path: 'docs/architecture/phase-36-account-session-abuse-controls.md',
    markers: [
      'Route-aware rate limiting',
      'Envelope abuse policy',
    ],
  },
  {
    path: 'docs/architecture/phase-60-prekey-abuse-controls.md',
    markers: [
      'Prekey claim throttling',
      'Prekey top-up throttling',
      'Dynamic route matching',
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
  console.error(`\n${failures} abuse-control check(s) failed.`);
  process.exit(1);
}

console.log('\nAccount/session abuse controls are present.');
