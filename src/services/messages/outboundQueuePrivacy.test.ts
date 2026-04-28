import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  assertNoPlaintextFieldsInOutboundQueue,
  findOutboundQueuePlaintextFields,
} from './outboundQueuePrivacy';

const safeQueueItem = {
  attemptCount: 1,
  conversationId: 'eleanor',
  createdAt: '2026-04-28T00:00:00.000Z',
  envelopeCount: 1,
  fanout: {
    conversationId: 'conversation_eleanor_account',
    envelopes: [
      {
        ciphertext: 'prototype-body-sha256:abc123',
        header: 'prototype-header-sha256:def456',
        messageId: 'message_001',
        recipientAccountId: 'account_recipient',
        recipientDeviceId: 'device_recipient',
      },
    ],
    senderAccountId: 'account_sender',
    senderDeviceId: 'device_sender',
  },
  id: 'outbound_1',
  recipientDisplayName: 'Eleanor',
  recipientRecordId: 'eleanor',
  state: 'queued',
  updatedAt: '2026-04-28T00:00:00.000Z',
};

describe('outbound queue plaintext privacy guard', () => {
  it('allows durable encrypted-envelope queue metadata', () => {
    assert.deepEqual(findOutboundQueuePlaintextFields(safeQueueItem), []);
    assert.doesNotThrow(() => assertNoPlaintextFieldsInOutboundQueue(safeQueueItem));
  });

  it('detects direct plaintext draft fields', () => {
    const unsafe = {
      ...safeQueueItem,
      plaintext: 'meet me at noon',
    };

    assert.deepEqual(findOutboundQueuePlaintextFields(unsafe), ['$.plaintext']);
    assert.throws(() => assertNoPlaintextFieldsInOutboundQueue(unsafe), /plaintext fields/);
  });

  it('detects nested message text fields before they can be persisted', () => {
    const unsafe = {
      ...safeQueueItem,
      fanout: {
        ...safeQueueItem.fanout,
        envelopes: [
          {
            ...safeQueueItem.fanout.envelopes[0],
            messageText: 'hidden plaintext',
          },
        ],
      },
    };

    assert.deepEqual(findOutboundQueuePlaintextFields(unsafe), ['$.fanout.envelopes[0].messageText']);
  });

  it('does not treat encrypted payload field names as plaintext fields', () => {
    const safe = {
      bodyCiphertext: 'encrypted-body',
      headerCiphertext: 'encrypted-header',
      messageId: 'message_123',
    };

    assert.deepEqual(findOutboundQueuePlaintextFields(safe), []);
  });
});
