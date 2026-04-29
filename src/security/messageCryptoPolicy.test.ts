import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  assertCanPrepareOutboundFanout,
  canSendWithMessageCrypto,
  getMessageCryptoReadiness,
  type MessageCryptoReadiness,
} from './messageCryptoPolicy';

describe('message crypto production gate', () => {
  it('allows the selected mock provider only in mock mode', () => {
    assert.equal(canSendWithMessageCrypto('mock'), true);
    assert.equal(canSendWithMessageCrypto('live'), false);
  });

  it('blocks live sends while the active provider is not production ready', () => {
    assert.throws(
      () => assertCanPrepareOutboundFanout('live'),
      /production-ready message crypto provider/,
    );
  });

  it('documents the live provider contract as not production ready', () => {
    const readiness = getMessageCryptoReadiness('live');

    assert.equal(readiness.provider, 'signal-x3dh-double-ratchet-v1');
    assert.equal(readiness.productionReady, false);
    assert.match(readiness.detail, /Signal\/X3DH/);
  });

  it('can permit live sends once a reviewed provider is wired later', () => {
    const futureProvider: MessageCryptoReadiness = {
      provider: 'signal-x3dh-double-ratchet-v1',
      label: 'Reviewed Signal provider',
      detail: 'Future production provider placeholder for policy tests.',
      productionReady: true,
      mockReady: true,
    };

    assert.equal(canSendWithMessageCrypto('live', futureProvider), true);
    assert.doesNotThrow(() => assertCanPrepareOutboundFanout('live', futureProvider));
  });
});
