export const SECURITY_INVARIANTS = [
  'Do not implement custom cryptographic primitives.',
  'Do not store private keys in AsyncStorage.',
  'Do not send plaintext message bodies or file bytes to the server.',
  'Do not include message content, sender names, group names, or filenames in push notifications.',
  'Do not silently add a trusted device.',
  'Do not log plaintext messages, private keys, safety numbers, or recovery secrets.',
  'Do not persist plaintext messages until the encrypted local database reports encrypted=true.',
] as const;

export const APPROVED_PROTOCOLS = {
  oneToOneKeyAgreement: 'Signal-style X3DH',
  oneToOneMessageRatchet: 'Double Ratchet',
  groupMessaging: 'MLS',
  localKeyStorage: 'Android Keystore / iOS Keychain',
  localDatabase: 'SQLCipher or equivalent encrypted database',
  calls: 'WebRTC with DTLS-SRTP',
} as const;

export const PUSH_PRIVACY_POLICY = {
  allowedPayloadFields: ['opaqueEventId', 'deliveryHint', 'badgeCount'],
  forbiddenPayloadFields: ['messageText', 'senderName', 'groupName', 'fileName', 'plaintextPreview'],
} as const;
