import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();

const checks = [
  {
    path: 'docs/security/external-audit-readiness.md',
    markers: [
      'Audit scope',
      'Critical blockers',
      'Reviewer entry points',
      'Audit tracks',
      'External audit deliverables',
    ],
  },
  {
    path: 'docs/security/audit-evidence-manifest.md',
    markers: [
      'Full CI gate',
      'Release smoke test',
      'High-severity dependency audit',
      'Runtime evidence to attach before launch',
    ],
  },
  {
    path: 'docs/architecture/phase-50-external-security-review-audit-readiness.md',
    markers: [
      'External review package',
      'Current status',
      'reviewed Signal/libsignal-compatible one-to-one crypto',
      'external security review findings',
    ],
  },
  {
    path: 'docs/security/security-acceptance-criteria.md',
    markers: [
      'External security review must be completed before production launch.',
      'Audit readiness gate output: `npm run verify:audit-readiness`',
      'External security review report and remediation evidence',
    ],
  },
  {
    path: 'docs/release/production-readiness-checklist.md',
    markers: [
      'External security review is complete.',
      'Audit readiness package is attached to the release record.',
    ],
  },
  {
    path: 'README.md',
    markers: [
      'Phase 50 - External Security Review And Audit Readiness',
      'docs/security/external-audit-readiness.md',
      'npm run verify:audit-readiness',
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
  console.error(`\n${failures} audit-readiness check(s) failed.`);
  process.exit(1);
}

console.log('\nExternal audit readiness package is present.');
