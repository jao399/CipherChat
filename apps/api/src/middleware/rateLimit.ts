import type { FastifyReply, FastifyRequest } from 'fastify';

import { routeRateLimitPolicies, type RouteRateLimitPolicy } from '../security/abusePolicy.js';

type RateLimitOptions = {
  windowMs: number;
  maxRequests: number;
  store?: RateLimitStore;
  routePolicies?: readonly RouteRateLimitPolicy[];
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

function getPathname(request: FastifyRequest) {
  return request.url.split('?')[0] ?? request.url;
}

function findRoutePolicy(request: FastifyRequest, policies: readonly RouteRateLimitPolicy[]) {
  const pathname = getPathname(request);
  return policies.find((policy) => policy.method === request.method && routePathMatches(policy.path, pathname));
}

function routePathMatches(policyPath: string, pathname: string) {
  if (policyPath === pathname) {
    return true;
  }

  const policySegments = policyPath.split('/').filter(Boolean);
  const pathSegments = pathname.split('/').filter(Boolean);

  if (policySegments.length !== pathSegments.length) {
    return false;
  }

  return policySegments.every((segment, index) => segment.startsWith(':') || segment === pathSegments[index]);
}

export function createRateLimitHook(options: RateLimitOptions) {
  const store = options.store ?? new InMemoryRateLimitStore();
  const routePolicies = options.routePolicies ?? routeRateLimitPolicies;

  return async function rateLimitHook(request: FastifyRequest, reply: FastifyReply) {
    if (publicHealthPaths.has(getPathname(request))) {
      return;
    }

    const routePolicy = findRoutePolicy(request, routePolicies);
    const windowMs = routePolicy?.windowMs ?? options.windowMs;
    const maxRequests = Math.min(routePolicy?.maxRequests ?? options.maxRequests, options.maxRequests);
    const keyPrefix = routePolicy?.id ?? 'global';
    const key = `${keyPrefix}:${request.ip}:${request.headers.authorization ?? 'anonymous'}`;
    const count = await store.increment(key, windowMs);

    if (count > maxRequests) {
      void reply.code(429).send({
        error: 'rate_limited',
        message: 'Too many requests. Please slow down and retry shortly.',
      });
    }
  };
}
