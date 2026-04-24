import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';

import { SecureButton } from '../../components/common/Buttons';
import { DarkCard } from '../../components/common/DarkCard';
import { FileTransferCard } from '../../components/common/FileTransferCard';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { ScreenHeader } from '../../components/common/ScreenHeader';
import { colors, spacing, typography } from '../../theme';
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
    <ScreenContainer scroll>
      <ScreenHeader title="Secure File Transfer" subtitle="Encrypted. Protected. Private." back />
      <FileTransferCard name="Quarterly_Report.pdf" size="8.7 MB" />
      <DarkCard style={styles.checkpoints}>
        {checkpoints.map(([title, detail], index) => (
          <View key={title} style={styles.checkRow}>
            <View style={styles.checkIcon}>
              <Ionicons name={index === 3 ? 'timer' : 'checkmark-circle'} size={22} color={colors.security} />
            </View>
            <View style={styles.checkText}>
              <Text style={styles.checkTitle}>{title}</Text>
              <Text style={styles.checkDetail}>{detail}</Text>
            </View>
            <Text style={styles.on}>{index === 3 ? 'ON' : ''}</Text>
          </View>
        ))}
      </DarkCard>
      <SecureButton onPress={() => navigation.goBack()} icon="send">
        Send Securely
      </SecureButton>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  checkpoints: {
    gap: spacing.md,
    marginVertical: spacing.xl,
  },
  checkRow: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  checkIcon: {
    width: 32,
    alignItems: 'center',
  },
  checkText: {
    flex: 1,
  },
  checkTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '800',
  },
  checkDetail: {
    ...typography.small,
  },
  on: {
    ...typography.small,
    color: colors.security,
  },
});
