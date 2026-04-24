import type { NavigatorScreenParams } from '@react-navigation/native';

export type MainTabParamList = {
  Chats: undefined;
  Calls: undefined;
  Files: undefined;
  Contacts: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Welcome: undefined;
  SignIn: undefined;
  SignUp: undefined;
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  Conversation: { chatId: string };
  DeviceVerification: undefined;
  SecureFileTransfer: undefined;
  PrivacyDashboard: undefined;
  About: undefined;
};
