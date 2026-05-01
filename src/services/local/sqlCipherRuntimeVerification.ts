import type {
  EncryptedLocalDatabasePort,
  EncryptedLocalDatabaseStatus,
  EncryptedLocalRecord,
} from '../ports/encryptedLocalDatabase';
import { ENCRYPTED_LOCAL_DATABASE_SCHEMA_VERSION } from './encryptedDatabaseSchema';

export type SqlCipherRuntimeVerificationStepId =
  | 'initialize'
  | 'schema-v1'
  | 'write-test-record'
  | 'read-test-record'
  | 'encrypted-status'
  | 'cleanup-test-record';

export type SqlCipherRuntimeVerificationStep = {
  id: SqlCipherRuntimeVerificationStepId;
  passed: boolean;
  message: string;
};

export type SqlCipherRuntimeVerificationResult = {
  passed: boolean;
  checkedAt: string;
  status: EncryptedLocalDatabaseStatus;
  steps: SqlCipherRuntimeVerificationStep[];
  summary: string;
};

type VerificationRecordValue = {
  purpose: 'sqlcipher-runtime-verification';
  marker: 'non-sensitive-test-record';
  schemaVersion: number;
};

const SQLCIPHER_VERIFICATION_RECORD_ID = 'sqlcipher-runtime-verification-v1';

function step(id: SqlCipherRuntimeVerificationStepId, passed: boolean, message: string) {
  return { id, message, passed };
}

function summarize(steps: SqlCipherRuntimeVerificationStep[]) {
  const failed = steps.find((item) => !item.passed);

  if (failed) {
    return `SQLCipher runtime verification failed at ${failed.id}: ${failed.message}`;
  }

  return 'SQLCipher runtime verification passed: encrypted database opened, schema v1 applied, and a harmless test record round-tripped.';
}

export async function runSqlCipherRuntimeVerification(
  database: EncryptedLocalDatabasePort,
  now: () => string = () => new Date().toISOString(),
): Promise<SqlCipherRuntimeVerificationResult> {
  const checkedAt = now();
  const steps: SqlCipherRuntimeVerificationStep[] = [];
  let status = await database.getStatus();

  try {
    status = await database.initialize();
    steps.push(
      step(
        'initialize',
        status.available,
        status.available
          ? `${status.adapterName} opened through ${status.driver ?? 'unknown driver'}.`
          : status.lastError ?? 'Encrypted database is unavailable.',
      ),
    );

    if (!status.available) {
      return {
        checkedAt,
        passed: false,
        status,
        steps,
        summary: summarize(steps),
      };
    }

    steps.push(
      step(
        'schema-v1',
        status.schemaVersion === ENCRYPTED_LOCAL_DATABASE_SCHEMA_VERSION,
        `Adapter reported schema v${status.schemaVersion}.`,
      ),
    );

    const record: EncryptedLocalRecord<VerificationRecordValue> = {
      createdAt: checkedAt,
      id: SQLCIPHER_VERIFICATION_RECORD_ID,
      kind: 'deviceMetadata',
      updatedAt: checkedAt,
      value: {
        marker: 'non-sensitive-test-record',
        purpose: 'sqlcipher-runtime-verification',
        schemaVersion: status.schemaVersion,
      },
    };

    await database.put(record);
    steps.push(
      step(
        'write-test-record',
        true,
        'Wrote a harmless deviceMetadata verification record with no message or file content.',
      ),
    );

    const stored = await database.get<VerificationRecordValue>('deviceMetadata', SQLCIPHER_VERIFICATION_RECORD_ID);
    const recordRoundTripped =
      stored?.value.marker === 'non-sensitive-test-record'
      && stored.value.purpose === 'sqlcipher-runtime-verification'
      && stored.value.schemaVersion === status.schemaVersion;
    steps.push(
      step(
        'read-test-record',
        recordRoundTripped,
        recordRoundTripped
          ? 'Read the harmless verification record back successfully.'
          : 'Verification record did not round-trip.',
      ),
    );

    steps.push(
      step(
        'encrypted-status',
        status.encrypted === true,
        status.encrypted
          ? 'Adapter reported encrypted=true.'
          : 'Adapter did not report encrypted=true.',
      ),
    );

    await database.delete('deviceMetadata', SQLCIPHER_VERIFICATION_RECORD_ID);
    steps.push(
      step(
        'cleanup-test-record',
        true,
        'Removed the harmless verification record after the runtime check.',
      ),
    );
  } catch (error) {
    steps.push(
      step(
        'cleanup-test-record',
        false,
        error instanceof Error ? error.message : 'SQLCipher runtime verification failed.',
      ),
    );
  }

  const passed = steps.length > 0 && steps.every((item) => item.passed);
  return {
    checkedAt,
    passed,
    status,
    steps,
    summary: summarize(steps),
  };
}

