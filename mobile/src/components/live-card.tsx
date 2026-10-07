import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import React from 'react';
import { Alert, Linking, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useLiveStream } from '@/hooks/use-api';

const LIVE_RED = '#DC2626';

const openLink = async (url: string) => {
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert('Could not open the link', 'Please try again in a moment.');
  }
};

// Home screen card, shown only while the church is live; refreshed whenever the screen gains focus.
export function LiveCard() {
  const { data: live, refetch } = useLiveStream();

  useFocusEffect(
    React.useCallback(() => {
      refetch();
    }, [refetch])
  );

  if (!live?.is_live) return null;

  return (
    <View style={styles.card}>
      <View style={styles.badge}>
        <View style={styles.dot} />
        <ThemedText type="smallBold" style={styles.badgeText}>
          Live now
        </ThemedText>
      </View>
      <ThemedText type="subtitle" style={styles.title}>
        {live.title || "We're live"}
      </ThemedText>
      <View style={styles.buttons}>
        {live.youtube_url ? <WatchButton icon="logo-youtube" label="Watch on YouTube" url={live.youtube_url} /> : null}
        {live.facebook_url ? <WatchButton icon="logo-facebook" label="Watch on Facebook" url={live.facebook_url} /> : null}
      </View>
    </View>
  );
}

function WatchButton({
  icon,
  label,
  url,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  url: string;
}) {
  return (
    <Pressable onPress={() => openLink(url)} style={styles.watchButton} accessibilityRole="link">
      <Ionicons name={icon} size={16} color={LIVE_RED} />
      <ThemedText type="defaultSemiBold" style={styles.watchText}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: LIVE_RED,
    borderRadius: Radius.large,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.pill,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: Radius.pill,
    backgroundColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  title: {
    color: '#FFFFFF',
  },
  buttons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  watchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  watchText: {
    color: LIVE_RED,
    fontWeight: '800',
  },
});
