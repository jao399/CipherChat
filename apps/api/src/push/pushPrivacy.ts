import { createHash } from 'node:crypto';

export type PushDeliveryHint = 'encrypted_envelope_available' | 'sync_required';

export type GenericPushPayload = {
  opaqueEventId: string;
  deliveryHint: PushDeliveryHint;
  badgeCount?: number;
};

export type DeliveryPushPayloadInput = {
  messageIds: string[];
  recipientDeviceCount: number;
  badgeCount?: number;
};

export const allowedPushPayloadFields = ['opaqueEventId', 'deliveryHint', 'badgeCount'] as const;

export const forbiddenPushPayloadFields = [
  'messageText',
  'plaintext',
  'plaintextPreview',
  'senderName',
  'contactName',
  'groupName',
  'chatName',
  'fileName',
  'filename',
  'mediaCaption',
  'conversationTitle',
] as const;

const allowedPushPayloadFieldSet = new Set<string>(allowedPushPayloadFields);
const forbiddenPushPayloadFieldSet = new Set<string>(forbiddenPushPayloadFields);

export function createGenericDeliveryPushPayload(input: DeliveryPushPayloadInput): GenericPushPayload {
  const sortedMessageIds = [...input.messageIds].sort();
  const opaqueSeed = JSON.stringify({
    kind: 'delivery.fanout',
    messageIds: sortedMessageIds,
    recipientDeviceCount: input.recipientDeviceCount,
  });
  const opaqueEventId = `push_${createHash('sha256').update(opaqueSeed).digest('hex').slice(0, 32)}`;
  const payload: GenericPushPayload = {
    opaqueEventId,
    deliveryHint: 'encrypted_envelope_available',
  };

  if (typeof input.badgeCount === 'number') {
    payload.badgeCount = clampBadgeCount(input.badgeCount);
  }

  assertPushPayloadPrivacy(payload);
  return payload;
}

export function findPushPayloadPrivacyViolations(value: unknown) {
  const violations: string[] = [];

  function walk(current: unknown, path: string, isRootObject: boolean) {
    if (!current || typeof current !== 'object') {
      return;
    }

    if (Array.isArray(current)) {
      current.forEach((item, index) => walk(item, `${path}[${index}]`, false));
      return;
    }

    for (const [key, nestedValue] of Object.entries(current)) {
      const nestedPath = `${path}.${key}`;
      if (isRootObject && !allowedPushPayloadFieldSet.has(key)) {
        violations.push(nestedPath);
      }
      if (forbiddenPushPayloadFieldSet.has(key)) {
        violations.push(nestedPath);
      }
      walk(nestedValue, nestedPath, false);
    }
  }

  walk(value, '$', true);
  return [...new Set(violations)];
}

export function assertPushPayloadPrivacy(value: unknown) {
  const violations = findPushPayloadPrivacyViolations(value);
  if (violations.length > 0) {
    throw new Error(`Push payload contains privacy-unsafe fields: ${violations.join(', ')}`);
  }
}

function clampBadgeCount(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(Math.max(Math.trunc(value), 0), 99);
}
