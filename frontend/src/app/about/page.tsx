'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, Calendar, HeartHandshake, Megaphone } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const pillars = [
  {
    icon: Megaphone,
    title: 'Publishing With Purpose',
    description:
      'ANT PRESS is designed to help organizations publish updates, stories, events, and media in a way that feels organized and easy to manage.',
  },
  {
    icon: Calendar,
    title: 'Community Rhythm',
    description:
      'From upcoming events to recurring activities, the platform keeps people aligned with what is happening and how to participate.',
  },
  {
    icon: BookOpen,
    title: 'Content That Lasts',
    description:
      'Sermons, announcements, and ministry resources stay accessible in one place so the message keeps working long after it is posted.',
  },
  {
    icon: HeartHandshake,
    title: 'Support And Service',
    description:
      'Giving, prayer, and member-facing tools make it easier to support the mission while staying connected to the wider community.',
  },
];

export default function AboutPage() {
  return (
    <div className="container-max py-8 sm:py-12 lg:py-16">
      <section className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-gradient-to-br from-slate-950 via-sky-950 to-cyan-900 px-6 py-10 text-white shadow-xl sm:px-8 sm:py-14 lg:px-12">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -left-16 top-10 h-40 w-40 rounded-full bg-cyan-300 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-56 w-56 rounded-full bg-sky-400 blur-3xl" />
        </div>

        <div className="relative grid gap-10 lg:grid-cols-[1.35fr_0.85fr] lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-cyan-200">
              About ANT PRESS
            </p>
            <h1 className="mt-4 max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl">
              A modern platform for publishing, engagement, and community momentum
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-cyan-50/90 sm:text-lg">
              ANT PRESS brings together content, events, giving, and communication so people can stay informed,
              connected, and ready to take part. It is built to make everyday coordination feel clearer and more intentional.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="text-sky-900 hover:bg-slate-100 hover:text-black">
                <Link href="/ministries">
                  Explore Ministries <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/50 bg-white/10 text-white hover:bg-white/20">
                <Link href="/contact">Get In Touch</Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {[
              ['Publishing', 'News, announcements, and updates in one workflow'],
              ['Participation', 'Events, ministries, and activities people can act on'],
              ['Support', 'Giving and member tools that stay easy to reach'],
            ].map(([title, text]) => (
              <div key={title} className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                <p className="text-sm font-semibold text-white">{title}</p>
                <p className="mt-2 text-sm leading-relaxed text-cyan-50/80">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <Card className="overflow-hidden border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-950">
          <CardContent className="p-6 sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-700 dark:text-cyan-300">
              Why It Matters
            </p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight">One place for the work that keeps people connected</h2>
            <div className="mt-5 space-y-4 text-sm leading-relaxed text-ui-muted sm:text-base">
              <p>
                Organizations often struggle when announcements live in one place, events in another, and support workflows somewhere else entirely.
                ANT PRESS closes that gap with a single experience that keeps communication, action, and follow-through in sync.
              </p>
              <p>
                The result is a platform that helps leaders manage content confidently and helps members find what they need without friction.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2">
          {pillars.map((pillar) => (
            <Card
              key={pillar.title}
              className="h-full border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-700 dark:bg-slate-950"
            >
              <CardContent className="p-6">
                <div className="inline-flex rounded-2xl bg-sky-100 p-3 text-sky-700 dark:bg-cyan-950/50 dark:text-cyan-300">
                  <pillar.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-xl font-bold tracking-tight">{pillar.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-ui-muted">{pillar.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-3">
        <Card className="border-dashed">
          <CardContent className="p-6 sm:p-7">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-ui-subtle">Explore</p>
            <h3 className="mt-3 text-xl font-bold">See what is happening now</h3>
            <p className="mt-3 text-sm leading-relaxed text-ui-muted">
              Browse the latest updates, discover active ministries, and review upcoming events from the public-facing sections.
            </p>
            <Button asChild variant="outline" className="mt-5 w-full sm:w-auto">
              <Link href="/news">Read News</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-dashed">
          <CardContent className="p-6 sm:p-7">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-ui-subtle">Support</p>
            <h3 className="mt-3 text-xl font-bold">Make your contribution count</h3>
            <p className="mt-3 text-sm leading-relaxed text-ui-muted">
              The giving flow is built to stay simple, trackable, and easy to revisit from your account dashboard.
            </p>
            <Button asChild variant="outline" className="mt-5 w-full sm:w-auto">
              <Link href="/donate">Open Giving Page</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-dashed">
          <CardContent className="p-6 sm:p-7">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-ui-subtle">Connect</p>
            <h3 className="mt-3 text-xl font-bold">Reach the team directly</h3>
            <p className="mt-3 text-sm leading-relaxed text-ui-muted">
              Use the contact page when you want to ask questions, request information, or start getting involved.
            </p>
            <Button asChild variant="outline" className="mt-5 w-full sm:w-auto">
              <Link href="/contact">Contact Us</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
