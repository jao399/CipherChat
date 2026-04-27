import type { RemoteIdentityTrustRecord, RemoteIdentityTrustState } from '../types';

export function describeRemoteTrustState(state: RemoteIdentityTrustState) {
  switch (state) {
    case 'changed':
      return {
        label: 'Key changed',
        detail: 'Review the safety number before sending sensitive messages.',
        icon: 'warning' as const,
      };
    case 'new':
      return {
        label: 'New key',
        detail: 'Verify this contact before trusting the conversation.',
        icon: 'help-circle' as const,
      };
    case 'trusted':
      return {
        label: 'Trusted',
        detail: 'Safety number is trusted on this device.',
        icon: 'shield-checkmark' as const,
      };
  }
}

export function findRemoteTrustRecord(records: RemoteIdentityTrustRecord[], id: string, displayName?: string) {
  const normalizedName = displayName?.trim().toLowerCase();
  return records.find((record) => record.id === id || record.displayName.toLowerCase() === normalizedName);
}
