import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  assertFileCryptoReadyForProduction,
  evaluateFileCryptoReadiness,
  type FileCryptoReadinessInput,
} from './fileCryptoPolicy';

const reviewedAdapter: FileCryptoReadinessInput = {
  id: 'reviewed-file-crypto-adapter',
  algorithm: 'AES-256-GCM',
  encryptsFileBytes: true,
  encryptsMetadata: true,
  productionReady: true,
  reviewedImplementation: true,
};

describe('file crypto production policy', () => {
  it('blocks production file transfer when no adapter is registered', () => {
    const readiness = evaluateFileCryptoReadiness();

    assert.equal(readiness.eligibleForProduction, false);
    assert.match(readiness.summary, /No reviewed client-side file crypto adapter/);
    assert.throws(() => assertFileCryptoReadyForProduction(), /Secure file transfer remains gated/);
  });

  it('requires review, byte encryption, and encrypted metadata', () => {
    const readiness = evaluateFileCryptoReadiness({
      ...reviewedAdapter,
      encryptsMetadata: false,
      reviewedImplementation: false,
    });

    assert.equal(readiness.eligibleForProduction, false);
    assert.match(readiness.summary, /filenames and MIME types/);
    assert.match(readiness.summary, /not been reviewed/);
  });

  it('accepts a reviewed authenticated file crypto adapter contract', () => {
    const readiness = evaluateFileCryptoReadiness(reviewedAdapter);

    assert.equal(readiness.eligibleForProduction, true);
    assert.doesNotThrow(() => assertFileCryptoReadyForProduction(reviewedAdapter));
  });
});

