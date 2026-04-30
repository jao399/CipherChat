import { signalX3dhPrekeyBundleFormat } from '../../security/signalPrekeyBundle';
import { getRegisteredSignalOneToOneCryptoAdapter } from './signalAdapterRegistry';
import type { SignalOneToOneCryptoAdapter } from './signalOneToOneCryptoProvider';

export type SignalAdapterReadiness = {
  installed: boolean;
  productionReady: boolean;
  prekeyBundleFormat?: string;
  eligibleForRegistration: boolean;
  summary: string;
};

export function evaluateSignalAdapterReadiness(
  adapter: SignalOneToOneCryptoAdapter | undefined = getRegisteredSignalOneToOneCryptoAdapter(),
): SignalAdapterReadiness {
  if (!adapter) {
    return {
      installed: false,
      productionReady: false,
      eligibleForRegistration: false,
      summary: 'No native Signal/libsignal adapter is registered.',
    };
  }

  if (adapter.prekeyBundleFormat !== signalX3dhPrekeyBundleFormat) {
    return {
      installed: true,
      productionReady: adapter.productionReady,
      prekeyBundleFormat: adapter.prekeyBundleFormat,
      eligibleForRegistration: false,
      summary: `Registered adapter ${adapter.id} does not use ${signalX3dhPrekeyBundleFormat}.`,
    };
  }

  if (!adapter.productionReady) {
    return {
      installed: true,
      productionReady: false,
      prekeyBundleFormat: adapter.prekeyBundleFormat,
      eligibleForRegistration: false,
      summary: `Registered adapter ${adapter.id} is installed but not marked production-ready.`,
    };
  }

  return {
    installed: true,
    productionReady: true,
    prekeyBundleFormat: adapter.prekeyBundleFormat,
    eligibleForRegistration: true,
    summary: `Registered adapter ${adapter.id} is eligible for Signal one-to-one provider use.`,
  };
}
