import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  assertNativeSigningKeyProviderReadyForProduction,
  evaluateNativeSigningKeyReadiness,
} from './nativeSigningKeyReadiness';
import {
  secureStorePrototypeSigningKeyProviderReadiness,
  type NativeSigningKeyProviderDescriptor,
} from './nativeSigningKeyProvider';

const baseNativeProvider: NativeSigningKeyProviderDescriptor = {
  providerId: 'reviewed-android-keystore-ed25519-v1',
  canExportPublicKeyOnly: true,
  canGenerateKey: true,
  canSignChallenge: true,
  evidenceStatus: 'complete',
  evidenceSummary: 'Reviewed native provider with attached runtime evidence.',
  keyProtectionLevel: 'android-keystore-non-exportable',
  limitations: [],
  platformSupport: ['android'],
  privateKeyExportable: false,
  productionReady: true,
  requiredEvidence: [
    'External implementation review',
    'Runtime non-exportability proof',
    'Public-key-only export proof',
  ],
  requiresNativeBuild: true,
  reviewedImplementation: true,
  runtimeEvidenceAttached: true,
  supportsRevocation: true,
  supportsRotation: true,
};

describe('native signing key readiness evaluation', () => {
  it('blocks production readiness when no native provider is installed', () => {
    const readiness = evaluateNativeSigningKeyReadiness();

    assert.equal(readiness.status, 'blocked');
    assert.equal(readiness.safeForDemo, false);
    assert.equal(readiness.safeForProduction, false);
    assert(readiness.reasons.some((reason) => reason.includes('unavailable')));
    assert(readiness.missingEvidence.some((item) => item.includes('Runtime device evidence')));
  });

  it('keeps SecureStore prototype provider safe for demo but not production', () => {
    const readiness = evaluateNativeSigningKeyReadiness(secureStorePrototypeSigningKeyProviderReadiness);

    assert.equal(readiness.status, 'development-only');
    assert.equal(readiness.safeForDemo, true);
    assert.equal(readiness.safeForProduction, false);
    assert(readiness.reasons.some((reason) => reason.includes('demo-only')));
    assert.throws(
      () => assertNativeSigningKeyProviderReadyForProduction(secureStorePrototypeSigningKeyProviderReadiness),
      /Production native signing key provider remains development-only/,
    );
  });

  it('blocks providers with exportable private keys', () => {
    const readiness = evaluateNativeSigningKeyReadiness({
      ...baseNativeProvider,
      privateKeyExportable: true,
    });

    assert.equal(readiness.status, 'blocked');
    assert.equal(readiness.safeForProduction, false);
    assert(readiness.reasons.some((reason) => reason.includes('non-exportability is not proven')));
  });

  it('blocks providers with missing evidence even when productionReady is true', () => {
    const readiness = evaluateNativeSigningKeyReadiness({
      ...baseNativeProvider,
      evidenceStatus: 'partial',
      reviewedImplementation: false,
      runtimeEvidenceAttached: false,
    });

    assert.equal(readiness.status, 'blocked');
    assert.equal(readiness.safeForProduction, false);
    assert(readiness.missingEvidence.includes('Reviewed native implementation evidence'));
    assert(readiness.missingEvidence.includes('Runtime device evidence'));
  });

  it('accepts Android Keystore non-exportable provider only with complete evidence', () => {
    const readiness = evaluateNativeSigningKeyReadiness(baseNativeProvider);

    assert.equal(readiness.status, 'ready');
    assert.equal(readiness.safeForProduction, true);
    assert.equal(readiness.productionReady, true);
    assert.doesNotThrow(() => assertNativeSigningKeyProviderReadyForProduction(baseNativeProvider));
  });

  it('accepts iOS Keychain and Secure Enclave non-exportable providers with complete evidence', () => {
    const iosKeychain = evaluateNativeSigningKeyReadiness({
      ...baseNativeProvider,
      providerId: 'reviewed-ios-keychain-ed25519-v1',
      keyProtectionLevel: 'ios-keychain-non-exportable',
      platformSupport: ['ios'],
    });
    const secureEnclave = evaluateNativeSigningKeyReadiness({
      ...baseNativeProvider,
      providerId: 'reviewed-ios-secure-enclave-ed25519-v1',
      keyProtectionLevel: 'ios-secure-enclave-non-exportable',
      platformSupport: ['ios'],
    });

    assert.equal(iosKeychain.status, 'ready');
    assert.equal(secureEnclave.status, 'ready');
  });

  it('does not treat web or unavailable providers as production-ready', () => {
    const readiness = evaluateNativeSigningKeyReadiness({
      ...baseNativeProvider,
      evidenceStatus: 'missing',
      keyProtectionLevel: 'unavailable',
      platformSupport: ['web'],
      privateKeyExportable: 'unknown',
      productionReady: false,
      runtimeEvidenceAttached: false,
    });

    assert.equal(readiness.status, 'unavailable');
    assert.equal(readiness.safeForProduction, false);
    assert(readiness.reasons.some((reason) => reason.includes('Web runtime')));
  });

  it('returns user-readable readiness reasons', () => {
    const readiness = evaluateNativeSigningKeyReadiness(secureStorePrototypeSigningKeyProviderReadiness);

    assert(readiness.reasons.length > 0);
    for (const reason of readiness.reasons) {
      assert.equal(reason.endsWith('.'), true);
      assert.equal(reason.includes('_'), false);
    }
  });
});
