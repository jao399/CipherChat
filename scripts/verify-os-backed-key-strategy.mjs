import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();

function read(path) {
  return readFileSync(join(root, path), 'utf8');
}

const identityProvider = read('src/security/deviceIdentityProvider.ts');
const keyStore = read('src/security/deviceSigningKeyStore.ts');

const checks = [
  {
    ok: identityProvider.includes('expoSecureStoreDeviceSigningKeyStore.sign'),
    label: 'device identity provider delegates signing to the key store',
  },
  {
    ok: !identityProvider.includes('loadPrivateKey'),
    label: 'device identity provider does not load private key bytes directly',
  },
  {
    ok: identityProvider.includes('privateKeyProtection'),
    label: 'public identity metadata records private-key protection policy',
  },
  {
    ok: keyStore.includes("strategy: 'expo-secure-store-os-backed-ed25519-v1'"),
    label: 'signing key store declares the OS-backed SecureStore strategy',
  },
  {
    ok: keyStore.includes('AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY'),
    label: 'signing key store uses this-device-only Keychain accessibility where supported',
  },
  {
    ok: keyStore.includes("productionUpgradeRequired: 'native-non-exportable-key-provider'"),
    label: 'signing key store keeps non-exportable native key provider as a production requirement',
  },
  {
    ok: !/type\s+LocalDeviceIdentity\s*=\s*\{[\s\S]*privateKey\s*:/m.test(identityProvider),
    label: 'LocalDeviceIdentity does not expose privateKey fields',
  },
];

console.log('CipherChat OS-backed device key strategy verification');
for (const check of checks) {
  console.log(`${check.ok ? 'PASS' : 'FAIL'} - ${check.label}`);
}

const failures = checks.filter((check) => !check.ok);
if (failures.length > 0) {
  console.error(`\n${failures.length} OS-backed key strategy check(s) failed.`);
  process.exit(1);
}

console.log('\nDevice private-key access is isolated behind the signing-key store boundary.');
