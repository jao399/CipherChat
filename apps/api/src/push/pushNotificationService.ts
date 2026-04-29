import { assertPushPayloadPrivacy, type GenericPushPayload } from './pushPrivacy.js';

export type ApnsProviderEnvironment = 'sandbox' | 'production';

export type ApnsPushProviderConfig = {
  teamId: string;
  keyId: string;
  bundleId: string;
  privateKey: string;
  environment: ApnsProviderEnvironment;
};

export type FcmPushProviderConfig = {
  projectId: string;
  clientEmail: string;
  privateKey: string;
};

export type PushNotificationConfig = {
  apns?: ApnsPushProviderConfig;
  fcm?: FcmPushProviderConfig;
};

export type GenericPushWakeInput = {
  recipientDeviceCount: number;
  payload: GenericPushPayload;
};

export type PushProviderDeliveryResult = {
  provider: 'apns' | 'fcm';
  attemptedGenericWakes: number;
};

export type GenericPushWakeResult = {
  provider: 'noop' | 'configured';
  queuedGenericPushes: number;
  opaqueEventId: string;
  providerResults?: PushProviderDeliveryResult[];
};

export type PushNotificationPort = {
  sendGenericWake(input: GenericPushWakeInput): Promise<GenericPushWakeResult>;
};

export type ApnsGenericWakeMessage = {
  config: ApnsPushProviderConfig;
  recipientDeviceCount: number;
  headers: {
    'apns-topic': string;
    'apns-push-type': 'background';
    'apns-priority': '5';
    'apns-collapse-id': string;
  };
  payload: {
    aps: {
      'content-available': 1;
      badge?: number;
    };
    data: GenericPushPayload;
  };
};

export type FcmGenericWakeMessage = {
  config: FcmPushProviderConfig;
  recipientDeviceCount: number;
  message: {
    data: Record<string, string>;
    android: {
      priority: 'normal';
    };
    apns: {
      headers: {
        'apns-push-type': 'background';
        'apns-priority': '5';
        'apns-collapse-id': string;
      };
      payload: {
        aps: {
          'content-available': 1;
          badge?: number;
        };
      };
    };
  };
};

export type ApnsPushProviderPort = {
  sendGenericWake(message: ApnsGenericWakeMessage): Promise<PushProviderDeliveryResult>;
};

export type FcmPushProviderPort = {
  sendGenericWake(message: FcmGenericWakeMessage): Promise<PushProviderDeliveryResult>;
};

export type PushProviderPorts = {
  apns?: ApnsPushProviderPort;
  fcm?: FcmPushProviderPort;
};

export class NoopPushNotificationService implements PushNotificationPort {
  async sendGenericWake(input: GenericPushWakeInput): Promise<GenericPushWakeResult> {
    assertPushPayloadPrivacy(input.payload);

    return {
      provider: 'noop',
      queuedGenericPushes: input.recipientDeviceCount,
      opaqueEventId: input.payload.opaqueEventId,
    };
  }
}

export class ConfiguredPushNotificationService implements PushNotificationPort {
  constructor(
    private readonly config: PushNotificationConfig,
    private readonly providers: PushProviderPorts,
  ) {}

  async sendGenericWake(input: GenericPushWakeInput): Promise<GenericPushWakeResult> {
    assertPushPayloadPrivacy(input.payload);

    const providerResults: PushProviderDeliveryResult[] = [];

    if (this.config.apns) {
      if (!this.providers.apns) {
        throw new Error('APNs push provider port is not configured');
      }

      providerResults.push(await this.providers.apns.sendGenericWake(createApnsGenericWakeMessage(this.config.apns, input)));
    }

    if (this.config.fcm) {
      if (!this.providers.fcm) {
        throw new Error('FCM push provider port is not configured');
      }

      providerResults.push(await this.providers.fcm.sendGenericWake(createFcmGenericWakeMessage(this.config.fcm, input)));
    }

    if (providerResults.length === 0) {
      throw new Error('At least one push notification provider must be configured');
    }

    return {
      provider: 'configured',
      queuedGenericPushes: input.recipientDeviceCount,
      opaqueEventId: input.payload.opaqueEventId,
      providerResults,
    };
  }
}

