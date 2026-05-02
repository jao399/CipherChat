import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { FilterChip } from '../../components/common/FilterChip';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { ScreenHeader } from '../../components/common/ScreenHeader';
import { SectionHeader } from '../../components/common/SectionHeader';
import { secureFiles } from '../../data/mockData';
import { useLanguage } from '../../i18n';
import { colors, radii, spacing, typography } from '../../theme';
import type { RootStackParamList } from '../../navigation/types';
import type { SecureFile } from '../../types';

const fileIcon: Record<SecureFile['type'], keyof typeof Ionicons.glyphMap> = {
  pdf: 'document-text',
  image: 'image',
  doc: 'reader',
  zip: 'archive',
};

export function FilesScreen() {
  const { t, textAlign, rowDirection } = useLanguage();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <ScreenContainer scroll contentContainerStyle={styles.content}>
      <ScreenHeader title={t('files.title')} subtitle={t('files.subtitle')}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Open secure file transfer"
          testID="files-open-transfer"
          style={styles.iconButton}
          onPress={() => navigation.navigate('SecureFileTransfer')}
        >
          <Ionicons name="cloud-upload" size={20} color={colors.text} />
        </TouchableOpacity>
      </ScreenHeader>

      <View style={[styles.search, { flexDirection: rowDirection }]}>
        <Ionicons name="search" size={18} color={colors.muted} />
        <TextInput
          accessibilityLabel={t('files.search')}
          testID="files-search"
          placeholder={t('files.search')}
          placeholderTextColor={colors.muted}
          style={[styles.searchInput, { textAlign }]}
        />
      </View>

      <View style={styles.filters}>
        {[
          ['all', t('files.filter.all')],
          ['recent', t('files.filter.recent')],
          ['pdf', t('files.filter.pdf')],
          ['images', t('files.filter.images')],
        ].map(([id, label], index) => (
          <FilterChip key={id} label={label} active={index === 0} testID={`files-filter-${id}`} />
        ))}
      </View>

      <SectionHeader title={t('files.recent')} action={t('files.prototypeOnly')} />
      <View style={styles.list}>
        {secureFiles.map((file) => (
          <TouchableOpacity
            key={file.id}
            accessibilityRole="button"
            accessibilityLabel={`${file.name}. ${file.status}. ${file.size}.`}
            testID={`file-row-${file.id}`}
            activeOpacity={0.78}
            style={styles.fileRow}
            onPress={() => navigation.navigate('SecureFileTransfer')}
          >
            <View style={styles.fileIcon}>
              <Ionicons name={fileIcon[file.type]} size={23} color={colors.security} />
            </View>
            <View style={styles.fileBody}>
              <Text style={styles.fileName}>{file.name}</Text>
              <Text style={styles.fileMeta}>{file.owner} | {file.size} | {file.updatedAt}</Text>
            </View>
            <View style={styles.status}>
              <Ionicons name="lock-closed" size={13} color={colors.security} />
              <Text style={styles.statusText}>{file.status}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 110,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  search: {
    minHeight: 48,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontWeight: '600',
  },
  filters: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  list: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(17,17,26,0.78)',
    paddingHorizontal: spacing.lg,
  },
  fileRow: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  fileIcon: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(25,217,142,0.28)',
    backgroundColor: 'rgba(25,217,142,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileBody: {
    flex: 1,
  },
  fileName: {
    ...typography.body,
    color: colors.text,
    fontWeight: '800',
  },
  fileMeta: {
    ...typography.small,
  },
  status: {
    alignItems: 'center',
    gap: 2,
  },
  statusText: {
    ...typography.small,
    color: colors.security,
    fontSize: 10,
  },
});
