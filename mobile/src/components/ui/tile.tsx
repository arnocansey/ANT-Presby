import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Corner, Space } from '@/constants/tokens';
import { useAppTheme } from '@/hooks/use-app-theme';

export function AppTile({
  icon,
  label,
  description,
  onPress,
  badge,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  description?: string;
  onPress: () => void;
  badge?: React.ReactNode;
}) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.tile,
        { backgroundColor: pressed ? colors.surface : colors.card, borderColor: colors.border },
      ]}>
      <View style={styles.top}>
        <View style={[styles.icon, { backgroundColor: colors.surface }]}>
          <Ionicons name={icon} size={20} color={colors.primary} />
        </View>
        {badge}
      </View>
      <AppText variant="bodyStrong">{label}</AppText>
      {description ? (
        <AppText variant="small" tone="muted" numberOfLines={2}>
          {description}
        </AppText>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: { flex: 1, minHeight: 112, borderWidth: 1, borderRadius: Corner.card, padding: Space.md, gap: Space.sm },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  icon: { width: 44, height: 44, borderRadius: Corner.control, alignItems: 'center', justifyContent: 'center' },
});

export default AppTile;
