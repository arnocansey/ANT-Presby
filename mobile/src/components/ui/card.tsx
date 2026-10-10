import React from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type AccessibilityActionEvent,
  type AccessibilityActionInfo,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { Corner, Space } from '@/constants/tokens';
import { useAppTheme } from '@/hooks/use-app-theme';

// A pressable card is one accessible element, so buttons nested inside it are hidden from screen
// readers; pass `accessibilityActions` to expose those extra actions from the card itself.
export function AppCard({
  children,
  onPress,
  style,
  accessibilityLabel,
  accessibilityActions,
  onAccessibilityAction,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityActions?: readonly AccessibilityActionInfo[];
  onAccessibilityAction?: (event: AccessibilityActionEvent) => void;
}) {
  const { colors } = useAppTheme();
  const base = [styles.card, { backgroundColor: colors.card, borderColor: colors.border }, style];
  if (!onPress) return <View style={base}>{children}</View>;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityActions={accessibilityActions}
      onAccessibilityAction={onAccessibilityAction}
      style={({ pressed }) => [...base, pressed && { backgroundColor: colors.surface }]}>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: Corner.card, padding: Space.md, gap: Space.sm },
});

export default AppCard;
