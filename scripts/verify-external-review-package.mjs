import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();

const checks = [
  {
    path: 'docs/security/external-review-request-package.md',
    markers: [
      'Review Scope',
      'Out Of Scope',
      'Architecture Summary',
      'Crypto Blockers',
      'Mobile Storage Blockers',
      'Backend Metadata And Audit Boundaries',
      'Push Notification Privacy Boundary',
      'File Encryption Boundary',
      'Required Reviewer Deliverables',
      'Evidence Docs To Attach',
      'Known Non-Production Areas',
    ],
  },
  {
    path: 'docs/security/dependency-advisory-triage.md',
    markers: [
      'npm Audit Summary',
      'Expo Transitive Advisories',
      'Why Forced Fix Is Not Applied',
      'Current Risk Classification',
      'Required Monitoring Action',
      'Re-Test Requirement Before Release',
      'Validate And Audit Commands',
      'Do Not Suppress Advisories',
    ],
  },
];

let failures = 0;

for (const check of checks) {
  let content = '';

  try {
    content = await readFile(path.join(root, check.path), 'utf8');
  } catch {
    console.error(`[external-review] MISSING ${check.path}`);
    failures += 1;
    continue;
  }

  console.log(`Checking ${check.path}`);

  for (const marker of check.markers) {
    if (!content.includes(marker)) {
      console.error(`[external-review] FAIL missing marker: ${marker}`);
      failures += 1;
    } else {
      console.log(`[external-review] PASS ${marker}`);
    }
  }
}

if (failures > 0) {
  console.error(`\n[external-review] ${failures} package check(s) failed.`);
  process.exit(1);
}

console.log('\n[external-review] External review request package and dependency advisory triage docs are present.');
