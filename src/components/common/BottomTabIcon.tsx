import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { colors } from '../../theme';
import type { MainTabParamList } from '../../navigation/types';

type BottomTabIconProps = {
  routeName: keyof MainTabParamList;
  focused: boolean;
  color: string;
};

const icons: Record<keyof MainTabParamList, keyof typeof Ionicons.glyphMap> = {
  Chats: 'chatbubble-ellipses',
  Calls: 'call',
  Files: 'document-text',
  Contacts: 'people',
  Settings: 'settings',
};

export function BottomTabIcon({ routeName, focused, color }: BottomTabIconProps) {
  return (
    <View style={[styles.wrap, focused && styles.active]}>
      <Ionicons name={icons[routeName]} size={21} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: 34,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  active: {
    shadowColor: colors.primaryBright,
    shadowOpacity: 0.48,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
});
