import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { SecureButton } from '../../components/common/Buttons';
import { DarkCard } from '../../components/common/DarkCard';
import { FileTransferCard } from '../../components/common/FileTransferCard';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { useLanguage } from '../../i18n';
import { colors, radii, spacing, typography } from '../../theme';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'SecureFileTransfer'>;

export function SecureFileTransferScreen({ navigation }: Props) {
  const { t, rowDirection, isRTL } = useLanguage();
  const checkpoints = [
    [t('security.fileTransfer.cryptoBoundary'), t('security.fileTransfer.cryptoBoundaryDetail')],
    [t('security.fileTransfer.opaqueTransfer'), t('security.fileTransfer.opaqueTransferDetail')],
    [t('security.fileTransfer.fileProtection'), t('security.fileTransfer.fileProtectionDetail')],
    [t('security.fileTransfer.autoDelete'), t('security.fileTransfer.autoDeleteDetail')],
  ];

  return (
    <ScreenContainer scroll contentContainerStyle={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Back from secure file transfer"
          testID="secure-transfer-back"
          style={styles.back}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name={isRTL ? 'chevron-forward' : 'chevron-back'} size={30} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>{t('security.fileTransfer.title')}</Text>
        <View style={styles.headerSpacer} />
      </View>
      <FileTransferCard name="Quarterly_Report.pdf" size="8.7 MB" />
      <DarkCard style={styles.checkpoints}>
        {checkpoints.map(([title, detail], index) => (
          <View key={title} style={[styles.checkRow, { flexDirection: rowDirection }]}>
            <View style={styles.checkIcon}>
              <Ionicons
                name={index === 0 ? 'lock-closed-outline' : index === 1 ? 'file-tray-full-outline' : index === 2 ? 'shield-checkmark-outline' : 'timer-outline'}
                size={28}
                color={colors.text}
              />
            </View>
            <View style={styles.checkText}>
              <Text style={styles.checkTitle}>{title}</Text>
              <Text style={styles.checkDetail}>{detail}</Text>
            </View>
            {index === 3 ? (
              <Text style={styles.on}>ON</Text>
            ) : (
              <View style={styles.checkCircle}>
                <Ionicons name="checkmark" size={18} color={colors.background} />
              </View>
            )}
          </View>
        ))}
      </DarkCard>
      <SecureButton
        accessibilityLabel="Preview secure file send"
        testID="secure-transfer-send"
        onPress={() => navigation.goBack()}
      >
        {t('security.fileTransfer.previewSend')}
      </SecureButton>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: {
    justifyContent: 'center',
  },
  header: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  back: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.subtitle,
    flex: 1,
    textAlign: 'center',
    fontSize: 24,
  },
  headerSpacer: {
    width: 42,
  },
  checkpoints: {
    gap: 0,
    marginVertical: spacing.xl,
    paddingVertical: spacing.sm,
  },
  checkRow: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  checkIcon: {
    width: 38,
    alignItems: 'center',
  },
  checkText: {
    flex: 1,
  },
  checkTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '800',
    fontSize: 18,
  },
  checkDetail: {
    ...typography.body,
    color: colors.textSecondary,
  },
  on: {
    ...typography.subtitle,
    color: colors.security,
    fontSize: 18,
  },
  checkCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.security,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
