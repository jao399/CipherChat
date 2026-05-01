export type PushDeliveryHint = 'encrypted_envelope_available' | 'sync_required';

export type GenericPushNotificationPayload = {
  opaqueEventId: string;
  deliveryHint: PushDeliveryHint;
  badgeCount?: number;
};

const allowedRootFields = new Set(['opaqueEventId', 'deliveryHint', 'badgeCount']);

const allowedDeliveryHints = new Set<PushDeliveryHint>([
  'encrypted_envelope_available',
  'sync_required',
]);

const forbiddenPushPayloadFields = new Set([
  'accountId',
  'body',
  'chatId',
  'chatName',
  'contactGraph',
  'contactName',
  'conversationId',
  'conversationTitle',
  'decryptedIdentifier',
  'fileName',
  'filename',
  'from',
  'groupName',
  'mediaCaption',
  'message',
  'messageText',
  'plaintext',
  'plaintextPreview',
  'recipientAccountId',
  'safetyNumber',
  'senderAccountId',
  'senderName',
  'subject',
  'text',
  'threadId',
  'title',
  'token',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function walkForbiddenFields(value: unknown, violations: string[], path = 'payload') {
  if (Array.isArray(value)) {
    value.forEach((item, index) => walkForbiddenFields(item, violations, `${path}[${index}]`));
    return;
  }

  if (!isRecord(value)) {
    return;
  }

  for (const [key, nestedValue] of Object.entries(value)) {
    if (forbiddenPushPayloadFields.has(key)) {
      violations.push(`${path}.${key} is not allowed in push notification payloads.`);
    }

    walkForbiddenFields(nestedValue, violations, `${path}.${key}`);
  }
}

export function findPushNotificationPolicyViolations(payload: unknown): string[] {
  const violations: string[] = [];

  if (!isRecord(payload)) {
    return ['Push notification payload must be an object.'];
  }

  walkForbiddenFields(payload, violations);

  for (const field of Object.keys(payload)) {
    if (!allowedRootFields.has(field)) {
      violations.push(`payload.${field} is not part of the generic push payload contract.`);
    }
  }

  if (typeof payload.opaqueEventId !== 'string' || payload.opaqueEventId.trim().length === 0) {
    violations.push('payload.opaqueEventId must be a non-empty opaque identifier.');
  }

  if (!allowedDeliveryHints.has(payload.deliveryHint as PushDeliveryHint)) {
    violations.push('payload.deliveryHint must be a generic delivery hint.');
  }

  const badgeCount = payload.badgeCount;
  if (badgeCount !== undefined) {
    if (typeof badgeCount !== 'number' || !Number.isInteger(badgeCount) || badgeCount < 0 || badgeCount > 99) {
      violations.push('payload.badgeCount must be an integer from 0 to 99 when present.');
    }
  }

  return violations;
}

export function assertPushNotificationPayloadSafe(
  payload: unknown,
): asserts payload is GenericPushNotificationPayload {
  const violations = findPushNotificationPolicyViolations(payload);

  if (violations.length > 0) {
    throw new Error(`Push notification payload violates metadata policy: ${violations.join(' ')}`);
  }
}
