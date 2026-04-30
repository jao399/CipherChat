import type { BackendMode } from '../../config/api';
import type { DeviceIdentityProvider, LocalDeviceIdentity } from '../../security/deviceIdentityProvider';
import {
  signalPrekeyGenerationProvider,
  type SignalPrekeyGenerationProvider,
} from '../messages/messageEncryptionProvider';
import type { PublishDeviceBundleRequest } from './types';

export const DEFAULT_DEVICE_BUNDLE_PREKEY_COUNT = 24;

export type DeviceBundlePublicationProvider = {
  createPublishableDeviceBundle(input: {
    mode: BackendMode;
    identity: LocalDeviceIdentity;
    oneTimePrekeyCount?: number;
  }): Promise<PublishDeviceBundleRequest>;
  generateTopUpOneTimePrekeys(input: {
    mode: BackendMode;
    identity: LocalDeviceIdentity;
    count: number;
  }): Promise<string[]>;
};

type DeviceBundlePublicationProviderOptions = {
  prototypeIdentityProvider?: DeviceIdentityProvider;
  signalPrekeyProvider?: SignalPrekeyGenerationProvider;
};

export function createDeviceBundlePublicationProvider(
  options: DeviceBundlePublicationProviderOptions = {},
): DeviceBundlePublicationProvider {
  const prototypeIdentityProvider = options.prototypeIdentityProvider;
  const signalPrekeyProvider = options.signalPrekeyProvider ?? signalPrekeyGenerationProvider;

  return {
    async createPublishableDeviceBundle({ mode, identity, oneTimePrekeyCount = DEFAULT_DEVICE_BUNDLE_PREKEY_COUNT }) {
      if (mode === 'mock') {
        if (!prototypeIdentityProvider) {
          throw new Error('Mock device bundle publication requires the prototype identity provider.');
        }

        return prototypeIdentityProvider.createDeviceBundle(identity);
      }

      const generated = await signalPrekeyProvider.generateDevicePrekeyBundle({
        accountId: identity.accountId,
        deviceId: identity.deviceId,
        deviceName: identity.deviceName,
        oneTimePrekeyCount,
      });

      return {
        accountId: identity.accountId,
        accountDisplayName: identity.accountDisplayName,
        deviceId: identity.deviceId,
        deviceName: identity.deviceName,
        authIdentityKey: identity.identityKey,
        signalIdentityKey: generated.identityKey,
        identityKey: generated.identityKey,
        signedPrekey: generated.signedPrekey,
        signedPrekeySignature: generated.signedPrekeySignature,
        oneTimePrekeys: generated.oneTimePrekeys,
      };
    },

    async generateTopUpOneTimePrekeys({ mode, identity, count }) {
      if (mode === 'mock') {
        if (!prototypeIdentityProvider) {
          throw new Error('Mock prekey top-up requires the prototype identity provider.');
        }

        return prototypeIdentityProvider.generateOneTimePrekeys(count);
      }

      const generated = await signalPrekeyProvider.generateDevicePrekeyBundle({
        accountId: identity.accountId,
        deviceId: identity.deviceId,
        deviceName: identity.deviceName,
        oneTimePrekeyCount: count,
      });

      return generated.oneTimePrekeys;
    },
  };
}
