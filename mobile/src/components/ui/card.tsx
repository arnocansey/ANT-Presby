import React from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Corner, Space } from '@/constants/tokens';
import { useAppTheme } from '@/hooks/use-app-theme';

export function AppCard({
  children,
  onPress,
  style,
  accessibilityLabel,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}) {
  const { colors } = useAppTheme();
  const base = [styles.card, { backgroundColor: colors.card, borderColor: colors.border }, style];
  if (!onPress) return <View style={base}>{children}</View>;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [...base, pressed && { backgroundColor: colors.surface }]}>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: Corner.card, padding: Space.md, gap: Space.sm },
});

export default AppCard;
