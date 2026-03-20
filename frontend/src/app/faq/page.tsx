'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const faqs = [
  {
    question: 'How do I create a church member account?',
    answer:
      'Go to the Register page, fill in your details, accept the Terms and Agreement, and submit the form.',
  },
  {
    question: 'How can I register for church events?',
    answer:
      'Open the Events page, select an event, and use the Register button on the event detail page.',
  },
  {
    question: 'Can I submit prayer requests privately?',
    answer:
      'Yes. On the Prayer Request page, you can choose to submit anonymously before sending.',
  },
  {
    question: 'How do notifications work?',
    answer:
      'You will receive in-app notifications for new events, prayer updates, and announcements. You can view them from the bell icon in the header.',
  },
  {
    question: 'How do I update my profile picture?',
    answer:
      'Visit your Profile page and use the Upload Photo button to upload a new image.',
  },
  {
    question: 'Who do I contact for support?',
    answer:
      'Use the Contact page and send a message to the church admin team.',
  },
];

export default function FaqPage() {
  return (
    <div className="container-max py-12 sm:py-16">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Frequently Asked Questions</h1>
        <p className="mt-2 text-ui-subtle">Quick answers to common questions about ANT PRESS.</p>
      </div>

      <div className="grid gap-4">
        {faqs.map((item) => (
          <Card key={item.question}>
            <CardHeader>
              <CardTitle className="text-lg tracking-tight">{item.question}</CardTitle>
            </CardHeader>
            <CardContent className="text-ui-muted">{item.answer}</CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