export function createConfiguredPushNotificationService(config: PushNotificationConfig, providers: PushProviderPorts = {}) {
  assertPushNotificationConfig(config);
  return new ConfiguredPushNotificationService(config, providers);
}

export function assertPushNotificationConfig(config: PushNotificationConfig) {
  const failures: string[] = [];

  if (!config.apns && !config.fcm) {
    failures.push('At least one push notification provider must be configured.');
  }

  if (config.apns) {
    requireConfigValue(config.apns.teamId, 'PUSH_APNS_TEAM_ID', failures);
    requireConfigValue(config.apns.keyId, 'PUSH_APNS_KEY_ID', failures);
    requireConfigValue(config.apns.bundleId, 'PUSH_APNS_BUNDLE_ID', failures);
    requireConfigValue(config.apns.privateKey, 'PUSH_APNS_PRIVATE_KEY', failures);

    if (config.apns.environment !== 'sandbox' && config.apns.environment !== 'production') {
      failures.push('PUSH_APNS_ENVIRONMENT must be either sandbox or production.');
    }
  }

  if (config.fcm) {
    requireConfigValue(config.fcm.projectId, 'PUSH_FCM_PROJECT_ID', failures);
    requireConfigValue(config.fcm.clientEmail, 'PUSH_FCM_CLIENT_EMAIL', failures);
    requireConfigValue(config.fcm.privateKey, 'PUSH_FCM_PRIVATE_KEY', failures);
  }

  if (failures.length > 0) {
    throw new Error(`Invalid push notification provider configuration:\n- ${failures.join('\n- ')}`);
  }
}

function createApnsGenericWakeMessage(config: ApnsPushProviderConfig, input: GenericPushWakeInput): ApnsGenericWakeMessage {
  assertPushPayloadPrivacy(input.payload);

  return {
    config,
    recipientDeviceCount: input.recipientDeviceCount,
    headers: {
      'apns-topic': config.bundleId,
      'apns-push-type': 'background',
      'apns-priority': '5',
      'apns-collapse-id': input.payload.opaqueEventId,
    },
    payload: {
      aps: createBackgroundAps(input.payload),
      data: input.payload,
    },
  };
}

function createFcmGenericWakeMessage(config: FcmPushProviderConfig, input: GenericPushWakeInput): FcmGenericWakeMessage {
  assertPushPayloadPrivacy(input.payload);

  return {
    config,
    recipientDeviceCount: input.recipientDeviceCount,
    message: {
      data: createFcmData(input.payload),
      android: {
        priority: 'normal',
      },
      apns: {
        headers: {
          'apns-push-type': 'background',
          'apns-priority': '5',
          'apns-collapse-id': input.payload.opaqueEventId,
        },
        payload: {
          aps: createBackgroundAps(input.payload),
        },
      },
    },
  };
}

function createBackgroundAps(payload: GenericPushPayload) {
  const aps: ApnsGenericWakeMessage['payload']['aps'] = {
    'content-available': 1,
  };

  if (typeof payload.badgeCount === 'number') {
    aps.badge = payload.badgeCount;
  }

  return aps;
}

function createFcmData(payload: GenericPushPayload) {
  const data: Record<string, string> = {
    opaqueEventId: payload.opaqueEventId,
    deliveryHint: payload.deliveryHint,
  };

  if (typeof payload.badgeCount === 'number') {
    data.badgeCount = String(payload.badgeCount);
  }

  return data;
}

function requireConfigValue(value: string | undefined, name: string, failures: string[]) {
  if (!value || value.trim().length === 0) {
    failures.push(`${name} is required when its push provider is enabled.`);
  }
}
