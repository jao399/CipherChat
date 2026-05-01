import type { PublicKeyMaterial } from './cryptoContracts';

export type NativeSigningKeyEvidence = {
  reviewedImplementation: boolean;
  runtimeEvidenceAttached: boolean;
  nonExportablePrivateKey: boolean;
  publicKeyExportOnly: boolean;
  privateKeyExportableToJavaScript: boolean;
  platformBackedBy?: 'android-keystore' | 'ios-keychain' | 'secure-enclave' | 'unknown';
  evidenceSummary: string;
};

export type NativeSigningKeyProviderReadinessInput = {
  id: string;
  productionReady: boolean;
  algorithm: 'ed25519';
  keyStorage: 'expo-secure-store' | 'native-non-exportable';
  supportsRotation: boolean;
  supportsRevocation: boolean;
  evidence: NativeSigningKeyEvidence;
};

export type NativeSigningKeyProviderReadiness = {
  provider: string;
  eligibleForProduction: boolean;
  summary: string;
  blockers: string[];
};

export type NativeSigningKeyProvider = NativeSigningKeyProviderReadinessInput & {
  generateKeyPair(): Promise<{ publicKey: PublicKeyMaterial }>;
  getPublicKey(): Promise<PublicKeyMaterial | null>;
  signChallenge(challenge: Uint8Array): Promise<Uint8Array>;
  rotateKeyPair(): Promise<{ publicKey: PublicKeyMaterial }>;
  revokeKey(): Promise<void>;
  getEvidence(): NativeSigningKeyEvidence;
};

export const blockedNativeSigningKeyProvider: NativeSigningKeyProvider = {
  id: 'native-non-exportable-signing-key-missing',
  algorithm: 'ed25519',
  evidence: {
    evidenceSummary: 'No reviewed native Android Keystore/iOS Keychain provider is installed.',
    nonExportablePrivateKey: false,
    privateKeyExportableToJavaScript: false,
    publicKeyExportOnly: false,
    reviewedImplementation: false,
    runtimeEvidenceAttached: false,
  },
  keyStorage: 'native-non-exportable',
  productionReady: false,
  supportsRevocation: false,
  supportsRotation: false,
  async generateKeyPair() {
    throw new Error('Native non-exportable signing key provider is not installed.');
  },
  async getPublicKey() {
    return null;
  },
  getEvidence() {
    return this.evidence;
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

export const secureStorePrototypeSigningKeyProviderReadiness: NativeSigningKeyProviderReadinessInput = {
  id: 'ed25519-noble-os-secure-store-v1',
  algorithm: 'ed25519',
  evidence: {
    evidenceSummary:
      'Expo SecureStore keeps private bytes outside AsyncStorage but JavaScript can still read the key inside the signing store.',
    nonExportablePrivateKey: false,
    privateKeyExportableToJavaScript: true,
    publicKeyExportOnly: false,
    reviewedImplementation: false,
    runtimeEvidenceAttached: false,
  },
  keyStorage: 'expo-secure-store',
  productionReady: false,
  supportsRevocation: true,
  supportsRotation: true,
};

export function evaluateNativeSigningKeyProviderReadiness(
  provider: NativeSigningKeyProviderReadinessInput = blockedNativeSigningKeyProvider,
): NativeSigningKeyProviderReadiness {
  const blockers: string[] = [];

  if (!provider.productionReady) {
    blockers.push('Provider is not marked production-ready.');
  }

  if (provider.keyStorage !== 'native-non-exportable') {
    blockers.push('Private key storage is not native non-exportable storage.');
  }

  if (!provider.evidence.reviewedImplementation) {
    blockers.push('Reviewed native implementation evidence is missing.');
  }

  if (!provider.evidence.runtimeEvidenceAttached) {
    blockers.push('Runtime device evidence is missing.');
  }

  if (!provider.evidence.nonExportablePrivateKey) {
    blockers.push('Private key non-exportability is not proven.');
  }

  if (!provider.evidence.publicKeyExportOnly) {
    blockers.push('Provider has not proven public-key-only export behavior.');
  }

  if (provider.evidence.privateKeyExportableToJavaScript) {
    blockers.push('Private key material is exportable to JavaScript.');
  }

  if (!provider.supportsRotation) {
    blockers.push('Key rotation support is missing.');
  }

  if (!provider.supportsRevocation) {
    blockers.push('Key revocation support is missing.');
  }

  return {
    blockers,
    eligibleForProduction: blockers.length === 0,
    provider: provider.id,
    summary:
      blockers.length === 0
        ? `${provider.id} is eligible for production device authentication signing.`
        : `Production native signing key provider remains blocked: ${blockers.join(' ')}`,
  };
}

export function assertNativeSigningKeyProviderReadyForProduction(
  provider?: NativeSigningKeyProviderReadinessInput,
) {
  const readiness = evaluateNativeSigningKeyProviderReadiness(provider);

  if (!readiness.eligibleForProduction) {
    throw new Error(readiness.summary);
  }
}

