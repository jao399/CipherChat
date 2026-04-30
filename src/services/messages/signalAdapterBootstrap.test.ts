import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

import { signalX3dhPrekeyBundleFormat } from '../../security/signalPrekeyBundle';
import {
  clearRegisteredSignalOneToOneCryptoAdapter,
  getRegisteredSignalOneToOneCryptoAdapter,
} from './messageEncryptionProvider';
import { bootstrapSignalOneToOneAdapter } from './signalAdapterBootstrap';
import type { SignalOneToOneCryptoAdapter } from './signalOneToOneCryptoProvider';

function adapter(overrides: Partial<SignalOneToOneCryptoAdapter> = {}): SignalOneToOneCryptoAdapter {
  return {
    id: 'reviewed-libsignal-adapter',
    productionReady: true,
    prekeyBundleFormat: signalX3dhPrekeyBundleFormat,
    async encryptForRecipient() {
      throw new Error('not needed');
    },
    async decryptInboundEnvelope() {
      throw new Error('not needed');
    },
    ...overrides,
  };
}

describe('Signal adapter bootstrap', () => {
  beforeEach(() => {
    clearRegisteredSignalOneToOneCryptoAdapter();
  });

  it('leaves the registry empty when no native adapter is provided', () => {
    const result = bootstrapSignalOneToOneAdapter();

    assert.equal(result.registered, false);
    assert.equal(result.installed, false);
    assert.equal(getRegisteredSignalOneToOneCryptoAdapter(), undefined);
  });

  it('refuses to register an adapter that is not production-ready', () => {
    const result = bootstrapSignalOneToOneAdapter(adapter({ productionReady: false }));

    assert.equal(result.registered, false);
    assert.equal(result.installed, true);
    assert.equal(result.eligibleForRegistration, false);
    assert.equal(getRegisteredSignalOneToOneCryptoAdapter(), undefined);
  });

  it('registers an eligible reviewed signal-x3dh-v1 adapter', () => {
    const result = bootstrapSignalOneToOneAdapter(adapter());

    assert.equal(result.registered, true);
    assert.equal(result.eligibleForRegistration, true);
    assert.equal(getRegisteredSignalOneToOneCryptoAdapter()?.id, 'reviewed-libsignal-adapter');
  });
});
