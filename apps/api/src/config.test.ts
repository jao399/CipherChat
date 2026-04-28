import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { readApiConfig, validateApiConfigForRuntime } from './config.js';

describe('API configuration', () => {
  it('keeps development configuration flexible for local UI work', () => {
    const config = readApiConfig({
      NODE_ENV: 'development',
    });

    assert.equal(config.nodeEnv, 'development');
    assert.doesNotThrow(() => validateApiConfigForRuntime(config, {}));
  });

  it('rejects invalid numeric limits before startup', () => {
    assert.throws(
      () =>
        readApiConfig({
          RATE_LIMIT_MAX_REQUESTS: '0',
        }),
      /RATE_LIMIT_MAX_REQUESTS must be a positive integer/,
    );
  });

  it('requires production persistence, Redis, strong internal token, and Ed25519 verification', () => {
    const config = readApiConfig({
      NODE_ENV: 'production',
      CORS_ORIGIN: 'http://localhost:8081',
      INTERNAL_JOB_TOKEN: 'replace-with-local-secret',
    });

    assert.throws(
      () =>
        validateApiConfigForRuntime(config, {
          allowInsecureDevSignatures: 'true',
          deviceSignatureVerifier: 'reject',
        }),
      (error) => {
        assert.ok(error instanceof Error);
        assert.match(error.message, /DATABASE_URL is required in production/);
        assert.match(error.message, /REDIS_URL is required in production/);
        assert.match(error.message, /INTERNAL_JOB_TOKEN must be at least 32 characters/);
        assert.match(error.message, /INTERNAL_JOB_TOKEN must not contain obvious placeholder words/);
        assert.match(error.message, /ALLOW_INSECURE_DEV_SIGNATURES must not be enabled/);
        assert.match(error.message, /DEVICE_SIGNATURE_VERIFIER must be set to ed25519/);
        assert.match(error.message, /CORS_ORIGIN must be a production origin/);
        return true;
      },
    );
  });

  it('accepts a production configuration with required dependencies and strong secret settings', () => {
    const config = readApiConfig({
      NODE_ENV: 'production',
      DATABASE_URL: 'postgresql://cipherchat:secret@db.internal:5432/cipherchat',
      REDIS_URL: 'redis://redis.internal:6379',
      INTERNAL_JOB_TOKEN: 'CipherChat_Production_Job_Token_2026!',
      CORS_ORIGIN: 'https://app.cipherchat.example',
    });

    assert.doesNotThrow(() =>
      validateApiConfigForRuntime(config, {
        deviceSignatureVerifier: 'ed25519',
      }),
    );
  });
});
