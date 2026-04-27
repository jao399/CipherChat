import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, typography } from '../../theme';
import type { Chat } from '../../types';
import { SecureBadge } from '../common/SecureBadge';

type ChatListItemProps = {
  chat: Chat;
  onPress?: () => void;
};

export function ChatListItem({ chat, onPress }: ChatListItemProps) {
  const isGroup = chat.group || chat.id === 'aurora';
  const isTimer = chat.id === 'off-record';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${chat.name}. ${chat.preview}. ${chat.unread > 0 ? `${chat.unread} unread messages.` : 'No unread messages.'}`}
      testID={`chat-row-${chat.id}`}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={[styles.avatar, isTimer && styles.timerAvatar, { backgroundColor: chat.avatarColor }]}>
        {isTimer ? (
          <Ionicons name="timer" size={27} color={colors.text} />
        ) : isGroup ? (
          <Ionicons name="people" size={24} color={colors.muted} />
        ) : (
          <Text style={styles.avatarText}>{chat.avatar}</Text>
        )}
      </View>
      <View style={styles.body}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>{chat.name}</Text>
          {chat.verified ? <SecureBadge tone="purple" /> : chat.locked ? <Ionicons name="lock-closed" size={13} color={colors.textSecondary} /> : null}
        </View>
        <Text style={styles.preview} numberOfLines={1}>{chat.preview}</Text>
      </View>
      <View style={styles.meta}>
        <Text style={[styles.time, isTimer && styles.timerText]}>{chat.time}</Text>
        {chat.unread > 0 ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{chat.unread}</Text>
          </View>
        ) : (
          <Ionicons name="checkmark-done" size={16} color={colors.primaryBright} />
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 78,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  pressed: {
    opacity: 0.78,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  timerAvatar: {
    shadowColor: colors.primaryBright,
    shadowOpacity: 0.48,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  },
  avatarText: {
    ...typography.button,
    color: colors.text,
  },
  body: {
    flex: 1,
    gap: spacing.xs,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  name: {
    ...typography.body,
    color: colors.text,
    fontWeight: '800',
    fontSize: 17,
    flexShrink: 1,
  },
  preview: {
    ...typography.small,
    color: colors.textSecondary,
    fontSize: 13,
  },
  meta: {
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  time: {
    ...typography.small,
    fontSize: 11,
  },
  timerText: {
    color: colors.primaryBright,
    fontSize: 14,
  },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  badgeText: {
    ...typography.small,
    color: colors.text,
    fontSize: 11,
  },
});
