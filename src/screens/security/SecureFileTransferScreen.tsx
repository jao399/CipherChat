import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { SecureButton } from '../../components/common/Buttons';
import { DarkCard } from '../../components/common/DarkCard';
import { FileTransferCard } from '../../components/common/FileTransferCard';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { colors, radii, spacing, typography } from '../../theme';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'SecureFileTransfer'>;

const checkpoints = [
  ['End-to-end Encrypted', 'File is encrypted on your device'],
  ['Secure Transfer', 'Transferred directly to recipient'],
  ['File Protection', 'Blocked from screenshots'],
  ['Auto-Delete', 'File will be removed after view'],
];

export function SecureFileTransferScreen({ navigation }: Props) {
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
          <Ionicons name="chevron-back" size={30} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Secure File Transfer</Text>
        <View style={styles.headerSpacer} />
      </View>
      <FileTransferCard name="Quarterly_Report.pdf" size="8.7 MB" />
      <DarkCard style={styles.checkpoints}>
        {checkpoints.map(([title, detail], index) => (
          <View key={title} style={styles.checkRow}>
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
        accessibilityLabel="Send file securely"
        testID="secure-transfer-send"
        onPress={() => navigation.goBack()}
      >
        SEND SECURELY
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
