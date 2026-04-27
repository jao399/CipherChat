import type {
  AccountId,
  EncryptedFileDescriptor,
  FileId,
  IsoTimestamp,
} from '../../security/cryptoContracts';

export type CreateEncryptedUploadSessionInput = {
  ownerAccountId: AccountId;
  sizeBytes: number;
  expiresAt?: IsoTimestamp;
};

export type EncryptedUploadSession = {
  uploadId: string;
  fileId: FileId;
  uploadUrl: string;
  expiresAt: IsoTimestamp;
};

export type FileServicePort = {
  createEncryptedUploadSession(input: CreateEncryptedUploadSessionInput): Promise<EncryptedUploadSession>;
  completeEncryptedUpload(descriptor: EncryptedFileDescriptor): Promise<EncryptedFileDescriptor>;
  deleteEncryptedFile(fileId: FileId): Promise<void>;
};
