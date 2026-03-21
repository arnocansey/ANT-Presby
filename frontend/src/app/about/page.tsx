'use client';

import Link from 'next/link';
import { ArrowRight, BookOpen, Calendar, HeartHandshake, Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/button';

const pillars = [
  {
    icon: Megaphone,
    title: 'Publishing With Purpose',
    description:
      'ANT PRESS helps teams publish updates, stories, events, and media with one clear workflow instead of scattered tools.',
  },
  {
    icon: Calendar,
    title: 'Community Rhythm',
    description:
      'Events and recurring activities stay visible so people can move from information to participation without friction.',
  },
  {
    icon: BookOpen,
    title: 'Content That Lasts',
    description:
      'Sermons, news, and ministry resources stay accessible in one place so the message keeps working long after it is posted.',
  },
  {
    icon: HeartHandshake,
    title: 'Support And Service',
    description:
      'Giving, prayer, and account tools make support feel straightforward while keeping the wider community connected.',
  },
];

export default function AboutPage() {
  return (
    <div className="container-max py-10">
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-6 py-12 text-white shadow-xl sm:px-10">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -left-16 top-12 h-44 w-44 rounded-full bg-cyan-400 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-56 w-56 rounded-full bg-amber-400 blur-3xl" />
        </div>
        <div className="relative grid gap-10 lg:grid-cols-[1.35fr_0.85fr] lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-amber-300">
              About ANT PRESS
            </p>
            <h1 className="mt-4 max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">
              A modern web platform for publishing, engagement, and community momentum
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-200 sm:text-lg">
              ANT PRESS brings together sermons, events, giving, updates, and account tools so the public site feels more intentional and easier to act on.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="rounded-full bg-white text-slate-950 hover:bg-slate-100">
                <Link href="/ministries">
                  Explore Ministries <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-full border-white/40 bg-white/10 text-white hover:bg-white/20"
              >
                <Link href="/contact">Get In Touch</Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {[
              ['Publishing', 'News, announcements, and updates in one web workflow'],
              ['Participation', 'Events, ministries, and actions people can take immediately'],
              ['Support', 'Giving and member tools that stay easy to reach'],
            ].map(([title, text]) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                <p className="text-sm font-semibold text-white">{title}</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-200">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-7 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-700 dark:text-cyan-300">
            Why It Matters
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 dark:text-white">
            One place for the work that keeps people connected
          </h2>
          <div className="mt-5 space-y-4 text-sm leading-relaxed text-ui-muted sm:text-base">
            <p>
              Organizations lose momentum when announcements, events, and support tools live in separate places. ANT PRESS closes that gap with one connected public experience.
            </p>
            <p>
              That means leaders can manage content more confidently, and members can find what they need without guessing where to go next.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {pillars.map((pillar) => (
            <div
              key={pillar.title}
              className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800 dark:bg-slate-950"
            >
              <div className="inline-flex rounded-2xl bg-sky-100 p-3 text-sky-700 dark:bg-cyan-950/50 dark:text-cyan-300">
                <pillar.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-xl font-bold tracking-tight text-slate-950 dark:text-white">
                {pillar.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-ui-muted">{pillar.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-3">
        {[
          {
            kicker: 'Explore',
            title: 'See what is happening now',
            text: 'Browse the latest updates, discover active ministries, and review upcoming events from the live public site.',
            href: '/news',
            label: 'Read News',
          },
          {
            kicker: 'Support',
            title: 'Make your contribution count',
            text: 'The giving flow is built to stay simple, trackable, and easy to revisit from your account dashboard.',
            href: '/donate',
            label: 'Open Giving Page',
          },
          {
            kicker: 'Connect',
            title: 'Reach the team directly',
            text: 'Use the contact page when you want to ask questions, request information, or start getting involved.',
            href: '/contact',
            label: 'Contact Us',
          },
        ].map((item) => (
          <div key={item.title} className="rounded-[1.5rem] border border-dashed border-slate-300 bg-white p-6 dark:border-slate-700 dark:bg-slate-950">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-ui-subtle">{item.kicker}</p>
            <h3 className="mt-3 text-xl font-bold text-slate-950 dark:text-white">{item.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-ui-muted">{item.text}</p>
            <Button asChild variant="outline" className="mt-5 rounded-full">
              <Link href={item.href}>{item.label}</Link>
            </Button>
          </div>
        ))}
      </section>
    </div>
  );
}
