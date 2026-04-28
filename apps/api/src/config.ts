export type ApiConfig = {
  host: string;
  port: number;
  corsOrigin: string;
  nodeEnv: string;
  databaseUrl?: string;
  redisUrl?: string;
  internalJobToken?: string;
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
};

type ProductionConfigValidationInput = {
  deviceSignatureVerifier?: string;
  allowInsecureDevSignatures?: string;
};

function readPort(value: string | undefined) {
  const parsed = Number.parseInt(value ?? '4000', 10);
  if (!Number.isFinite(parsed) || parsed < 1 || parsed > 65535) {
    throw new Error('API_PORT must be a valid TCP port');
  }
  return parsed;
}

function readPositiveInteger(value: string | undefined, fallback: string, name: string) {
  const parsed = Number.parseInt(value ?? fallback, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    throw new Error(`${name} must be a positive integer`);
  }
  return parsed;
}

function isWeakSecret(value: string) {
  const normalized = value.toLowerCase();
  return ['secret', 'password', 'changeme', 'replace', 'development', 'local', 'test'].some((marker) =>
    normalized.includes(marker),
  );
}

function secretCategoryCount(value: string) {
  return [
    /[a-z]/.test(value),
    /[A-Z]/.test(value),
    /\d/.test(value),
    /[^a-zA-Z\d]/.test(value),
  ].filter(Boolean).length;
}

export function validateApiConfigForRuntime(
  config: ApiConfig,
  input: ProductionConfigValidationInput = {
    deviceSignatureVerifier: process.env.DEVICE_SIGNATURE_VERIFIER,
    allowInsecureDevSignatures: process.env.ALLOW_INSECURE_DEV_SIGNATURES,
  },
) {
  if (config.nodeEnv !== 'production') {
    return;
  }

  const failures: string[] = [];

  if (!config.databaseUrl) {
    failures.push('DATABASE_URL is required in production.');
  }

  if (!config.redisUrl) {
    failures.push('REDIS_URL is required in production.');
  }

  if (!config.internalJobToken) {
    failures.push('INTERNAL_JOB_TOKEN is required in production.');
  } else {
    if (config.internalJobToken.length < 32) {
      failures.push('INTERNAL_JOB_TOKEN must be at least 32 characters.');
    }

    if (secretCategoryCount(config.internalJobToken) < 3) {
      failures.push('INTERNAL_JOB_TOKEN must include at least three character classes.');
    }

    if (isWeakSecret(config.internalJobToken)) {
      failures.push('INTERNAL_JOB_TOKEN must not contain obvious placeholder words.');
    }
  }

  if (input.allowInsecureDevSignatures === 'true') {
    failures.push('ALLOW_INSECURE_DEV_SIGNATURES must not be enabled in production.');
  }

  if (input.deviceSignatureVerifier !== 'ed25519') {
    failures.push('DEVICE_SIGNATURE_VERIFIER must be set to ed25519 in production.');
  }

  if (!config.corsOrigin || config.corsOrigin === '*' || /localhost|127\.0\.0\.1/i.test(config.corsOrigin)) {
    failures.push('CORS_ORIGIN must be a production origin, not wildcard or localhost.');
  }

  if (failures.length > 0) {
    throw new Error(`Invalid CipherChat production configuration:\n- ${failures.join('\n- ')}`);
  }
}

export function readApiConfig(env: NodeJS.ProcessEnv = process.env): ApiConfig {
  return {
    host: env.API_HOST ?? '127.0.0.1',
    port: readPort(env.API_PORT),
    corsOrigin: env.CORS_ORIGIN ?? 'http://localhost:8081',
    nodeEnv: env.NODE_ENV ?? 'development',
    databaseUrl: env.DATABASE_URL,
    redisUrl: env.REDIS_URL,
    internalJobToken: env.INTERNAL_JOB_TOKEN,
    rateLimitWindowMs: readPositiveInteger(env.RATE_LIMIT_WINDOW_MS, '60000', 'RATE_LIMIT_WINDOW_MS'),
    rateLimitMaxRequests: readPositiveInteger(env.RATE_LIMIT_MAX_REQUESTS, '120', 'RATE_LIMIT_MAX_REQUESTS'),
  };
}
