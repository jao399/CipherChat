import type {
  AccountId,
  Base64String,
  EncryptedFileDescriptor,
  FileId,
} from '../../security';
import type {
  EncryptedUploadSession,
  FileServicePort,
} from '../ports';

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

export type FileCryptoAdapter = {
  id: string;
  productionReady: boolean;
  encryptFile(input: PlainFileInput): Promise<EncryptedFilePayload>;
  decryptFile(input: {
    descriptor: EncryptedFileDescriptor;
    ciphertext: Uint8Array;
  }): Promise<DecryptedFilePayload>;
};

export type EncryptedObjectTransferAdapter = {
  uploadEncryptedBytes(session: EncryptedUploadSession, ciphertext: Uint8Array): Promise<{ objectRef: string }>;
  downloadEncryptedBytes(descriptor: EncryptedFileDescriptor): Promise<Uint8Array>;
};

export type SecureFileTransferProvider = {
  readonly id: string;
  readonly productionReady: boolean;
  uploadEncryptedFile(input: PlainFileInput): Promise<EncryptedFileDescriptor>;
  downloadEncryptedFile(descriptor: EncryptedFileDescriptor): Promise<DecryptedFilePayload>;
};

export type SecureFileTransferProviderOptions = {
  cryptoAdapter?: FileCryptoAdapter;
  fileService: FileServicePort;
  objectTransfer: EncryptedObjectTransferAdapter;
};

function assertProductionFileCrypto(adapter: FileCryptoAdapter | undefined): asserts adapter is FileCryptoAdapter {
  if (!adapter?.productionReady) {
    throw new Error('Secure file transfer requires a production-ready client-side file crypto adapter.');
  }
}

function assertFileInput(input: PlainFileInput) {
  if (!input.name.trim()) {
    throw new Error('Secure file transfer requires a file name for local encryption metadata.');
  }

  if (input.bytes.byteLength === 0) {
    throw new Error('Secure file transfer cannot upload an empty file.');
  }
}

export function createSecureFileTransferProvider({
  cryptoAdapter,
  fileService,
  objectTransfer,
}: SecureFileTransferProviderOptions): SecureFileTransferProvider {
  return {
    id: cryptoAdapter?.id ?? 'secure-file-transfer-gated',
    productionReady: cryptoAdapter?.productionReady === true,

    async uploadEncryptedFile(input) {
      assertFileInput(input);
      assertProductionFileCrypto(cryptoAdapter);

      const encrypted = await cryptoAdapter.encryptFile(input);
      const session = await fileService.createEncryptedUploadSession({
        ownerAccountId: input.ownerAccountId,
        sizeBytes: encrypted.ciphertext.byteLength,
        expiresAt: input.expiresAt,
      });
      const uploaded = await objectTransfer.uploadEncryptedBytes(session, encrypted.ciphertext);
      const descriptor: EncryptedFileDescriptor = {
        fileId: session.fileId,
        ownerAccountId: input.ownerAccountId,
        objectRef: uploaded.objectRef,
        encryptedName: encrypted.encryptedName,
        encryptedMimeType: encrypted.encryptedMimeType,
        sizeBytes: encrypted.ciphertext.byteLength,
        contentDigest: encrypted.contentDigest,
        algorithm: encrypted.algorithm,
        createdAt: new Date().toISOString(),
        expiresAt: input.expiresAt ?? session.expiresAt,
      };

      return fileService.completeEncryptedUpload(descriptor);
    },

    async downloadEncryptedFile(descriptor) {
      assertProductionFileCrypto(cryptoAdapter);

      const ciphertext = await objectTransfer.downloadEncryptedBytes(descriptor);
      return cryptoAdapter.decryptFile({
        descriptor,
        ciphertext,
      });
    },
  };
}
