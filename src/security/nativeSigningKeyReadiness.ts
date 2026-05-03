import {
  blockedNativeSigningKeyProvider,
  type NativeSigningKeyProviderDescriptor,
  type NativeSigningKeyProtectionLevel,
} from './nativeSigningKeyProvider';

export type NativeSigningKeyReadinessStatus =
  | 'ready'
  | 'blocked'
  | 'unavailable'
  | 'development-only';

export type NativeSigningKeyReadiness = {
  providerId: string;
  status: NativeSigningKeyReadinessStatus;
  reasons: string[];
  missingEvidence: string[];
  productionReady: boolean;
  safeForDemo: boolean;
  safeForProduction: boolean;
  eligibleForProduction: boolean;
  keyProtectionLevel: NativeSigningKeyProtectionLevel;
  evidenceStatus: NativeSigningKeyProviderDescriptor['evidenceStatus'];
  summary: string;
};

export type NativeSigningKeyProviderReadiness = NativeSigningKeyReadiness;

const nonExportableProductionProtection = new Set<NativeSigningKeyProtectionLevel>([
  'android-keystore-non-exportable',
  'ios-keychain-non-exportable',
  'ios-secure-enclave-non-exportable',
]);

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

export function evaluateNativeSigningKeyReadiness(
  provider: NativeSigningKeyProviderDescriptor = blockedNativeSigningKeyProvider,
): NativeSigningKeyReadiness {
  const reasons: string[] = [];
  const missingEvidence: string[] = [];
  const isMissingNativeProvider =
    provider.providerId === blockedNativeSigningKeyProvider.providerId;
  const isUnavailable =
    provider.keyProtectionLevel === 'unavailable' || provider.platformSupport.includes('unavailable');
  const isPrototypeSecureStore = provider.keyProtectionLevel === 'prototype-securestore';

  if (isUnavailable) {
    reasons.push('Native signing key provider is unavailable.');
  }

  if (provider.platformSupport.includes('web')) {
    reasons.push('Web runtime cannot prove native non-exportable private-key behavior.');
  }

  if (isPrototypeSecureStore) {
    reasons.push('Prototype SecureStore keys are demo-only and not production non-exportable evidence.');
  }

  if (!provider.productionReady) {
    reasons.push('Provider is not marked production-ready.');
  }

  if (!nonExportableProductionProtection.has(provider.keyProtectionLevel)) {
    reasons.push('Key protection level is not proven native non-exportable storage.');
  }

  if (!provider.canGenerateKey) {
    reasons.push('Provider cannot generate signing keys.');
  }

  if (!provider.canExportPublicKeyOnly) {
    reasons.push('Provider has not proven public-key-only export behavior.');
  }

  if (!provider.canSignChallenge) {
    reasons.push('Provider cannot sign authentication challenges.');
  }

  if (provider.privateKeyExportable !== false) {
    reasons.push('Private key non-exportability is not proven.');
  }

  if (!provider.reviewedImplementation) {
    reasons.push('Reviewed native implementation evidence is missing.');
    missingEvidence.push('Reviewed native implementation evidence');
  }

  if (!provider.runtimeEvidenceAttached) {
    reasons.push('Runtime device evidence is missing.');
    missingEvidence.push('Runtime device evidence');
  }

  if (provider.evidenceStatus !== 'complete') {
    reasons.push('Production evidence package is incomplete.');
    missingEvidence.push(...provider.requiredEvidence);
  }

  if (!provider.supportsRotation) {
    reasons.push('Key rotation support is missing.');
  }

  if (!provider.supportsRevocation) {
    reasons.push('Key revocation support is missing.');
  }

  const safeForDemo =
    isPrototypeSecureStore ||
    (provider.canGenerateKey && provider.canSignChallenge && provider.keyProtectionLevel !== 'unavailable');
  const safeForProduction = reasons.length === 0;
  const status: NativeSigningKeyReadinessStatus = safeForProduction
    ? 'ready'
    : isMissingNativeProvider
      ? 'blocked'
      : isPrototypeSecureStore
        ? 'development-only'
        : isUnavailable || provider.platformSupport.includes('web')
          ? 'unavailable'
          : 'blocked';

  return {
    providerId: provider.providerId,
    evidenceStatus: provider.evidenceStatus,
    eligibleForProduction: safeForProduction,
    keyProtectionLevel: provider.keyProtectionLevel,
    missingEvidence: unique(missingEvidence),
    productionReady: safeForProduction,
    reasons: unique(reasons),
    safeForDemo,
    safeForProduction,
    status,
    summary: safeForProduction
      ? `${provider.providerId} is ready for production device authentication signing.`
      : `Production native signing key provider remains ${status}: ${unique(reasons).join(' ')}`,
  };
}

export function evaluateNativeSigningKeyProviderReadiness(
  provider?: NativeSigningKeyProviderDescriptor,
) {
  return evaluateNativeSigningKeyReadiness(provider);
}

export function assertNativeSigningKeyProviderReadyForProduction(
  provider?: NativeSigningKeyProviderDescriptor,
) {
  const readiness = evaluateNativeSigningKeyReadiness(provider);

  if (!readiness.safeForProduction) {
    throw new Error(readiness.summary);
  }
}
