import { assertPushPayloadPrivacy, type GenericPushPayload } from './pushPrivacy.js';

export type GenericPushWakeInput = {
  recipientDeviceCount: number;
  payload: GenericPushPayload;
};

export type GenericPushWakeResult = {
  provider: 'noop' | 'configured';
  queuedGenericPushes: number;
  opaqueEventId: string;
};

export type PushNotificationPort = {
  sendGenericWake(input: GenericPushWakeInput): Promise<GenericPushWakeResult>;
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
