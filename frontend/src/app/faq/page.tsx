import Link from 'next/link';
import { HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import PageHeader from '@/components/ui/page-header';

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
    <div className="container-max py-10 sm:py-12">
      <div className="mx-auto max-w-3xl space-y-8">
        <PageHeader
          title="Frequently asked questions"
          description="Quick answers to common questions about ANT PRESS."
          breadcrumb={[{ label: 'About', href: '/about' }, { label: 'FAQ' }]}
        />

        <Card>
          <dl className="divide-y divide-border">
            {faqs.map((item) => (
              <div key={item.question} className="space-y-2 p-6">
                <dt className="text-lg font-semibold text-foreground">{item.question}</dt>
                <dd className="leading-relaxed text-foreground/85">{item.answer}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <Card className="bg-surface">
          <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <HelpCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
              <div>
                <p className="font-semibold text-foreground">Still have a question?</p>
                <p className="text-sm text-muted">Send us a message and the team will get back to you.</p>
              </div>
            </div>
            <Button asChild className="self-start sm:self-auto">
              <Link href="/contact">Contact us</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
