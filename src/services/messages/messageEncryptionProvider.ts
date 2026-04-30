import type { BackendMode } from '../../config/api';
import type { EncryptedEnvelopeFanoutRequest } from '../api/types';
import type { RemoteIdentityTrustRecord } from '../../types';
import { getRegisteredSignalOneToOneCryptoAdapter } from './signalAdapterRegistry';
import {
  createSignalOneToOneMessageEncryptionProvider,
  signalOneToOneMessageEncryptionProvider,
} from './signalOneToOneCryptoProvider';

export type MessageCryptoProviderId =
  | 'prototype-sha256-envelope-v1'
  | 'signal-double-ratchet-pending'
  | 'signal-x3dh-double-ratchet-v1';

export type PrepareMessageFanoutInput = {
  conversationId: string;
  senderAccountId: string;
  senderDeviceId: string;
  plaintext: string;
  disappearingTimer: string;
  recipients: RemoteIdentityTrustRecord[];
};

export type MessageEncryptionProvider = {
  id: MessageCryptoProviderId;
  label: string;
  detail: string;
  productionReady: boolean;
  mockReady: boolean;
  prepareOutboundFanout(input: PrepareMessageFanoutInput): Promise<EncryptedEnvelopeFanoutRequest>;
};

export const prototypeMessageEncryptionProvider: MessageEncryptionProvider = {
  id: 'prototype-sha256-envelope-v1',
  label: 'Prototype envelope hashing',
  detail: 'Mock-only envelope preparation. Production sends require reviewed Signal/X3DH + Double Ratchet encryption.',
  productionReady: false,
  mockReady: true,
  async prepareOutboundFanout(input) {
    const { preparePrototypeOutboundFanout } = await import('./outboundEnvelopeService');
    return preparePrototypeOutboundFanout(input);
  },
};

export const pendingSignalMessageEncryptionProvider: MessageEncryptionProvider = {
  id: 'signal-double-ratchet-pending',
  label: 'Signal provider pending',
  detail: 'Legacy production provider placeholder. Use signal-x3dh-double-ratchet-v1 for the active integration boundary.',
  productionReady: false,
  mockReady: false,
  async prepareOutboundFanout() {
    throw new Error('Signal/X3DH + Double Ratchet message encryption is not implemented yet.');
  },
};

export function readConfiguredMessageCryptoProviderId(): MessageCryptoProviderId | undefined {
  const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env;
  const configured = env?.EXPO_PUBLIC_CIPHERCHAT_MESSAGE_CRYPTO_PROVIDER;

  if (
    configured === 'prototype-sha256-envelope-v1' ||
    configured === 'signal-double-ratchet-pending' ||
    configured === 'signal-x3dh-double-ratchet-v1'
  ) {
    return configured;
  }

  return undefined;
}

export function selectMessageEncryptionProvider(
  mode: BackendMode,
  requestedProviderId = readConfiguredMessageCryptoProviderId(),
): MessageEncryptionProvider {
  if (requestedProviderId === 'prototype-sha256-envelope-v1') {
    return prototypeMessageEncryptionProvider;
  }

  if (requestedProviderId === 'signal-double-ratchet-pending') {
    return pendingSignalMessageEncryptionProvider;
  }

  if (requestedProviderId === 'signal-x3dh-double-ratchet-v1') {
    return getSignalOneToOneMessageEncryptionProvider();
  }

  return mode === 'mock' ? prototypeMessageEncryptionProvider : getSignalOneToOneMessageEncryptionProvider();
}

export function getSignalOneToOneMessageEncryptionProvider() {
  const adapter = getRegisteredSignalOneToOneCryptoAdapter();
  return adapter ? createSignalOneToOneMessageEncryptionProvider(adapter) : signalOneToOneMessageEncryptionProvider;
}

export {
  evaluateSignalAdapterReadiness,
  type SignalAdapterReadiness,
} from './signalAdapterReadiness';
export {
  clearRegisteredSignalOneToOneCryptoAdapter,
  getRegisteredSignalOneToOneCryptoAdapter,
  registerSignalOneToOneCryptoAdapter,
} from './signalAdapterRegistry';
export { createSignalOneToOneMessageEncryptionProvider, signalOneToOneMessageEncryptionProvider } from './signalOneToOneCryptoProvider';
