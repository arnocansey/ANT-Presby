import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import {
  BrandButton,
  BrandCard,
  BrandHero,
  BrandPill,
  BrandScreen,
  BrandSectionHeader,
} from '@/components/brand-ui';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useHealth } from '@/hooks/use-api';
import { APP_NAME, API_URL } from '@/lib/config';

export default function HomeScreen() {
  const { data, isLoading } = useHealth();

  return (
    <BrandScreen>
      <BrandHero
        eyebrow="Welcome To ANT PRESS"
        title={APP_NAME}
        description="A modern publishing, events, giving, and engagement experience built to match the ANT PRESS website.">
        <View style={styles.heroActions}>
          <BrandButton label="Read News" onPress={() => router.push('/news')} />
          <BrandButton label="View Events" onPress={() => router.push('/events')} variant="outline" />
        </View>
      </BrandHero>

      <BrandCard>
        <BrandSectionHeader
          title="Connected backend"
          description="The mobile app is running against the same ANT PRESS backend as the website."
        />
        {isLoading ? (
          <ActivityIndicator />
        ) : (
          <>
            <BrandPill>{data?.status === 'ok' ? 'Backend online' : 'Checking backend'}</BrandPill>
            <ThemedText type="small">{API_URL}</ThemedText>
          </>
        )}
      </BrandCard>

      <BrandSectionHeader
        title="Quick paths"
        description="The same public and member-facing flows from the website, shaped for mobile."
      />
      <View style={styles.grid}>
        <QuickCard
          title="Announcements"
          description="Read published news and updates."
          action="Open News"
          onPress={() => router.push('/news')}
        />
        <QuickCard
          title="Community Events"
          description="Track upcoming events and register."
          action="Open Events"
          onPress={() => router.push('/events')}
        />
        <QuickCard
          title="Member Dashboard"
          description="See your profile, notifications, giving, and prayer activity."
          action="Open Dashboard"
          onPress={() => router.push('/dashboard')}
        />
      </View>
    </BrandScreen>
  );
}

function QuickCard({
  title,
  description,
  action,
  onPress,
}: {
  title: string;
  description: string;
  action: string;
  onPress: () => void;
}) {
  return (
    <BrandCard>
      <ThemedText type="defaultSemiBold">{title}</ThemedText>
      <ThemedText type="small">{description}</ThemedText>
      <BrandButton label={action} onPress={onPress} variant="secondary" />
    </BrandCard>
  );
}

const styles = StyleSheet.create({
  heroActions: {
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  grid: {
    gap: Spacing.three,
  },
});
