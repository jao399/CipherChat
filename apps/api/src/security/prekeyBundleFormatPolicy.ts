export const prototypePrekeyBundleFormat = 'prototype-v1' as const;
export const signalX3dhPrekeyBundleFormat = 'signal-x3dh-v1' as const;

export type PrekeyBundleFormat = typeof prototypePrekeyBundleFormat | typeof signalX3dhPrekeyBundleFormat;

export class PrekeyBundleFormatPolicyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PrekeyBundleFormatPolicyError';
  }
}

type PublicPrekeyBundleInput = {
  format?: string;
  identityKey: string;
  signedPrekey: string;
  signedPrekeySignature: string;
  oneTimePrekeys?: string[];
};

const signalKeyPattern = /^signal-x3dh-v1:(identity|signed-prekey|one-time-prekey):[A-Za-z0-9+/_=-]{32,}$/;
const signalSignaturePattern = /^signal-x3dh-v1:signed-prekey-signature:[A-Za-z0-9+/_=-]{32,}$/;

export function normalizePrekeyBundleFormat(format?: string): PrekeyBundleFormat {
  if (!format || format === prototypePrekeyBundleFormat) {
    return prototypePrekeyBundleFormat;
  }

  if (format === signalX3dhPrekeyBundleFormat) {
    return signalX3dhPrekeyBundleFormat;
  }

  throw new PrekeyBundleFormatPolicyError(`Unsupported prekey bundle format: ${format}`);
}

export function validatePublicPrekeyBundleFormat(input: PublicPrekeyBundleInput) {
  const format = normalizePrekeyBundleFormat(input.format);

  if (format === prototypePrekeyBundleFormat) {
    return { format, errors: [] };
  }

  const errors: string[] = [];

  if (!input.identityKey.startsWith('signal-x3dh-v1:identity:') || !signalKeyPattern.test(input.identityKey)) {
    errors.push('Signal identity key must use the signal-x3dh-v1 identity public-key format.');
  }

  if (!input.signedPrekey.startsWith('signal-x3dh-v1:signed-prekey:') || !signalKeyPattern.test(input.signedPrekey)) {
    errors.push('Signal signed prekey must use the signal-x3dh-v1 signed-prekey public-key format.');
  }

  if (!signalSignaturePattern.test(input.signedPrekeySignature)) {
    errors.push('Signal signed prekey signature must use the signal-x3dh-v1 signature format.');
  }

  for (const oneTimePrekey of input.oneTimePrekeys ?? []) {
    if (!oneTimePrekey.startsWith('signal-x3dh-v1:one-time-prekey:') || !signalKeyPattern.test(oneTimePrekey)) {
      errors.push('Signal one-time prekey must use the signal-x3dh-v1 one-time-prekey public-key format.');
      break;
    }
  }

  return { format, errors };
}

export function assertPublicPrekeyBundleFormat(input: PublicPrekeyBundleInput) {
  const result = validatePublicPrekeyBundleFormat(input);

  if (result.errors.length > 0) {
    throw new PrekeyBundleFormatPolicyError(result.errors.join(' '));
  }

  return result.format;
}
