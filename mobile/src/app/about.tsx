import { router } from 'expo-router';
import React from 'react';

import { ListGroup, ListRow, Screen, ScreenHeader, SectionHeader } from '@/components/kit';
import { AppText } from '@/components/ui/app-text';
import { AppCard } from '@/components/ui/card';

export default function AboutScreen() {
  return (
    <Screen>
      <ScreenHeader
        back
        eyebrow="About"
        title="About ANT PRESS"
        subtitle="Announcements, sermons, events, giving, prayer and member engagement in one place."
      />

      <AppCard>
        <AppText variant="bodyStrong">What the platform does</AppText>
        <AppText variant="small" tone="muted">
          ANT PRESS helps your team publish updates, manage events, share sermons, receive donations,
          track prayer requests, and keep members informed from web and mobile.
        </AppText>
      </AppCard>

      <AppCard>
        <AppText variant="bodyStrong">What you can do here</AppText>
        <AppText variant="small" tone="muted">
          Read announcements, explore ministries, watch sermons, search content, give, and stay connected.
        </AppText>
      </AppCard>

      <SectionHeader title="More" />
      <ListGroup>
        <ListRow icon="sparkles-outline" label="Ministries" onPress={() => router.push('/ministries' as never)} />
        <ListRow icon="mail-outline" label="Contact us" onPress={() => router.push('/contact' as never)} />
        <ListRow icon="help-circle-outline" label="FAQ" onPress={() => router.push('/faq' as never)} />
        <ListRow icon="shield-checkmark-outline" label="Privacy" onPress={() => router.push('/privacy' as never)} />
        <ListRow icon="document-text-outline" label="Terms" onPress={() => router.push('/terms' as never)} />
      </ListGroup>
    </Screen>
  );
}
