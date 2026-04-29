import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  ConfiguredPushNotificationService,
  assertPushNotificationConfig,
  type ApnsGenericWakeMessage,
  type FcmGenericWakeMessage,
  type PushNotificationConfig,
} from './pushNotificationService.js';
import type { GenericPushPayload } from './pushPrivacy.js';

const completeConfig: PushNotificationConfig = {
  apns: {
    teamId: 'TEAMID1234',
    keyId: 'KEYID12345',
    bundleId: 'com.cipherchat.app',
    privateKey: '-----BEGIN PRIVATE KEY-----\nexample\n-----END PRIVATE KEY-----',
    environment: 'production',
  },
  fcm: {
    projectId: 'cipherchat-prod',
    clientEmail: 'firebase-adminsdk@cipherchat-prod.iam.gserviceaccount.com',
    privateKey: '-----BEGIN PRIVATE KEY-----\nexample\n-----END PRIVATE KEY-----',
  },
};

const genericPayload: GenericPushPayload = {
  opaqueEventId: 'push_0123456789abcdef0123456789abcdef',
  deliveryHint: 'encrypted_envelope_available',
  badgeCount: 4,
};

describe('configured push notification service', () => {
  it('fails closed without at least one configured provider', () => {
    assert.throws(() => assertPushNotificationConfig({}), /At least one push notification provider must be configured/);
  });

  it('fails closed when configured provider credentials are incomplete', () => {
    assert.throws(
      () =>
        assertPushNotificationConfig({
          apns: {
            teamId: 'TEAMID1234',
            keyId: '',
            bundleId: 'com.cipherchat.app',
            privateKey: '',
            environment: 'production',
          },
        }),
      /PUSH_APNS_KEY_ID is required when its push provider is enabled/,
    );
  });

  it('passes only opaque wake payloads to APNs and FCM provider ports', async () => {
    const apnsMessages: ApnsGenericWakeMessage[] = [];
    const fcmMessages: FcmGenericWakeMessage[] = [];
    const service = new ConfiguredPushNotificationService(completeConfig, {
      apns: {
        async sendGenericWake(message) {
          apnsMessages.push(message);
          return {
            provider: 'apns',
            attemptedGenericWakes: message.recipientDeviceCount,
          };
        },
      },
      fcm: {
        async sendGenericWake(message) {
          fcmMessages.push(message);
          return {
            provider: 'fcm',
            attemptedGenericWakes: message.recipientDeviceCount,
          };
        },
      },
    });

    const result = await service.sendGenericWake({
      recipientDeviceCount: 3,
      payload: genericPayload,
    });

    assert.equal(result.provider, 'configured');
    assert.equal(result.queuedGenericPushes, 3);
    assert.equal(apnsMessages.length, 1);
    assert.equal(fcmMessages.length, 1);
    assert.deepEqual(Object.keys(apnsMessages[0].payload.data).sort(), ['badgeCount', 'deliveryHint', 'opaqueEventId']);
    assert.deepEqual(Object.keys(fcmMessages[0].message.data).sort(), ['badgeCount', 'deliveryHint', 'opaqueEventId']);
    assert.equal('alert' in apnsMessages[0].payload.aps, false);
    assert.equal('notification' in fcmMessages[0].message, false);
  });

  it('rejects unsafe payloads before provider ports are called', async () => {
    let providerCalls = 0;
    const service = new ConfiguredPushNotificationService(
      {
        apns: completeConfig.apns,
      },
      {
        apns: {
          async sendGenericWake(message) {
            providerCalls += 1;
            return {
              provider: 'apns',
              attemptedGenericWakes: message.recipientDeviceCount,
            };
          },
        },
      },
    );

    await assert.rejects(
      () =>
        service.sendGenericWake({
          recipientDeviceCount: 1,
          payload: {
            ...genericPayload,
            senderName: 'Eleanor',
          } as GenericPushPayload,
        }),
      /privacy-unsafe fields/,
    );
    assert.equal(providerCalls, 0);
  });

  it('fails closed when a configured provider has no injected port', async () => {
    const service = new ConfiguredPushNotificationService(
      {
        fcm: completeConfig.fcm,
      },
      {},
    );

    await assert.rejects(
      () =>
        service.sendGenericWake({
          recipientDeviceCount: 1,
          payload: genericPayload,
        }),
      /FCM push provider port is not configured/,
    );
  });
});
