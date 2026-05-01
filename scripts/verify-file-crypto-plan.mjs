import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const planPath = 'docs/architecture/phase-79-production-file-encryption-adapter-plan.md';
const policyPath = 'src/security/fileCryptoPolicy.ts';
const providerPath = 'src/services/files/fileEncryptionProvider.ts';

const requiredPlanMarkers = [
  'Authenticated Encryption Only',
  'Per-File Random Keys',
  'Per-Recipient File Key Wrapping Strategy',
  'Encrypted Thumbnails Policy',
  'Chunking And Resumable Upload Requirements',
  'Integrity And Authentication Requirements',
  'Local Encrypted Metadata Requirements',
  'Key Rotation And Revocation Limitations',
  'Android And iOS Native Dependency Requirements',
  'Test Plan',
  'Abuse And Size-Limit Considerations',
  'Why Mock File Transfer Cannot Be Production',
  'Production Readiness Criteria',
  'reviewed production-ready file crypto adapter',
  'No homemade file cryptography',
];

const requiredPolicyMarkers = [
  'reviewedFileAlgorithms',
  'AES-256-GCM',
  'ChaCha20-Poly1305',
  'encryptsFileBytes',
  'encryptsMetadata',
  'reviewed authenticated file encryption algorithm',
];

const requiredProviderMarkers = [
  'FileEncryptionAdapter',
  'encryptFile',
  'decryptFile',
  'PlainFileInput',
  'EncryptedFilePayload',
];

async function readRequiredFile(relativePath) {
  try {
    return await readFile(path.join(root, relativePath), 'utf8');
  } catch {
    console.error(`[file-crypto-plan] MISSING ${relativePath}`);
    process.exit(1);
  }
}

function assertMarkers(label, content, markers) {
  const missing = markers.filter((marker) => !content.includes(marker));

  if (missing.length > 0) {
    console.error(`[file-crypto-plan] INVALID ${label}`);
    for (const marker of missing) {
      console.error(`[file-crypto-plan] missing marker: ${marker}`);
    }
    process.exit(1);
  }

  console.log(`[file-crypto-plan] OK ${label}`);
}

const plan = await readRequiredFile(planPath);
const policy = await readRequiredFile(policyPath);
const provider = await readRequiredFile(providerPath);

assertMarkers(planPath, plan, requiredPlanMarkers);
assertMarkers(policyPath, policy, requiredPolicyMarkers);
assertMarkers(providerPath, provider, requiredProviderMarkers);

console.log('[file-crypto-plan] Documentation and boundary gate only; this does not install or certify a production file encryption adapter.');
