import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { signalX3dhPrekeyBundleFormat } from '../../security/signalPrekeyBundle';
import { createSignalPrekeyGenerationProvider } from './signalPrekeyGenerationProvider';

const keyMaterial = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-=';

function key(kind: 'identity' | 'signed-prekey' | 'one-time-prekey', suffix = '') {
  return `signal-x3dh-v1:${kind}:${keyMaterial}${suffix}`;
}

describe('Signal prekey generation provider', () => {
  it('blocks generation until a reviewed native adapter is installed', async () => {
    const provider = createSignalPrekeyGenerationProvider();

    assert.equal(provider.productionReady, false);
    await assert.rejects(
      provider.generateDevicePrekeyBundle({
        accountId: 'account_1',
        deviceId: 'device_1',
        deviceName: 'Device',
        oneTimePrekeyCount: 10,
      }),
      /reviewed production-ready/,
    );
  });

  it('generates a validated signal-x3dh-v1 prekey bundle through a production adapter', async () => {
    const provider = createSignalPrekeyGenerationProvider({
      id: 'test-libsignal-prekey-adapter',
      productionReady: true,
      prekeyBundleFormat: signalX3dhPrekeyBundleFormat,
      async generateDevicePrekeyBundle(input) {
        return {
          format: signalX3dhPrekeyBundleFormat,
          identityKey: key('identity'),
          signedPrekey: key('signed-prekey'),
          signedPrekeySignature: `signal-x3dh-v1:signed-prekey-signature:${keyMaterial}`,
          oneTimePrekeys: Array.from({ length: input.oneTimePrekeyCount }, (_, index) =>
            key('one-time-prekey', String(index).padStart(2, '0')),
          ),
        };
      },
    });

    const bundle = await provider.generateDevicePrekeyBundle({
      accountId: 'account_1',
      deviceId: 'device_1',
      deviceName: 'Device',
      oneTimePrekeyCount: 3,
    });

    assert.equal(provider.productionReady, true);
    assert.equal(bundle.format, signalX3dhPrekeyBundleFormat);
    assert.equal(bundle.oneTimePrekeys.length, 3);
  });

  it('rejects malformed adapter output before it can be published', async () => {
    const provider = createSignalPrekeyGenerationProvider({
      id: 'bad-output-adapter',
      productionReady: true,
      prekeyBundleFormat: signalX3dhPrekeyBundleFormat,
      async generateDevicePrekeyBundle() {
        return {
          format: signalX3dhPrekeyBundleFormat,
          identityKey: 'prototype_identity_key',
          signedPrekey: key('signed-prekey'),
          signedPrekeySignature: `signal-x3dh-v1:signed-prekey-signature:${keyMaterial}`,
          oneTimePrekeys: [key('one-time-prekey')],
        };
      },
    });

    await assert.rejects(
      provider.generateDevicePrekeyBundle({
        accountId: 'account_1',
        deviceId: 'device_1',
        deviceName: 'Device',
        oneTimePrekeyCount: 1,
      }),
      /identity key/,
    );
  });
});
