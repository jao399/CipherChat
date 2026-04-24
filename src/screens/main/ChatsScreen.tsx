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
import { colors, radii, spacing, typography } from '../../theme';
import type { RootStackParamList } from '../../navigation/types';

type Filter = 'All' | 'Unread' | 'Groups' | 'Verified';

const filters: Filter[] = ['All', 'Unread', 'Groups', 'Verified'];

export function ChatsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('All');

  const filteredChats = useMemo(() => {
    return chats.filter((chat) => {
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
        <View style={styles.header}>
          <Text style={styles.title}>
            Cipher<Text style={styles.purple}>Chat</Text>
          </Text>
          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('DeviceVerification')}>
            <Ionicons name="scan" size={21} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchRow}>
          <View style={styles.search}>
            <Ionicons name="search" size={18} color={colors.muted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search conversations"
              placeholderTextColor={colors.muted}
              style={styles.searchInput}
            />
          </View>
          <TouchableOpacity style={styles.addButton}>
            <Ionicons name="add" size={26} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.filters}>
          {filters.map((item) => (
            <FilterChip key={item} label={item} active={filter === item} onPress={() => setFilter(item)} />
          ))}
        </View>

        <FlatList
          data={filteredChats}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ChatListItem chat={item} onPress={() => navigation.navigate('Conversation', { chatId: item.id })} />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState title="No secure chats found" text="Try a different search or filter." icon="chatbubble-ellipses" />
          }
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingBottom: 92,
  },
  header: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    ...typography.subtitle,
    fontSize: 23,
  },
  purple: {
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
    marginTop: spacing.md,
  },
  search: {
    flex: 1,
    minHeight: 48,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
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
    width: 48,
    height: 48,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filters: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  list: {
    paddingBottom: spacing.xxl,
  },
});
