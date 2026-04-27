import type {
  AccountId,
  ConversationId,
  DeviceId,
  EncryptedMessageEnvelope,
  MessageId,
} from '../../security/cryptoContracts';

export type PendingMessageQuery = {
  accountId: AccountId;
  deviceId: DeviceId;
  cursor?: string;
  limit: number;
};

export type PendingMessagePage = {
  envelopes: EncryptedMessageEnvelope[];
  nextCursor?: string;
};

export type DeliveryReceipt = {
  messageId: MessageId;
  conversationId: ConversationId;
  recipientDeviceId: DeviceId;
  receivedAt: string;
};

export type MessageServicePort = {
  sendEnvelope(envelope: EncryptedMessageEnvelope): Promise<void>;
  getPendingMessages(query: PendingMessageQuery): Promise<PendingMessagePage>;
  acknowledgeDelivery(receipt: DeliveryReceipt): Promise<void>;
};
