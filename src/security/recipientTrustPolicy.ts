import type { RemoteIdentityTrustRecord } from '../types';

export type RecipientTrustDecision = {
  allowed: boolean;
  reason?: 'missing' | 'new' | 'changed';
  message?: string;
};

export function evaluateRecipientTrustForSend(record?: RemoteIdentityTrustRecord): RecipientTrustDecision {
  if (!record) {
    return {
      allowed: false,
      reason: 'missing',
      message: 'No recipient identity key is available for this conversation.',
    };
  }

  if (record.trustState === 'changed') {
    return {
      allowed: false,
      reason: 'changed',
      message: 'This contact safety number changed. Review and trust the new safety number before sending.',
    };
  }

  if (record.trustState === 'new') {
    return {
      allowed: false,
      reason: 'new',
      message: 'Verify this contact safety number before sending encrypted messages.',
    };
  }

  return {
    allowed: true,
  };
}

export function assertRecipientTrustedForSend(record?: RemoteIdentityTrustRecord): asserts record is RemoteIdentityTrustRecord {
  const decision = evaluateRecipientTrustForSend(record);

  if (!decision.allowed) {
    throw new Error(decision.message);
  }
}
