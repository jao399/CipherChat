import type { FastifyReply, FastifyRequest } from 'fastify';

type RateLimitOptions = {
  windowMs: number;
  maxRequests: number;
  store?: RateLimitStore;
};

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

export type RateLimitStore = {
  increment(key: string, windowMs: number): Promise<number>;
};

export class InMemoryRateLimitStore implements RateLimitStore {
  private readonly buckets = new Map<string, RateLimitBucket>();

  async increment(key: string, windowMs: number) {
    const now = Date.now();
    const current = this.buckets.get(key);

    if (!current || current.resetAt <= now) {
      this.buckets.set(key, {
        count: 1,
        resetAt: now + windowMs,
      });
      return 1;
    }

    current.count += 1;
    return current.count;
  }
}

const publicHealthPaths = new Set(['/health', '/ready']);

export function createRateLimitHook(options: RateLimitOptions) {
  const store = options.store ?? new InMemoryRateLimitStore();

  return async function rateLimitHook(request: FastifyRequest, reply: FastifyReply) {
    if (publicHealthPaths.has(request.url.split('?')[0] ?? request.url)) {
      return;
    }

    const key = `${request.ip}:${request.headers.authorization ?? 'anonymous'}`;
    const count = await store.increment(key, options.windowMs);

    if (count > options.maxRequests) {
      void reply.code(429).send({
        error: 'rate_limited',
        message: 'Too many requests. Please slow down and retry shortly.',
      });
    }
  };
}
