import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();

const requiredDocs = [
  {
    path: 'CipherChat-threat-model.md',
    sections: [
      '## Executive summary',
      '## Scope and assumptions',
      '## System model',
      '## Assets and security objectives',
      '## Attacker model',
      '## Entry points and attack surfaces',
      '## Top abuse paths',
      '## Threat model table',
      '## Criticality calibration',
      '## Focus paths for security review',
      'TM-001',
      'TM-008',
    ],
  },
  {
    path: 'docs/security/security-acceptance-criteria.md',
    sections: [
      '# CipherChat Security Acceptance Criteria',
      '## Production blockers',
      '## Cryptography gates',
      '## Mobile security gates',
      '## API and infrastructure gates',
      '## Privacy and abuse gates',
      '## Evidence required before release',
    ],
  },
];

let failureCount = 0;

for (const doc of requiredDocs) {
  const content = readFileSync(join(root, doc.path), 'utf8');
  console.log(`Checking ${doc.path}`);

  for (const section of doc.sections) {
    if (!content.includes(section)) {
      console.error(`FAIL - missing required section or marker: ${section}`);
      failureCount += 1;
    } else {
      console.log(`PASS - ${section}`);
    }
  }
}

if (failureCount > 0) {
  console.error(`\n${failureCount} security documentation check(s) failed.`);
  process.exit(1);
}

console.log('\nSecurity threat model and acceptance criteria are present.');
