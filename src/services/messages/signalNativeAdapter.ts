import type { SignalX3dhPrekeyBundle, SignalX3dhPrekeyBundleFormat } from '../../security/signalPrekeyBundle';

export type SignalNativePlatform = 'android' | 'ios';

export type SignalNativeEvidenceStatus = 'missing' | 'partial' | 'complete';

export type SignalNativeAdapterReadinessReport = {
  adapterId: string;
  officialLibsignalVersion: string;
  androidPackage?: 'org.signal:libsignal-client' | 'org.signal:libsignal-android';
  iosPod?: 'LibSignalClient';
  platforms: SignalNativePlatform[];
  productionReady: boolean;
  evidenceStatus: SignalNativeEvidenceStatus;
  reviewedImplementation: boolean;
  externalCryptoReviewComplete: boolean;
  x3dhVectorsPassing: boolean;
  doubleRatchetVectorsPassing: boolean;
  encryptedSessionStorageVerified: boolean;
  noPrivateKeyExportToJavaScript: boolean;
  noSensitiveLoggingVerified: boolean;
  limitations: string[];
};

export type SignalAndroidBridgeReadiness = {
  adapterInstalled: boolean;
  platform: 'android';
  library: 'official org.signal libsignal target';
  androidPackage: 'org.signal:libsignal-android';
  companionPackage: 'org.signal:libsignal-client';
  officialLibsignalVersion: string;
  productionReady: false;
  missing: string[];
};

export type SignalAndroidNativeBridge = {
  getReadiness(): Promise<SignalAndroidBridgeReadiness>;
  encryptOneToOne(payload: string): Promise<never>;
  decryptOneToOne(payload: string): Promise<never>;
};

type ReactNativeModuleContainer = {
  NativeModules?: {
    CipherChatSignalBridge?: SignalAndroidNativeBridge;
  };
};

export type SignalNativePublicIdentity = {
  accountId: string;
  deviceId: string;
  identityKey: string;
  registrationId: number;
};

export type SignalNativeSignedPrekey = {
  prekeyId: number;
  publicKey: string;
  signature: string;
  createdAt: string;
};

export type SignalNativeOneTimePrekey = {
  prekeyId: number;
  publicKey: string;
};

export type SignalNativeSessionRef = {
  sessionId: string;
  localAccountId: string;
  localDeviceId: string;
  remoteAccountId: string;
  remoteDeviceId: string;
  storageKey: string;
};

export type SignalNativeSessionSnapshot = {
  sessionRef: SignalNativeSessionRef;
  encryptedSerializedState: string;
  schemaVersion: 1;
};

export type SignalNativeCreateSessionInput = {
  localAccountId: string;
  localDeviceId: string;
  remoteAccountId: string;
  remoteDeviceId: string;
  remoteBundle: SignalX3dhPrekeyBundle;
};

export type SignalNativeEncryptInput = {
  sessionRef: SignalNativeSessionRef;
  plaintext: string;
  associatedData: string;
};

export type SignalNativeEncryptedMessage = {
  messageId: string;
  header: string;
  ciphertext: string;
  sessionRef: SignalNativeSessionRef;
};

export type SignalNativeDecryptInput = {
  sessionRef: SignalNativeSessionRef;
  header: string;
  ciphertext: string;
  associatedData: string;
};

export type SignalNativeDecryptedMessage = {
  plaintext: string;
  sessionRef: SignalNativeSessionRef;
};

export type SignalNativeIdentityFingerprint = {
  fingerprint: string;
  safetyNumberBlocks: string[];
};

export type SignalNativeIdentityChangeResult = {
  changed: boolean;
  previousFingerprint?: string;
  nextFingerprint: string;
};

