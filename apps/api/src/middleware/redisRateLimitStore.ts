import type { Redis } from 'ioredis';

import type { RateLimitStore } from './rateLimit.js';

export class RedisRateLimitStore implements RateLimitStore {
  constructor(private readonly redis: Redis) {}

  async increment(key: string, windowMs: number) {
    const redisKey = `rate-limit:${key}`;
    const count = await this.redis.incr(redisKey);

    if (count === 1) {
      await this.redis.pexpire(redisKey, windowMs);
    }

    return count;
  }
}
