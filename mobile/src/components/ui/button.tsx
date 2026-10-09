import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Corner, MIN_TOUCH, Space } from '@/constants/tokens';
import { useAppTheme } from '@/hooks/use-app-theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

export function AppButton({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  accessibilityLabel,
}: {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: 'md' | 'sm';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  accessibilityLabel?: string;
}) {
  const { colors } = useAppTheme();
  const palette = {
    primary: { bg: colors.primary, fg: colors.onPrimary, border: colors.primary },
    secondary: { bg: colors.background, fg: colors.text, border: colors.input },
    ghost: { bg: 'transparent', fg: colors.text, border: 'transparent' },
    danger: { bg: colors.dangerSolid, fg: colors.onDangerSolid, border: colors.dangerSolid },
  }[variant];
  const inactive = disabled || loading;

  return (
    <Pressable
      onPress={inactive ? undefined : onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        size === 'sm' ? styles.sm : styles.md,
        { backgroundColor: palette.bg, borderColor: palette.border, opacity: inactive ? 0.5 : pressed ? 0.85 : 1 },
      ]}>
      <View style={styles.row}>
        {loading ? <ActivityIndicator size="small" color={palette.fg} /> : icon}
        <AppText variant="bodyStrong" style={{ color: palette.fg }}>
          {label}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: Corner.control, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  md: { minHeight: MIN_TOUCH, paddingHorizontal: Space.lg },
  sm: { minHeight: MIN_TOUCH, paddingHorizontal: Space.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: Space.sm },
});

export default AppButton;
