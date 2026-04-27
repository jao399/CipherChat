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
      <View pointerEvents="none" style={styles.perspectiveGrid}>
        {Array.from({ length: 9 }).map((_, index) => (
          <View key={`v-${index}`} style={[styles.gridLineVertical, { left: `${10 + index * 10}%` }]} />
        ))}
        {Array.from({ length: 5 }).map((_, index) => (
          <View key={`h-${index}`} style={[styles.gridLineHorizontal, { top: `${18 + index * 16}%` }]} />
        ))}
      </View>
      <View style={styles.fileIcon}>
        <Ionicons name="document-lock" size={96} color={colors.security} />
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
    minHeight: 260,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    overflow: 'hidden',
  },
  fileIcon: {
    width: 138,
    height: 138,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'rgba(25,217,142,0.46)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(34,197,94,0.12)',
    shadowColor: colors.security,
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
  },
  name: {
    ...typography.subtitle,
    textAlign: 'center',
    fontSize: 21,
    marginTop: spacing.sm,
  },
  size: {
    ...typography.body,
  },
  perspectiveGrid: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.26,
  },
  gridLineVertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: StyleSheet.hairlineWidth,
    backgroundColor: colors.security,
  },
  gridLineHorizontal: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.security,
  },
});
