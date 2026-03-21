import React from 'react';

import { BrandCard, BrandHero, BrandScreen } from '@/components/brand-ui';
import { ThemedText } from '@/components/themed-text';

export default function PrivacyScreen() {
  return (
    <BrandScreen>
      <BrandHero
        eyebrow="Privacy"
        title="Privacy overview"
        description="A mobile summary of the privacy commitments represented on the ANT PRESS website."
      />

      <BrandCard>
        <ThemedText type="defaultSemiBold">Your data</ThemedText>
        <ThemedText type="small">
          ANT PRESS stores the account, giving, prayer, and notification data needed to provide the platform experience across web and mobile.
        </ThemedText>
      </BrandCard>

      <BrandCard>
        <ThemedText type="defaultSemiBold">How it is used</ThemedText>
        <ThemedText type="small">
          We use your information to authenticate you, support participation in events, power giving and communication flows, and help admins manage the platform responsibly.
        </ThemedText>
      </BrandCard>
    </BrandScreen>
  );
}
