import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createGracefulShutdown } from './gracefulShutdown.js';

describe('graceful shutdown', () => {
  it('runs close only once when shutdown is requested repeatedly', async () => {
    let closeCount = 0;
    const exitCodes: number[] = [];
    const shutdown = createGracefulShutdown({
      label: 'test-service',
      close: async () => {
        closeCount += 1;
      },
      exit: ((code: number) => {
        exitCodes.push(code);
        throw new Error(`exit:${code}`);
      }) as never,
    });

    await assert.rejects(() => shutdown('SIGTERM'), /exit:0/);
    await assert.rejects(() => shutdown('SIGINT'), /exit:0/);

    assert.equal(closeCount, 1);
    assert.deepEqual(exitCodes, [0, 0]);
  });

  it('exits non-zero when close fails', async () => {
    const exitCodes: number[] = [];
    const shutdown = createGracefulShutdown({
      label: 'test-service',
      close: async () => {
        throw new Error('close failed');
      },
      exit: ((code: number) => {
        exitCodes.push(code);
        throw new Error(`exit:${code}`);
      }) as never,
    });

    await assert.rejects(() => shutdown('SIGTERM'), /exit:1/);

    assert.deepEqual(exitCodes, [1]);
  });
});
