export const envelopeAbusePolicy = {
  maxFanoutRecipients: 50,
  maxHeaderCiphertextChars: 8_192,
  maxBodyCiphertextChars: 65_536,
} as const;

export const routeRateLimitPolicies = [
  {
    id: 'account-create',
    method: 'POST',
    path: '/v1/accounts',
    windowMs: 60_000,
    maxRequests: 20,
  },
  {
    id: 'device-challenge',
    method: 'POST',
    path: '/v1/auth/device-challenges',
    windowMs: 60_000,
    maxRequests: 30,
  },
  {
    id: 'device-session',
    method: 'POST',
    path: '/v1/auth/device-sessions',
    windowMs: 60_000,
    maxRequests: 30,
  },
  {
    id: 'account-discovery',
    method: 'GET',
    path: '/v1/accounts/discover',
    windowMs: 60_000,
    maxRequests: 60,
  },
  {
    id: 'envelope-fanout',
    method: 'POST',
    path: '/v1/messages/envelopes/fanout',
    windowMs: 60_000,
    maxRequests: 120,
  },
  {
    id: 'prekey-claim',
    method: 'POST',
    path: '/v1/devices/bundles/:accountId/:deviceId/claim',
    windowMs: 60_000,
    maxRequests: 30,
  },
  {
    id: 'prekey-top-up',
    method: 'POST',
    path: '/v1/devices/prekeys/top-up',
    windowMs: 60_000,
    maxRequests: 10,
  },
] as const;

export type RouteRateLimitPolicy = (typeof routeRateLimitPolicies)[number];
