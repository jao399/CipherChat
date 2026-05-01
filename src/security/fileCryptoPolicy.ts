import type { EncryptedFileDescriptor } from './cryptoContracts';

export type FileCryptoReadinessInput = {
  id?: string;
  productionReady?: boolean;
  reviewedImplementation?: boolean;
  encryptsFileBytes?: boolean;
  encryptsMetadata?: boolean;
  algorithm?: EncryptedFileDescriptor['algorithm'];
};

export type FileCryptoReadiness = {
  provider: string;
  eligibleForProduction: boolean;
  summary: string;
  blockers: string[];
};

const reviewedFileAlgorithms: ReadonlySet<EncryptedFileDescriptor['algorithm']> = new Set([
  'AES-256-GCM',
  'ChaCha20-Poly1305',
]);

export function evaluateFileCryptoReadiness(input?: FileCryptoReadinessInput): FileCryptoReadiness {
  const provider = input?.id ?? 'secure-file-crypto-gated';
  const blockers: string[] = [];

  if (!input) {
    blockers.push('No reviewed client-side file crypto adapter is registered.');
  } else {
    if (!input.productionReady) {
      blockers.push('Adapter is not marked production-ready.');
    }

    if (!input.reviewedImplementation) {
      blockers.push('Adapter has not been reviewed for production file encryption.');
    }

    if (!input.encryptsFileBytes) {
      blockers.push('Adapter does not declare client-side file byte encryption.');
    }

    if (!input.encryptsMetadata) {
      blockers.push('Adapter does not declare encrypted filenames and MIME types.');
    }

    if (!input.algorithm || !reviewedFileAlgorithms.has(input.algorithm)) {
      blockers.push('Adapter must use a reviewed authenticated file encryption algorithm.');
    }
  }

  return {
    provider,
    eligibleForProduction: blockers.length === 0,
    summary:
      blockers.length === 0
        ? `${provider} is eligible for production secure file transfer.`
        : `Secure file transfer remains gated: ${blockers.join(' ')}`,
    blockers,
  };
}

export function assertFileCryptoReadyForProduction(input?: FileCryptoReadinessInput) {
  const readiness = evaluateFileCryptoReadiness(input);

  if (!readiness.eligibleForProduction) {
    throw new Error(readiness.summary);
  }
}

