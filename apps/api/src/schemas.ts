import { envelopeAbusePolicy } from './security/abusePolicy.js';

export const errorResponseSchema = {
  type: 'object',
  required: ['error', 'message'],
  additionalProperties: false,
  properties: {
    error: { type: 'string' },
    message: { type: 'string' },
  },
} as const;

export const healthResponseSchema = {
  type: 'object',
  required: ['ok', 'service', 'version'],
  additionalProperties: false,
  properties: {
    ok: { type: 'boolean' },
    service: { type: 'string' },
    version: { type: 'string' },
  },
} as const;

export const readinessResponseSchema = {
  type: 'object',
  required: ['ok', 'checks', 'reasons'],
  additionalProperties: false,
  properties: {
    ok: { type: 'boolean' },
    checks: {
      type: 'object',
      required: ['api', 'database', 'queue', 'objectStorage'],
      additionalProperties: false,
      properties: {
        api: { type: 'string' },
        database: { type: 'string' },
        queue: { type: 'string' },
        objectStorage: { type: 'string' },
      },
    },
    reasons: {
      type: 'object',
      additionalProperties: false,
      properties: {
        database: { type: 'string' },
        queue: { type: 'string' },
      },
    },
  },
} as const;

export const acceptedResponseSchema = {
  type: 'object',
  required: ['accepted'],
  additionalProperties: true,
  properties: {
    accepted: { type: 'boolean' },
    accountId: { type: 'string' },
    deviceId: { type: 'string' },
    bundleId: { type: 'string' },
    messageId: { type: 'string' },
    envelopeId: { type: 'string' },
    deliveryState: { type: 'string' },
  },
} as const;

export const accountCreateBodySchema = {
  type: 'object',
  required: ['displayName'],
  additionalProperties: false,
  properties: {
    id: { type: 'string', minLength: 16 },
    displayName: { type: 'string', minLength: 1, maxLength: 80 },
    username: { type: 'string', minLength: 3, maxLength: 32 },
  },
} as const;

export const accountResponseSchema = {
  type: 'object',
  required: ['accountId', 'displayName', 'createdAt'],
  additionalProperties: false,
  properties: {
    accountId: { type: 'string' },
    displayName: { type: 'string' },
    username: { type: 'string' },
    createdAt: { type: 'string' },
  },
} as const;

export const accountDiscoveryQuerySchema = {
  type: 'object',
  required: ['query'],
  additionalProperties: false,
  properties: {
    query: { type: 'string', minLength: 2, maxLength: 80 },
    limit: { type: 'integer', minimum: 1, maximum: 20, default: 10 },
  },
} as const;

export const accountDiscoveryResponseSchema = {
  type: 'object',
  required: ['results'],
  additionalProperties: false,
  properties: {
    results: {
      type: 'array',
      items: {
        type: 'object',
        required: ['accountId', 'displayName', 'devices'],
        additionalProperties: false,
        properties: {
          accountId: { type: 'string' },
          displayName: { type: 'string' },
          username: { type: 'string' },
          devices: {
            type: 'array',
            items: {
              type: 'object',
              required: [
                'deviceId',
                'deviceName',
                'identityKey',
                'signedPrekey',
                'signedPrekeySignature',
                'oneTimePrekeys',
                'publishedAt',
              ],
              additionalProperties: false,
              properties: {
                deviceId: { type: 'string' },
                deviceName: { type: 'string' },
                identityKey: { type: 'string' },
                signedPrekey: { type: 'string' },
                signedPrekeySignature: { type: 'string' },
                oneTimePrekeys: {
                  type: 'array',
                  items: { type: 'string' },
                },
                publishedAt: { type: 'string' },
              },
            },
          },
        },
      },
    },
  },
} as const;

export const deviceChallengeBodySchema = {
  type: 'object',
  required: ['accountId', 'deviceId'],
  additionalProperties: false,
  properties: {
    accountId: { type: 'string', minLength: 16 },
    deviceId: { type: 'string', minLength: 16 },
  },
} as const;

export const deviceChallengeResponseSchema = {
  type: 'object',
  required: ['challengeId', 'accountId', 'deviceId', 'challenge', 'expiresAt'],
  additionalProperties: false,
  properties: {
    challengeId: { type: 'string' },
    accountId: { type: 'string' },
    deviceId: { type: 'string' },
    challenge: { type: 'string' },
    expiresAt: { type: 'string' },
  },
} as const;

