import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing, typography } from '../../theme';
import { LogoMark } from './LogoMark';

const QR_SIZE = 21;

function isFinder(row: number, col: number) {
  const inTopLeft = row < 7 && col < 7;
  const inTopRight = row < 7 && col >= QR_SIZE - 7;
  const inBottomLeft = row >= QR_SIZE - 7 && col < 7;
  return inTopLeft || inTopRight || inBottomLeft;
}

function isFinderOn(row: number, col: number) {
  const localRow = row < 7 ? row : row - (QR_SIZE - 7);
  const localCol = col < 7 ? col : col - (QR_SIZE - 7);
  return (
    localRow === 0 ||
    localRow === 6 ||
    localCol === 0 ||
    localCol === 6 ||
    (localRow >= 2 && localRow <= 4 && localCol >= 2 && localCol <= 4)
  );
}

export function QRCard() {
  const cells = Array.from({ length: QR_SIZE * QR_SIZE }, (_, index) => {
    const row = Math.floor(index / QR_SIZE);
    const col = index % QR_SIZE;
    const finder = isFinder(row, col);
    const on = finder ? isFinderOn(row, col) : (row * 7 + col * 11 + row * col) % 5 < 2;
    return { id: `${row}-${col}`, on };
  });

  return (
    <View style={styles.wrapper}>
      <View style={styles.qr}>
        {cells.map((cell) => (
          <View key={cell.id} style={[styles.cell, cell.on && styles.cellOn]} />
        ))}
        <View style={styles.logo}>
          <LogoMark size={44} />
        </View>
      </View>
    </View>
  );
}

type VerificationCodeCardProps = {
  blocks?: string[];
};

export function VerificationCodeCard({ blocks = ['7XQ9', 'L2M8', 'P4K7', 'J6D3', 'N9Z1', 'H7F2'] }: VerificationCodeCardProps) {
  const firstRow = blocks.slice(0, 3).join('  |  ');
  const secondRow = blocks.slice(3, 6).join('  |  ');

  return (
    <View style={styles.codeCard}>
      <Text style={styles.codeLabel}>Safety Code</Text>
      <Text style={styles.code}>{firstRow}</Text>
      <Text style={styles.code}>{secondRow}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: 'center',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.primaryBright,
    padding: spacing.lg,
    backgroundColor: 'rgba(124,45,255,0.08)',
    shadowColor: colors.primaryBright,
    shadowOpacity: 0.34,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
  },
  qr: {
    width: 226,
    height: 226,
    borderRadius: radii.sm,
    backgroundColor: '#0F1015',
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 9,
    position: 'relative',
  },
  cell: {
    width: 9.9,
    height: 9.9,
    backgroundColor: '#161820',
  },
  cellOn: {
    backgroundColor: '#F2F3F7',
  },
  logo: {
    position: 'absolute',
    left: 91,
    top: 91,
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: '#0F1015',
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeCard: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(10,10,18,0.82)',
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  codeLabel: {
    ...typography.small,
    textTransform: 'uppercase',
    color: colors.muted,
  },
  code: {
    ...typography.subtitle,
    color: colors.security,
    fontSize: 19,
  },
});
