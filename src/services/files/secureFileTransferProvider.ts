import type {
  EncryptedFileDescriptor,
} from '../../security/cryptoContracts';
import type {
  EncryptedUploadSession,
  FileServicePort,
} from '../ports/fileService';
import {
  assertFileEncryptionAdapterReady,
  type DecryptedFilePayload,
  type EncryptedFilePayload,
  type FileEncryptionAdapter,
  type PlainFileInput,
} from './fileEncryptionProvider';

export type {
  DecryptedFilePayload,
  EncryptedFilePayload,
  FileEncryptionAdapter,
  PlainFileInput,
};

export type FileCryptoAdapter = FileEncryptionAdapter;

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
      assertFileEncryptionAdapterReady(cryptoAdapter);

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
      assertFileEncryptionAdapterReady(cryptoAdapter);

      const ciphertext = await objectTransfer.downloadEncryptedBytes(descriptor);
      return cryptoAdapter.decryptFile({
        descriptor,
        ciphertext,
      });
    },
  };
}
