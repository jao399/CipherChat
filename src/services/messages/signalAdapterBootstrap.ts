import {
  clearRegisteredSignalOneToOneCryptoAdapter,
  registerSignalOneToOneCryptoAdapter,
} from './signalAdapterRegistry';
import { evaluateSignalAdapterReadiness, type SignalAdapterReadiness } from './signalAdapterReadiness';
import type { SignalOneToOneCryptoAdapter } from './signalOneToOneCryptoProvider';

export type SignalAdapterBootstrapResult = SignalAdapterReadiness & {
  registered: boolean;
};

export function bootstrapSignalOneToOneAdapter(
  adapter?: SignalOneToOneCryptoAdapter,
): SignalAdapterBootstrapResult {
  clearRegisteredSignalOneToOneCryptoAdapter();

  const candidateReadiness = evaluateSignalAdapterReadiness(adapter);

  if (!adapter || !candidateReadiness.eligibleForRegistration) {
    return {
      ...candidateReadiness,
      registered: false,
    };
  }

  registerSignalOneToOneCryptoAdapter(adapter);
  const registeredReadiness = evaluateSignalAdapterReadiness();

  return {
    ...registeredReadiness,
    registered: registeredReadiness.eligibleForRegistration,
  };
}