export type SignalNativeAdapter = {
  getReadinessReport(): Promise<SignalNativeAdapterReadinessReport>;
  generateIdentityKeyPair(accountId: string, deviceId: string): Promise<SignalNativePublicIdentity>;
  generateSignedPrekey(identity: SignalNativePublicIdentity): Promise<SignalNativeSignedPrekey>;
  generateOneTimePrekeys(
    identity: SignalNativePublicIdentity,
    count: number,
  ): Promise<SignalNativeOneTimePrekey[]>;
  createSessionFromPrekeyBundle(input: SignalNativeCreateSessionInput): Promise<SignalNativeSessionRef>;
  encryptOneToOne(input: SignalNativeEncryptInput): Promise<SignalNativeEncryptedMessage>;
  decryptOneToOne(input: SignalNativeDecryptInput): Promise<SignalNativeDecryptedMessage>;
  serializeSession(sessionRef: SignalNativeSessionRef): Promise<SignalNativeSessionSnapshot>;
  restoreSession(snapshot: SignalNativeSessionSnapshot): Promise<SignalNativeSessionRef>;
  deleteSession(sessionRef: SignalNativeSessionRef): Promise<void>;
  getIdentityFingerprint(identity: SignalNativePublicIdentity): Promise<SignalNativeIdentityFingerprint>;
  detectIdentityChange(
    previous: SignalNativeIdentityFingerprint,
    next: SignalNativeIdentityFingerprint,
  ): Promise<SignalNativeIdentityChangeResult>;
};

export const signalNativeAdapterContractVersion = 'signal-native-adapter-contract-v1';

export const officialAndroidLibsignalVersion = '0.86.5';

export const missingAndroidLibsignalBridgeRequirements = [
  'X3DH identity and prekey generation',
  'Double Ratchet encrypt/decrypt',
  'Encrypted Signal session storage',
  'Safety-number and key-change verification',
  'External cryptography review evidence',
];

export const requiredSignalNativeAdapterEvidence = [
  'Pinned official libsignal version for Android and iOS',
  'Android Java/Kotlin bridge proof using official org.signal packages',
  'iOS Swift bridge proof using LibSignalClient',
  'X3DH/prekey interoperability vectors',
  'Double Ratchet encrypt/decrypt vectors',
  'Encrypted local Signal session storage evidence',
  'External cryptography review sign-off',
  'No sensitive logging review',
];

export function isSignalNativeAdapterProductionEvidenceComplete(
  report: SignalNativeAdapterReadinessReport,
  expectedPrekeyBundleFormat: SignalX3dhPrekeyBundleFormat,
) {
  return (
    report.productionReady === true &&
    report.evidenceStatus === 'complete' &&
    report.reviewedImplementation === true &&
    report.externalCryptoReviewComplete === true &&
    report.x3dhVectorsPassing === true &&
    report.doubleRatchetVectorsPassing === true &&
    report.encryptedSessionStorageVerified === true &&
    report.noPrivateKeyExportToJavaScript === true &&
    report.noSensitiveLoggingVerified === true &&
    report.officialLibsignalVersion.length > 0 &&
    expectedPrekeyBundleFormat === 'signal-x3dh-v1'
  );
}

export async function readAndroidSignalBridgeReadiness(
  bridge?: SignalAndroidNativeBridge,
): Promise<SignalAndroidBridgeReadiness> {
  if (!bridge) {
    return {
      adapterInstalled: false,
      androidPackage: 'org.signal:libsignal-android',
      companionPackage: 'org.signal:libsignal-client',
      library: 'official org.signal libsignal target',
      missing: [
        'Android native bridge module',
        ...missingAndroidLibsignalBridgeRequirements,
      ],
      officialLibsignalVersion: officialAndroidLibsignalVersion,
      platform: 'android',
      productionReady: false,
    };
  }

  const readiness = await bridge.getReadiness();

  return {
    ...readiness,
    adapterInstalled: readiness.adapterInstalled === true,
    androidPackage: 'org.signal:libsignal-android',
    companionPackage: 'org.signal:libsignal-client',
    library: 'official org.signal libsignal target',
    missing: readiness.productionReady ? [] : readiness.missing,
    officialLibsignalVersion: readiness.officialLibsignalVersion || officialAndroidLibsignalVersion,
    platform: 'android',
    productionReady: false,
  };
}

function loadReactNativeModules(): ReactNativeModuleContainer['NativeModules'] | undefined {
  try {
    const dynamicRequire = (0, eval)('require') as undefined | ((moduleName: string) => ReactNativeModuleContainer);
    return dynamicRequire?.('react-native')?.NativeModules;
  } catch {
    return undefined;
  }
}

export function getInstalledAndroidSignalNativeBridge() {
  return loadReactNativeModules()?.CipherChatSignalBridge;
}

export function readInstalledAndroidSignalBridgeReadiness() {
  return readAndroidSignalBridgeReadiness(getInstalledAndroidSignalNativeBridge());
}
