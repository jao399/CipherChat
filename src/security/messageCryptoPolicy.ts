import type { BackendMode } from '../config/api';
import {
  evaluateSignalAdapterReadiness,
  selectMessageEncryptionProvider,
  type MessageCryptoProviderId,
  type MessageEncryptionProvider,
} from '../services/messages/messageEncryptionProvider';

export type { MessageCryptoProviderId } from '../services/messages/messageEncryptionProvider';

export type MessageCryptoReadiness = {
  provider: MessageCryptoProviderId;
  label: string;
  detail: string;
  productionReady: boolean;
  mockReady: boolean;
  signalAdapterInstalled: boolean;
  signalAdapterEligible: boolean;
  signalAdapterSummary: string;
};

function readinessFromProvider(provider: MessageEncryptionProvider): MessageCryptoReadiness {
  const signalAdapterReadiness = evaluateSignalAdapterReadiness();

  return {
    provider: provider.id,
    label: provider.label,
    detail:
      provider.id === 'signal-x3dh-double-ratchet-v1'
        ? `${provider.detail} ${signalAdapterReadiness.summary}`
        : provider.detail,
    productionReady: provider.productionReady,
    mockReady: provider.mockReady,
    signalAdapterInstalled: signalAdapterReadiness.installed,
    signalAdapterEligible: signalAdapterReadiness.eligibleForRegistration,
    signalAdapterSummary: signalAdapterReadiness.summary,
  };
}

export function getMessageCryptoReadiness(mode: BackendMode, provider = selectMessageEncryptionProvider(mode)): MessageCryptoReadiness {
  return readinessFromProvider(provider);
}

export function canSendWithMessageCrypto(mode: BackendMode, readiness = getMessageCryptoReadiness(mode)) {
  return mode === 'mock' ? readiness.mockReady : readiness.productionReady;
}

export function assertCanPrepareOutboundFanout(mode: BackendMode, readiness = getMessageCryptoReadiness(mode)) {
  if (!canSendWithMessageCrypto(mode, readiness)) {
    throw new Error(
      'Live encrypted sending is blocked because CipherChat does not have a production-ready message crypto provider. Integrate reviewed Signal/X3DH + Double Ratchet encryption before production sends.',
    );
  }
}

export function assertCanProcessInboundEnvelopes(mode: BackendMode, readiness = getMessageCryptoReadiness(mode)) {
  if (!canSendWithMessageCrypto(mode, readiness)) {
    throw new Error(
      'Live encrypted receiving is blocked because CipherChat does not have a production-ready message crypto provider. Integrate reviewed Signal/X3DH + Double Ratchet decrypt support before production receives.',
    );
  }
}
