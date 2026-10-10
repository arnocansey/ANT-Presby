import React from 'react';
import { Alert } from 'react-native';

import { AdminShell } from '@/components/admin-shell';
import { ScreenHeader } from '@/components/kit';
import { AppText } from '@/components/ui/app-text';
import { AppBadge } from '@/components/ui/badge';
import { AppButton } from '@/components/ui/button';
import { AppCard } from '@/components/ui/card';
import { TextField } from '@/components/ui/text-field';
import { getApiErrorMessage, getLiveErrorMessage, useEndLive, useLiveStream, useStartLive } from '@/hooks/use-api';
import { useAuthStore } from '@/store/auth';

export default function AdminLiveScreen() {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'admin';
  const liveQuery = useLiveStream();
  const startMutation = useStartLive();
  const endMutation = useEndLive();
  const [title, setTitle] = React.useState('');
  const [youtubeUrl, setYoutubeUrl] = React.useState('');
  const [facebookUrl, setFacebookUrl] = React.useState('');
  const filledFromLive = React.useRef(false);
  const live = liveQuery.data;

  // While live, start from the current title and links so they can be corrected.
  React.useEffect(() => {
    if (filledFromLive.current || !live?.is_live) return;
    filledFromLive.current = true;
    setTitle(live.title ?? '');
    setYoutubeUrl(live.youtube_url ?? '');
    setFacebookUrl(live.facebook_url ?? '');
  }, [live]);

  if (!user || !isAdmin) return null;

  const isLive = Boolean(live?.is_live);

  const onStart = () => {
    if (startMutation.isPending) return;
    if (!title.trim()) {
      Alert.alert('Missing title', 'Add a title for the livestream.');
      return;
    }
    if (!youtubeUrl.trim() && !facebookUrl.trim()) {
      Alert.alert('Missing link', 'Add a YouTube or Facebook link.');
      return;
    }
    startMutation.mutate(
      { title: title.trim(), youtubeUrl: youtubeUrl.trim() || undefined, facebookUrl: facebookUrl.trim() || undefined },
      {
        onSuccess: (result) => Alert.alert(result?.data?.notified ? "You're live" : 'Updated', result?.message || 'Livestream updated'),
        onError: (error) => Alert.alert('Could not go live', getLiveErrorMessage(error, 'Please try again.')),
      }
    );
  };

  const onEnd = () => {
    if (endMutation.isPending) return;
    Alert.alert('End the livestream?', 'The live card will disappear for everyone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End',
        style: 'destructive',
        onPress: () =>
          endMutation.mutate(undefined, {
            onSuccess: (result) => Alert.alert('Ended', result?.message || 'Livestream ended'),
            onError: (error) => Alert.alert('Could not end', getApiErrorMessage(error, 'Please try again.')),
          }),
      },
    ]);
  };

  return (
    <AdminShell activeTab="/admin">
      <ScreenHeader back eyebrow="Admin" title="Livestream" />

      <AppCard>
        <AppText variant="small" tone="muted">
          Status
        </AppText>
        {isLive ? (
          <>
            <AppBadge tone="live">Live now</AppBadge>
            <AppText variant="bodyStrong">{live?.title ?? ''}</AppText>
            {live?.started_at ? (
              <AppText variant="small" tone="muted">
                {`Since ${new Date(live.started_at).toLocaleString()}`}
              </AppText>
            ) : null}
          </>
        ) : (
          <AppText variant="bodyStrong">{liveQuery.isLoading ? 'Loading...' : 'Not live.'}</AppText>
        )}
      </AppCard>

      <AppCard>
        <TextField label="Title" value={title} onChangeText={setTitle} placeholder="e.g. Sunday Worship Service" maxLength={255} />
        <TextField
          label="YouTube link"
          value={youtubeUrl}
          onChangeText={setYoutubeUrl}
          placeholder="https://youtube.com/live/…"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          maxLength={500}
        />
        <TextField
          label="Facebook link"
          value={facebookUrl}
          onChangeText={setFacebookUrl}
          placeholder="https://facebook.com/…"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          maxLength={500}
        />
        <AppText variant="small" tone="muted">
          Everyone is notified once when you go live. Updating the links while live does not notify again.
        </AppText>
        <AppButton label={isLive ? 'Update links' : 'Go live'} onPress={onStart} />
        {isLive ? <AppButton label="End livestream" variant="danger" onPress={onEnd} /> : null}
      </AppCard>
    </AdminShell>
  );
}
