import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Corner, Space } from '@/constants/tokens';
import { useAppTheme } from '@/hooks/use-app-theme';

type Tone = 'neutral' | 'gold' | 'success' | 'warning' | 'danger' | 'live';

export function AppBadge({ tone = 'neutral', children }: { tone?: Tone; children: string }) {
  const { colors } = useAppTheme();
  const look = {
    neutral: { bg: colors.surface, fg: colors.muted },
    gold: { bg: colors.goldSoft, fg: colors.goldInk },
    success: { bg: colors.surface, fg: colors.success },
    warning: { bg: colors.surface, fg: colors.warning },
    danger: { bg: colors.surface, fg: colors.danger },
    live: { bg: colors.dangerSolid, fg: colors.onDangerSolid },
  }[tone];
  return (
    <View style={[styles.badge, { backgroundColor: look.bg }]}>
      {tone === 'live' ? <View style={[styles.dot, { backgroundColor: look.fg }]} /> : null}
      <AppText variant="caption" style={{ color: look.fg }}>
        {children}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.xs,
    alignSelf: 'flex-start',
    borderRadius: Corner.pill,
    paddingHorizontal: Space.sm + 2,
    paddingVertical: 2,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
});

export default AppBadge;
