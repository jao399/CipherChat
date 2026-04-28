import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();

const checks = [
  {
    path: 'src/services/messages/outboundQueueStore.ts',
    markers: [
      "import { assertNoPlaintextFieldsInOutboundQueue } from './outboundQueuePrivacy';",
      'assertNoPlaintextFieldsInOutboundQueue(items);',
    ],
  },
  {
    path: 'src/services/messages/outboundQueuePrivacy.test.ts',
    markers: [
      'detects direct plaintext draft fields',
      'detects nested message text fields before they can be persisted',
      'does not treat encrypted payload field names as plaintext fields',
    ],
  },
  {
    path: 'docs/architecture/phase-35-outbound-plaintext-lifecycle.md',
    markers: [
      'Plaintext exists only in transient UI state',
      'Durable outbound queue records are scanned before persistence',
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
  console.error(`\n${failures} plaintext lifecycle check(s) failed.`);
  process.exit(1);
}

console.log('\nOutbound plaintext lifecycle controls are present.');
