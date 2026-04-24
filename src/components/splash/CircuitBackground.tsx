import { Animated, StyleSheet, View, type ViewStyle } from 'react-native';

import { encryptedSplash } from '../../constants/splash';

type CircuitBackgroundProps = {
  opacity: Animated.Value;
};

const verticalLines = [0.11, 0.22, 0.34, 0.48, 0.63, 0.78, 0.9];
const horizontalLines = [0.12, 0.23, 0.36, 0.49, 0.61, 0.74, 0.87];

type CircuitSegment = ViewStyle & {
  rotate: `${number}deg`;
};

const circuitSegments: CircuitSegment[] = [
  { top: '18%', left: '9%', width: 82, rotate: '0deg' },
  { top: '18%', left: '29%', width: 44, rotate: '90deg' },
  { top: '29%', right: '12%', width: 96, rotate: '0deg' },
  { top: '38%', right: '28%', width: 54, rotate: '90deg' },
  { bottom: '28%', left: '13%', width: 118, rotate: '0deg' },
  { bottom: '20%', left: '35%', width: 42, rotate: '90deg' },
  { bottom: '17%', right: '14%', width: 104, rotate: '0deg' },
];

export function CircuitBackground({ opacity }: CircuitBackgroundProps) {
  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity }]}>
      <View style={styles.grid}>
        {verticalLines.map((position) => (
          <View key={`v-${position}`} style={[styles.vertical, { left: `${position * 100}%` }]} />
        ))}
        {horizontalLines.map((position) => (
          <View key={`h-${position}`} style={[styles.horizontal, { top: `${position * 100}%` }]} />
        ))}
      </View>

      {circuitSegments.map(({ rotate, ...segment }, index) => (
        <View key={`segment-${index}`} style={[styles.segment, segment, { transform: [{ rotate }] }]}>
          <View style={styles.node} />
          <View style={styles.segmentLine} />
          <View style={styles.node} />
        </View>
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  grid: {
    ...StyleSheet.absoluteFillObject,
  },
  vertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(168,85,247,0.11)',
  },
  horizontal: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(168,85,247,0.08)',
  },
  segment: {
    position: 'absolute',
    height: 10,
    flexDirection: 'row',
    alignItems: 'center',
    opacity: 0.42,
  },
  segmentLine: {
    flex: 1,
    height: 1,
    backgroundColor: encryptedSplash.colors.deepPurple,
  },
  node: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: encryptedSplash.colors.secondaryPurple,
  },
});
