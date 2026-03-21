'use client';

import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  Calendar,
  HeartHandshake,
  Megaphone,
  Newspaper,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const pillars = [
  {
    icon: Megaphone,
    title: 'Publishing With Purpose',
    description:
      'Announcements, updates, and stories move through one clear workflow instead of being scattered across disconnected tools.',
  },
  {
    icon: Calendar,
    title: 'Community Rhythm',
    description:
      'Events stay visible and actionable so people can move from reading to participating without friction.',
  },
  {
    icon: BookOpen,
    title: 'Content That Lasts',
    description:
      'Sermons, ministry resources, and archive content remain easy to revisit long after they are first published.',
  },
  {
    icon: HeartHandshake,
    title: 'Support And Service',
    description:
      'Giving, prayer, and member tools stay close to the public experience so support feels natural instead of hidden.',
  },
];

const statCards = [
  ['One connected platform', 'Sermons, events, news, community, and support tools working together.'],
  ['Real-time participation', 'People can respond to what they read instead of stopping at information.'],
  ['Admin clarity', 'Content and operations live in one manageable system for the team behind the scenes.'],
];

const pathways = [
  {
    kicker: 'Newsroom',
    title: 'Follow fresh updates',
    text: 'Read published announcements, stories, and practical updates from the live content flow.',
    href: '/news',
    label: 'Read News',
    icon: Newspaper,
  },
  {
    kicker: 'Ministries',
    title: 'Discover active communities',
    text: 'Browse ministry groups and see how content, leadership, and participation connect.',
    href: '/ministries',
    label: 'Explore Ministries',
    icon: Users,
  },
  {
    kicker: 'Giving',
    title: 'Support the mission simply',
    text: 'Use the connected giving flow to contribute without losing track of your account history.',
    href: '/donate',
    label: 'Open Giving',
    icon: HeartHandshake,
  },
];

export default function AboutPage() {
  return (
    <div className="pb-16">
      <section className="container-max py-10 md:py-16">
        <div className="relative overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,rgb(180_83_9)_0%,rgb(245_158_11)_46%,rgb(234_88_12)_100%)] px-6 py-10 text-white shadow-2xl shadow-orange-200/60 sm:px-8 md:px-10 md:py-14">
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%23ffffff' fillOpacity='0.45'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
            }}
          />
          <div className="relative grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <div className="mb-4 inline-flex items-center rounded-full bg-white/20 px-4 py-1.5 text-sm font-semibold uppercase tracking-[0.26em] text-white/95">
                About ANT PRESS
              </div>
              <h1 className="max-w-4xl text-3xl font-black leading-tight tracking-tight sm:text-4xl lg:text-6xl">
                A platform built to turn information into real community movement
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-orange-50 sm:text-lg">
                ANT PRESS brings together publishing, participation, support, and member tools so the public website feels
                intentional, clear, and ready for action.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Button
                  asChild
                  size="lg"
                  className="rounded-full bg-white !text-amber-700 hover:bg-amber-50 hover:!text-amber-800"
                >
                  <Link href="/ministries">
                    Explore Ministries <ArrowRight className="ml-2 h-4 w-4 text-amber-700" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="rounded-full border-white/40 bg-white/10 !text-white hover:bg-white/20 hover:!text-white"
                >
                  <Link href="/contact">Talk To The Team</Link>
                </Button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {statCards.map(([title, text]) => (
                <div key={title} className="rounded-[1.4rem] border border-white/15 bg-white/10 p-4 backdrop-blur">
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-orange-50">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="container-max grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[1.6rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-7 dark:border-slate-800 dark:bg-slate-950">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-700 dark:text-cyan-300">
            Why It Exists
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 dark:text-white">
            One digital home for the work that keeps people connected
          </h2>
          <div className="mt-5 space-y-4 text-sm leading-relaxed text-ui-muted sm:text-base">
            <p>
              Momentum is easy to lose when updates, sermons, events, and support tools live in separate places. ANT PRESS
              closes that gap by giving the public site and the operations side a single shared system.
            </p>
            <p>
              That means leaders can publish with more confidence, and members can find what matters without guessing where
              to go next.
            </p>
          </div>

          <div className="mt-6 rounded-[1.4rem] bg-slate-50 p-5 dark:bg-slate-900">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-ui-subtle">In practice</p>
            <ul className="mt-4 space-y-3 text-sm leading-relaxed text-ui-muted">
              <li>People can move from reading an update to registering for an event in the same experience.</li>
              <li>Published content stays reusable instead of disappearing after one announcement cycle.</li>
              <li>Support tools like giving and prayer requests stay easy to reach from the public side of the site.</li>
            </ul>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {pillars.map((pillar) => (
            <div
              key={pillar.title}
              className="rounded-[1.6rem] border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800 dark:bg-slate-950"
            >
              <div className="inline-flex rounded-2xl bg-sky-100 p-3 text-sky-700 dark:bg-cyan-950/50 dark:text-cyan-300">
                <pillar.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-xl font-bold tracking-tight text-slate-950 dark:text-white">{pillar.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-ui-muted">{pillar.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-max mt-8">
        <div className="rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-800 dark:bg-slate-950">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-600 dark:text-amber-300">
                What You Can Do Next
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 dark:text-white">
                Move from reading about the platform to using it
              </h2>
            </div>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 text-sm font-semibold text-sky-700 transition-colors hover:text-sky-800 dark:text-cyan-300 dark:hover:text-cyan-200"
            >
              Create an account
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {pathways.map((item) => (
              <div
                key={item.title}
                className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="inline-flex rounded-2xl bg-white p-3 text-sky-700 shadow-sm dark:bg-slate-950 dark:text-cyan-300">
                  <item.icon className="h-5 w-5" />
                </div>
                <p className="mt-4 text-sm font-semibold uppercase tracking-[0.22em] text-ui-subtle">{item.kicker}</p>
                <h3 className="mt-2 text-xl font-bold text-slate-950 dark:text-white">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-ui-muted">{item.text}</p>
                <Button asChild variant="outline" className="mt-5 rounded-full">
                  <Link href={item.href}>{item.label}</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
