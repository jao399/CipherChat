import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  assertPublicPrekeyBundleFormat,
  prototypePrekeyBundleFormat,
  signalX3dhPrekeyBundleFormat,
  validatePublicPrekeyBundleFormat,
} from './prekeyBundleFormatPolicy.js';

const keyMaterial = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdef0123456789+/_=-';

function key(kind: 'identity' | 'signed-prekey' | 'one-time-prekey') {
  return `signal-x3dh-v1:${kind}:${keyMaterial}`;
}

describe('prekey bundle format policy', () => {
  it('keeps legacy prototype bundles backward compatible', () => {
    const result = validatePublicPrekeyBundleFormat({
      identityKey: 'prototype-identity-key-material-0001',
      signedPrekey: 'prototype-signed-prekey-material-0001',
      signedPrekeySignature: 'prototype-signed-prekey-signature-0001',
      oneTimePrekeys: ['prototype-one-time-prekey-0001'],
    });

    assert.equal(result.format, prototypePrekeyBundleFormat);
    assert.deepEqual(result.errors, []);
  });

  it('accepts signal-x3dh-v1 public bundle material', () => {
    const format = assertPublicPrekeyBundleFormat({
      format: signalX3dhPrekeyBundleFormat,
      identityKey: key('identity'),
      signedPrekey: key('signed-prekey'),
      signedPrekeySignature: `signal-x3dh-v1:signed-prekey-signature:${keyMaterial}`,
      oneTimePrekeys: [key('one-time-prekey')],
    });

    assert.equal(format, signalX3dhPrekeyBundleFormat);
  });

  it('rejects malformed signal-x3dh-v1 public bundle material', () => {
    assert.throws(
      () =>
        assertPublicPrekeyBundleFormat({
          format: signalX3dhPrekeyBundleFormat,
          identityKey: 'prototype-identity-key-material-0001',
          signedPrekey: key('signed-prekey'),
          signedPrekeySignature: `signal-x3dh-v1:signed-prekey-signature:${keyMaterial}`,
          oneTimePrekeys: [key('one-time-prekey')],
        }),
      /Signal identity key/,
    );
  });

  it('rejects unsupported declared formats', () => {
    assert.throws(
      () =>
        assertPublicPrekeyBundleFormat({
          format: 'custom-crypto-v1',
          identityKey: key('identity'),
          signedPrekey: key('signed-prekey'),
          signedPrekeySignature: `signal-x3dh-v1:signed-prekey-signature:${keyMaterial}`,
        }),
      /Unsupported prekey bundle format/,
    );
  });
});
