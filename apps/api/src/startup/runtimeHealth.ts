export type DependencyState = 'disabled' | 'connected' | 'unavailable';
export type DependencyReason = 'not_configured' | 'connection_failed';

export type DependencyHealth = {
  state: DependencyState;
  reason?: DependencyReason;
};

export type ApiRuntimeHealth = {
  ok: boolean;
  checks: {
    api: 'ready';
    database: DependencyState;
    queue: DependencyState;
    objectStorage: 'not-connected-in-phase-9';
  };
  reasons: {
    database?: DependencyReason;
    queue?: DependencyReason;
  };
};

type RuntimeDependencyChecks = {
  databaseCheck?: () => Promise<void>;
  queueCheck?: () => Promise<void>;
};

async function probeDependency(check?: () => Promise<void>): Promise<DependencyHealth> {
  if (!check) {
    return {
      state: 'disabled',
      reason: 'not_configured',
    };
  }

  try {
    await check();
    return { state: 'connected' };
  } catch {
    return {
      state: 'unavailable',
      reason: 'connection_failed',
    };
  }
}

export async function probeApiRuntimeHealth(input: RuntimeDependencyChecks): Promise<ApiRuntimeHealth> {
  const [database, queue] = await Promise.all([probeDependency(input.databaseCheck), probeDependency(input.queueCheck)]);

  return {
    ok: database.state !== 'unavailable' && queue.state !== 'unavailable',
    checks: {
      api: 'ready',
      database: database.state,
      queue: queue.state,
      objectStorage: 'not-connected-in-phase-9',
    },
    reasons: {
      database: database.reason,
      queue: queue.reason,
    },
  };
}

export async function ensureStartupDependencies(input: RuntimeDependencyChecks) {
  const health = await probeApiRuntimeHealth(input);
  const failures: string[] = [];

  if (input.databaseCheck && health.checks.database !== 'connected') {
    failures.push('database dependency check failed');
  }

  if (input.queueCheck && health.checks.queue !== 'connected') {
    failures.push('queue dependency check failed');
  }

  if (failures.length > 0) {
    throw new Error(`CipherChat startup dependency checks failed: ${failures.join('; ')}`);
  }

  return health;
}
