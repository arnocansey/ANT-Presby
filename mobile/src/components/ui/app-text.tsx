import React from 'react';
import { Platform, Text, type TextProps } from 'react-native';

import { TypeScale } from '@/constants/tokens';
import { useAppTheme } from '@/hooks/use-app-theme';

type Variant = keyof typeof TypeScale;
type Tone = 'default' | 'muted' | 'primary' | 'link' | 'gold' | 'danger' | 'onPrimary';

export function AppText({
  variant = 'body',
  tone = 'default',
  serif = false,
  style,
  ...props
}: TextProps & { variant?: Variant; tone?: Tone; serif?: boolean }) {
  const { colors } = useAppTheme();
  const color = {
    default: colors.text,
    muted: colors.muted,
    primary: colors.primary,
    link: colors.link,
    gold: colors.goldInk,
    danger: colors.danger,
    onPrimary: colors.onPrimary,
  }[tone];
  const fontFamily = serif ? Platform.select({ ios: 'Georgia', default: 'serif' }) : undefined;
  return <Text style={[TypeScale[variant], { color, fontFamily }, style]} {...props} />;
}

export default AppText;
