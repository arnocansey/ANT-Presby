import { router } from 'expo-router';
import React from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import {
  ErrorState,
  IconButton,
  LoadingList,
  Screen,
  ScreenHeader,
  Scripture,
  SignInPrompt,
  UnderlineTabs,
  statusTone,
} from '@/components/kit';
import { AppText } from '@/components/ui/app-text';
import { AppBadge } from '@/components/ui/badge';
import { AppButton } from '@/components/ui/button';
import { AppCard } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Space } from '@/constants/tokens';
import {
  useMyPrayerRequests,
  usePrayerWall,
  usePrayForRequest,
  useSetPrayerSharing,
  type WallPrayer,
} from '@/hooks/use-api';
import { useAuthStore } from '@/store/auth';

type Tab = 'wall' | 'mine';

const TABS: { value: Tab; label: string }[] = [
  { value: 'wall', label: 'Wall' },
  { value: 'mine', label: 'My requests' },
];

export default function PrayerWallScreen() {
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
      <Screen>
        <ScreenHeader back title="Prayer wall" />
        <SignInPrompt
          icon="heart-outline"
          title="Pray with the church family"
          message="Sign in to see the prayer wall and pray with the church family."
          label="Go to sign in"
          onSignIn={() => router.replace('/login')}
        />
      </Screen>
    );
  }

  const wall = Array.isArray(wallQuery.data) ? wallQuery.data : [];
  const mine = Array.isArray(myPrayersQuery.data) ? myPrayersQuery.data : [];
  const activeQuery = tab === 'wall' ? wallQuery : myPrayersQuery;

  const renderWallItem = (prayer: WallPrayer) => (
    <AppCard key={String(prayer.id)}>
      <View style={styles.head}>
        <View style={styles.flex}>
          <AppText variant="bodyStrong">{prayer.requester_name}</AppText>
          <AppText variant="caption" tone="muted">
            {new Date(prayer.created_at).toLocaleDateString()}
          </AppText>
        </View>
        <View style={styles.badges}>
          {prayer.status === 'answered' ? <AppBadge tone="success">Answered</AppBadge> : null}
          <AppBadge>{prayer.category}</AppBadge>
        </View>
      </View>
      <AppText variant="bodyStrong">{prayer.title}</AppText>
      <AppText variant="small">{prayer.description}</AppText>
      <AppButton
        label={`${prayer.prayed_by_me ? 'You prayed' : 'I prayed'} · ${prayer.prayer_count}`}
        variant={prayer.prayed_by_me ? 'secondary' : 'primary'}
        onPress={() => {
          if (!prayer.prayed_by_me && !prayMutation.isPending) {
            pray(prayer.id);
          }
        }}
      />
    </AppCard>
  );

  return (
    <Screen>
      <ScreenHeader
        back
        title="Prayer wall"
        subtitle="Pray for one another"
        right={
          <IconButton icon="add" variant="primary" accessibilityLabel="Share a prayer request" onPress={() => router.push('/prayers')} />
        }
      />

      <Scripture text="Pray for each other so that you may be healed." reference="James 5:16" />

      <UnderlineTabs options={TABS} value={tab} onChange={setTab} />

      {activeQuery.isLoading ? (
        <LoadingList count={2} height={160} />
      ) : activeQuery.isError ? (
        <ErrorState title="Could not load prayers" onRetry={() => activeQuery.refetch()} />
      ) : tab === 'wall' ? (
        wall.length > 0 ? (
          wall.map(renderWallItem)
        ) : (
          <EmptyState
            icon="heart-outline"
            title="Nothing on the wall yet"
            message="Requests appear here once their owner shares them and they are approved."
            action={<AppButton label="Share a request" variant="secondary" onPress={() => router.push('/prayers')} />}
          />
        )
      ) : mine.length > 0 ? (
        mine.map((prayer: any) => (
          <AppCard key={String(prayer?.id)}>
            <View style={styles.head}>
              <AppText variant="bodyStrong" style={styles.flex}>
                {prayer?.title || 'Prayer request'}
              </AppText>
              <AppBadge tone={statusTone(prayer?.status || 'pending')}>{String(prayer?.status || 'pending')}</AppBadge>
            </View>
            <AppText variant="small">{prayer?.description}</AppText>
            <AppText variant="small" tone="muted">
              {prayer?.share_on_wall
                ? prayer?.status === 'pending'
                  ? 'Will appear on the wall after approval'
                  : `Shared on the wall · ${prayer?.prayer_count ?? 0} prayed`
                : 'Private'}
            </AppText>
            <AppButton
              label={prayer?.share_on_wall ? 'Stop sharing' : 'Share on wall'}
              variant="secondary"
              onPress={() => {
                if (!sharingMutation.isPending) {
                  toggleSharing(prayer);
                }
              }}
            />
          </AppCard>
        ))
      ) : (
        <EmptyState
          icon="heart-outline"
          title="No requests yet"
          action={<AppButton label="Share a request" variant="secondary" onPress={() => router.push('/prayers')} />}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: Space.sm },
  flex: { flex: 1, gap: 2 },
  badges: { flexDirection: 'row', gap: Space.xs },
});
