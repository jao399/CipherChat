import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const planPath = 'docs/architecture/phase-76-signal-libsignal-integration-plan.md';
const absolutePlanPath = path.join(root, planPath);

const requiredMarkers = [
  'Native Adapter Requirements',
  'Android Requirements',
  'iOS Requirements',
  'X3DH And Prekey Requirements',
  'Double Ratchet Session Requirements',
  'Safety Number And Key-Change Behavior',
  'Local Encrypted Session Storage Requirements',
  'Test Plan',
  'Migration Plan From Prototype Provider',
  'Production Readiness Criteria',
  'Why prototype-sha256-envelope-v1 Cannot Be Used For Production',
  'fail-closed',
  'real reviewed native Signal/libsignal-compatible implementation',
  'signal-x3dh-double-ratchet-v1',
  'No reviewed native Signal/libsignal adapter is installed',
];

let content = '';

try {
  content = await readFile(absolutePlanPath, 'utf8');
} catch {
  console.error(`[signal-plan] MISSING ${planPath}`);
  process.exit(1);
}

const missingMarkers = requiredMarkers.filter((marker) => !content.includes(marker));

if (missingMarkers.length > 0) {
  console.error(`[signal-plan] INVALID ${planPath}`);
  for (const marker of missingMarkers) {
    console.error(`[signal-plan] missing marker: ${marker}`);
  }
  process.exit(1);
}

console.log(`[signal-plan] OK ${planPath}`);
console.log('[signal-plan] Documentation gate only; this does not install or certify Signal/libsignal support.');
