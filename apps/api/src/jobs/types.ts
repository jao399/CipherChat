export const jobQueueName = 'cipherchat-jobs';

export type DeliveryFanoutJobData = {
  messageIds: string[];
  recipientDeviceCount: number;
};

export type ExpireEnvelopesJobData = {
  requestedAt: string;
};

export type CipherChatJob =
  | {
      name: 'delivery.fanout';
      data: DeliveryFanoutJobData;
    }
  | {
      name: 'envelopes.expire';
      data: ExpireEnvelopesJobData;
    };
