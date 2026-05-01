import type {
  AccountId,
  Base64String,
  EncryptedFileDescriptor,
} from '../../security/cryptoContracts';
import {
  assertFileCryptoReadyForProduction,
  evaluateFileCryptoReadiness,
  type FileCryptoReadiness,
} from '../../security/fileCryptoPolicy';

export type PlainFileInput = {
  ownerAccountId: AccountId;
  name: string;
  mimeType: string;
  bytes: Uint8Array;
  expiresAt?: string;
};

export type EncryptedFilePayload = {
  ciphertext: Uint8Array;
  encryptedName: Base64String;
  encryptedMimeType: Base64String;
  contentDigest: Base64String;
  algorithm: EncryptedFileDescriptor['algorithm'];
};

export type DecryptedFilePayload = {
  name: string;
  mimeType: string;
  bytes: Uint8Array;
};

export type FileEncryptionAdapter = {
  id: string;
  productionReady: boolean;
  reviewedImplementation: boolean;
  encryptsFileBytes: boolean;
  encryptsMetadata: boolean;
  algorithm: EncryptedFileDescriptor['algorithm'];
  encryptFile(input: PlainFileInput): Promise<EncryptedFilePayload>;
  decryptFile(input: {
    descriptor: EncryptedFileDescriptor;
    ciphertext: Uint8Array;
  }): Promise<DecryptedFilePayload>;
};

export function evaluateFileEncryptionAdapterReadiness(
  adapter?: FileEncryptionAdapter,
): FileCryptoReadiness {
  return evaluateFileCryptoReadiness(adapter);
}

export function assertFileEncryptionAdapterReady(
  adapter?: FileEncryptionAdapter,
): asserts adapter is FileEncryptionAdapter {
  assertFileCryptoReadyForProduction(adapter);
}
