import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

import { signalX3dhPrekeyBundleFormat } from '../../security/signalPrekeyBundle';
import {
  clearRegisteredSignalOneToOneCryptoAdapter,
  evaluateSignalAdapterReadiness,
  registerSignalOneToOneCryptoAdapter,
} from './messageEncryptionProvider';

describe('Signal adapter readiness', () => {
  beforeEach(() => {
    clearRegisteredSignalOneToOneCryptoAdapter();
  });

  it('reports no native adapter when nothing is registered', () => {
    const readiness = evaluateSignalAdapterReadiness();

    assert.equal(readiness.installed, false);
    assert.equal(readiness.eligibleForRegistration, false);
    assert.match(readiness.summary, /No native Signal\/libsignal adapter/);
  });

  it('blocks registered adapters with an incompatible prekey bundle format', () => {
    registerSignalOneToOneCryptoAdapter({
      id: 'legacy-adapter',
      productionReady: true,
      prekeyBundleFormat: 'legacy-format' as typeof signalX3dhPrekeyBundleFormat,
      async encryptForRecipient() {
        throw new Error('not needed');
      },
      async decryptInboundEnvelope() {
        throw new Error('not needed');
      },
    });

    const readiness = evaluateSignalAdapterReadiness();

    assert.equal(readiness.installed, true);
    assert.equal(readiness.productionReady, true);
    assert.equal(readiness.eligibleForRegistration, false);
    assert.match(readiness.summary, /does not use signal-x3dh-v1/);
  });

  it('marks reviewed signal-x3dh-v1 adapters eligible for provider use', () => {
    registerSignalOneToOneCryptoAdapter({
      id: 'reviewed-libsignal-adapter',
      productionReady: true,
      prekeyBundleFormat: signalX3dhPrekeyBundleFormat,
      async encryptForRecipient() {
        throw new Error('not needed');
      },
      async decryptInboundEnvelope() {
        throw new Error('not needed');
      },
    });

    const readiness = evaluateSignalAdapterReadiness();

    assert.equal(readiness.installed, true);
    assert.equal(readiness.productionReady, true);
    assert.equal(readiness.eligibleForRegistration, true);
    assert.match(readiness.summary, /eligible/);
  });
});
