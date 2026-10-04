import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';

import { BrandButton, BrandCard, BrandPill, BrandScreen } from '@/components/brand-ui';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import {
  useMyPrayerRequests,
  usePrayerWall,
  usePrayForRequest,
  useSetPrayerSharing,
  type WallPrayer,
} from '@/hooks/use-api';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/store/auth';

type Tab = 'wall' | 'mine';

export default function PrayerWallScreen() {
  const theme = useTheme();
  const user = useAuthStore((state) => state.user);
  const [tab, setTab] = React.useState<Tab>('wall');
  const wallQuery = usePrayerWall(Boolean(user));
  const myPrayersQuery = useMyPrayerRequests(Boolean(user) && tab === 'mine');
  const prayMutation = usePrayForRequest();
  const sharingMutation = useSetPrayerSharing();

  const errorMessage = (error: any, fallback: string) =>
    error?.response?.status === 404
      ? 'This request is no longer on the prayer wall.'
      : error?.response?.data?.message || fallback;

  const pray = (id: number) =>
    prayMutation.mutate(id, {
      onError: (error) => Alert.alert('Prayer not recorded', errorMessage(error, 'Please try again.')),
    });

  const toggleSharing = (prayer: any) =>
    sharingMutation.mutate(
      {
        id: prayer.id,
        title: prayer.title,
        description: prayer.description,
        category: prayer.category,
        shareOnWall: !prayer.share_on_wall,
      },
      {
        onError: (error) => Alert.alert('Could not update sharing', errorMessage(error, 'Please try again.')),
      }
    );

  if (!user) {
    return (
      <BrandScreen>
        <BrandCard>
          <ThemedText type="subtitle">Prayer Wall</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Sign in to see the prayer wall and pray with the church family.
          </ThemedText>
          <BrandButton label="Go To Sign In" onPress={() => router.replace('/login')} />
        </BrandCard>
      </BrandScreen>
    );
  }

  const wall = Array.isArray(wallQuery.data) ? wallQuery.data : [];
  const mine = Array.isArray(myPrayersQuery.data) ? myPrayersQuery.data : [];
  const activeQuery = tab === 'wall' ? wallQuery : myPrayersQuery;
  const isLoading = activeQuery.isLoading;
  const isError = activeQuery.isError;

  const renderTab = (value: Tab, label: string) => {
    const active = tab === value;
    return (
      <Pressable key={value} onPress={() => setTab(value)} style={styles.tabPressable}>
        <View
          style={[
            styles.tab,
            {
              backgroundColor: active ? theme.tint : 'transparent',
              borderColor: active ? theme.tint : theme.border,
            },
          ]}>
          <ThemedText type="smallBold" style={{ color: active ? theme.white : theme.text }}>
            {label}
          </ThemedText>
        </View>
      </Pressable>
    );
  };

  const renderWallItem = (prayer: WallPrayer) => (
    <BrandCard key={String(prayer.id)}>
      <View style={styles.prayerHead}>
        <View style={styles.prayerMeta}>
          <ThemedText type="defaultSemiBold">{prayer.requester_name}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {new Date(prayer.created_at).toLocaleDateString()}
          </ThemedText>
        </View>
        <View style={styles.pills}>
          {prayer.status === 'answered' ? <BrandPill>Answered</BrandPill> : null}
          <BrandPill>{prayer.category}</BrandPill>
        </View>
      </View>
      <ThemedText type="defaultSemiBold">{prayer.title}</ThemedText>
      <ThemedText type="small">{prayer.description}</ThemedText>
      <BrandButton
        label={`${prayer.prayed_by_me ? 'You prayed' : 'I prayed'} · ${prayer.prayer_count}`}
        variant={prayer.prayed_by_me ? 'outline' : 'primary'}
        onPress={() => {
          if (!prayer.prayed_by_me && !prayMutation.isPending) {
            pray(prayer.id);
          }
        }}
      />
    </BrandCard>
  );

  return (
    <BrandScreen>
      <View style={styles.headerRow}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.iconButton, { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: theme.border }]}>
          <Ionicons name="chevron-back" size={16} color={theme.textSecondary} />
        </Pressable>
        <View style={styles.headerCopy}>
          <ThemedText type="subtitle">Prayer Wall</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Pray for one another
          </ThemedText>
        </View>
        <Pressable
          accessibilityLabel="Share a prayer request"
          onPress={() => router.push('/prayers')}
          style={[styles.iconButton, { backgroundColor: '#E11D48', borderColor: '#E11D48' }]}>
          <Ionicons name="add" size={18} color="#FFFFFF" />
        </Pressable>
      </View>

      <View style={styles.scriptureCard}>
        <ThemedText type="small" style={styles.scriptureText}>
          &quot;Pray for each other so that you may be healed.&quot; - James 5:16
        </ThemedText>
      </View>

      <View style={styles.tabs}>
        {renderTab('wall', 'Wall')}
        {renderTab('mine', 'My requests')}
      </View>

      {isLoading ? (
        <ActivityIndicator color={theme.tint} />
      ) : isError ? (
        <BrandCard>
          <ThemedText type="defaultSemiBold">Could not load prayers</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Check your connection and try again.
          </ThemedText>
          <BrandButton label="Try again" onPress={() => activeQuery.refetch()} />
        </BrandCard>
      ) : tab === 'wall' ? (
        wall.length > 0 ? (
          wall.map(renderWallItem)
        ) : (
          <BrandCard>
            <ThemedText type="defaultSemiBold">Nothing on the wall yet</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Requests appear here once their owner shares them and they are approved.
            </ThemedText>
            <BrandButton label="Share a request" onPress={() => router.push('/prayers')} />
          </BrandCard>
        )
      ) : mine.length > 0 ? (
        mine.map((prayer: any) => (
          <BrandCard key={String(prayer?.id)}>
            <View style={styles.prayerHead}>
              <ThemedText type="defaultSemiBold" style={styles.prayerMeta}>
                {prayer?.title || 'Prayer request'}
              </ThemedText>
              <BrandPill>{prayer?.status || 'pending'}</BrandPill>
            </View>
            <ThemedText type="small">{prayer?.description}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {prayer?.share_on_wall
                ? prayer?.status === 'pending'
                  ? 'Will appear on the wall after approval'
                  : `Shared on the wall · ${prayer?.prayer_count ?? 0} prayed`
                : 'Private'}
            </ThemedText>
            <BrandButton
              label={prayer?.share_on_wall ? 'Stop sharing' : 'Share on wall'}
              variant="outline"
              onPress={() => {
                if (!sharingMutation.isPending) {
                  toggleSharing(prayer);
                }
              }}
            />
          </BrandCard>
        ))
      ) : (
        <BrandCard>
          <ThemedText type="defaultSemiBold">No requests yet</ThemedText>
          <BrandButton label="Share a request" onPress={() => router.push('/prayers')} />
        </BrandCard>
      )}
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
  scriptureCard: {
    borderRadius: Radius.medium,
    padding: Spacing.three,
    backgroundColor: 'rgba(225,29,72,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(225,29,72,0.16)',
  },
  scriptureText: {
    color: '#FDA4AF',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  tabs: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  tabPressable: {
    flex: 1,
  },
  tab: {
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingVertical: Spacing.two,
    alignItems: 'center',
  },
  prayerHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  prayerMeta: {
    flex: 1,
    gap: 2,
  },
  pills: {
    flexDirection: 'row',
    gap: Spacing.one,
  },
});
