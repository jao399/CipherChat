import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  assertSignalX3dhPrekeyBundle,
  signalX3dhPrekeyBundleFormat,
  validateSignalX3dhPrekeyBundle,
  type SignalX3dhPrekeyBundle,
} from './signalPrekeyBundle';

const keyMaterial = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-=';

function validBundle(overrides: Partial<SignalX3dhPrekeyBundle> = {}): SignalX3dhPrekeyBundle {
  return {
    format: signalX3dhPrekeyBundleFormat,
    identityKey: `signal-x3dh-v1:identity:${keyMaterial}`,
    signedPrekey: `signal-x3dh-v1:signed-prekey:${keyMaterial}`,
    signedPrekeySignature: `signal-x3dh-v1:signed-prekey-signature:${keyMaterial}`,
    oneTimePrekey: `signal-x3dh-v1:one-time-prekey:${keyMaterial}`,
    ...overrides,
  };
}

describe('Signal X3DH prekey bundle contract', () => {
  it('accepts the reviewed Signal/X3DH public prekey bundle shape', () => {
    const validation = validateSignalX3dhPrekeyBundle(validBundle());

    assert.equal(validation.ok, true);
    assert.deepEqual(validation.errors, []);
  });

  it('rejects prototype prekey placeholders and non-Signal key prefixes', () => {
    const validation = validateSignalX3dhPrekeyBundle(
      validBundle({
        identityKey: 'ed25519-spki:prototype-public-identity-key',
        signedPrekey: 'prototype_signed_prekey_0001',
        signedPrekeySignature: 'prototype_signed_prekey_signature_0001',
        oneTimePrekey: 'prototype_one_time_prekey_0001',
      }),
    );

    assert.equal(validation.ok, false);
    assert.equal(validation.errors.length, 4);
  });

  it('throws a consolidated error when a production adapter receives an invalid bundle', () => {
    assert.throws(
      () =>
        assertSignalX3dhPrekeyBundle(
          validBundle({
            signedPrekeySignature: 'bad-signature',
          }),
        ),
      /signed prekey signature/,
    );
  });
});
