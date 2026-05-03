import type { PublicKeyMaterial } from './cryptoContracts';

export type NativeSigningPlatform = 'android' | 'ios' | 'web' | 'unavailable';

export type NativeSigningEvidenceStatus = 'missing' | 'partial' | 'complete';

export type NativeSigningKeyProtectionLevel =
  | 'prototype-securestore'
  | 'os-backed-exportable-unknown'
  | 'android-keystore-non-exportable'
  | 'ios-keychain-non-exportable'
  | 'ios-secure-enclave-non-exportable'
  | 'unavailable';

export type PrivateKeyExportableState = boolean | 'unknown';

export type NativeSigningKeyProviderDescriptor = {
  providerId: string;
  platformSupport: NativeSigningPlatform[];
  productionReady: boolean;
  evidenceStatus: NativeSigningEvidenceStatus;
  keyProtectionLevel: NativeSigningKeyProtectionLevel;
  canGenerateKey: boolean;
  canExportPublicKeyOnly: boolean;
  canSignChallenge: boolean;
  privateKeyExportable: PrivateKeyExportableState;
  requiresNativeBuild: boolean;
  supportsRotation: boolean;
  supportsRevocation: boolean;
  reviewedImplementation: boolean;
  runtimeEvidenceAttached: boolean;
  requiredEvidence: string[];
  limitations: string[];
  evidenceSummary: string;
};

export type NativeSigningKeyProviderReadinessInput = NativeSigningKeyProviderDescriptor;

export type NativeSigningKeyEvidence = Pick<
  NativeSigningKeyProviderDescriptor,
  | 'evidenceStatus'
  | 'evidenceSummary'
  | 'keyProtectionLevel'
  | 'privateKeyExportable'
  | 'requiredEvidence'
  | 'reviewedImplementation'
  | 'runtimeEvidenceAttached'
>;

export type NativeSigningKeyProvider = NativeSigningKeyProviderDescriptor & {
  generateKeyPair(): Promise<{ publicKey: PublicKeyMaterial }>;
  getPublicKey(): Promise<PublicKeyMaterial | null>;
  signChallenge(challenge: Uint8Array): Promise<Uint8Array>;
  rotateKeyPair(): Promise<{ publicKey: PublicKeyMaterial }>;
  revokeKey(): Promise<void>;
  getEvidence(): NativeSigningKeyEvidence;
};

const missingNativeProviderEvidence = [
  'Reviewed Android Keystore or iOS Keychain/Secure Enclave implementation',
  'Runtime device proof that private key bytes are non-exportable',
  'Public-key-only export verification',
  'Challenge signing proof without exposing private key bytes to JavaScript',
  'Rotation and revocation behavior evidence',
];

export const blockedNativeSigningKeyProvider: NativeSigningKeyProvider = {
  providerId: 'native-non-exportable-signing-key-missing',
  canExportPublicKeyOnly: false,
  canGenerateKey: false,
  canSignChallenge: false,
  evidenceStatus: 'missing',
  evidenceSummary: 'No reviewed native Android Keystore/iOS Keychain provider is installed.',
  keyProtectionLevel: 'unavailable',
  limitations: [
    'Production device authentication must remain blocked until a reviewed native provider is installed.',
    'Expo Go and web cannot prove native non-exportable private-key behavior.',
  ],
  platformSupport: ['unavailable'],
  privateKeyExportable: 'unknown',
  productionReady: false,
  requiredEvidence: missingNativeProviderEvidence,
  requiresNativeBuild: true,
  reviewedImplementation: false,
  runtimeEvidenceAttached: false,
  supportsRevocation: false,
  supportsRotation: false,
  async generateKeyPair() {
    throw new Error('Native non-exportable signing key provider is not installed.');
  },
  async getPublicKey() {
    return null;
  },
  getEvidence() {
    return {
      evidenceStatus: this.evidenceStatus,
      evidenceSummary: this.evidenceSummary,
      keyProtectionLevel: this.keyProtectionLevel,
      privateKeyExportable: this.privateKeyExportable,
      requiredEvidence: this.requiredEvidence,
      reviewedImplementation: this.reviewedImplementation,
      runtimeEvidenceAttached: this.runtimeEvidenceAttached,
    };
  },
  async revokeKey() {
    throw new Error('Native non-exportable signing key provider is not installed.');
  },
  async rotateKeyPair() {
    throw new Error('Native non-exportable signing key provider is not installed.');
  },
  async signChallenge() {
    throw new Error('Native non-exportable signing key provider is not installed.');
  },
};

export const secureStorePrototypeSigningKeyProviderReadiness: NativeSigningKeyProviderDescriptor = {
  providerId: 'ed25519-noble-os-secure-store-v1',
  canExportPublicKeyOnly: false,
  canGenerateKey: true,
  canSignChallenge: true,
  evidenceStatus: 'partial',
  evidenceSummary:
    'Expo SecureStore keeps prototype private bytes outside AsyncStorage, but JavaScript can still access key material inside the signing store.',
  keyProtectionLevel: 'prototype-securestore',
  limitations: [
    'Safe for demo device identity signing only.',
    'Does not prove non-exportable Android Keystore or iOS Keychain/Secure Enclave behavior.',
    'Must not satisfy production encrypted messaging requirements.',
  ],
  platformSupport: ['android', 'ios'],
  privateKeyExportable: true,
  productionReady: false,
  requiredEvidence: missingNativeProviderEvidence,
  requiresNativeBuild: false,
  reviewedImplementation: false,
  runtimeEvidenceAttached: false,
  supportsRevocation: true,
  supportsRotation: true,
};
