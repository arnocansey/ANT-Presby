import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Corner } from '@/constants/tokens';
import { useAppTheme } from '@/hooks/use-app-theme';

export function Avatar({ initials, size = 48, tone = 'primary' }: { initials: string; size?: number; tone?: 'primary' | 'gold' }) {
  const { colors } = useAppTheme();
  const bg = tone === 'gold' ? colors.goldSoft : colors.primary;
  const fg = tone === 'gold' ? colors.goldInk : colors.onPrimary;
  return (
    <View
      accessible={false}
      style={[styles.avatar, { width: size, height: size, backgroundColor: bg }]}>
      <AppText variant={size >= 72 ? 'title' : 'bodyStrong'} style={{ color: fg }}>
        {initials}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: { borderRadius: Corner.pill, alignItems: 'center', justifyContent: 'center' },
});
