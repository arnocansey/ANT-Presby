import React from 'react';

import { Screen, ScreenHeader } from '@/components/kit';
import { AppText } from '@/components/ui/app-text';
import { AppCard } from '@/components/ui/card';

const faqs = [
  {
    question: 'How do I make a donation?',
    answer: 'Open the donation flow from the dashboard, account area, or public donate screen and follow the payment steps.',
  },
  {
    question: 'Do I need an account to register for events?',
    answer: 'Yes. Event registration is tied to your ANT PRESS account so your activity and notifications can stay connected.',
  },
  {
    question: 'Where do sermons come from?',
    answer: 'Sermons are published from the same ANT PRESS admin system used on the website and appear here automatically.',
  },
];

export default function FaqScreen() {
  return (
    <Screen>
      <ScreenHeader back eyebrow="FAQ" title="Common questions" />

      {faqs.map((item) => (
        <AppCard key={item.question}>
          <AppText variant="bodyStrong" accessibilityRole="header">
            {item.question}
          </AppText>
          <AppText variant="small" tone="muted">
            {item.answer}
          </AppText>
        </AppCard>
      ))}
    </Screen>
  );
}
