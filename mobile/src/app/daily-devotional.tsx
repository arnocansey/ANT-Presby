import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { BrandButton, BrandCard, BrandScreen } from '@/components/brand-ui';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useDevotionalArchive, useTodayDevotional, type Devotional } from '@/hooks/use-api';
import { useTheme } from '@/hooks/use-theme';

// publish_date is YYYY-MM-DD; format in UTC so it never shifts a day.
const formatDay = (ymd: string) =>
  new Date(`${ymd}T00:00:00Z`).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' });

export default function DailyDevotionalScreen() {
  const theme = useTheme();
  const todayQuery = useTodayDevotional();
  const archiveQuery = useDevotionalArchive();
  const [selected, setSelected] = React.useState<Devotional | null>(null);
  const devotional = selected ?? todayQuery.data ?? null;
  const archive = (archiveQuery.data ?? []).filter((item) => item.id !== devotional?.id);

  return (
    <BrandScreen>
      <View style={styles.headerRow}>
        <Pressable
          onPress={() => (selected ? setSelected(null) : router.back())}
          style={[styles.iconButton, { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: theme.border }]}>
          <Ionicons name="chevron-back" size={16} color={theme.textSecondary} />
        </Pressable>
        <View style={styles.headerCopy}>
          <ThemedText type="smallBold" style={{ color: theme.tint, textTransform: 'uppercase', letterSpacing: 1 }}>
            Daily Devotional
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {devotional ? formatDay(devotional.publish_date) : ''}
            {devotional && devotional.is_today === false && !selected ? ' · latest' : ''}
          </ThemedText>
        </View>
      </View>

      {todayQuery.isLoading ? (
        <ActivityIndicator color={theme.tint} />
      ) : todayQuery.isError ? (
        <BrandCard>
          <ThemedText type="small">Could not load the devotional.</ThemedText>
          <BrandButton label="Try again" onPress={() => todayQuery.refetch()} />
        </BrandCard>
      ) : !devotional ? (
        <BrandCard>
          <ThemedText type="small" themeColor="textSecondary">
            No devotional has been published yet.
          </ThemedText>
        </BrandCard>
      ) : (
        <>
          <ThemedText type="title" style={styles.title}>
            {devotional.title}
          </ThemedText>
          <View style={[styles.scripture, { borderColor: theme.tint }]}>
            <ThemedText style={styles.scriptureText}>{devotional.scripture_text}</ThemedText>
            <ThemedText type="smallBold">{devotional.scripture_reference}</ThemedText>
          </View>
          <BrandCard>
            <ThemedText>{devotional.body}</ThemedText>
          </BrandCard>
          {devotional.prayer ? (
            <BrandCard>
              <ThemedText type="smallBold" themeColor="textSecondary">
                Prayer
              </ThemedText>
              <ThemedText>{devotional.prayer}</ThemedText>
            </BrandCard>
          ) : null}
        </>
      )}

      {archive.length > 0 ? (
        <BrandCard>
          <ThemedText type="defaultSemiBold">Earlier devotionals</ThemedText>
          {archive.map((item) => (
            <Pressable key={item.id} onPress={() => setSelected(item)} style={styles.archiveRow}>
              <ThemedText type="small" style={styles.archiveTitle} numberOfLines={1}>
                {item.title}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {formatDay(item.publish_date)}
              </ThemedText>
            </Pressable>
          ))}
        </BrandCard>
      ) : null}
    </BrandScreen>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  headerCopy: { flex: 1, gap: 2 },
  iconButton: { width: 38, height: 38, borderRadius: Radius.pill, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 26, lineHeight: 32 },
  scripture: { borderLeftWidth: 4, paddingLeft: Spacing.three, gap: Spacing.one },
  scriptureText: { fontStyle: 'italic' },
  archiveRow: { gap: 2, paddingVertical: Spacing.one },
  archiveTitle: { fontWeight: '600' },
});
