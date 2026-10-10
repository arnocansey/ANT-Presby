import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import type { IconName } from '@/components/kit/icon-button';
import { Corner } from '@/constants/tokens';
import { useAppTheme } from '@/hooks/use-app-theme';

// A picture, or a calm surface-coloured placeholder with an icon when there is none.
export function MediaFrame({
  uri,
  icon = 'image-outline',
  height = 180,
  radius = Corner.card,
  accessibilityLabel,
}: {
  uri?: string | null;
  icon?: IconName;
  height?: number;
  radius?: number;
  accessibilityLabel?: string;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.frame, { height, borderRadius: radius, backgroundColor: colors.surface }]}>
      {uri ? (
        <Image
          source={{ uri }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          accessibilityLabel={accessibilityLabel}
          accessible={Boolean(accessibilityLabel)}
        />
      ) : (
        <Ionicons name={icon} size={36} color={colors.muted} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { width: '100%', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
});
