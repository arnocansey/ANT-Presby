'use client';

import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  Calendar,
  Church,
  FileText,
  HeartHandshake,
  HelpCircle,
  Mail,
  Megaphone,
  Newspaper,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Section from '@/components/ui/section';
import Tile from '@/components/ui/tile';

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
    text: 'Read published announcements, stories, and practical updates.',
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

// Spec §3.1: About links to Ministries, Contact, FAQ, Privacy and Terms.
const aboutLinks = [
  { href: '/ministries', label: 'Ministries', description: 'Serve and belong', icon: Church },
  { href: '/contact', label: 'Contact', description: 'Talk to the team', icon: Mail },
  { href: '/faq', label: 'FAQ', description: 'Quick answers', icon: HelpCircle },
  { href: '/privacy', label: 'Privacy', description: 'How we handle your data', icon: ShieldCheck },
  { href: '/terms', label: 'Terms', description: 'Using this site', icon: FileText },
];

export default function AboutPage() {
  return (
    <div className="container-max space-y-14 py-10 sm:py-12">
      <section className="rounded-panel border border-border bg-surface px-6 py-10 sm:px-10 md:py-14">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div className="space-y-5">
            <Badge tone="gold">About ANT PRESS</Badge>
            <h1 className="max-w-3xl text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl">
              A platform built to turn information into real community movement
            </h1>
            <p className="max-w-2xl text-lg text-muted">
              ANT PRESS brings together publishing, participation, support, and member tools so the public website feels
              intentional, clear, and ready for action.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/ministries">
                  Explore Ministries <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/contact">Talk To The Team</Link>
              </Button>
            </div>
          </div>

          <ul className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {statCards.map(([title, text]) => (
              <li key={title} className="rounded-card border border-border bg-card p-4">
                <p className="text-sm font-semibold text-foreground">{title}</p>
                <p className="mt-1 text-sm text-muted">{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardContent className="p-6 sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold-ink">Why it exists</p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-foreground">
              One digital home for the work that keeps people connected
            </h2>
            <div className="mt-5 space-y-4 leading-relaxed text-foreground/85">
              <p>
                Momentum is easy to lose when updates, sermons, events, and support tools live in separate places. ANT PRESS
                closes that gap by giving the public site and the operations side a single shared system.
              </p>
              <p>
                That means leaders can publish with more confidence, and members can find what matters without guessing where
                to go next.
              </p>
            </div>

            <div className="mt-6 rounded-card bg-surface p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">In practice</p>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-foreground/85">
                <li>People can move from reading an update to registering for an event in the same experience.</li>
                <li>Published content stays reusable instead of disappearing after one announcement cycle.</li>
                <li>Support tools like giving and prayer requests stay easy to reach from the public side of the site.</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2">
          {pillars.map((pillar) => (
            <Card key={pillar.title}>
              <CardContent className="p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <pillar.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-lg font-semibold text-foreground">{pillar.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-foreground/85">{pillar.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Section title="More about us">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {aboutLinks.map((link) => (
            <Tile key={link.href} href={link.href} icon={link.icon} label={link.label} description={link.description} />
          ))}
        </div>
      </Section>

      <Section title="What you can do next" href="/register" linkLabel="Create an account">
        <div className="grid gap-4 lg:grid-cols-3">
          {pathways.map((item) => (
            <Card key={item.title} className="flex flex-col">
              <CardContent className="flex flex-1 flex-col p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <item.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-muted">{item.kicker}</p>
                <h3 className="mt-1 text-lg font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-foreground/85">{item.text}</p>
                <Button asChild variant="secondary" className="mt-5 self-start">
                  <Link href={item.href}>{item.label}</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>
    </div>
  );
}
