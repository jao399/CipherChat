import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { ensureStartupDependencies, probeApiRuntimeHealth } from './runtimeHealth.js';

describe('runtime health', () => {
  it('reports disabled dependencies without exposing connection details', async () => {
    const health = await probeApiRuntimeHealth({});

    assert.equal(health.ok, true);
    assert.equal(health.checks.database, 'disabled');
    assert.equal(health.checks.queue, 'disabled');
    assert.equal(health.reasons.database, 'not_configured');
    assert.equal(health.reasons.queue, 'not_configured');
  });

  it('reports unavailable dependencies with safe reasons', async () => {
    const health = await probeApiRuntimeHealth({
      databaseCheck: async () => {
        throw new Error('postgresql://user:password@db.internal/cipherchat');
      },
      queueCheck: async () => {
        throw new Error('redis://:password@redis.internal:6379');
      },
    });

    assert.equal(health.ok, false);
    assert.equal(health.checks.database, 'unavailable');
    assert.equal(health.checks.queue, 'unavailable');
    assert.equal(health.reasons.database, 'connection_failed');
    assert.equal(health.reasons.queue, 'connection_failed');
  });

  it('fails startup when configured dependencies are unavailable', async () => {
    await assert.rejects(
      () =>
        ensureStartupDependencies({
          databaseCheck: async () => {
            throw new Error('database down');
          },
          queueCheck: async () => undefined,
        }),
      /database dependency check failed/,
    );
  });
});
