import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { ChatListItem } from '../../components/chat/ChatListItem';
import { EmptyState } from '../../components/common/EmptyState';
import { FilterChip } from '../../components/common/FilterChip';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { chats } from '../../data/mockData';
import { useBackend } from '../../hooks/useBackend';
import { useLanguage, type TranslationKey } from '../../i18n';
import { colors, radii, spacing, typography } from '../../theme';
import type { RootStackParamList } from '../../navigation/types';

type Filter = 'All' | 'Unread' | 'Groups' | 'Verified';

const filters: Filter[] = ['All', 'Unread', 'Groups', 'Verified'];
const filterLabelKeys: Record<Filter, TranslationKey> = {
  All: 'chats.filter.all',
  Unread: 'chats.filter.unread',
  Groups: 'chats.filter.groups',
  Verified: 'chats.filter.verified',
};

export function ChatsScreen() {
  const { t, textAlign, rowDirection } = useLanguage();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { inboundEnvelopeStatus } = useBackend();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('All');

  const filteredChats = useMemo(() => {
    return chats.slice(0, 5).filter((chat) => {
      const matchesSearch = chat.name.toLowerCase().includes(query.toLowerCase());
      const matchesFilter =
        filter === 'All' ||
        (filter === 'Unread' && chat.unread > 0) ||
        (filter === 'Groups' && chat.group) ||
        (filter === 'Verified' && chat.verified);
      return matchesSearch && matchesFilter;
    });
  }, [filter, query]);

  return (
    <ScreenContainer padded={false}>
      <View style={styles.content}>
        <View style={[styles.header, { flexDirection: rowDirection }]}>
          <Text style={styles.title}>CipherChat</Text>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Open device verification"
            testID="chats-device-verification"
            style={styles.iconButton}
            onPress={() => navigation.navigate('DeviceVerification')}
          >
            <Ionicons name="star-outline" size={19} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchRow}>
          <View style={[styles.search, { flexDirection: rowDirection }]}>
            <Ionicons name="search" size={18} color={colors.muted} />
            <TextInput
              accessibilityLabel={t('chats.search')}
              testID="chats-search"
              value={query}
              onChangeText={setQuery}
              placeholder={t('chats.search')}
              placeholderTextColor={colors.muted}
              style={[styles.searchInput, { textAlign }]}
            />
          </View>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Start a new chat" testID="chats-add" style={styles.addButton}>
            <Ionicons name="add" size={26} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.filters}>
          {filters.map((item) => (
            <FilterChip
              key={item}
              label={t(filterLabelKeys[item])}
              active={filter === item}
              testID={`chat-filter-${item.toLowerCase()}`}
              onPress={() => setFilter(item)}
            />
          ))}
        </View>

        <View style={styles.inboxStatus}>
          <View style={styles.inboxIcon}>
            <Ionicons
              name={inboundEnvelopeStatus.lastError ? 'warning' : inboundEnvelopeStatus.nextCursor ? 'mail-unread' : 'mail-open'}
              size={17}
              color={inboundEnvelopeStatus.lastError ? colors.warning : colors.primaryBright}
            />
          </View>
          <View style={styles.inboxText}>
            <Text style={[styles.inboxTitle, { textAlign }]}>{t('chats.inbox.title')}</Text>
            <Text style={styles.inboxSubtitle}>
              {inboundEnvelopeStatus.lastError
                ? inboundEnvelopeStatus.lastError
                : inboundEnvelopeStatus.lastPolledAt
                  ? `${inboundEnvelopeStatus.totalAcknowledged} ${t('chats.inbox.receiptsAcknowledged')}${inboundEnvelopeStatus.nextCursor ? ` | ${t('chats.inbox.more')}` : ''}`
                  : t('chats.inbox.idle')}
            </Text>
          </View>
        </View>

        <FlatList
          testID="chats-list"
          data={filteredChats}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ChatListItem chat={item} onPress={() => navigation.navigate('Conversation', { chatId: item.id })} />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState title={t('chats.empty.title')} text={t('chats.empty.text')} icon="chatbubble-ellipses" />
          }
          ListFooterComponent={filteredChats.length > 0 ? <ArchiveRow /> : null}
        />
      </View>
    </ScreenContainer>
  );
}

function ArchiveRow() {
  const { t, rowDirection } = useLanguage();

  return (
    <View style={[styles.archiveRow, { flexDirection: rowDirection }]}>
      <View style={styles.archiveAvatar}>
        <Ionicons name="archive-outline" size={27} color={colors.textSecondary} />
      </View>
      <View style={styles.archiveBody}>
        <View style={styles.archiveNameRow}>
          <Text style={styles.archiveName}>{t('chats.archive')}</Text>
          <Ionicons name="lock-closed" size={13} color={colors.textSecondary} />
        </View>
        <Text style={styles.archiveText}>{t('chats.archiveCount')}</Text>
      </View>
      <Ionicons name="chevron-forward" size={25} color={colors.textSecondary} />
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingBottom: 92,
  },
  header: {
    minHeight: 66,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    ...typography.subtitle,
    fontSize: 27,
    color: colors.primaryBright,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  searchRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  search: {
    flex: 1,
    minHeight: 56,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(17,17,26,0.94)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontWeight: '600',
  },
  addButton: {
    width: 56,
    height: 56,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filters: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  list: {
    paddingBottom: spacing.xxl,
  },
  inboxStatus: {
    minHeight: 56,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.28)',
    backgroundColor: 'rgba(124,45,255,0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  inboxIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(124,45,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inboxText: {
    flex: 1,
    gap: 2,
  },
  inboxTitle: {
    ...typography.small,
    color: colors.text,
    textTransform: 'uppercase',
    fontWeight: '900',
  },
  inboxSubtitle: {
    ...typography.small,
    color: colors.textSecondary,
  },
  archiveRow: {
    minHeight: 82,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  archiveAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  archiveBody: {
    flex: 1,
    gap: spacing.xs,
  },
  archiveNameRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  archiveName: {
    ...typography.body,
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  archiveText: {
    ...typography.small,
    color: colors.textSecondary,
    fontSize: 13,
  },
});
