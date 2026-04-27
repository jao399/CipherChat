export type FoundationDecisionStatus = 'accepted' | 'requires-review-before-production';

export type FoundationChoice = {
  area: string;
  decision: string;
  status: FoundationDecisionStatus;
  implementationPhase: 4 | 5 | 6 | 7;
  notes: string;
};

export const FOUNDATION_STACK: FoundationChoice[] = [
  {
    area: 'Mobile runtime',
    decision: 'Expo React Native TypeScript with Expo development builds for native security modules',
    status: 'accepted',
    implementationPhase: 5,
    notes: 'Expo Go remains valid for UI-only work; native crypto and encrypted database work requires development builds.',
  },
  {
    area: 'Secure small-secret storage',
    decision: 'expo-secure-store first, with production review for custom Keychain/Keystore wrappers',
    status: 'requires-review-before-production',
    implementationPhase: 5,
    notes: 'AsyncStorage is limited to non-sensitive prototype state.',
  },
  {
    area: 'Encrypted local database',
    decision: 'SQLCipher-backed SQLite, with OP-SQLite as the React Native candidate',
    status: 'requires-review-before-production',
    implementationPhase: 5,
    notes: 'Database keys must be stored through OS secure storage.',
  },
  {
    area: 'One-to-one encryption',
    decision: 'Signal libsignal for X3DH and Double Ratchet',
    status: 'requires-review-before-production',
    implementationPhase: 6,
    notes: 'Requires native integration, protocol tests, and license review.',
  },
  {
    area: 'Group encryption',
    decision: 'MLS, with OpenMLS as the implementation candidate',
    status: 'requires-review-before-production',
    implementationPhase: 7,
    notes: 'Do not build groups by manually chaining one-to-one sessions.',
  },
  {
    area: 'Backend API',
    decision: 'TypeScript Fastify API with strict schemas',
    status: 'accepted',
    implementationPhase: 5,
    notes: 'Every route must validate request and response payloads.',
  },
  {
    area: 'Server database',
    decision: 'PostgreSQL with Prisma',
    status: 'accepted',
    implementationPhase: 5,
    notes: 'Stores metadata and encrypted envelope records only, never plaintext message bodies.',
  },
  {
    area: 'Queue',
    decision: 'Redis with BullMQ',
    status: 'accepted',
    implementationPhase: 5,
    notes: 'Handles delivery retries, expiry, cleanup, and push jobs.',
  },
  {
    area: 'File storage',
    decision: 'S3-compatible object storage with presigned URLs',
    status: 'accepted',
    implementationPhase: 6,
    notes: 'Stores encrypted file blobs only; file keys are delivered through encrypted message envelopes.',
  },
  {
    area: 'Push privacy',
    decision: 'Generic push notifications with opaque event ids only',
    status: 'accepted',
    implementationPhase: 6,
    notes: 'No message text, sender names, group names, filenames, or plaintext previews in push payloads.',
  },
];

export const PHASE_4_EXIT_GATES = [
  'Stack decisions documented',
  'Security-sensitive libraries identified',
  'Backend boundaries selected',
  'No backend or fake crypto implemented',
  'TypeScript validation passes',
  'Expo Doctor passes',
] as const;
