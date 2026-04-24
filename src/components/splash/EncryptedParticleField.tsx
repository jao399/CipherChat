import { useMemo } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { encryptedSplash } from '../../constants/splash';

type EncryptedParticleFieldProps = {
  progress: Animated.Value;
  width: number;
  height: number;
};

type Particle = {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  size: number;
};

const logoPoints = [
  [0, -58],
  [50, -30],
  [50, 30],
  [0, 58],
  [-50, 30],
  [-50, -30],
  [0, -34],
  [29, -17],
  [29, 18],
  [0, 35],
  [-29, 18],
  [-29, -17],
  [-18, 4],
  [18, 4],
  [25, 18],
  [0, 23],
  [-25, 18],
] as const;

function createParticles(width: number, height: number): Particle[] {
  const centerY = height * 0.42;
  const startRadiusX = width * 0.56;
  const startRadiusY = height * 0.34;

  return Array.from({ length: 34 }, (_, index) => {
    const angle = (Math.PI * 2 * index) / 34 - Math.PI / 2;
    const jitter = index % 2 === 0 ? 1 : 0.78;
    const [endX, endY] = logoPoints[index % logoPoints.length];

    return {
      id: `particle-${index}`,
      startX: Math.cos(angle) * startRadiusX * jitter,
      startY: Math.sin(angle) * startRadiusY * jitter + (index % 3) * 16,
      endX: endX * 0.88,
      endY: endY * 0.88,
      size: 3 + (index % 4),
    };
  }).map((particle) => ({
    ...particle,
    startY: particle.startY + centerY - height * 0.42,
  }));
}

export function EncryptedParticleField({ progress, width, height }: EncryptedParticleFieldProps) {
  const particles = useMemo(() => createParticles(width, height), [width, height]);
  const centerY = height * 0.42;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {particles.map((particle, index) => {
        const translateX = progress.interpolate({
          inputRange: [0, 0.36, 1],
          outputRange: [particle.startX, particle.startX * 0.76, particle.endX],
        });
        const translateY = progress.interpolate({
          inputRange: [0, 0.36, 1],
          outputRange: [particle.startY, particle.startY * 0.72, particle.endY],
        });
        const opacity = progress.interpolate({
          inputRange: [0, 0.12, 0.74, 1],
          outputRange: [0, 0.9, 0.78, 0.18],
        });
        const scale = progress.interpolate({
          inputRange: [0, 0.55, 1],
          outputRange: [0.55, 1, 0.7],
        });

        return (
          <Animated.View
            key={particle.id}
            style={[
              styles.particle,
              {
                width: particle.size,
                height: particle.size,
                borderRadius: particle.size / 2,
                left: width / 2,
                top: centerY,
                opacity,
                transform: [{ translateX }, { translateY }, { scale }],
                backgroundColor:
                  index % 5 === 0
                    ? encryptedSplash.colors.secondaryPurple
                    : encryptedSplash.colors.glowPurple,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  particle: {
    position: 'absolute',
    shadowColor: encryptedSplash.colors.glowPurple,
    shadowOpacity: 0.9,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
});
