import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();

const checks = [
  {
    path: 'src/services/messages/signalAdapterRegistry.ts',
    markers: [
      'registerSignalOneToOneCryptoAdapter',
      'getRegisteredSignalOneToOneCryptoAdapter',
      'clearRegisteredSignalOneToOneCryptoAdapter',
    ],
  },
  {
    path: 'src/services/messages/signalAdapterReadiness.ts',
    markers: [
      'evaluateSignalAdapterReadiness',
      'No native Signal/libsignal adapter is registered.',
      'eligibleForRegistration',
      'signalX3dhPrekeyBundleFormat',
    ],
  },
  {
    path: 'src/services/messages/signalAdapterReadiness.test.ts',
    markers: [
      'reports no native adapter when nothing is registered',
      'blocks registered adapters with an incompatible prekey bundle format',
      'marks reviewed signal-x3dh-v1 adapters eligible for provider use',
    ],
  },
  {
    path: 'src/services/messages/signalAdapterBootstrap.ts',
    markers: [
      'bootstrapSignalOneToOneAdapter',
      'clearRegisteredSignalOneToOneCryptoAdapter',
      'registerSignalOneToOneCryptoAdapter',
      'eligibleForRegistration',
    ],
  },
  {
    path: 'src/services/messages/signalAdapterBootstrap.test.ts',
    markers: [
      'leaves the registry empty when no native adapter is provided',
      'refuses to register an adapter that is not production-ready',
      'registers an eligible reviewed signal-x3dh-v1 adapter',
    ],
  },
  {
    path: 'src/security/messageCryptoPolicy.ts',
    markers: [
      'signalAdapterInstalled',
      'signalAdapterEligible',
      'signalAdapterSummary',
    ],
  },
  {
    path: 'docs/architecture/phase-63-signal-adapter-readiness.md',
    markers: [
      'Phase 63 - Signal Adapter Readiness',
      'missing adapters',
      'incompatible',
      'eligible reviewed adapters',
    ],
  },
  {
    path: 'docs/architecture/phase-65-signal-adapter-bootstrap.md',
    markers: [
      'Phase 65 - Signal Adapter Bootstrap',
      'Ineligible adapters are not registered',
      'bootstrapSignalOneToOneAdapter',
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
  console.error(`\n${failures} Signal adapter readiness check(s) failed.`);
  process.exit(1);
}

console.log('\nSignal adapter readiness controls are present.');
