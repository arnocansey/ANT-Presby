import React from 'react';

import { BrandCard, BrandHero, BrandScreen, BrandSectionHeader } from '@/components/brand-ui';
import { ThemedText } from '@/components/themed-text';

export default function AboutScreen() {
  return (
    <BrandScreen>
      <BrandHero
        eyebrow="About ANT PRESS"
        title="A connected publishing and engagement platform"
        description="ANT PRESS brings together announcements, sermons, events, giving, prayer, and member engagement in one modern experience."
      />

      <BrandCard>
        <BrandSectionHeader
          title="What the platform does"
          description="The same mission and product story carried over from the website."
        />
        <ThemedText type="small">
          ANT PRESS helps your team publish updates, manage events, share sermons, receive donations,
          track prayer requests, and keep members informed from web and mobile.
        </ThemedText>
      </BrandCard>

      <BrandCard>
        <BrandSectionHeader
          title="What you can do here"
          description="Mobile is designed to match the website more closely with each release."
        />
        <ThemedText type="small">Read announcements, explore ministries, watch sermons, search content, give, and stay connected.</ThemedText>
      </BrandCard>
    </BrandScreen>
  );
}
