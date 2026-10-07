import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AdminShell } from '@/components/admin-shell';
import { BrandButton, BrandCard } from '@/components/brand-ui';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { getApiErrorMessage, getLiveErrorMessage, useEndLive, useLiveStream, useStartLive } from '@/hooks/use-api';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/store/auth';

export default function AdminLiveScreen() {
  const theme = useTheme();
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

  const inputStyle = [styles.input, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }];

  return (
    <AdminShell activeTab="/admin">
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} style={[styles.iconButton, { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: theme.border }]}>
          <Ionicons name="chevron-back" size={16} color={theme.textSecondary} />
        </Pressable>
        <View style={styles.headerCopy}>
          <ThemedText type="smallBold" style={{ color: '#818CF8', textTransform: 'uppercase', letterSpacing: 1 }}>
            Admin
          </ThemedText>
          <ThemedText type="subtitle">Livestream</ThemedText>
        </View>
      </View>

      <BrandCard>
        <ThemedText type="smallBold">Status</ThemedText>
        {isLive ? (
          <>
            <ThemedText type="defaultSemiBold" style={styles.liveText}>
              {`Live now: ${live?.title ?? ''}`}
            </ThemedText>
            {live?.started_at ? (
              <ThemedText type="small" themeColor="textSecondary">
                {`Since ${new Date(live.started_at).toLocaleString()}`}
              </ThemedText>
            ) : null}
          </>
        ) : (
          <ThemedText type="small" themeColor="textSecondary">
            {liveQuery.isLoading ? 'Loading...' : 'Not live.'}
          </ThemedText>
        )}
      </BrandCard>

      <BrandCard>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Title (e.g. Sunday Worship Service)"
          placeholderTextColor={theme.textSecondary}
          maxLength={255}
          style={inputStyle}
        />
        <TextInput
          value={youtubeUrl}
          onChangeText={setYoutubeUrl}
          placeholder="YouTube link"
          placeholderTextColor={theme.textSecondary}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          maxLength={500}
          style={inputStyle}
        />
        <TextInput
          value={facebookUrl}
          onChangeText={setFacebookUrl}
          placeholder="Facebook link"
          placeholderTextColor={theme.textSecondary}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          maxLength={500}
          style={inputStyle}
        />
        <ThemedText type="small" themeColor="textSecondary">
          Everyone is notified once when you go live. Updating the links while live does not notify again.
        </ThemedText>
        <BrandButton label={isLive ? 'Update links' : 'Go live'} variant="secondary" onPress={onStart} />
        {isLive ? <BrandButton label="End livestream" variant="outline" onPress={onEnd} /> : null}
      </BrandCard>
    </AdminShell>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  headerCopy: { flex: 1, gap: 2 },
  iconButton: { width: 38, height: 38, borderRadius: Radius.pill, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  input: { borderWidth: 1, borderRadius: Radius.medium, paddingHorizontal: Spacing.three, paddingVertical: Spacing.three, fontSize: 16 },
  liveText: { color: '#EF4444' },
});
