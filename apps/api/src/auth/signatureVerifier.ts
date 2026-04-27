import { createPublicKey, verify } from 'node:crypto';

export type DeviceChallengeVerificationInput = {
  accountId: string;
  deviceId: string;
  identityKey: string;
  challenge: string;
  signature: string;
};

export type DeviceSignatureVerifier = {
  verifyDeviceChallenge(input: DeviceChallengeVerificationInput): Promise<boolean>;
};

export class RejectingDeviceSignatureVerifier implements DeviceSignatureVerifier {
  async verifyDeviceChallenge(_input: DeviceChallengeVerificationInput) {
    return false;
  }
}

export class InsecureDevelopmentSignatureVerifier implements DeviceSignatureVerifier {
  async verifyDeviceChallenge(input: DeviceChallengeVerificationInput) {
    return input.signature === `dev:${input.challenge}`;
  }
}

const ed25519IdentityPrefix = 'ed25519-spki:';
const ed25519SignaturePrefix = 'ed25519:';

function decodePrefixedBase64(value: string, prefix: string) {
  if (!value.startsWith(prefix)) {
    return null;
  }

  const encoded = value.slice(prefix.length);

  if (!encoded || /[^a-z0-9+/=]/i.test(encoded)) {
    return null;
  }

  return Buffer.from(encoded, 'base64');
}

export class Ed25519DeviceSignatureVerifier implements DeviceSignatureVerifier {
  async verifyDeviceChallenge(input: DeviceChallengeVerificationInput) {
    try {
      const publicKeyDer = decodePrefixedBase64(input.identityKey, ed25519IdentityPrefix);
      const signature = decodePrefixedBase64(input.signature, ed25519SignaturePrefix);

      if (!publicKeyDer || !signature) {
        return false;
      }

      const publicKey = createPublicKey({
        key: publicKeyDer,
        format: 'der',
        type: 'spki',
      });

      return verify(null, Buffer.from(input.challenge, 'utf8'), publicKey, signature);
    } catch {
      return false;
    }
  }
}

export function encodeEd25519IdentityKey(publicKeySpkiDer: Buffer) {
  return `${ed25519IdentityPrefix}${publicKeySpkiDer.toString('base64')}`;
}

export function encodeEd25519ChallengeSignature(signature: Buffer) {
  return `${ed25519SignaturePrefix}${signature.toString('base64')}`;
}

export function createDeviceSignatureVerifier(env: NodeJS.ProcessEnv = process.env): DeviceSignatureVerifier {
  if (env.ALLOW_INSECURE_DEV_SIGNATURES === 'true') {
    return new InsecureDevelopmentSignatureVerifier();
  }

  if (env.DEVICE_SIGNATURE_VERIFIER === 'ed25519') {
    return new Ed25519DeviceSignatureVerifier();
  }

  return new RejectingDeviceSignatureVerifier();
}
