import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { BrandCard, BrandPill, BrandScreen } from '@/components/brand-ui';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useSermonById } from '@/hooks/use-api';

export default function SermonDetailScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ id: string }>();
  const sermonId = params.id;
  const sermonQuery = useSermonById(sermonId);
  const sermon = sermonQuery.data;

  return (
    <BrandScreen>
      {sermonQuery.isLoading ? (
        <BrandCard>
          <ThemedText type="small">Loading sermon...</ThemedText>
        </BrandCard>
      ) : sermon ? (
        <>
          <View style={styles.heroCard}>
            <View style={styles.heroBar}>
              <Pressable
                onPress={() => router.back()}
                style={[styles.heroIconButton, { backgroundColor: 'rgba(0,0,0,0.35)', borderColor: 'rgba(255,255,255,0.15)' }]}>
                <Ionicons name="chevron-back" size={16} color="#FFFFFF" />
              </Pressable>
              <View style={styles.heroActions}>
                <Pressable style={[styles.heroIconButton, { backgroundColor: 'rgba(0,0,0,0.35)', borderColor: 'rgba(255,255,255,0.15)' }]}>
                  <Ionicons name="heart-outline" size={16} color="#FFFFFF" />
                </Pressable>
                <Pressable style={[styles.heroIconButton, { backgroundColor: 'rgba(0,0,0,0.35)', borderColor: 'rgba(255,255,255,0.15)' }]}>
                  <Ionicons name="share-social-outline" size={16} color="#FFFFFF" />
                </Pressable>
              </View>
            </View>

            <View style={styles.heroCenter}>
              <View style={styles.bookWrap}>
                <Ionicons name="play-circle-outline" size={42} color="#FFFFFF" />
              </View>
              <ThemedText type="smallBold" style={styles.seriesText}>
                {sermon?.series || 'Sermon Series'}
              </ThemedText>
            </View>
          </View>

          <View style={styles.titleBlock}>
            <View style={styles.metaTop}>
              <BrandPill>{sermon?.speaker || 'Speaker not listed'}</BrandPill>
              <ThemedText type="small" themeColor="textSecondary">
                {sermon?.sermon_date ? new Date(sermon.sermon_date).toLocaleDateString() : 'Date unavailable'}
              </ThemedText>
            </View>
            <ThemedText type="title" style={styles.titleText}>
              {sermon?.title}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {sermon?.description || 'No description provided.'}
            </ThemedText>
          </View>

          <BrandCard>
            <ThemedText type="defaultSemiBold">Playback</ThemedText>
            <View style={styles.playerRow}>
              <Pressable style={[styles.playerButton, { backgroundColor: theme.tint }]}>
                <Ionicons name="play" size={22} color="#FFFFFF" />
              </Pressable>
              <View style={styles.playerMeta}>
                <ThemedText type="small">Tap to start this sermon experience</ThemedText>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { backgroundColor: theme.tint }]} />
                </View>
              </View>
            </View>
          </BrandCard>

          <BrandCard>
            <ThemedText type="defaultSemiBold">Media</ThemedText>
            {sermon?.video_url || sermon?.videoUrl ? (
              <View style={styles.mediaRow}>
                <Ionicons name="videocam-outline" size={16} color={theme.textSecondary} />
                <ThemedText type="small">{sermon?.video_url || sermon?.videoUrl}</ThemedText>
              </View>
            ) : (
              <ThemedText type="small">No video link attached yet.</ThemedText>
            )}
          </BrandCard>

          <BrandCard>
            <ThemedText type="defaultSemiBold">Notes</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Save sermon notes, downloadable resources, and comments can be expanded here next.
            </ThemedText>
          </BrandCard>
        </>
      ) : (
        <BrandCard>
          <ThemedText type="small">Sermon not found.</ThemedText>
        </BrandCard>
      )}
    </BrandScreen>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    height: 220,
    borderRadius: Radius.large,
    padding: Spacing.three,
    overflow: 'hidden',
    backgroundColor: '#5B21B6',
    justifyContent: 'space-between',
  },
  heroBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroActions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  heroIconButton: {
    width: 38,
    height: 38,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCenter: {
    alignItems: 'center',
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  bookWrap: {
    width: 88,
    height: 88,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  seriesText: {
    color: '#FCD34D',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  titleBlock: {
    gap: Spacing.one,
  },
  metaTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
  },
  titleText: {
    fontSize: 28,
    lineHeight: 32,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  playerButton: {
    width: 56,
    height: 56,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerMeta: {
    flex: 1,
    gap: Spacing.two,
  },
  progressTrack: {
    height: 6,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  progressFill: {
    width: '32%',
    height: '100%',
    borderRadius: Radius.pill,
  },
  mediaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
