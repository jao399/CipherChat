const baseUrl = process.env.API_BASE_URL ?? 'http://127.0.0.1:4000';
const timeoutMs = Number.parseInt(process.env.RELEASE_SMOKE_TIMEOUT_MS ?? '60000', 10);
const requireConnectedDeps = process.env.REQUIRE_CONNECTED_DEPS !== 'false';
const internalJobToken = process.env.INTERNAL_JOB_TOKEN;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, options);
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(`${path} returned ${response.status}: ${JSON.stringify(body)}`);
  }

  return body;
}

function assertReady(readiness) {
  if (readiness.ok !== true) {
    throw new Error(`/ready is not ready: ${JSON.stringify(readiness)}`);
  }

  if (!requireConnectedDeps) {
    return;
  }

  if (readiness.checks?.database !== 'connected') {
    throw new Error(`/ready database is not connected: ${JSON.stringify(readiness)}`);
  }

  if (readiness.checks?.queue !== 'connected') {
    throw new Error(`/ready queue is not connected: ${JSON.stringify(readiness)}`);
  }
}

async function runSmokeCheck() {
  const health = await fetchJson('/health');
  if (health.ok !== true || health.service !== 'cipherchat-api') {
    throw new Error(`/health returned unexpected body: ${JSON.stringify(health)}`);
  }

  const readiness = await fetchJson('/ready');
  assertReady(readiness);

  if (internalJobToken) {
    const queue = await fetchJson('/v1/internal/ops/queue', {
      headers: {
        'x-internal-job-token': internalJobToken,
      },
    });

    if (!['healthy', 'warning'].includes(queue.status)) {
      throw new Error(`Queue operational status is not usable for release: ${JSON.stringify(queue)}`);
    }
  }
}

const startedAt = Date.now();
let lastError;
let passed = false;

while (Date.now() - startedAt < timeoutMs) {
  try {
    await runSmokeCheck();
    console.log(`Release smoke checks passed against ${baseUrl}.`);
    passed = true;
    break;
  } catch (error) {
    lastError = error;
    await sleep(1500);
  }
}

if (!passed) {
  console.error(lastError?.message ?? 'Release smoke checks timed out.');
  process.exitCode = 1;
}
