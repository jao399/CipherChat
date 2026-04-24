export type OnboardingSlide = {
  id: string;
  title: string;
  text: string;
  icon: string;
};

export type Chat = {
  id: string;
  name: string;
  avatar: string;
  avatarColor: string;
  preview: string;
  time: string;
  unread: number;
  verified: boolean;
  locked: boolean;
  online?: boolean;
  group?: boolean;
};

export type MessageKind = 'text' | 'file' | 'image' | 'voice';

export type Message = {
  id: string;
  chatId: string;
  sender: 'me' | 'them' | 'system';
  kind: MessageKind;
  text: string;
  time: string;
  status?: 'sent' | 'delivered' | 'read';
  fileName?: string;
  fileSize?: string;
  duration?: string;
};

export type SecureFile = {
  id: string;
  name: string;
  size: string;
  type: 'pdf' | 'image' | 'doc' | 'zip';
  owner: string;
  status: 'Encrypted' | 'Transferring' | 'Available';
  updatedAt: string;
};

export type Contact = {
  id: string;
  name: string;
  handle: string;
  verified: boolean;
  mutualKeys: number;
  avatar: string;
};

export type CallRecord = {
  id: string;
  name: string;
  type: 'incoming' | 'outgoing' | 'missed';
  secure: boolean;
  time: string;
  duration: string;
  video?: boolean;
};

export type PrivacyMetric = {
  id: string;
  title: string;
  value: string;
  detail: string;
  icon: string;
  accent: string;
};
