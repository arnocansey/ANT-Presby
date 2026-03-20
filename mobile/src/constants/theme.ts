import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#0F172A',
    background: '#FFFFFF',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#DBEAFE',
    textSecondary: '#64748B',
    textMuted: '#334155',
    tint: '#2563EB',
    border: '#E2E8F0',
    heroStart: '#1D4ED8',
    heroMid: '#2563EB',
    heroEnd: '#60A5FA',
    accent: '#2563EB',
    accentSoft: '#EFF6FF',
    success: '#059669',
    danger: '#B91C1C',
    white: '#FFFFFF',
  },
  dark: {
    text: '#F8FAFC',
    background: '#020617',
    backgroundElement: '#0F172A',
    backgroundSelected: '#1E3A8A',
    textSecondary: '#94A3B8',
    textMuted: '#CBD5E1',
    tint: '#60A5FA',
    border: '#1E293B',
    heroStart: '#0F172A',
    heroMid: '#1D4ED8',
    heroEnd: '#2563EB',
    accent: '#60A5FA',
    accentSoft: '#172554',
    success: '#34D399',
    danger: '#F87171',
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
