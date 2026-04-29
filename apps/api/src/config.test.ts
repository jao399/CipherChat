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
        assert.match(error.message, /At least one push notification provider must be configured/);
        return true;
      },
    );
  });

  it('fails closed when a production push provider is enabled with incomplete credentials', () => {
    const config = readApiConfig({
      NODE_ENV: 'production',
      DATABASE_URL: 'postgresql://cipherchat:secret@db.internal:5432/cipherchat',
      REDIS_URL: 'redis://redis.internal:6379',
      INTERNAL_JOB_TOKEN: 'CipherChat_Production_Job_Token_2026!',
      CORS_ORIGIN: 'https://app.cipherchat.example',
      PUSH_APNS_ENABLED: 'true',
      PUSH_APNS_TEAM_ID: 'TEAMID1234',
      PUSH_APNS_ENVIRONMENT: 'production',
    });

    assert.throws(
      () =>
        validateApiConfigForRuntime(config, {
          deviceSignatureVerifier: 'ed25519',
        }),
      /PUSH_APNS_KEY_ID is required when its push provider is enabled/,
    );
  });

  it('accepts a production configuration with required dependencies and strong secret settings', () => {
    const config = readApiConfig({
      NODE_ENV: 'production',
      DATABASE_URL: 'postgresql://cipherchat:secret@db.internal:5432/cipherchat',
      REDIS_URL: 'redis://redis.internal:6379',
      INTERNAL_JOB_TOKEN: 'CipherChat_Production_Job_Token_2026!',
      CORS_ORIGIN: 'https://app.cipherchat.example',
      PUSH_APNS_ENABLED: 'true',
      PUSH_APNS_TEAM_ID: 'TEAMID1234',
      PUSH_APNS_KEY_ID: 'KEYID12345',
      PUSH_APNS_BUNDLE_ID: 'com.cipherchat.app',
      PUSH_APNS_PRIVATE_KEY: '-----BEGIN PRIVATE KEY-----\nexample\n-----END PRIVATE KEY-----',
      PUSH_APNS_ENVIRONMENT: 'production',
      PUSH_FCM_ENABLED: 'true',
      PUSH_FCM_PROJECT_ID: 'cipherchat-prod',
      PUSH_FCM_CLIENT_EMAIL: 'firebase-adminsdk@cipherchat-prod.iam.gserviceaccount.com',
      PUSH_FCM_PRIVATE_KEY: '-----BEGIN PRIVATE KEY-----\nexample\n-----END PRIVATE KEY-----',
    });

    assert.doesNotThrow(() =>
      validateApiConfigForRuntime(config, {
        deviceSignatureVerifier: 'ed25519',
      }),
    );
  });
});