export const deviceSessionBodySchema = {
  type: 'object',
  required: ['accountId', 'deviceId', 'challengeId', 'signature'],
  additionalProperties: false,
  properties: {
    accountId: { type: 'string', minLength: 16 },
    deviceId: { type: 'string', minLength: 16 },
    challengeId: { type: 'string', minLength: 16 },
    signature: { type: 'string', minLength: 8 },
  },
} as const;

export const deviceSessionRevokedResponseSchema = {
  type: 'object',
  required: ['sessionId', 'revoked'],
  additionalProperties: false,
  properties: {
    sessionId: { type: 'string' },
    revoked: { type: 'boolean' },
  },
} as const;

export const deviceRevokedResponseSchema = {
  type: 'object',
  required: ['accountId', 'deviceId', 'revoked', 'revokedAt'],
  additionalProperties: false,
  properties: {
    accountId: { type: 'string' },
    deviceId: { type: 'string' },
    revoked: { type: 'boolean' },
    revokedAt: { type: 'string' },
  },
} as const;

export const deviceSessionResponseSchema = {
  type: 'object',
  required: ['sessionId', 'accountId', 'deviceId', 'token', 'expiresAt'],
  additionalProperties: false,
  properties: {
    sessionId: { type: 'string' },
    accountId: { type: 'string' },
    deviceId: { type: 'string' },
    token: { type: 'string' },
    expiresAt: { type: 'string' },
  },
} as const;

export const envelopeListResponseSchema = {
  type: 'object',
  required: ['envelopes'],
  additionalProperties: false,
  properties: {
    envelopes: {
      type: 'array',
      items: {
        type: 'object',
        required: [
          'envelopeId',
          'messageId',
          'conversationId',
          'senderAccountId',
          'senderDeviceId',
          'recipientAccountId',
          'recipientDeviceId',
          'headerCiphertext',
          'bodyCiphertext',
          'deliveryState',
          'queuedAt',
        ],
        additionalProperties: false,
        properties: {
          envelopeId: { type: 'string' },
          messageId: { type: 'string' },
          conversationId: { type: 'string' },
          senderAccountId: { type: 'string' },
          senderDeviceId: { type: 'string' },
          recipientAccountId: { type: 'string' },
          recipientDeviceId: { type: 'string' },
          headerCiphertext: { type: 'string' },
          bodyCiphertext: { type: 'string' },
          deliveryState: { type: 'string' },
          queuedAt: { type: 'string' },
        },
      },
    },
    nextCursor: { type: 'string' },
  },
} as const;

export const envelopeAckResponseSchema = {
  type: 'object',
  required: ['messageId', 'deliveryState', 'acknowledgedAt'],
  additionalProperties: false,
  properties: {
    messageId: { type: 'string' },
    deliveryState: { type: 'string' },
    acknowledgedAt: { type: 'string' },
  },
} as const;

export const deviceBundleBodySchema = {
  type: 'object',
  required: ['accountId', 'deviceId', 'deviceName', 'identityKey', 'signedPrekey', 'signedPrekeySignature'],
  additionalProperties: false,
  properties: {
    accountDisplayName: { type: 'string', minLength: 1, maxLength: 80 },
    accountId: { type: 'string', minLength: 16 },
    deviceId: { type: 'string', minLength: 16 },
    deviceName: { type: 'string', minLength: 1, maxLength: 80 },
    identityKey: { type: 'string', minLength: 32 },
    signedPrekey: { type: 'string', minLength: 32 },
    signedPrekeySignature: { type: 'string', minLength: 32 },
    oneTimePrekeys: {
      type: 'array',
      maxItems: 200,
      items: { type: 'string', minLength: 16 },
    },
  },
} as const;

export const publicDeviceBundleResponseSchema = {
  type: 'object',
  required: [
    'accountId',
    'accountDisplayName',
    'deviceId',
    'deviceName',
    'identityKey',
    'signedPrekey',
    'signedPrekeySignature',
    'oneTimePrekeys',
    'publishedAt',
  ],
  additionalProperties: false,
  properties: {
    accountId: { type: 'string' },
    accountDisplayName: { type: 'string' },
    deviceId: { type: 'string' },
    deviceName: { type: 'string' },
    identityKey: { type: 'string' },
    signedPrekey: { type: 'string' },
    signedPrekeySignature: { type: 'string' },
    oneTimePrekeys: {
      type: 'array',
      items: { type: 'string' },
    },
    publishedAt: { type: 'string' },
  },
} as const;

