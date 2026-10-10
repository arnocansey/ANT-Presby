import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import type { IconName } from '@/components/kit/icon-button';
import { AppText } from '@/components/ui/app-text';
import { Corner, Space } from '@/constants/tokens';
import { useAppTheme } from '@/hooks/use-app-theme';

const TileWidth = React.createContext(140);

export function StatGrid({ children, minTileWidth = 140 }: { children: React.ReactNode; minTileWidth?: number }) {
  return (
    <TileWidth.Provider value={minTileWidth}>
      <View style={styles.grid}>{children}</View>
    </TileWidth.Provider>
  );
}

export function StatTile({ label, value, icon }: { label: string; value: string | number; icon?: IconName }) {
  const { colors } = useAppTheme();
  const minWidth = React.useContext(TileWidth);
  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${value}`}
      style={[styles.tile, { minWidth, backgroundColor: colors.surface, borderColor: colors.border }]}>
      {icon ? <Ionicons name={icon} size={18} color={colors.primary} /> : null}
      <AppText variant="section">{String(value)}</AppText>
      <AppText variant="small" tone="muted">
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.sm },
  tile: { flexGrow: 1, flexBasis: 0, borderWidth: 1, borderRadius: Corner.card, padding: Space.md, gap: Space.xs },
});
