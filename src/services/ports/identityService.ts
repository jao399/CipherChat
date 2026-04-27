import type {
  AccountId,
  DeviceId,
  DeviceIdentityBundle,
  IsoTimestamp,
  VerificationState,
} from '../../security/cryptoContracts';

export type AccountProfile = {
  accountId: AccountId;
  displayName: string;
  username?: string;
  createdAt: IsoTimestamp;
};

export type RegisteredDevice = {
  deviceId: DeviceId;
  deviceName: string;
  verificationState: VerificationState;
  lastSeenAt?: IsoTimestamp;
  revokedAt?: IsoTimestamp;
};

export type RegisterAccountInput = {
  displayName: string;
  username?: string;
  primaryDevice: DeviceIdentityBundle;
};

export type IdentityServicePort = {
  registerAccount(input: RegisterAccountInput): Promise<AccountProfile>;
  listDevices(accountId: AccountId): Promise<RegisteredDevice[]>;
  publishDeviceBundle(bundle: DeviceIdentityBundle): Promise<void>;
  revokeDevice(accountId: AccountId, deviceId: DeviceId): Promise<void>;
};
