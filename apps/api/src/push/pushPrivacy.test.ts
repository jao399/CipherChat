import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  assertPushPayloadPrivacy,
  createGenericDeliveryPushPayload,
  findPushPayloadPrivacyViolations,
} from './pushPrivacy.js';

describe('push payload privacy', () => {
  it('creates generic wake payloads without message or sender metadata', () => {
    const payload = createGenericDeliveryPushPayload({
      messageIds: ['message_b', 'message_a'],
      recipientDeviceCount: 2,
    });

    assert.match(payload.opaqueEventId, /^push_[a-f0-9]{32}$/);
    assert.equal(payload.deliveryHint, 'encrypted_envelope_available');
    assert.equal('badgeCount' in payload, false);
    assert.deepEqual(Object.keys(payload).sort(), ['deliveryHint', 'opaqueEventId']);
  });

  it('keeps opaque event IDs stable regardless of message ID order', () => {
    const first = createGenericDeliveryPushPayload({
      messageIds: ['message_b', 'message_a'],
      recipientDeviceCount: 2,
    });
    const second = createGenericDeliveryPushPayload({
      messageIds: ['message_a', 'message_b'],
      recipientDeviceCount: 2,
    });

    assert.equal(first.opaqueEventId, second.opaqueEventId);
  });

  it('rejects plaintext and sensitive metadata fields', () => {
    const unsafePayload = {
      opaqueEventId: 'push_test',
      deliveryHint: 'encrypted_envelope_available',
      senderName: 'Eleanor',
      nested: {
        fileName: 'Quarterly_Report.pdf',
      },
    };

    assert.deepEqual(findPushPayloadPrivacyViolations(unsafePayload), ['$.senderName', '$.nested', '$.nested.fileName']);
    assert.throws(() => assertPushPayloadPrivacy(unsafePayload), /privacy-unsafe fields/);
  });

  it('clamps optional badge counts without adding other fields', () => {
    const payload = createGenericDeliveryPushPayload({
      messageIds: ['message_a'],
      recipientDeviceCount: 1,
      badgeCount: 421,
    });

    assert.equal(payload.badgeCount, 99);
    assert.deepEqual(Object.keys(payload).sort(), ['badgeCount', 'deliveryHint', 'opaqueEventId']);
  });
});
