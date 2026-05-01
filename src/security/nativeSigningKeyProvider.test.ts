import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  assertNativeSigningKeyProviderReadyForProduction,
  blockedNativeSigningKeyProvider,
  evaluateNativeSigningKeyProviderReadiness,
  secureStorePrototypeSigningKeyProviderReadiness,
  type NativeSigningKeyProviderReadinessInput,
} from './nativeSigningKeyProvider';

const reviewedNativeProvider: NativeSigningKeyProviderReadinessInput = {
  id: 'reviewed-native-ed25519-keystore-v1',
  algorithm: 'ed25519',
  evidence: {
    evidenceSummary: 'Reviewed native provider with attached Android/iOS runtime evidence.',
    nonExportablePrivateKey: true,
    privateKeyExportableToJavaScript: false,
    publicKeyExportOnly: true,
    reviewedImplementation: true,
    runtimeEvidenceAttached: true,
  },
  keyStorage: 'native-non-exportable',
  productionReady: true,
  supportsRevocation: true,
  supportsRotation: true,
};

describe('native signing key provider readiness', () => {
  it('blocks production readiness when no native provider is installed', async () => {
    const readiness = evaluateNativeSigningKeyProviderReadiness();

    assert.equal(readiness.eligibleForProduction, false);
    assert.match(readiness.summary, /Reviewed native implementation evidence is missing/);
    await assert.rejects(
      blockedNativeSigningKeyProvider.signChallenge(new Uint8Array([1, 2, 3])),
      /not installed/,
    );
  });

  it('does not treat SecureStore-held private keys as production non-exportable evidence', () => {
    const readiness = evaluateNativeSigningKeyProviderReadiness(
      secureStorePrototypeSigningKeyProviderReadiness,
    );

    assert.equal(readiness.eligibleForProduction, false);
    assert(readiness.blockers.some((blocker) => blocker.includes('not native non-exportable')));
    assert(readiness.blockers.some((blocker) => blocker.includes('exportable to JavaScript')));
    assert.throws(
      () => assertNativeSigningKeyProviderReadyForProduction(secureStorePrototypeSigningKeyProviderReadiness),
      /Production native signing key provider remains blocked/,
    );
  });

  it('accepts only reviewed non-exportable public-key-only native provider evidence', () => {
    const readiness = evaluateNativeSigningKeyProviderReadiness(reviewedNativeProvider);

    assert.equal(readiness.eligibleForProduction, true);
    assert.doesNotThrow(() => assertNativeSigningKeyProviderReadyForProduction(reviewedNativeProvider));
  });
});

