import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { DeviceIdentityProvider, LocalDeviceIdentity } from '../../security/deviceIdentityProvider';
import { signalX3dhPrekeyBundleFormat } from '../../security/signalPrekeyBundle';
import {
  createSignalPrekeyGenerationProvider,
  type SignalGeneratedDevicePrekeyBundle,
} from '../messages/messageEncryptionProvider';
import { createDeviceBundlePublicationProvider } from './deviceBundlePublication';

const keyMaterial = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdef0123456789+/_=-';

const identity: LocalDeviceIdentity = {
  accountId: 'account-1',
  accountDisplayName: 'CipherChat Tester',
  deviceId: 'device-1',
  deviceName: 'Test Device',
  identityKey: 'ed25519-spki:prototype-auth-key',
  signedPrekey: 'prototype_signed_prekey_existing',
  signedPrekeySignature: 'prototype_signed_prekey_signature_existing',
  oneTimePrekeys: ['prototype_one_time_prekey_existing'],
  fingerprint: '1111 2222 3333',
  provider: 'ed25519-noble-os-secure-store-v1',
  createdAt: new Date(0).toISOString(),
};

function key(kind: 'identity' | 'signed-prekey' | 'one-time-prekey', suffix = '') {
  return `signal-x3dh-v1:${kind}:${keyMaterial}${suffix}`;
}

const prototypeIdentityProvider: DeviceIdentityProvider = {
  async getOrCreateIdentity() {
    return identity;
  },
  async rotateIdentity() {
    return identity;
  },
  async clearIdentity() {},
  createDeviceBundle(input) {
    return {
      accountId: input.accountId,
      accountDisplayName: input.accountDisplayName,
      deviceId: input.deviceId,
      deviceName: input.deviceName,
      identityKey: input.identityKey,
      signedPrekey: input.signedPrekey,
      signedPrekeySignature: input.signedPrekeySignature,
      oneTimePrekeys: input.oneTimePrekeys,
    };
  },
  async generateOneTimePrekeys(count) {
    return Array.from({ length: count }, (_, index) => `prototype_one_time_prekey_${index}`);
  },
  async signDeviceChallenge() {
    return 'ed25519:signature';
  },
};

function signalBundle(count: number): SignalGeneratedDevicePrekeyBundle {
  return {
    format: signalX3dhPrekeyBundleFormat,
    identityKey: key('identity'),
    signedPrekey: key('signed-prekey'),
    signedPrekeySignature: `signal-x3dh-v1:signed-prekey-signature:${keyMaterial}`,
    oneTimePrekeys: Array.from({ length: count }, (_, index) => key('one-time-prekey', String(index).padStart(2, '0'))),
  };
}

describe('device bundle publication provider', () => {
  it('keeps prototype device bundles isolated to mock mode', async () => {
    const provider = createDeviceBundlePublicationProvider({ prototypeIdentityProvider });

    const bundle = await provider.createPublishableDeviceBundle({
      mode: 'mock',
      identity,
    });

    assert.equal(bundle.identityKey, identity.identityKey);
    assert.equal(bundle.signedPrekey, identity.signedPrekey);
    assert.deepEqual(bundle.oneTimePrekeys, identity.oneTimePrekeys);
  });

  it('blocks live publication until Signal prekey generation is production ready', async () => {
    const provider = createDeviceBundlePublicationProvider({ prototypeIdentityProvider });

    await assert.rejects(
      provider.createPublishableDeviceBundle({
        mode: 'live',
        identity,
      }),
      /Signal prekey generation requires/,
    );
  });

  it('uses generated signal-x3dh-v1 public prekeys for live device publication', async () => {
    const signalPrekeyProvider = createSignalPrekeyGenerationProvider({
      id: 'test-libsignal-prekey-adapter',
      productionReady: true,
      prekeyBundleFormat: signalX3dhPrekeyBundleFormat,
      async generateDevicePrekeyBundle(input) {
        return signalBundle(input.oneTimePrekeyCount);
      },
    });
    const provider = createDeviceBundlePublicationProvider({
      prototypeIdentityProvider,
      signalPrekeyProvider,
    });

    const bundle = await provider.createPublishableDeviceBundle({
      mode: 'live',
      identity,
      oneTimePrekeyCount: 3,
    });

    assert.equal(bundle.accountId, identity.accountId);
    assert.equal(bundle.deviceId, identity.deviceId);
    assert.equal(bundle.authIdentityKey, identity.identityKey);
    assert.equal(bundle.identityKey, key('identity'));
    assert.equal(bundle.signalIdentityKey, key('identity'));
    assert.equal(bundle.signedPrekey, key('signed-prekey'));
    assert.equal(bundle.oneTimePrekeys?.length, 3);
    assert.ok(bundle.oneTimePrekeys?.every((prekey) => prekey.startsWith('signal-x3dh-v1:one-time-prekey:')));
  });

  it('generates live top-up prekeys through the same Signal boundary', async () => {
    const signalPrekeyProvider = createSignalPrekeyGenerationProvider({
      id: 'test-libsignal-prekey-adapter',
      productionReady: true,
      prekeyBundleFormat: signalX3dhPrekeyBundleFormat,
      async generateDevicePrekeyBundle(input) {
        return signalBundle(input.oneTimePrekeyCount);
      },
    });
    const provider = createDeviceBundlePublicationProvider({
      prototypeIdentityProvider,
      signalPrekeyProvider,
    });

    const oneTimePrekeys = await provider.generateTopUpOneTimePrekeys({
      mode: 'live',
      identity,
      count: 4,
    });

    assert.equal(oneTimePrekeys.length, 4);
    assert.ok(oneTimePrekeys.every((prekey) => prekey.startsWith('signal-x3dh-v1:one-time-prekey:')));
  });
});
