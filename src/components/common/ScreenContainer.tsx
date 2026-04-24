import { LinearGradient } from 'expo-linear-gradient';
import type { PropsWithChildren } from 'react';
import { ScrollView, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, gradients, layout, spacing } from '../../theme';

type ScreenContainerProps = PropsWithChildren<{
  scroll?: boolean;
  padded?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
}>;

export function ScreenContainer({
  children,
  scroll = false,
  padded = true,
  contentContainerStyle,
}: ScreenContainerProps) {
  const contentStyle = [
    styles.content,
    padded && styles.padded,
    contentContainerStyle,
  ];

  return (
    <View style={styles.root}>
      <LinearGradient colors={gradients.screen} style={StyleSheet.absoluteFill} />
      <View pointerEvents="none" style={styles.grid}>
        {Array.from({ length: 7 }).map((_, index) => (
          <View
            key={`v-${index}`}
            style={[styles.gridVertical, { left: `${(index + 1) * 12.5}%` }]}
          />
        ))}
        {Array.from({ length: 9 }).map((_, index) => (
          <View
            key={`h-${index}`}
            style={[styles.gridHorizontal, { top: `${(index + 1) * 10}%` }]}
          />
        ))}
      </View>
      <View pointerEvents="none" style={styles.purpleGlow} />
      <View pointerEvents="none" style={styles.greenGlow} />
      <SafeAreaView style={styles.safe}>
        {scroll ? (
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={contentStyle}
          >
            {children}
          </ScrollView>
        ) : (
          <View style={contentStyle}>{children}</View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safe: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    width: '100%',
    maxWidth: layout.maxPhoneWidth,
    alignSelf: 'center',
  },
  padded: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: spacing.xxl,
  },
  grid: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.18,
  },
  gridVertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  gridHorizontal: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  purpleGlow: {
    position: 'absolute',
    top: 70,
    right: -120,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(139,61,255,0.18)',
  },
  greenGlow: {
    position: 'absolute',
    bottom: -90,
    left: -120,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(25,217,142,0.10)',
  },
});
