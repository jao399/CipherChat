import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { evaluateQueueDepth, queueOperationsPolicy } from './queueOperationsPolicy.js';

describe('queue operations policy', () => {
  it('defines retention options for every queue job type', () => {
    assert.equal(queueOperationsPolicy.jobs['delivery.fanout'].removeOnComplete, 1000);
    assert.equal(queueOperationsPolicy.jobs['delivery.fanout'].removeOnFail, 5000);
    assert.equal(queueOperationsPolicy.jobs['envelopes.expire'].removeOnComplete, 1000);
    assert.equal(queueOperationsPolicy.jobs['metadata.cleanup'].removeOnFail, 5000);
  });

  it('reports healthy queue depth below operational thresholds', () => {
    const result = evaluateQueueDepth({
      waiting: 1,
      active: 1,
      delayed: 0,
      failed: 0,
      completed: 10,
      paused: 0,
    });

    assert.equal(result.status, 'healthy');
    assert.deepEqual(result.warnings, []);
  });

  it('reports warnings when queue depth exceeds operational thresholds', () => {
    const result = evaluateQueueDepth(
      {
        waiting: 5,
        active: 0,
        delayed: 0,
        failed: 3,
        completed: 0,
        paused: 0,
      },
      {
        waiting: 4,
        active: 1,
        delayed: 1,
        failed: 2,
        completed: 1,
        paused: 1,
      },
    );

    assert.equal(result.status, 'warning');
    assert.deepEqual(result.warnings, ['waiting:5>4', 'failed:3>2']);
  });
});
