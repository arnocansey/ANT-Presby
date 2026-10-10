import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { Corner, MIN_TOUCH } from '@/constants/tokens';
import { useAppTheme } from '@/hooks/use-app-theme';

export type IconName = React.ComponentProps<typeof Ionicons>['name'];

// A 44×44 round button with only an icon; the label is spoken by screen readers.
export function IconButton({
  icon,
  accessibilityLabel,
  onPress,
  variant = 'secondary',
  disabled = false,
}: {
  icon: IconName;
  accessibilityLabel: string;
  onPress?: () => void;
  variant?: 'secondary' | 'primary' | 'ghost' | 'danger';
  disabled?: boolean;
}) {
  const { colors } = useAppTheme();
  const look = {
    secondary: { bg: colors.background, fg: colors.text, border: colors.input },
    primary: { bg: colors.primary, fg: colors.onPrimary, border: colors.primary },
    ghost: { bg: 'transparent', fg: colors.muted, border: 'transparent' },
    danger: { bg: colors.background, fg: colors.danger, border: colors.input },
  }[variant];

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: look.bg, borderColor: look.border, opacity: disabled ? 0.5 : pressed ? 0.7 : 1 },
      ]}>
      <Ionicons name={icon} size={20} color={look.fg} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    borderRadius: Corner.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default IconButton;
