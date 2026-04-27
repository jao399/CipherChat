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

function readPort(value: string | undefined) {
  const parsed = Number.parseInt(value ?? '4000', 10);
  if (!Number.isFinite(parsed) || parsed < 1 || parsed > 65535) {
    throw new Error('API_PORT must be a valid TCP port');
  }
  return parsed;
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
    rateLimitWindowMs: Number.parseInt(env.RATE_LIMIT_WINDOW_MS ?? '60000', 10),
    rateLimitMaxRequests: Number.parseInt(env.RATE_LIMIT_MAX_REQUESTS ?? '120', 10),
  };
}
