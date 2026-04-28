import AsyncStorage from '@react-native-async-storage/async-storage';

import type { PendingEnvelope } from '../api/types';

export type InboundDeliveryReceipt = {
  messageId: string;
  envelopeId: string;
  conversationId: string;
  senderAccountId: string;
  senderDeviceId: string;
  recipientAccountId: string;
  recipientDeviceId: string;
  deliveryState: string;
  queuedAt: string;
  acknowledgedAt: string;
};

export type InboundEnvelopeSyncState = {
  nextCursor?: string;
  lastCursor?: string;
  lastPolledAt?: string;
  lastAcknowledgedAt?: string;
  totalFetched: number;
  totalAcknowledged: number;
  receipts: InboundDeliveryReceipt[];
};

const INBOUND_ENVELOPE_STORAGE_KEY = '@cipherchat/inbound-envelope-sync-v1';
const MAX_STORED_RECEIPTS = 200;

export const emptyInboundEnvelopeSyncState: InboundEnvelopeSyncState = {
  totalFetched: 0,
  totalAcknowledged: 0,
  receipts: [],
};

export async function readInboundEnvelopeSyncState() {
  const stored = await AsyncStorage.getItem(INBOUND_ENVELOPE_STORAGE_KEY);
  return stored ? (JSON.parse(stored) as InboundEnvelopeSyncState) : emptyInboundEnvelopeSyncState;
}

export async function writeInboundEnvelopeSyncState(state: InboundEnvelopeSyncState) {
  await AsyncStorage.setItem(INBOUND_ENVELOPE_STORAGE_KEY, JSON.stringify(state));
}

export async function mergeInboundDeliveryReceipts(
  state: InboundEnvelopeSyncState,
  input: {
    cursor?: string;
    nextCursor?: string;
    fetched: PendingEnvelope[];
    acknowledgements: Array<{ messageId: string; deliveryState: string; acknowledgedAt: string }>;
    polledAt: string;
  },
) {
  const acknowledgementsByMessage = new Map(input.acknowledgements.map((ack) => [ack.messageId, ack]));
  const nextReceipts = input.fetched.map<InboundDeliveryReceipt>((envelope) => {
    const acknowledgement = acknowledgementsByMessage.get(envelope.messageId);
    return {
      messageId: envelope.messageId,
      envelopeId: envelope.envelopeId,
      conversationId: envelope.conversationId,
      senderAccountId: envelope.senderAccountId,
      senderDeviceId: envelope.senderDeviceId,
      recipientAccountId: envelope.recipientAccountId,
      recipientDeviceId: envelope.recipientDeviceId,
      deliveryState: acknowledgement?.deliveryState ?? envelope.deliveryState,
      queuedAt: envelope.queuedAt,
      acknowledgedAt: acknowledgement?.acknowledgedAt ?? input.polledAt,
    };
  });
  const merged = new Map(state.receipts.map((receipt) => [receipt.messageId, receipt]));

  for (const receipt of nextReceipts) {
    merged.set(receipt.messageId, receipt);
  }

  const nextState: InboundEnvelopeSyncState = {
    nextCursor: input.nextCursor,
    lastCursor: input.cursor,
    lastPolledAt: input.polledAt,
    lastAcknowledgedAt: input.acknowledgements.at(-1)?.acknowledgedAt ?? state.lastAcknowledgedAt,
    totalFetched: state.totalFetched + input.fetched.length,
    totalAcknowledged: state.totalAcknowledged + input.acknowledgements.length,
    receipts: Array.from(merged.values()).slice(-MAX_STORED_RECEIPTS),
  };

  await writeInboundEnvelopeSyncState(nextState);
  return nextState;
}
