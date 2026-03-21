import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { BrandButton, BrandCard, BrandHero, BrandPill, BrandScreen } from '@/components/brand-ui';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useMinistries } from '@/hooks/use-api';
import { useTheme } from '@/hooks/use-theme';

const groupColors = ['#2563EB', '#DB2777', '#7C3AED', '#16A34A', '#D97706'];

export default function SmallGroupsScreen() {
  const theme = useTheme();
  const ministriesQuery = useMinistries();
  const groups = Array.isArray(ministriesQuery.data) ? ministriesQuery.data : [];

  return (
    <BrandScreen>
      <BrandHero
        eyebrow="Small Groups"
        title="Find your community"
        description="Browse published ministries and community groups from ANT PRESS in a more mobile-friendly layout."
      />

      <View style={[styles.searchShell, { backgroundColor: 'rgba(255,255,255,0.06)', borderColor: theme.border }]}>
        <Ionicons name="search-outline" size={16} color={theme.textSecondary} />
        <ThemedText type="small" themeColor="textSecondary">
          Search groups coming soon
        </ThemedText>
      </View>

      {ministriesQuery.isLoading ? (
        <BrandCard>
          <ThemedText type="small">Loading small groups...</ThemedText>
        </BrandCard>
      ) : groups.length > 0 ? (
        groups.map((group: any, index: number) => {
          const color = groupColors[index % groupColors.length];
          const sermonCount = Array.isArray(group?.sermons) ? group.sermons.length : 0;

          return (
            <BrandCard key={String(group?.id)}>
              <View style={styles.groupHeader}>
                <View style={[styles.groupIcon, { backgroundColor: `${color}22` }]}>
                  <Ionicons name="people-outline" size={20} color={color} />
                </View>
                <View style={styles.groupCopy}>
                  <ThemedText type="defaultSemiBold">{group?.name || 'Group'}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {group?.description || 'Community details will appear here.'}
                  </ThemedText>
                </View>
                <BrandPill>{sermonCount > 0 ? `${sermonCount} sermons` : 'Open'}</BrandPill>
              </View>

              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Ionicons name="book-outline" size={14} color={theme.textSecondary} />
                  <ThemedText type="small" themeColor="textSecondary">
                    {sermonCount > 0 ? `${sermonCount} resources` : 'No resources yet'}
                  </ThemedText>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="arrow-forward-outline" size={14} color={theme.textSecondary} />
                  <ThemedText type="small" themeColor="textSecondary">
                    Learn more
                  </ThemedText>
                </View>
              </View>

              <BrandButton
                label="Open Group"
                onPress={() => router.push(`/ministries/${group?.id}` as never)}
                variant="secondary"
              />
            </BrandCard>
          );
        })
      ) : (
        <BrandCard>
          <ThemedText type="defaultSemiBold">No groups published yet</ThemedText>
          <ThemedText type="small">
            Published ministries will appear here when they are added on the web or admin side.
          </ThemedText>
        </BrandCard>
      )}
    </BrandScreen>
  );
}

const styles = StyleSheet.create({
  searchShell: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: Radius.medium,
    paddingHorizontal: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  groupIcon: {
    width: 48,
    height: 48,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupCopy: {
    flex: 1,
    gap: 2,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});
