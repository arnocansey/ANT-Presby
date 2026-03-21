import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { BrandButton, BrandCard, BrandScreen } from '@/components/brand-ui';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useNews, useSermons } from '@/hooks/use-api';
import { useTheme } from '@/hooks/use-theme';

export default function DailyDevotionalScreen() {
  const theme = useTheme();
  const newsQuery = useNews();
  const sermonsQuery = useSermons(1, 1);
  const latestNews = Array.isArray(newsQuery.data) ? newsQuery.data[0] : null;
  const latestSermon = Array.isArray(sermonsQuery.data) ? sermonsQuery.data[0] : null;
  const title = latestNews?.title || latestSermon?.title || 'Daily reflection';
  const body =
    latestNews?.excerpt ||
    latestNews?.content ||
    latestSermon?.description ||
    'A fresh reflection from ANT PRESS will appear here as new content is published.';

  return (
    <BrandScreen>
      <View style={styles.headerRow}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.iconButton, { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: theme.border }]}>
          <Ionicons name="chevron-back" size={16} color={theme.textSecondary} />
        </Pressable>
        <View style={styles.headerCopy}>
          <ThemedText type="smallBold" style={{ color: theme.tint, textTransform: 'uppercase', letterSpacing: 1 }}>
            Daily Devotional
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {new Date().toDateString()}
          </ThemedText>
        </View>
        <Pressable
          style={[styles.iconButton, { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: theme.border }]}>
          <Ionicons name="bookmark-outline" size={16} color={theme.textSecondary} />
        </Pressable>
      </View>

      <View style={styles.streakCard}>
        <View style={styles.streakHeader}>
          <Ionicons name="flame-outline" size={16} color="#FB923C" />
          <ThemedText type="defaultSemiBold">Fresh mercy for today</ThemedText>
        </View>
        <ThemedText type="small" themeColor="textSecondary">
          Use the newest sermon and news content as a reflection point each day.
        </ThemedText>
      </View>

      <BrandCard>
        <ThemedText type="title" style={styles.titleText}>
          {title}
        </ThemedText>
        <ThemedText type="default" style={styles.bodyText}>
          {String(body).slice(0, 500)}
        </ThemedText>
        {latestNews?.id ? (
          <BrandButton label="Open Related Update" onPress={() => router.push(`/news/${latestNews.id}` as never)} />
        ) : latestSermon?.id ? (
          <BrandButton label="Open Related Sermon" onPress={() => router.push(`/sermons/${latestSermon.id}` as never)} />
        ) : null}
      </BrandCard>

      <BrandCard>
        <ThemedText type="defaultSemiBold">Reflection</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          What truth from today’s content should shape how you move through this day?
        </ThemedText>
        <BrandButton label="Browse News" onPress={() => router.push('/news' as never)} variant="outline" />
      </BrandCard>
    </BrandScreen>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  headerCopy: {
    flex: 1,
    gap: 2,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakCard: {
    borderRadius: Radius.large,
    padding: Spacing.four,
    backgroundColor: 'rgba(245,158,11,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.18)',
    gap: Spacing.two,
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titleText: {
    fontSize: 28,
    lineHeight: 32,
  },
  bodyText: {
    lineHeight: 24,
  },
});
