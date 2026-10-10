import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import React from 'react';
import { Alert, Linking, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Corner, MIN_TOUCH, Space } from '@/constants/tokens';
import { useLiveStream } from '@/hooks/use-api';
import { useAppTheme } from '@/hooks/use-app-theme';

const openLink = async (url: string) => {
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert('Could not open the link', 'Please try again in a moment.');
  }
};

// Shown on Home and Watch only while the church is live; refreshed whenever the screen gains focus.
export function LiveCard() {
  const { colors } = useAppTheme();
  const { data: live, refetch } = useLiveStream();

  useFocusEffect(
    React.useCallback(() => {
      refetch();
    }, [refetch])
  );

  if (!live?.is_live) return null;

  return (
    <View style={[styles.card, { backgroundColor: colors.dangerSolid }]}>
      <View style={[styles.pill, { borderColor: colors.onDangerSolid }]}>
        <View style={[styles.dot, { backgroundColor: colors.onDangerSolid }]} />
        <AppText variant="caption" style={[styles.pillText, { color: colors.onDangerSolid }]}>
          Live now
        </AppText>
      </View>
      <AppText variant="section" accessibilityRole="header" style={{ color: colors.onDangerSolid }}>
        {live.title || "We're live"}
      </AppText>
      <View style={styles.buttons}>
        {live.youtube_url ? <WatchButton icon="logo-youtube" label="Watch on YouTube" url={live.youtube_url} /> : null}
        {live.facebook_url ? <WatchButton icon="logo-facebook" label="Watch on Facebook" url={live.facebook_url} /> : null}
      </View>
    </View>
  );
}

function WatchButton({ icon, label, url }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; url: string }) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      onPress={() => openLink(url)}
      accessibilityRole="link"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.watch, { backgroundColor: colors.onDangerSolid, opacity: pressed ? 0.85 : 1 }]}>
      <Ionicons name={icon} size={18} color={colors.dangerSolid} />
      <AppText variant="bodyStrong" style={{ color: colors.dangerSolid }}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: Corner.panel, padding: Space.lg, gap: Space.sm },
  pill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.xs,
    borderWidth: 1,
    borderRadius: Corner.pill,
    paddingHorizontal: Space.sm + 2,
    paddingVertical: 2,
  },
  dot: { width: 8, height: 8, borderRadius: Corner.pill },
  pillText: { textTransform: 'uppercase', letterSpacing: 1 },
  buttons: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.sm, marginTop: Space.xs },
  watch: {
    minHeight: MIN_TOUCH,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.sm,
    borderRadius: Corner.pill,
    paddingHorizontal: Space.md,
  },
});
