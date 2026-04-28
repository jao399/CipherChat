import AsyncStorage from '@react-native-async-storage/async-storage';

import type { EncryptedEnvelopeFanoutRequest } from '../api/types';
import { assertNoPlaintextFieldsInOutboundQueue } from './outboundQueuePrivacy';

export type OutboundQueueState = 'queued' | 'sending' | 'sent' | 'failed';

export type OutboundQueueItem = {
  id: string;
  conversationId: string;
  recipientRecordId: string;
  recipientDisplayName: string;
  state: OutboundQueueState;
  attemptCount: number;
  envelopeCount: number;
  fanout: EncryptedEnvelopeFanoutRequest;
  createdAt: string;
  updatedAt: string;
  sentAt?: string;
  lastError?: string;
};

const OUTBOUND_QUEUE_STORAGE_KEY = '@cipherchat/outbound-envelope-queue-v1';

export async function readOutboundQueue() {
  const stored = await AsyncStorage.getItem(OUTBOUND_QUEUE_STORAGE_KEY);
  return stored ? (JSON.parse(stored) as OutboundQueueItem[]) : [];
}

export async function writeOutboundQueue(items: OutboundQueueItem[]) {
  assertNoPlaintextFieldsInOutboundQueue(items);
  await AsyncStorage.setItem(OUTBOUND_QUEUE_STORAGE_KEY, JSON.stringify(items));
}

export async function replaceOutboundQueueItem(items: OutboundQueueItem[], item: OutboundQueueItem) {
  const replaced = items.some((current) => current.id === item.id);
  const nextItems = replaced ? items.map((current) => (current.id === item.id ? item : current)) : [...items, item];
  await writeOutboundQueue(nextItems);
  return nextItems;
}

export async function updateOutboundQueueItem(
  items: OutboundQueueItem[],
  itemId: string,
  updater: (item: OutboundQueueItem) => OutboundQueueItem,
) {
  const nextItems = items.map((item) => (item.id === itemId ? updater(item) : item));
  await writeOutboundQueue(nextItems);
  return nextItems;
}
