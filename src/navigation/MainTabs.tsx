import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { BottomTabIcon } from '../components/common/BottomTabIcon';
import { useLanguage, type TranslationKey } from '../i18n';
import { CallsScreen } from '../screens/main/CallsScreen';
import { ChatsScreen } from '../screens/main/ChatsScreen';
import { ContactsScreen } from '../screens/main/ContactsScreen';
import { FilesScreen } from '../screens/main/FilesScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { colors, radii, spacing } from '../theme';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

const tabLabelKeys: Record<keyof MainTabParamList, TranslationKey> = {
  Chats: 'tabs.chats',
  Calls: 'tabs.calls',
  Files: 'tabs.files',
  Contacts: 'tabs.contacts',
  Settings: 'tabs.settings',
};

export function MainTabs() {
  const { t } = useLanguage();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primaryBright,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          position: 'absolute',
          left: spacing.md,
          right: spacing.md,
          bottom: spacing.sm,
          height: 78,
          borderRadius: 22,
          borderTopWidth: 0,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: 'rgba(14,15,20,0.96)',
          paddingTop: spacing.md,
          paddingBottom: spacing.md,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '800',
        },
        tabBarLabel: t(tabLabelKeys[route.name]),
        tabBarIcon: ({ focused, color }) => (
          <BottomTabIcon routeName={route.name} focused={focused} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Chats" component={ChatsScreen} />
      <Tab.Screen name="Calls" component={CallsScreen} />
      <Tab.Screen name="Files" component={FilesScreen} />
      <Tab.Screen name="Contacts" component={ContactsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}
