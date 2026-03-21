import React from 'react';

import { BrandCard, BrandHero, BrandScreen } from '@/components/brand-ui';
import { ThemedText } from '@/components/themed-text';

export default function TermsScreen() {
  return (
    <BrandScreen>
      <BrandHero
        eyebrow="Terms"
        title="Terms and agreement"
        description="A mobile summary of the platform terms represented on the ANT PRESS website."
      />

      <BrandCard>
        <ThemedText type="defaultSemiBold">Platform use</ThemedText>
        <ThemedText type="small">
          By using ANT PRESS, members and admins agree to use the platform responsibly for church communications, events, giving, and engagement.
        </ThemedText>
      </BrandCard>

      <BrandCard>
        <ThemedText type="defaultSemiBold">Account responsibility</ThemedText>
        <ThemedText type="small">
          Keep your account details accurate, protect your credentials, and use admin access only when it is appropriate to your role.
        </ThemedText>
      </BrandCard>
    </BrandScreen>
  );
}
