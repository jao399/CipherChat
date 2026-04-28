import type { Redis } from 'ioredis';

import type { RateLimitStore } from './rateLimit.js';

export type RedisRateLimitOperationalStats = {
  namespace: 'rate-limit';
  keyCount: number;
  scannedKeys: number;
  scanCount: number;
  cleanup: 'ttl-managed';
};

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

  async getOperationalStats(scanCount = 1000): Promise<RedisRateLimitOperationalStats> {
    let cursor = '0';
    let keyCount = 0;
    let scannedKeys = 0;

    do {
      const [nextCursor, keys] = await this.redis.scan(cursor, 'MATCH', 'rate-limit:*', 'COUNT', scanCount);
      cursor = nextCursor;
      keyCount += keys.length;
      scannedKeys += keys.length;
    } while (cursor !== '0');

    return {
      namespace: 'rate-limit',
      keyCount,
      scannedKeys,
      scanCount,
      cleanup: 'ttl-managed',
    };
  }
}
