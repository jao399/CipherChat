import type { ViewStyle } from 'react-native';

export const colors = {
  background: '#07070B',
  backgroundSecondary: '#0B0B12',
  surface: '#11111A',
  surfaceElevated: '#151524',
  surfaceGlass: 'rgba(21, 21, 36, 0.78)',
  primary: '#8B3DFF',
  primaryBright: '#A855F7',
  primaryDeep: '#5B21B6',
  security: '#19D98E',
  emerald: '#12B981',
  danger: '#FF5F7A',
  warning: '#F4B740',
  text: '#F5F7FF',
  textSecondary: '#B1B6C9',
  muted: '#7E8499',
  border: '#232238',
  divider: 'rgba(255,255,255,0.08)',
  black: '#000000',
  white: '#FFFFFF',
};

export const spacing = {
  xxs: 4,
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 44,
};

export const radii = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 8,
  pill: 999,
};

export const typography = {
  hero: {
    fontSize: 34,
    lineHeight: 42,
    fontWeight: '800' as const,
    color: colors.text,
  },
  title: {
    fontSize: 26,
    lineHeight: 34,
    fontWeight: '800' as const,
    color: colors.text,
  },
  subtitle: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '700' as const,
    color: colors.text,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500' as const,
    color: colors.textSecondary,
  },
  small: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600' as const,
    color: colors.muted,
  },
  button: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '800' as const,
    color: colors.text,
  },
};

export const shadows = {
  purpleGlow: {
    shadowColor: colors.primaryBright,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.42,
    shadowRadius: 18,
    elevation: 10,
  } satisfies ViewStyle,
  greenGlow: {
    shadowColor: colors.security,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.34,
    shadowRadius: 14,
    elevation: 8,
  } satisfies ViewStyle,
  card: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.38,
    shadowRadius: 22,
    elevation: 8,
  } satisfies ViewStyle,
};

export const gradients = {
  screen: [colors.background, '#090713', colors.backgroundSecondary] as const,
  purple: [colors.primaryBright, colors.primary, colors.primaryDeep] as const,
  green: [colors.security, colors.emerald] as const,
  card: ['rgba(139,61,255,0.14)', 'rgba(17,17,26,0.78)'] as const,
};

export const layout = {
  screenPadding: spacing.xl,
  maxPhoneWidth: 480,
};
