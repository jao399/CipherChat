import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  blockedNativeSigningKeyProvider,
  secureStorePrototypeSigningKeyProviderReadiness,
} from './nativeSigningKeyProvider';

describe('native signing key provider descriptors', () => {
  it('keeps the default native provider blocked and unavailable', async () => {
    assert.equal(blockedNativeSigningKeyProvider.providerId, 'native-non-exportable-signing-key-missing');
    assert.equal(blockedNativeSigningKeyProvider.productionReady, false);
    assert.equal(blockedNativeSigningKeyProvider.keyProtectionLevel, 'unavailable');
    assert.equal(blockedNativeSigningKeyProvider.evidenceStatus, 'missing');
    assert.equal(blockedNativeSigningKeyProvider.canExportPublicKeyOnly, false);
    assert.equal(blockedNativeSigningKeyProvider.privateKeyExportable, 'unknown');
    assert(blockedNativeSigningKeyProvider.requiredEvidence.length > 0);

    await assert.rejects(
      blockedNativeSigningKeyProvider.signChallenge(new Uint8Array([1, 2, 3])),
      /not installed/,
    );
  });

  it('marks SecureStore prototype keys as demo-only and not production evidence', () => {
    assert.equal(secureStorePrototypeSigningKeyProviderReadiness.productionReady, false);
    assert.equal(
      secureStorePrototypeSigningKeyProviderReadiness.keyProtectionLevel,
      'prototype-securestore',
    );
    assert.equal(secureStorePrototypeSigningKeyProviderReadiness.privateKeyExportable, true);
    assert.equal(secureStorePrototypeSigningKeyProviderReadiness.canSignChallenge, true);
    assert.equal(secureStorePrototypeSigningKeyProviderReadiness.canExportPublicKeyOnly, false);
    assert.match(
      secureStorePrototypeSigningKeyProviderReadiness.evidenceSummary,
      /JavaScript can still access key material/,
    );
  });
});
