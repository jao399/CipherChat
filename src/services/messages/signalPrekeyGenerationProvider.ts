import {
  signalX3dhPrekeyBundleFormat,
  validateSignalX3dhPrekeyBundle,
  type SignalX3dhPrekeyBundleFormat,
} from '../../security/signalPrekeyBundle';

export type SignalPrekeyGenerationInput = {
  accountId: string;
  deviceId: string;
  deviceName: string;
  oneTimePrekeyCount: number;
};

export type SignalGeneratedDevicePrekeyBundle = {
  format: SignalX3dhPrekeyBundleFormat;
  identityKey: string;
  signedPrekey: string;
  signedPrekeySignature: string;
  oneTimePrekeys: string[];
};

export type SignalPrekeyGenerationAdapter = {
  id: string;
  productionReady: boolean;
  prekeyBundleFormat: SignalX3dhPrekeyBundleFormat;
  generateDevicePrekeyBundle(input: SignalPrekeyGenerationInput): Promise<SignalGeneratedDevicePrekeyBundle>;
};

export type SignalPrekeyGenerationProvider = {
  id: 'signal-prekey-generation-v1';
  productionReady: boolean;
  detail: string;
  generateDevicePrekeyBundle(input: SignalPrekeyGenerationInput): Promise<SignalGeneratedDevicePrekeyBundle>;
};

function assertGeneratedBundleReady(bundle: SignalGeneratedDevicePrekeyBundle) {
  const commonBundle = {
    format: bundle.format,
    identityKey: bundle.identityKey,
    signedPrekey: bundle.signedPrekey,
    signedPrekeySignature: bundle.signedPrekeySignature,
  };

  const baseValidation = validateSignalX3dhPrekeyBundle(commonBundle);

  if (!baseValidation.ok) {
    throw new Error(baseValidation.errors.join(' '));
  }

  for (const oneTimePrekey of bundle.oneTimePrekeys) {
    const validation = validateSignalX3dhPrekeyBundle({
      ...commonBundle,
      oneTimePrekey,
    });

    if (!validation.ok) {
      throw new Error(validation.errors.join(' '));
    }
  }
}

export function createSignalPrekeyGenerationProvider(
  adapter?: SignalPrekeyGenerationAdapter,
): SignalPrekeyGenerationProvider {
  const adapterReady =
    adapter?.productionReady === true && adapter.prekeyBundleFormat === signalX3dhPrekeyBundleFormat;

  return {
    id: 'signal-prekey-generation-v1',
    productionReady: adapterReady,
    detail: adapterReady
      ? `Using ${adapter.id} for Signal X3DH prekey generation.`
      : 'Awaiting reviewed native Signal/libsignal adapter for identity, signed prekey, and one-time prekey generation.',
    async generateDevicePrekeyBundle(input) {
      if (!adapterReady) {
        throw new Error('Signal prekey generation requires a reviewed production-ready signal-x3dh-v1 native adapter.');
      }

      const bundle = await adapter.generateDevicePrekeyBundle(input);
      assertGeneratedBundleReady(bundle);
      return bundle;
    },
  };
}

export const signalPrekeyGenerationProvider = createSignalPrekeyGenerationProvider();
