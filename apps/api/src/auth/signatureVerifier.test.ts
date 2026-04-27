import assert from 'node:assert/strict';
import { generateKeyPairSync, sign } from 'node:crypto';
import { describe, it } from 'node:test';

import {
  createDeviceSignatureVerifier,
  Ed25519DeviceSignatureVerifier,
  encodeEd25519ChallengeSignature,
  encodeEd25519IdentityKey,
  InsecureDevelopmentSignatureVerifier,
  RejectingDeviceSignatureVerifier,
} from './signatureVerifier.js';

const inputBase = {
  accountId: 'account_00000001',
  deviceId: 'device_000000001',
};

function createSignedChallenge(challenge = 'challenge-value') {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519');
  const publicKeyDer = publicKey.export({ format: 'der', type: 'spki' });
  const signature = sign(null, Buffer.from(challenge, 'utf8'), privateKey);

  return {
    challenge,
    identityKey: encodeEd25519IdentityKey(publicKeyDer),
    signature: encodeEd25519ChallengeSignature(signature),
  };
}

describe('device signature verifiers', () => {
  it('rejecting verifier always denies challenge signatures', async () => {
    const verifier = new RejectingDeviceSignatureVerifier();
    const signed = createSignedChallenge();

    const verified = await verifier.verifyDeviceChallenge({
      ...inputBase,
      ...signed,
    });

    assert.equal(verified, false);
  });

  it('development verifier accepts only the explicit dev challenge signature', async () => {
    const verifier = new InsecureDevelopmentSignatureVerifier();

    assert.equal(
      await verifier.verifyDeviceChallenge({
        ...inputBase,
        identityKey: 'prototype-key',
        challenge: 'challenge-value',
        signature: 'dev:challenge-value',
      }),
      true,
    );
    assert.equal(
      await verifier.verifyDeviceChallenge({
        ...inputBase,
        identityKey: 'prototype-key',
        challenge: 'challenge-value',
        signature: 'dev:other-challenge',
      }),
      false,
    );
  });

  it('ed25519 verifier accepts a valid challenge signature', async () => {
    const verifier = new Ed25519DeviceSignatureVerifier();
    const signed = createSignedChallenge();

    const verified = await verifier.verifyDeviceChallenge({
      ...inputBase,
      ...signed,
    });

    assert.equal(verified, true);
  });

  it('ed25519 verifier rejects signatures over a different challenge', async () => {
    const verifier = new Ed25519DeviceSignatureVerifier();
    const signed = createSignedChallenge('original-challenge');

    const verified = await verifier.verifyDeviceChallenge({
      ...inputBase,
      identityKey: signed.identityKey,
      challenge: 'changed-challenge',
      signature: signed.signature,
    });

    assert.equal(verified, false);
  });

  it('ed25519 verifier rejects malformed keys and signatures', async () => {
    const verifier = new Ed25519DeviceSignatureVerifier();

    assert.equal(
      await verifier.verifyDeviceChallenge({
        ...inputBase,
        identityKey: 'ed25519-spki:not-valid-@@',
        challenge: 'challenge-value',
        signature: 'ed25519:not-valid-@@',
      }),
      false,
    );
  });

  it('factory keeps reject-all as the safe default', async () => {
    assert.ok(createDeviceSignatureVerifier({}) instanceof RejectingDeviceSignatureVerifier);
    assert.ok(
      createDeviceSignatureVerifier({ DEVICE_SIGNATURE_VERIFIER: 'ed25519' }) instanceof Ed25519DeviceSignatureVerifier,
    );
    assert.ok(
      createDeviceSignatureVerifier({
        DEVICE_SIGNATURE_VERIFIER: 'ed25519',
        ALLOW_INSECURE_DEV_SIGNATURES: 'true',
      }) instanceof InsecureDevelopmentSignatureVerifier,
    );
  });
});
