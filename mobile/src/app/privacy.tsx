import React from 'react';

import { Screen, ScreenHeader } from '@/components/kit';
import { AppText } from '@/components/ui/app-text';
import { AppCard } from '@/components/ui/card';

export default function PrivacyScreen() {
  return (
    <Screen>
      <ScreenHeader back eyebrow="Privacy" title="Privacy overview" />

      <AppCard>
        <AppText variant="bodyStrong">Your data</AppText>
        <AppText variant="small" tone="muted">
          ANT PRESS stores the account, giving, prayer, and notification data needed to provide the platform experience across web and mobile.
        </AppText>
      </AppCard>

      <AppCard>
        <AppText variant="bodyStrong">How it is used</AppText>
        <AppText variant="small" tone="muted">
          We use your information to authenticate you, support participation in events, power giving and communication flows, and help admins manage the platform responsibly.
        </AppText>
      </AppCard>
    </Screen>
  );
}
