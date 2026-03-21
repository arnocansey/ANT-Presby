import React from 'react';

import { BrandCard, BrandHero, BrandScreen } from '@/components/brand-ui';
import { ThemedText } from '@/components/themed-text';

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
    <BrandScreen>
      <BrandHero
        eyebrow="FAQ"
        title="Common questions"
        description="A quick mobile version of the same help and onboarding content available on the website."
      />

      {faqs.map((item) => (
        <BrandCard key={item.question}>
          <ThemedText type="defaultSemiBold">{item.question}</ThemedText>
          <ThemedText type="small">{item.answer}</ThemedText>
        </BrandCard>
      ))}
    </BrandScreen>
  );
}
