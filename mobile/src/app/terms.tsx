import React from 'react';

import { Screen, ScreenHeader } from '@/components/kit';
import { AppText } from '@/components/ui/app-text';
import { AppCard } from '@/components/ui/card';

export default function TermsScreen() {
  return (
    <Screen>
      <ScreenHeader back eyebrow="Terms" title="Terms and agreement" />

      <AppCard>
        <AppText variant="bodyStrong">Platform use</AppText>
        <AppText variant="small" tone="muted">
          By using ANT PRESS, members and admins agree to use the platform responsibly for church communications, events, giving, and engagement.
        </AppText>
      </AppCard>

      <AppCard>
        <AppText variant="bodyStrong">Account responsibility</AppText>
        <AppText variant="small" tone="muted">
          Keep your account details accurate, protect your credentials, and use admin access only when it is appropriate to your role.
        </AppText>
      </AppCard>
    </Screen>
  );
}
