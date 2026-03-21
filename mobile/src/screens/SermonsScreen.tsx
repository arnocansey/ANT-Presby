import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { BrandScreen } from '@/components/brand-ui';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useSermons } from '@/hooks/use-api';
import { useTheme } from '@/hooks/use-theme';

const gradients = ['#7C3AED', '#E11D48', '#0F9FA8', '#D97706'];

export default function SermonsScreen() {
  const theme = useTheme();
  const sermonsQuery = useSermons();
  const sermons = Array.isArray(sermonsQuery.data) ? sermonsQuery.data : [];
  const series = ['All', ...Array.from(new Set(sermons.map((item: any) => item?.series).filter(Boolean))).slice(0, 4)];
  const featured = sermons[0];
  const recent = featured ? sermons.slice(1) : sermons;

  return (
    <BrandScreen>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.headerTitle}>
          Sermons
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Watch, listen & grow in faith
        </ThemedText>
      </View>

      <View style={styles.searchRow}>
        <View style={[styles.searchInput, { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: theme.border }]}>
          <Ionicons name="search-outline" size={16} color={theme.textSecondary} />
          <TextInput
            editable={false}
            placeholder="Search sermons..."
            placeholderTextColor={theme.textSecondary}
            style={[styles.searchTextInput, { color: theme.text }]}
          />
        </View>
        <Pressable style={[styles.filterButton, { backgroundColor: theme.tint }]}>
          <Ionicons name="filter-outline" size={16} color="#FFFFFF" />
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
        {series.map((item, index) => (
          <View
            key={item}
            style={[
              styles.seriesPill,
              index === 0
                ? { backgroundColor: theme.tint, borderColor: theme.tint }
                : { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.12)' },
            ]}>
            <ThemedText type="smallBold" style={{ color: index === 0 ? '#FFFFFF' : theme.textSecondary }}>
              {item}
            </ThemedText>
          </View>
        ))}
      </ScrollView>

      {featured ? (
        <Pressable
          onPress={() => router.push(`/sermons/${featured.id}` as never)}
          style={styles.featuredWrapper}>
          <View style={[styles.featuredMedia, { backgroundColor: gradients[0] }]}>
            <View style={styles.featuredOverlay} />
            <View style={styles.featuredPlay}>
              <Ionicons name="play" size={32} color="#FFFFFF" />
            </View>
            <View style={[styles.featuredBadge, { backgroundColor: theme.tint }]}>
              <ThemedText type="smallBold" style={styles.badgeText}>
                Featured
              </ThemedText>
            </View>
            <View style={styles.featuredDuration}>
              <ThemedText type="smallBold" style={styles.durationText}>
                42:15
              </ThemedText>
            </View>
          </View>

          <View style={[styles.featuredBody, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <ThemedText type="smallBold" style={{ color: theme.tint }}>
              {featured.series || 'Featured Sermon'}
            </ThemedText>
            <ThemedText type="defaultSemiBold">{featured.title || 'Untitled sermon'}</ThemedText>
            <View style={styles.featuredMetaRow}>
              <View>
                <ThemedText type="small" themeColor="textSecondary">
                  {featured.speaker || 'Speaker unavailable'}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {featured.sermon_date ? new Date(featured.sermon_date).toLocaleDateString() : 'Date unavailable'}
                </ThemedText>
              </View>
              <View style={styles.featuredActionIcons}>
                <View style={styles.smallIconButton}>
                  <Ionicons name="bookmark" size={15} color={theme.tint} />
                </View>
                <View style={styles.smallIconButton}>
                  <Ionicons name="heart-outline" size={15} color={theme.textSecondary} />
                </View>
              </View>
            </View>
          </View>
        </Pressable>
      ) : null}

      <View style={styles.sectionRow}>
        <ThemedText type="defaultSemiBold">Recent Messages</ThemedText>
        <Pressable onPress={() => router.push('/search' as never)}>
          <ThemedText type="smallBold" style={{ color: theme.tint }}>
            Explore
          </ThemedText>
        </Pressable>
      </View>

      {sermonsQuery.isLoading ? (
        <View style={[styles.listCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <ThemedText type="small">Loading sermons...</ThemedText>
        </View>
      ) : recent.length > 0 ? (
        recent.map((sermon: any, index: number) => (
          <Pressable
            key={String(sermon?.id)}
            onPress={() => router.push(`/sermons/${sermon?.id}` as never)}
            style={[styles.listCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <View style={[styles.listMedia, { backgroundColor: gradients[(index + 1) % gradients.length] }]}>
              <Ionicons name="play" size={24} color="#FFFFFF" />
              <View style={styles.listDuration}>
                <ThemedText type="smallBold" style={styles.listDurationText}>
                  {sermon?.duration || '45:20'}
                </ThemedText>
              </View>
            </View>
            <View style={styles.listContent}>
              <ThemedText type="smallBold" style={{ color: theme.tint }}>
                {sermon?.series || 'Sermon'}
              </ThemedText>
              <ThemedText type="defaultSemiBold" numberOfLines={2}>
                {sermon?.title || 'Untitled sermon'}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {sermon?.speaker || 'Speaker unavailable'}
              </ThemedText>
              <View style={styles.rowMeta}>
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={12} color={theme.textSecondary} />
                  <ThemedText type="small" themeColor="textSecondary">
                    {sermon?.duration || '42:15'}
                  </ThemedText>
                </View>
                <ThemedText type="small" themeColor="textSecondary">
                  {sermon?.views || '1.2K'} views
                </ThemedText>
              </View>
            </View>
            <View style={styles.bookmarkArea}>
              <View style={styles.cardArrow}>
                <Ionicons name="chevron-forward" size={16} color={theme.tint} />
              </View>
            </View>
          </Pressable>
        ))
      ) : (
        <View style={[styles.listCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <ThemedText type="small">No sermons available yet.</ThemedText>
        </View>
      )}
    </BrandScreen>
  );
}

const styles = StyleSheet.create({
  header: { gap: Spacing.one },
  headerTitle: { fontSize: 30, lineHeight: 34 },
  searchRow: { flexDirection: 'row', gap: Spacing.two, alignItems: 'center' },
  searchInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: Radius.medium,
    paddingHorizontal: Spacing.three,
    minHeight: 46,
  },
  searchTextInput: { flex: 1, fontSize: 14 },
  filterButton: { width: 46, height: 46, borderRadius: Radius.medium, alignItems: 'center', justifyContent: 'center' },
  pillRow: { gap: Spacing.two },
  seriesPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.pill, borderWidth: 1 },
  featuredWrapper: { gap: 0 },
  featuredMedia: {
    height: 192,
    borderTopLeftRadius: Radius.large,
    borderTopRightRadius: Radius.large,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  featuredOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.18)' },
  featuredPlay: {
    width: 66,
    height: 66,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  featuredBadge: { position: 'absolute', top: 12, left: 12, paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.pill },
  badgeText: { color: '#FFFFFF', textTransform: 'uppercase' },
  featuredDuration: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  durationText: { color: '#FFFFFF' },
  featuredBody: {
    borderWidth: 1,
    borderTopWidth: 0,
    borderBottomLeftRadius: Radius.large,
    borderBottomRightRadius: Radius.large,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  featuredMetaRow: {
    marginTop: Spacing.one,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
  },
  featuredActionIcons: { flexDirection: 'row', gap: Spacing.two },
  smallIconButton: {
    width: 34,
    height: 34,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  listCard: {
    flexDirection: 'row',
    gap: Spacing.three,
    borderWidth: 1,
    borderRadius: Radius.medium,
    padding: Spacing.three,
    alignItems: 'flex-start',
  },
  listMedia: {
    width: 80,
    height: 80,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  listDuration: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  listDurationText: { color: '#FFFFFF', fontSize: 9, lineHeight: 11 },
  listContent: { flex: 1, gap: 2 },
  rowMeta: { marginTop: Spacing.one, flexDirection: 'row', alignItems: 'center', gap: Spacing.three, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  bookmarkArea: { paddingTop: 4 },
  cardArrow: {
    width: 30,
    height: 30,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,159,26,0.14)',
  },
});