export const encryptedEnvelopeBodySchema = {
  type: 'object',
  required: [
    'messageId',
    'conversationId',
    'senderAccountId',
    'senderDeviceId',
    'recipientAccountId',
    'recipientDeviceId',
    'ciphertext',
    'header',
  ],
  additionalProperties: false,
  properties: {
    messageId: { type: 'string', minLength: 16 },
    conversationId: { type: 'string', minLength: 16 },
    senderAccountId: { type: 'string', minLength: 16 },
    senderDeviceId: { type: 'string', minLength: 16 },
    recipientAccountId: { type: 'string', minLength: 16 },
    recipientDeviceId: { type: 'string', minLength: 16 },
    ciphertext: { type: 'string', minLength: 1, maxLength: envelopeAbusePolicy.maxBodyCiphertextChars },
    header: { type: 'string', minLength: 1, maxLength: envelopeAbusePolicy.maxHeaderCiphertextChars },
  },
} as const;

export const encryptedEnvelopeFanoutBodySchema = {
  type: 'object',
  required: ['conversationId', 'senderAccountId', 'senderDeviceId', 'envelopes'],
  additionalProperties: false,
  properties: {
    conversationId: { type: 'string', minLength: 16 },
    senderAccountId: { type: 'string', minLength: 16 },
    senderDeviceId: { type: 'string', minLength: 16 },
    envelopes: {
      type: 'array',
      minItems: 1,
      maxItems: envelopeAbusePolicy.maxFanoutRecipients,
      items: {
        type: 'object',
        required: ['messageId', 'recipientAccountId', 'recipientDeviceId', 'ciphertext', 'header'],
        additionalProperties: false,
        properties: {
          messageId: { type: 'string', minLength: 16 },
          recipientAccountId: { type: 'string', minLength: 16 },
          recipientDeviceId: { type: 'string', minLength: 16 },
          ciphertext: { type: 'string', minLength: 1, maxLength: envelopeAbusePolicy.maxBodyCiphertextChars },
          header: { type: 'string', minLength: 1, maxLength: envelopeAbusePolicy.maxHeaderCiphertextChars },
        },
      },
    },
  },
} as const;

export const fanoutAcceptedResponseSchema = {
  type: 'object',
  required: ['accepted', 'envelopeCount', 'messageIds'],
  additionalProperties: false,
  properties: {
    accepted: { type: 'boolean' },
    envelopeCount: { type: 'number' },
    messageIds: {
      type: 'array',
      items: { type: 'string' },
    },
  },
} as const;

export const queuedJobResponseSchema = {
  type: 'object',
  required: ['queued'],
  additionalProperties: false,
  properties: {
    queued: { type: 'boolean' },
  },
} as const;

export const queueOperationalStatsResponseSchema = {
  type: 'object',
  required: ['queueName', 'status', 'counts', 'warnings', 'retention'],
  additionalProperties: false,
  properties: {
    queueName: { type: 'string' },
    status: { type: 'string' },
    counts: {
      type: 'object',
      required: ['waiting', 'active', 'delayed', 'failed', 'completed', 'paused'],
      additionalProperties: false,
      properties: {
        waiting: { type: 'number' },
        active: { type: 'number' },
        delayed: { type: 'number' },
        failed: { type: 'number' },
        completed: { type: 'number' },
        paused: { type: 'number' },
      },
    },
    warnings: {
      type: 'array',
      items: { type: 'string' },
    },
    retention: {
      type: 'object',
      required: [
        'retainedCompletedJobs',
        'retainedFailedJobs',
        'completedJobCleanupGraceMs',
        'failedJobCleanupGraceMs',
      ],
      additionalProperties: false,
      properties: {
        retainedCompletedJobs: { type: 'number' },
        retainedFailedJobs: { type: 'number' },
        completedJobCleanupGraceMs: { type: 'number' },
        failedJobCleanupGraceMs: { type: 'number' },
      },
    },
  },
} as const;

export const queueOperationalCleanupResponseSchema = {
  type: 'object',
  required: ['cleanedCompletedJobs', 'cleanedFailedJobs'],
  additionalProperties: false,
  properties: {
    cleanedCompletedJobs: { type: 'number' },
    cleanedFailedJobs: { type: 'number' },
  },
} as const;

export const redisRateLimitOperationalStatsResponseSchema = {
  type: 'object',
  required: ['namespace', 'keyCount', 'scannedKeys', 'scanCount', 'cleanup'],
  additionalProperties: false,
  properties: {
    namespace: { type: 'string' },
    keyCount: { type: 'number' },
    scannedKeys: { type: 'number' },
    scanCount: { type: 'number' },
    cleanup: { type: 'string' },
  },
} as const;
