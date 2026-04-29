import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { RemoteIdentityTrustRecord } from '../types';
import { assertRecipientTrustedForSend, evaluateRecipientTrustForSend } from './recipientTrustPolicy';

function trustRecord(trustState: RemoteIdentityTrustRecord['trustState']): RemoteIdentityTrustRecord {
  return {
    accountId: 'account_2',
    deviceId: 'device_2',
    displayName: 'Eleanor',
    id: 'eleanor',
    identityFingerprint: 'ABCD',
    identityKey: 'ed25519-spki:public-key',
    safetyNumberBlocks: ['ABCD'],
    trustState,
  };
}

describe('recipient trust send policy', () => {
  it('allows trusted recipient identity records', () => {
    assert.deepEqual(evaluateRecipientTrustForSend(trustRecord('trusted')), { allowed: true });
    assert.doesNotThrow(() => assertRecipientTrustedForSend(trustRecord('trusted')));
  });

  it('blocks missing recipient identity records', () => {
    const decision = evaluateRecipientTrustForSend();

    assert.equal(decision.allowed, false);
    assert.equal(decision.reason, 'missing');
    assert.throws(() => assertRecipientTrustedForSend(), /No recipient identity key/);
  });

  it('blocks new identity records until reviewed', () => {
    const decision = evaluateRecipientTrustForSend(trustRecord('new'));

    assert.equal(decision.allowed, false);
    assert.equal(decision.reason, 'new');
    assert.throws(() => assertRecipientTrustedForSend(trustRecord('new')), /Verify this contact safety number/);
  });

  it('blocks changed identity records with a high-friction warning', () => {
    const decision = evaluateRecipientTrustForSend(trustRecord('changed'));

    assert.equal(decision.allowed, false);
    assert.equal(decision.reason, 'changed');
    assert.throws(() => assertRecipientTrustedForSend(trustRecord('changed')), /safety number changed/);
  });
});
