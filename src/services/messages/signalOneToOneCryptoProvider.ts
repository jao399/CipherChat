import type { EncryptedEnvelopeFanoutRequest } from '../api/types';
import type { PendingEnvelope } from '../api/types';
import type { RemoteIdentityTrustRecord } from '../../types';
import type {
  MessageEncryptionProvider,
  PrepareMessageFanoutInput,
} from './messageEncryptionProvider';

export type SignalOneToOneEncryptedEnvelope = {
  messageId: string;
  header: string;
  ciphertext: string;
};

export type SignalOneToOneEncryptInput = {
  conversationId: string;
  senderAccountId: string;
  senderDeviceId: string;
  recipient: RemoteIdentityTrustRecord;
  plaintext: string;
  disappearingTimer: string;
};

export type SignalOneToOneDecryptInput = {
  envelope: PendingEnvelope;
  localAccountId: string;
  localDeviceId: string;
};

export type SignalOneToOneDecryptedMessage = {
  messageId: string;
  conversationId: string;
  senderAccountId: string;
  senderDeviceId: string;
  plaintext: string;
  receivedAt: string;
};

export type SignalOneToOneCryptoAdapter = {
  id: string;
  productionReady: boolean;
  encryptForRecipient(input: SignalOneToOneEncryptInput): Promise<SignalOneToOneEncryptedEnvelope>;
  decryptInboundEnvelope(input: SignalOneToOneDecryptInput): Promise<SignalOneToOneDecryptedMessage>;
};

function normalizedSignalConversationId(conversationId: string, senderAccountId: string) {
  const safeConversation = conversationId.replace(/[^a-zA-Z0-9_-]/g, '_');
  return `signal_${safeConversation}_${senderAccountId.slice(0, 12)}`;
}

function assertSignalInputReady(input: PrepareMessageFanoutInput) {
  if (!input.plaintext.trim()) {
    throw new Error('Signal provider cannot encrypt an empty message.');
  }

  const trustedRecipients = input.recipients.filter((recipient) => recipient.trustState === 'trusted');
  if (trustedRecipients.length === 0) {
    throw new Error('Signal provider requires at least one trusted recipient identity.');
  }

  for (const recipient of trustedRecipients) {
    if (!recipient.identityKey) {
      throw new Error(`Signal provider is missing identity key material for ${recipient.displayName}.`);
    }
  }

  return trustedRecipients;
}

export function createSignalOneToOneMessageEncryptionProvider(
  adapter?: SignalOneToOneCryptoAdapter,
): MessageEncryptionProvider {
  return {
    id: 'signal-x3dh-double-ratchet-v1',
    label: adapter?.productionReady ? 'Signal one-to-one encryption' : 'Signal provider gated',
    detail: adapter?.productionReady
      ? `Using ${adapter.id} for X3DH session setup and Double Ratchet message encryption.`
      : 'Awaiting reviewed libsignal/native adapter for Signal/X3DH + Double Ratchet one-to-one encryption.',
    productionReady: adapter?.productionReady === true,
    mockReady: false,
    async prepareOutboundFanout(input): Promise<EncryptedEnvelopeFanoutRequest> {
      const trustedRecipients = assertSignalInputReady(input);

      if (!adapter?.productionReady) {
        throw new Error('Signal/X3DH + Double Ratchet adapter is not installed or not marked production-ready.');
      }

      const conversationId = normalizedSignalConversationId(input.conversationId, input.senderAccountId);
      const envelopes = await Promise.all(
        trustedRecipients.map(async (recipient) => {
          const encrypted = await adapter.encryptForRecipient({
            conversationId,
            senderAccountId: input.senderAccountId,
            senderDeviceId: input.senderDeviceId,
            recipient,
            plaintext: input.plaintext,
            disappearingTimer: input.disappearingTimer,
          });

          return {
            messageId: encrypted.messageId,
            recipientAccountId: recipient.accountId,
            recipientDeviceId: recipient.deviceId,
            header: encrypted.header,
            ciphertext: encrypted.ciphertext,
          };
        }),
      );

      return {
        conversationId,
        senderAccountId: input.senderAccountId,
        senderDeviceId: input.senderDeviceId,
        envelopes,
      };
    },
  };
}

export const signalOneToOneMessageEncryptionProvider = createSignalOneToOneMessageEncryptionProvider();
