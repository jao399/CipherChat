import * as Crypto from 'expo-crypto';

export type SafetyNumberInput = {
  accountId: string;
  deviceId: string;
  identityKey: string;
};

export async function createSafetyNumberBlocks(input: SafetyNumberInput) {
  const material = `${input.accountId}:${input.deviceId}:${input.identityKey}`;
  const digest = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, material);
  return digest
    .toUpperCase()
    .match(/.{1,4}/g)
    ?.slice(0, 6) ?? ['0000', '0000', '0000', '0000', '0000', '0000'];
}
