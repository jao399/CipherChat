import * as Crypto from 'expo-crypto';

import type { EncryptedEnvelopeFanoutRequest } from '../api/types';
import type { RemoteIdentityTrustRecord } from '../../types';

type PrepareOutboundFanoutInput = {
  conversationId: string;
  senderAccountId: string;
  senderDeviceId: string;
  plaintext: string;
  disappearingTimer: string;
  recipients: RemoteIdentityTrustRecord[];
};

function normalizeConversationId(conversationId: string, senderAccountId: string) {
  const safeId = conversationId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const base = `conversation_${safeId}_${senderAccountId.slice(0, 12)}`;
  return base.length >= 16 ? base : `${base}_prototype`;
}

async function digestPayload(value: unknown) {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, JSON.stringify(value));
}

async function messageIdFor(input: {
  conversationId: string;
  senderDeviceId: string;
  recipientDeviceId: string;
  nonce: string;
}) {
  const digest = await digestPayload(input);
  return `message_${digest.slice(0, 24)}`;
}

export async function preparePrototypeOutboundFanout(
  input: PrepareOutboundFanoutInput,
): Promise<EncryptedEnvelopeFanoutRequest> {
  const trustedRecipients = input.recipients.filter((recipient) => recipient.trustState === 'trusted');

  if (trustedRecipients.length === 0) {
    throw new Error('No trusted recipient device keys are available for this conversation.');
  }

  const conversationId = normalizeConversationId(input.conversationId, input.senderAccountId);
  const nonce = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const plaintextDigest = await digestPayload({
    plaintext: input.plaintext,
    nonce,
  });

  const envelopes = await Promise.all(
    trustedRecipients.map(async (recipient) => {
      const messageId = await messageIdFor({
        conversationId,
        senderDeviceId: input.senderDeviceId,
        recipientDeviceId: recipient.deviceId,
        nonce,
      });
      const header = await digestPayload({
        version: 'prototype-header-v1',
        conversationId,
        senderDeviceId: input.senderDeviceId,
        recipientDeviceId: recipient.deviceId,
        recipientIdentityKey: recipient.identityKey,
        disappearingTimer: input.disappearingTimer,
        nonce,
      });
      const ciphertext = await digestPayload({
        version: 'prototype-ciphertext-v1',
        plaintextDigest,
        recipientIdentityKey: recipient.identityKey,
        messageId,
      });

      return {
        messageId,
        recipientAccountId: recipient.accountId,
        recipientDeviceId: recipient.deviceId,
        header: `prototype-header-sha256:${header}`,
        ciphertext: `prototype-body-sha256:${ciphertext}`,
      };
    }),
  );

  return {
    conversationId,
    senderAccountId: input.senderAccountId,
    senderDeviceId: input.senderDeviceId,
    envelopes,
  };
}
