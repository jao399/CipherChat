import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();

const evidenceDocs = [
  {
    label: 'Android SQLCipher release evidence',
    path: 'docs/release/android-sqlcipher-evidence.md',
  },
  {
    label: 'iOS SQLCipher release evidence',
    path: 'docs/release/ios-sqlcipher-evidence.md',
  },
];

const requiredMarkers = [
  'Evidence status:',
  'Blocking status:',
  'Last verified:',
];

let failures = 0;

for (const doc of evidenceDocs) {
  const absolutePath = path.join(root, doc.path);
  let content = '';

  try {
    content = await readFile(absolutePath, 'utf8');
  } catch {
    console.error(`[release-evidence] MISSING ${doc.label}: ${doc.path}`);
    failures += 1;
    continue;
  }

  const missingMarkers = requiredMarkers.filter((marker) => !content.includes(marker));

  if (missingMarkers.length > 0) {
    console.error(
      `[release-evidence] INVALID ${doc.label}: missing ${missingMarkers.join(', ')}`,
    );
    failures += 1;
    continue;
  }

  const blockingStatus = content.match(/Blocking status:\s*(.+)/)?.[1]?.trim() ?? 'unknown';
  const evidenceStatus = content.match(/Evidence status:\s*(.+)/)?.[1]?.trim() ?? 'unknown';
  const prefix = /missing|blocking|required|refresh/i.test(blockingStatus)
    ? 'NEEDS-EVIDENCE'
    : 'OK';

  console.log(
    `[release-evidence] ${prefix} ${doc.label}: evidence=${evidenceStatus}; blocking=${blockingStatus}`,
  );
}

if (failures > 0) {
  console.error(`[release-evidence] ${failures} release evidence document check(s) failed.`);
  process.exit(1);
}

console.log(
  '[release-evidence] Required evidence documents exist. Runtime evidence can still be blocking.',
);

