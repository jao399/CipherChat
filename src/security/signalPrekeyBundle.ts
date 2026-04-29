export const signalX3dhPrekeyBundleFormat = 'signal-x3dh-v1' as const;

export type SignalX3dhPrekeyBundleFormat = typeof signalX3dhPrekeyBundleFormat;

export type SignalX3dhPrekeyBundle = {
  format: SignalX3dhPrekeyBundleFormat;
  identityKey: string;
  signedPrekey: string;
  signedPrekeySignature: string;
  oneTimePrekey?: string;
};

export type SignalX3dhPrekeyBundleValidation = {
  ok: boolean;
  errors: string[];
};

const signalKeyPattern = /^signal-x3dh-v1:(identity|signed-prekey|one-time-prekey):[A-Za-z0-9+/_=-]{32,}$/;
const signalSignaturePattern = /^signal-x3dh-v1:signed-prekey-signature:[A-Za-z0-9+/_=-]{32,}$/;

export function isSignalX3dhPublicKeyMaterial(value: string) {
  return signalKeyPattern.test(value);
}

export function isSignalX3dhSignedPrekeySignature(value: string) {
  return signalSignaturePattern.test(value);
}

export function validateSignalX3dhPrekeyBundle(
  bundle: SignalX3dhPrekeyBundle,
): SignalX3dhPrekeyBundleValidation {
  const errors: string[] = [];

  if (bundle.format !== signalX3dhPrekeyBundleFormat) {
    errors.push('Signal prekey bundle format must be signal-x3dh-v1.');
  }

  if (!bundle.identityKey.startsWith('signal-x3dh-v1:identity:') || !isSignalX3dhPublicKeyMaterial(bundle.identityKey)) {
    errors.push('Signal identity key must use the signal-x3dh-v1 identity public-key format.');
  }

  if (!bundle.signedPrekey.startsWith('signal-x3dh-v1:signed-prekey:') || !isSignalX3dhPublicKeyMaterial(bundle.signedPrekey)) {
    errors.push('Signal signed prekey must use the signal-x3dh-v1 signed-prekey public-key format.');
  }

  if (!isSignalX3dhSignedPrekeySignature(bundle.signedPrekeySignature)) {
    errors.push('Signal signed prekey signature must use the signal-x3dh-v1 signature format.');
  }

  if (
    bundle.oneTimePrekey &&
    (!bundle.oneTimePrekey.startsWith('signal-x3dh-v1:one-time-prekey:') ||
      !isSignalX3dhPublicKeyMaterial(bundle.oneTimePrekey))
  ) {
    errors.push('Signal one-time prekey must use the signal-x3dh-v1 one-time-prekey public-key format.');
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}

export function assertSignalX3dhPrekeyBundle(bundle: SignalX3dhPrekeyBundle) {
  const validation = validateSignalX3dhPrekeyBundle(bundle);

  if (!validation.ok) {
    throw new Error(validation.errors.join(' '));
  }
}
