import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import {
  Alert,
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
import { useBackend } from '../../hooks/useBackend';
import { useLanguage } from '../../i18n';
import { describeRemoteTrustState, findRemoteTrustRecord } from '../../security';
import { colors, radii, spacing, typography } from '../../theme';
import type { RootStackParamList } from '../../navigation/types';
import type { Message } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Conversation'>;

const timers = ['10s', '30s', '1m', '5m', '10m'];

export function ConversationScreen({ navigation, route }: Props) {
  const { t, textAlign, rowDirection, isRTL } = useLanguage();
  const [timer, setTimer] = useState('30s');
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [queuedCopy, setQueuedCopy] = useState<string | null>(null);
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const { remoteTrustRecords, sendSecureMessage, outboundQueue, retryOutboundMessage } = useBackend();
  const chat = chats.find((item) => item.id === route.params.chatId) ?? chats[0];
  const remoteTrust = findRemoteTrustRecord(remoteTrustRecords, chat.id, chat.name);
  const remoteTrustCopy = remoteTrust ? describeRemoteTrustState(remoteTrust.trustState) : null;
  const shouldWarnTrust = remoteTrust?.trustState === 'changed' || remoteTrust?.trustState === 'new';
  const chatMessages = useMemo(
    () => messages.filter((message) => message.chatId === chat.id || message.chatId === 'eleanor').slice(0, 4),
    [chat.id],
  );
  const conversationQueue = useMemo(
    () => outboundQueue.filter((item) => item.conversationId === chat.id),
    [chat.id, outboundQueue],
  );
  const visibleMessages = useMemo(() => {
    const localWithQueueState = localMessages.map((message) => {
      const queueItem = conversationQueue.find((item) => item.id === message.id);
      return queueItem ? { ...message, status: queueItem.state } : message;
    });
    const persistedQueueMessages = conversationQueue
      .filter((item) => !localMessages.some((message) => message.id === item.id))
      .map<Message>((item) => ({
        id: item.id,
        chatId: chat.id,
        sender: 'me',
        kind: 'text',
        text:
          item.state === 'sent'
            ? t('conversation.queuedSent')
            : t('conversation.queuedRetry'),
        time: new Date(item.updatedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
        status: item.state,
      }));

    return [...chatMessages, ...localWithQueueState, ...persistedQueueMessages];
  }, [chat.id, chatMessages, conversationQueue, localMessages, t]);
  const retryableQueue = conversationQueue.filter((item) => item.state === 'failed' || item.state === 'queued');

  const sendDraft = async () => {
    const plaintext = draft.trim();

    if (!plaintext) {
      return;
    }

    if (!remoteTrust) {
      Alert.alert(t('conversation.noTrustedKey.title'), t('conversation.noTrustedKey.text'));
      return;
    }

    setSending(true);
    setQueuedCopy(null);

    try {
      const queuedItem = await sendSecureMessage({
        conversationId: chat.id,
        recipientRecordId: remoteTrust.id,
        plaintext,
        disappearingTimer: timer,
      });
      const now = new Date();
      const sentMessage: Message = {
        id: queuedItem.id,
        chatId: chat.id,
        sender: 'me',
        kind: 'text',
        text: plaintext,
        time: now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
        status: queuedItem.state,
      };

      setLocalMessages((current) => [...current, sentMessage]);
      setQueuedCopy(
        `${queuedItem.envelopeCount} encrypted envelope${queuedItem.envelopeCount === 1 ? '' : 's'} ${queuedItem.state}`,
      );
      setDraft('');
    } catch (error) {
      Alert.alert(
        t('conversation.sendBlocked.title'),
        error instanceof Error ? error.message : t('conversation.sendBlocked.fallback'),
      );
    } finally {
      setSending(false);
    }
  };

  const retryQueuedMessage = async (itemId: string) => {
    setRetryingId(itemId);

    try {
      const item = await retryOutboundMessage(itemId);
      setQueuedCopy(
        `${item.envelopeCount} encrypted envelope${item.envelopeCount === 1 ? '' : 's'} ${item.state}`,
      );
    } catch (error) {
      Alert.alert(
        t('conversation.retryUnavailable.title'),
        error instanceof Error ? error.message : t('conversation.retryUnavailable.fallback'),
      );
    } finally {
      setRetryingId(null);
    }
  };

  return (
    <ScreenContainer padded={false}>
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.header, { flexDirection: rowDirection }]}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={`Back from conversation with ${chat.name}`}
            testID="conversation-back"
            style={styles.back}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name={isRTL ? 'chevron-forward' : 'chevron-back'} size={22} color={colors.text} />
          </TouchableOpacity>
          <View style={[styles.avatar, { backgroundColor: chat.avatarColor }]}>
            <Text style={styles.avatarText}>{chat.avatar}</Text>
          </View>
          <View style={styles.headerText}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{chat.name}</Text>
              {chat.verified ? <Text style={styles.verified}>{t('conversation.verified')}</Text> : null}
            </View>
            <Text style={styles.online}>{chat.online ? t('conversation.online') : t('conversation.encryptedSession')}</Text>
          </View>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Start secure call with ${chat.name}`} testID="conversation-call" style={styles.headerIcon}>
            <Ionicons name="call" size={19} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Start secure video with ${chat.name}`} testID="conversation-video" style={styles.headerIcon}>
            <Ionicons name="videocam" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.messages}>
          {remoteTrust && shouldWarnTrust && remoteTrustCopy ? (
            <View style={[styles.trustWarning, remoteTrust.trustState === 'changed' && styles.changedWarning]}>
              <View style={styles.trustWarningTitleRow}>
                <Ionicons
                  name={remoteTrustCopy.icon}
                  size={18}
                  color={remoteTrust.trustState === 'changed' ? colors.warning : colors.primaryBright}
                />
                <Text style={styles.trustWarningTitle}>{remoteTrustCopy.label}</Text>
              </View>
              <Text style={styles.trustWarningText}>{remoteTrustCopy.detail}</Text>
              <Text style={styles.trustSafety}>{remoteTrust.safetyNumberBlocks.join(' ')}</Text>
            </View>
          ) : null}
          {visibleMessages.map((message) => (
            <MessageBubble key={message.id} message={{ ...message, chatId: chat.id }} />
          ))}
          {queuedCopy ? (
            <View style={styles.outboundStatus}>
              <Ionicons name="lock-closed" size={14} color={colors.primaryBright} />
              <Text style={styles.outboundStatusText}>{queuedCopy}</Text>
            </View>
          ) : null}
          {retryableQueue.length > 0 ? (
            <View style={styles.queueCard}>
              <View style={styles.queueHeader}>
                <Ionicons name="cloud-upload" size={16} color={colors.primaryBright} />
                <Text style={styles.queueTitle}>{t('conversation.outboundQueue')}</Text>
              </View>
              {retryableQueue.map((item) => (
                <View key={item.id} style={styles.queueRow}>
                  <View style={styles.queueBody}>
                    <Text style={styles.queueState}>{item.state}</Text>
                    <Text style={styles.queueMeta}>
                      {item.envelopeCount} {item.envelopeCount === 1 ? t('conversation.envelope') : t('conversation.envelopes')} | {t('conversation.attempt')} {item.attemptCount}
                    </Text>
                    {item.lastError ? <Text style={styles.queueError}>{item.lastError}</Text> : null}
                  </View>
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Retry encrypted outbound message"
                    testID={`conversation-retry-${item.id}`}
                    disabled={retryingId === item.id}
                    style={styles.retryButton}
                    onPress={() => void retryQueuedMessage(item.id)}
                  >
                    <Text style={styles.retryButtonText}>{retryingId === item.id ? t('common.retrying') : t('common.retry')}</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : null}
          <View style={styles.timerCard}>
            <Text style={styles.timerLabel}>{t('conversation.timerLabel')}</Text>
            <View style={styles.timerRow}>
              {timers.map((item) => (
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel={`Set disappearing timer to ${item}`}
                  accessibilityState={{ selected: timer === item }}
                  testID={`timer-${item}`}
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
          <TextInput
            accessibilityLabel={t('conversation.composer')}
            testID="conversation-composer"
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={() => void sendDraft()}
            returnKeyType="send"
            placeholder={t('conversation.composer')}
            placeholderTextColor={colors.muted}
            style={[styles.input, { textAlign }]}
          />
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Open emoji picker" testID="conversation-emoji" style={styles.composerIcon}>
            <Ionicons name="happy" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={draft.trim() ? t('conversation.sendA11y') : t('conversation.voiceA11y')}
            testID={draft.trim() ? 'conversation-send' : 'conversation-mic'}
            disabled={sending}
            style={[styles.mic, sending && styles.micDisabled]}
            onPress={draft.trim() ? () => void sendDraft() : undefined}
          >
            <Ionicons name={sending ? 'sync' : draft.trim() ? 'send' : 'mic'} size={20} color={colors.text} />
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
    minHeight: 76,
    paddingHorizontal: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  back: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
    fontSize: 20,
  },
  verified: {
    ...typography.small,
    color: colors.security,
    backgroundColor: 'rgba(34,197,94,0.18)',
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    textTransform: 'uppercase',
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
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  trustWarning: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.34)',
    backgroundColor: 'rgba(124,45,255,0.08)',
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
  changedWarning: {
    borderColor: 'rgba(244,183,64,0.44)',
    backgroundColor: 'rgba(244,183,64,0.08)',
  },
  trustWarningTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  trustWarningTitle: {
    ...typography.small,
    color: colors.text,
    textTransform: 'uppercase',
    fontWeight: '900',
  },
  trustWarningText: {
    ...typography.small,
    color: colors.textSecondary,
  },
  trustSafety: {
    ...typography.small,
    color: colors.primaryBright,
    fontSize: 11,
  },
  timerCard: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(17,17,26,0.86)',
    padding: spacing.md,
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  outboundStatus: {
    alignSelf: 'center',
    minHeight: 30,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.3)',
    backgroundColor: 'rgba(124,45,255,0.1)',
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  outboundStatusText: {
    ...typography.small,
    color: colors.primaryBright,
    textTransform: 'uppercase',
  },
  queueCard: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.28)',
    backgroundColor: 'rgba(17,17,26,0.82)',
    padding: spacing.md,
    gap: spacing.md,
    marginTop: spacing.md,
  },
  queueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  queueTitle: {
    ...typography.small,
    color: colors.text,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  queueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  queueBody: {
    flex: 1,
    gap: spacing.xxs,
  },
  queueState: {
    ...typography.small,
    color: colors.primaryBright,
    textTransform: 'uppercase',
  },
  queueMeta: {
    ...typography.small,
    color: colors.textSecondary,
  },
  queueError: {
    ...typography.small,
    color: colors.danger,
  },
  retryButton: {
    minHeight: 34,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButtonText: {
    ...typography.small,
    color: colors.text,
    fontWeight: '900',
    textTransform: 'uppercase',
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
    minHeight: 52,
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
    fontSize: 18,
  },
  timerActiveText: {
    color: colors.text,
  },
  composer: {
    minHeight: 84,
    paddingHorizontal: spacing.xl,
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
    minHeight: 58,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    color: colors.text,
    paddingHorizontal: spacing.lg,
    fontWeight: '600',
    fontSize: 17,
  },
  mic: {
    width: 58,
    height: 58,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micDisabled: {
    opacity: 0.72,
  },
});
