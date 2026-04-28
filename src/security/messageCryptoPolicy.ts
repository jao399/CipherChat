import type { BackendMode } from '../config/api';

export type MessageCryptoProviderId = 'prototype-sha256-envelope-v1' | 'signal-double-ratchet-pending';

export type MessageCryptoReadiness = {
  provider: MessageCryptoProviderId;
  label: string;
  detail: string;
  productionReady: boolean;
  mockReady: boolean;
};

export const prototypeMessageCryptoReadiness: MessageCryptoReadiness = {
  provider: 'prototype-sha256-envelope-v1',
  label: 'Prototype envelope hashing',
  detail: 'Mock-only envelope preparation. Production sends require reviewed Signal/X3DH + Double Ratchet encryption.',
  productionReady: false,
  mockReady: true,
};

export function getMessageCryptoReadiness(_mode: BackendMode): MessageCryptoReadiness {
  return prototypeMessageCryptoReadiness;
}

export function canSendWithMessageCrypto(mode: BackendMode, readiness = getMessageCryptoReadiness(mode)) {
  return mode === 'mock' ? readiness.mockReady : readiness.productionReady;
}

export function assertCanPrepareOutboundFanout(mode: BackendMode, readiness = getMessageCryptoReadiness(mode)) {
  if (!canSendWithMessageCrypto(mode, readiness)) {
    throw new Error(
      'Live encrypted sending is blocked because CipherChat is still using the prototype message crypto provider. Integrate reviewed Signal/X3DH + Double Ratchet encryption before production sends.',
    );
  }
}
