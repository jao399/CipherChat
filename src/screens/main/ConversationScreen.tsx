import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { MessageBubble } from '../../components/chat/MessageBubble';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { chats, messages } from '../../data/mockData';
import { colors, radii, spacing, typography } from '../../theme';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Conversation'>;

const timers = ['10s', '30s', '1m', '5m', '10m'];

export function ConversationScreen({ navigation, route }: Props) {
  const [timer, setTimer] = useState('30s');
  const chat = chats.find((item) => item.id === route.params.chatId) ?? chats[0];
  const chatMessages = useMemo(
    () => messages.filter((message) => message.chatId === chat.id || message.chatId === 'eleanor'),
    [chat.id],
  );

  return (
    <ScreenContainer padded={false}>
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <View style={[styles.avatar, { backgroundColor: chat.avatarColor }]}>
            <Text style={styles.avatarText}>{chat.avatar}</Text>
          </View>
          <View style={styles.headerText}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{chat.name}</Text>
              {chat.verified ? <Text style={styles.verified}>Verified</Text> : null}
            </View>
            <Text style={styles.online}>{chat.online ? 'Online' : 'Encrypted session'}</Text>
          </View>
          <TouchableOpacity style={styles.headerIcon}>
            <Ionicons name="call" size={19} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIcon}>
            <Ionicons name="videocam" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.messages}>
          {chatMessages.map((message) => (
            <MessageBubble key={message.id} message={{ ...message, chatId: chat.id }} />
          ))}
          <View style={styles.timerCard}>
            <Text style={styles.timerLabel}>This message will self-destruct</Text>
            <View style={styles.timerRow}>
              {timers.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[styles.timer, timer === item && styles.timerActive]}
                  onPress={() => setTimer(item)}
                >
                  <Text style={[styles.timerText, timer === item && styles.timerActiveText]}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

        <View style={styles.composer}>
          <TouchableOpacity style={styles.composerIcon}>
            <Ionicons name="add" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <TextInput placeholder="Type a message..." placeholderTextColor={colors.muted} style={styles.input} />
          <TouchableOpacity style={styles.composerIcon}>
            <Ionicons name="happy" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.mic}>
            <Ionicons name="mic" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    minHeight: 66,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  back: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...typography.small,
    color: colors.text,
  },
  headerText: {
    flex: 1,
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
  },
  verified: {
    ...typography.small,
    color: colors.security,
  },
  online: {
    ...typography.small,
    color: colors.textSecondary,
  },
  headerIcon: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messages: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  timerCard: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(17,17,26,0.86)',
    padding: spacing.md,
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  timerLabel: {
    ...typography.small,
    textAlign: 'center',
    color: colors.textSecondary,
  },
  timerRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  timer: {
    flex: 1,
    minHeight: 38,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  timerActive: {
    backgroundColor: colors.primary,
  },
  timerText: {
    ...typography.small,
    color: colors.textSecondary,
  },
  timerActiveText: {
    color: colors.text,
  },
  composer: {
    minHeight: 74,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  composerIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    minHeight: 44,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    color: colors.text,
    paddingHorizontal: spacing.md,
    fontWeight: '600',
  },
  mic: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
