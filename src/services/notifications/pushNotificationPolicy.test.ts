import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  assertPushNotificationPayloadSafe,
  findPushNotificationPolicyViolations,
  type GenericPushNotificationPayload,
} from './pushNotificationPolicy';

const safePayload: GenericPushNotificationPayload = {
  badgeCount: 2,
  deliveryHint: 'encrypted_envelope_available',
  opaqueEventId: 'evt_opaque_01',
};

describe('push notification metadata policy', () => {
  it('allows only generic delivery notifications', () => {
    assert.deepEqual(findPushNotificationPolicyViolations(safePayload), []);
    assert.doesNotThrow(() => assertPushNotificationPayloadSafe(safePayload));
  });

  it('blocks message plaintext and sender names', () => {
    const violations = findPushNotificationPolicyViolations({
      ...safePayload,
      messageText: 'meet at 9',
      senderName: 'Alice',
    });

    assert(violations.some((violation) => violation.includes('messageText')));
    assert(violations.some((violation) => violation.includes('senderName')));
    assert.throws(
      () => assertPushNotificationPayloadSafe({
        ...safePayload,
        plaintextPreview: 'secret preview',
      }),
      /plaintextPreview/,
    );
  });

  it('blocks filenames and conversation identifiers', () => {
    const violations = findPushNotificationPolicyViolations({
      ...safePayload,
      conversationId: 'conversation_1',
      fileName: 'Payroll.pdf',
    });

    assert(violations.some((violation) => violation.includes('conversationId')));
    assert(violations.some((violation) => violation.includes('fileName')));
  });

  it('blocks sensitive nested provider payload fields', () => {
    const violations = findPushNotificationPolicyViolations({
      ...safePayload,
      data: {
        senderAccountId: 'account_1',
        token: 'push-token',
      },
    });

    assert(violations.some((violation) => violation.includes('data.senderAccountId')));
    assert(violations.some((violation) => violation.includes('data.token')));
    assert(violations.some((violation) => violation.includes('payload.data')));
  });

  it('rejects non-generic hints and unsafe badge counts', () => {
    const violations = findPushNotificationPolicyViolations({
      badgeCount: 101,
      deliveryHint: 'message_from_alice',
      opaqueEventId: 'evt_opaque_01',
    });

    assert(violations.some((violation) => violation.includes('deliveryHint')));
    assert(violations.some((violation) => violation.includes('badgeCount')));
  });
});

