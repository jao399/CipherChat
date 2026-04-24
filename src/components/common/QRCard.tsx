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

export function VerificationCodeCard() {
  return (
    <View style={styles.codeCard}>
      <Text style={styles.codeLabel}>Safety Code</Text>
      <Text style={styles.code}>7XQ9  |  L2M8  |  P4K7</Text>
      <Text style={styles.code}>J6D3  |  N9Z1  |  H7F2</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: 'center',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.primaryBright,
    padding: spacing.md,
    backgroundColor: 'rgba(139,61,255,0.10)',
  },
  qr: {
    width: 236,
    height: 236,
    borderRadius: radii.sm,
    backgroundColor: colors.white,
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
    position: 'relative',
  },
  cell: {
    width: 10.28,
    height: 10.28,
    backgroundColor: '#F2F2F7',
  },
  cellOn: {
    backgroundColor: '#111111',
  },
  logo: {
    position: 'absolute',
    left: 96,
    top: 96,
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeCard: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
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
