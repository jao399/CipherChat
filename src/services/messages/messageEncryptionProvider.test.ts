import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  createSignalOneToOneMessageEncryptionProvider,
  pendingSignalMessageEncryptionProvider,
  prototypeMessageEncryptionProvider,
  signalOneToOneMessageEncryptionProvider,
  selectMessageEncryptionProvider,
  type MessageEncryptionProvider,
} from './messageEncryptionProvider';
import { signalX3dhPrekeyBundleFormat } from '../../security/signalPrekeyBundle';

describe('message encryption provider selection', () => {
  it('uses the explicit prototype provider only when mock mode needs UI fanout', () => {
    const provider = selectMessageEncryptionProvider('mock');

    assert.equal(provider.id, 'prototype-sha256-envelope-v1');
    assert.equal(provider.mockReady, true);
    assert.equal(provider.productionReady, false);
  });

  it('defaults live mode to the active Signal one-to-one provider gate', () => {
    const provider = selectMessageEncryptionProvider('live');

    assert.equal(provider.id, 'signal-x3dh-double-ratchet-v1');
    assert.equal(provider.mockReady, false);
    assert.equal(provider.productionReady, false);
  });

  it('allows explicit provider selection for future rollout controls', () => {
    assert.equal(selectMessageEncryptionProvider('live', 'prototype-sha256-envelope-v1'), prototypeMessageEncryptionProvider);
    assert.equal(selectMessageEncryptionProvider('mock', 'signal-double-ratchet-pending'), pendingSignalMessageEncryptionProvider);
    assert.equal(selectMessageEncryptionProvider('mock', 'signal-x3dh-double-ratchet-v1'), signalOneToOneMessageEncryptionProvider);
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

  it('keeps the active Signal provider gated until a reviewed adapter is installed', async () => {
    await assert.rejects(
      signalOneToOneMessageEncryptionProvider.prepareOutboundFanout({
        conversationId: 'chat_1',
        senderAccountId: 'account_1',
        senderDeviceId: 'device_1',
        plaintext: 'hello',
        disappearingTimer: '30s',
        recipients: [
          {
            accountId: 'account_2',
            deviceId: 'device_2',
            displayName: 'Maya',
            id: 'maya',
            identityFingerprint: 'ABCD',
            identityKey: 'ed25519-spki:public-key',
            safetyNumberBlocks: ['ABCD'],
            trustState: 'trusted',
          },
        ],
      }),
      /adapter is not installed/,
    );
  });

  it('can fan out through an injected production-ready Signal adapter', async () => {
    const provider = createSignalOneToOneMessageEncryptionProvider({
      id: 'test-libsignal-adapter',
      productionReady: true,
      prekeyBundleFormat: signalX3dhPrekeyBundleFormat,
      async encryptForRecipient(input) {
        return {
          messageId: `signal_${input.recipient.deviceId}`,
          header: 'signal-header:opaque',
          ciphertext: 'signal-body:opaque',
        };
      },
      async decryptInboundEnvelope(input) {
        return {
          conversationId: input.envelope.conversationId,
          messageId: input.envelope.messageId,
          plaintext: 'hello',
          receivedAt: '2026-04-29T00:00:00.000Z',
          senderAccountId: input.envelope.senderAccountId,
          senderDeviceId: input.envelope.senderDeviceId,
        };
      },
    });
    const fanout = await provider.prepareOutboundFanout({
      conversationId: 'chat_1',
      senderAccountId: 'account_1',
      senderDeviceId: 'device_1',
      plaintext: 'hello',
      disappearingTimer: '30s',
      recipients: [
        {
          accountId: 'account_2',
          deviceId: 'device_2',
          displayName: 'Maya',
          id: 'maya',
          identityFingerprint: 'ABCD',
          identityKey: 'ed25519-spki:public-key',
          safetyNumberBlocks: ['ABCD'],
          trustState: 'trusted',
        },
      ],
    });

    assert.equal(provider.productionReady, true);
    assert.equal(fanout.conversationId, 'signal_chat_1_account_1');
    assert.equal(fanout.envelopes[0].ciphertext, 'signal-body:opaque');
  });

  it('rejects adapters that do not declare the reviewed Signal X3DH prekey bundle format', async () => {
    const provider = createSignalOneToOneMessageEncryptionProvider({
      id: 'wrong-prekey-format-adapter',
      productionReady: true,
      prekeyBundleFormat: 'legacy-prekey-format' as typeof signalX3dhPrekeyBundleFormat,
      async encryptForRecipient() {
        throw new Error('should not encrypt with a mismatched prekey format');
      },
      async decryptInboundEnvelope() {
        throw new Error('should not decrypt with a mismatched prekey format');
      },
    });

    assert.equal(provider.productionReady, false);
    await assert.rejects(
      provider.prepareOutboundFanout({
        conversationId: 'chat_1',
        senderAccountId: 'account_1',
        senderDeviceId: 'device_1',
        plaintext: 'hello',
        disappearingTimer: '30s',
        recipients: [
          {
            accountId: 'account_2',
            deviceId: 'device_2',
            displayName: 'Maya',
            id: 'maya',
            identityFingerprint: 'ABCD',
            identityKey: 'signal-x3dh-v1:identity:ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-=',
            safetyNumberBlocks: ['ABCD'],
            trustState: 'trusted',
          },
        ],
      }),
      /signal-x3dh-v1 prekey bundles/,
    );
  });

  it('defines the provider shape expected by production crypto implementations', () => {
    const futureProvider: MessageEncryptionProvider = {
      id: 'signal-x3dh-double-ratchet-v1',
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
