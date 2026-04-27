import type {
  CryptoOperationResult,
  SecureStorageSecret,
} from '../../security/cryptoContracts';

export type LocalSecureStorePort = {
  setSecret(name: SecureStorageSecret, value: Uint8Array): Promise<CryptoOperationResult<void>>;
  getSecret(name: SecureStorageSecret): Promise<CryptoOperationResult<Uint8Array | null>>;
  deleteSecret(name: SecureStorageSecret): Promise<CryptoOperationResult<void>>;
};
