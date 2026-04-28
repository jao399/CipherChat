import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  pendingSignalMessageEncryptionProvider,
  prototypeMessageEncryptionProvider,
  selectMessageEncryptionProvider,
  type MessageEncryptionProvider,
} from './messageEncryptionProvider';

describe('message encryption provider selection', () => {
  it('uses the explicit prototype provider only when mock mode needs UI fanout', () => {
    const provider = selectMessageEncryptionProvider('mock');

    assert.equal(provider.id, 'prototype-sha256-envelope-v1');
    assert.equal(provider.mockReady, true);
    assert.equal(provider.productionReady, false);
  });

  it('defaults live mode to the pending production provider contract', () => {
    const provider = selectMessageEncryptionProvider('live');

    assert.equal(provider.id, 'signal-double-ratchet-pending');
    assert.equal(provider.mockReady, false);
    assert.equal(provider.productionReady, false);
  });

  it('allows explicit provider selection for future rollout controls', () => {
    assert.equal(selectMessageEncryptionProvider('live', 'prototype-sha256-envelope-v1'), prototypeMessageEncryptionProvider);
    assert.equal(selectMessageEncryptionProvider('mock', 'signal-double-ratchet-pending'), pendingSignalMessageEncryptionProvider);
  });

  it('keeps the pending Signal provider non-operational until implemented', async () => {
    await assert.rejects(
      pendingSignalMessageEncryptionProvider.prepareOutboundFanout({
        conversationId: 'chat_1',
        senderAccountId: 'account_1',
        senderDeviceId: 'device_1',
        plaintext: 'hello',
        disappearingTimer: '30s',
        recipients: [],
      }),
      /not implemented/,
    );
  });

  it('defines the provider shape expected by production crypto implementations', () => {
    const futureProvider: MessageEncryptionProvider = {
      id: 'signal-double-ratchet-pending',
      label: 'Reviewed Signal provider',
      detail: 'Future provider placeholder.',
      productionReady: true,
      mockReady: true,
      async prepareOutboundFanout() {
        return {
          conversationId: 'conversation_1',
          senderAccountId: 'account_1',
          senderDeviceId: 'device_1',
          envelopes: [],
        };
      },
    };

    assert.equal(futureProvider.productionReady, true);
  });
});
