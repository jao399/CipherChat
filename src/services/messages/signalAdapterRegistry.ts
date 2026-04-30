import type { SignalOneToOneCryptoAdapter } from './signalOneToOneCryptoProvider';

let registeredSignalOneToOneCryptoAdapter: SignalOneToOneCryptoAdapter | undefined;

export function registerSignalOneToOneCryptoAdapter(adapter: SignalOneToOneCryptoAdapter) {
  registeredSignalOneToOneCryptoAdapter = adapter;
}

export function clearRegisteredSignalOneToOneCryptoAdapter() {
  registeredSignalOneToOneCryptoAdapter = undefined;
}

export function getRegisteredSignalOneToOneCryptoAdapter() {
  return registeredSignalOneToOneCryptoAdapter;
}
