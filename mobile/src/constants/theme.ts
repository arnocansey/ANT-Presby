import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#F8FAFC',
    background: '#0A0C16',
    backgroundElement: '#151826',
    backgroundSelected: '#1D2233',
    textSecondary: '#8F9BB7',
    textMuted: '#CDD6F4',
    tint: '#FF9F1A',
    border: '#242A3D',
    heroStart: '#FF9F1A',
    heroMid: '#7C3AED',
    heroEnd: '#2563EB',
    accent: '#A855F7',
    accentSoft: '#22163A',
    success: '#10B981',
    danger: '#FB7185',
    white: '#FFFFFF',
  },
  dark: {
    text: '#F8FAFC',
    background: '#0A0C16',
    backgroundElement: '#151826',
    backgroundSelected: '#1D2233',
    textSecondary: '#8F9BB7',
    textMuted: '#CDD6F4',
    tint: '#FF9F1A',
    border: '#242A3D',
    heroStart: '#FF9F1A',
    heroMid: '#7C3AED',
    heroEnd: '#2563EB',
    accent: '#A855F7',
    accentSoft: '#22163A',
    success: '#34D399',
    danger: '#FB7185',
    white: '#FFFFFF',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    serif: 'Georgia, serif',
    rounded: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    mono: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 48,
  seven: 64,
} as const;

export const Radius = {
  small: 12,
  medium: 18,
  large: 28,
  pill: 999,
} as const;

export const BottomTabInset = Platform.select({ ios: 54, android: 80 }) ?? 0;
export const MaxContentWidth = 880;
