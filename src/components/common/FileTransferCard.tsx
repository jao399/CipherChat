import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import { colors, gradients, radii, spacing, typography } from '../../theme';

type FileTransferCardProps = {
  name: string;
  size: string;
};

export function FileTransferCard({ name, size }: FileTransferCardProps) {
  return (
    <LinearGradient colors={gradients.card} style={styles.card}>
      <View style={styles.fileIcon}>
        <Ionicons name="document-lock" size={64} color={colors.security} />
      </View>
      <Text style={styles.name}>{name}</Text>
      <Text style={styles.size}>{size}</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 210,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  fileIcon: {
    width: 100,
    height: 100,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(25,217,142,0.46)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(25,217,142,0.10)',
  },
  name: {
    ...typography.subtitle,
    textAlign: 'center',
  },
  size: {
    ...typography.body,
  },
});
