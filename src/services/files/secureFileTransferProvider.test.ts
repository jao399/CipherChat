import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { AccountId, EncryptedFileDescriptor, FileId } from '../../security';
import type { EncryptedUploadSession, FileServicePort } from '../ports';
import {
  createSecureFileTransferProvider,
  type EncryptedObjectTransferAdapter,
  type FileCryptoAdapter,
} from './secureFileTransferProvider';

const ownerAccountId = 'account_1' as AccountId;
const fileId = 'file_1' as FileId;

function createFileService(): { service: FileServicePort; completed: EncryptedFileDescriptor[] } {
  const completed: EncryptedFileDescriptor[] = [];
  const service: FileServicePort = {
    async createEncryptedUploadSession(input): Promise<EncryptedUploadSession> {
      return {
        expiresAt: input.expiresAt ?? '2026-04-29T00:10:00.000Z',
        fileId,
        uploadId: 'upload_1',
        uploadUrl: 'https://object-storage.invalid/upload_1',
      };
    },
    async completeEncryptedUpload(descriptor) {
      completed.push(descriptor);
      return descriptor;
    },
    async deleteEncryptedFile() {
      return undefined;
    },
  };

  return { completed, service };
}

function createObjectTransfer(): { transfer: EncryptedObjectTransferAdapter; uploaded: Uint8Array[] } {
  const uploaded: Uint8Array[] = [];
  const transfer: EncryptedObjectTransferAdapter = {
    async uploadEncryptedBytes(session, ciphertext) {
      uploaded.push(ciphertext);
      return { objectRef: `object://${session.uploadId}` };
    },
    async downloadEncryptedBytes() {
      return new Uint8Array([9, 8, 7]);
    },
  };

  return { transfer, uploaded };
}

const cryptoAdapter: FileCryptoAdapter = {
  id: 'test-file-crypto',
  productionReady: true,
  async encryptFile(input) {
    return {
      algorithm: 'AES-256-GCM',
      ciphertext: new Uint8Array([1, 2, 3, input.bytes.byteLength]),
      contentDigest: 'digest:encrypted',
      encryptedMimeType: 'encrypted:application/pdf',
      encryptedName: 'encrypted:Quarterly_Report.pdf',
    };
  },
  async decryptFile() {
    return {
      bytes: new Uint8Array([1, 2, 3]),
      mimeType: 'application/pdf',
      name: 'Quarterly_Report.pdf',
    };
  },
};

describe('secure file transfer provider', () => {
  it('blocks upload without a production-ready file crypto adapter', async () => {
    const { service } = createFileService();
    const { transfer } = createObjectTransfer();
    const provider = createSecureFileTransferProvider({
      fileService: service,
      objectTransfer: transfer,
    });

    await assert.rejects(
      provider.uploadEncryptedFile({
        bytes: new Uint8Array([1]),
        mimeType: 'application/pdf',
        name: 'Quarterly_Report.pdf',
        ownerAccountId,
      }),
      /production-ready client-side file crypto adapter/,
    );
  });

  it('uploads only encrypted bytes and completes encrypted metadata', async () => {
    const { completed, service } = createFileService();
    const { transfer, uploaded } = createObjectTransfer();
    const provider = createSecureFileTransferProvider({
      cryptoAdapter,
      fileService: service,
      objectTransfer: transfer,
    });
    const descriptor = await provider.uploadEncryptedFile({
      bytes: new Uint8Array([7, 7, 7]),
      mimeType: 'application/pdf',
      name: 'Quarterly_Report.pdf',
      ownerAccountId,
    });

    assert.equal(provider.productionReady, true);
    assert.equal(uploaded.length, 1);
    assert.deepEqual(uploaded[0], new Uint8Array([1, 2, 3, 3]));
    assert.equal(descriptor.objectRef, 'object://upload_1');
    assert.equal(descriptor.encryptedName, 'encrypted:Quarterly_Report.pdf');
    assert.equal(completed[0].contentDigest, 'digest:encrypted');
  });

  it('downloads encrypted bytes before decrypting locally', async () => {
    const { service } = createFileService();
    const { transfer } = createObjectTransfer();
    const provider = createSecureFileTransferProvider({
      cryptoAdapter,
      fileService: service,
      objectTransfer: transfer,
    });
    const file = await provider.downloadEncryptedFile({
      algorithm: 'AES-256-GCM',
      contentDigest: 'digest:encrypted',
      createdAt: '2026-04-29T00:00:00.000Z',
      fileId,
      objectRef: 'object://upload_1',
      ownerAccountId,
      sizeBytes: 3,
    });

    assert.equal(file.name, 'Quarterly_Report.pdf');
    assert.deepEqual(file.bytes, new Uint8Array([1, 2, 3]));
  });
});
