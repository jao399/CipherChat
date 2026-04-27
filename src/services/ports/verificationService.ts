import type {
  AccountId,
  DeviceId,
  SafetyNumber,
  VerificationState,
} from '../../security/cryptoContracts';

export type VerificationRecord = {
  accountId: AccountId;
  deviceId: DeviceId;
  state: VerificationState;
  safetyNumber: SafetyNumber;
  verifiedAt?: string;
};

export type VerificationServicePort = {
  getSafetyNumber(accountId: AccountId, deviceId: DeviceId): Promise<SafetyNumber>;
  markDeviceVerified(accountId: AccountId, deviceId: DeviceId): Promise<VerificationRecord>;
  markDeviceChanged(accountId: AccountId, deviceId: DeviceId): Promise<VerificationRecord>;
};
