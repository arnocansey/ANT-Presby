'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { CalendarCheck } from 'lucide-react';
import apiClient from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import EmptyState from '@/components/ui/empty-state';
import PageHeader from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';

type Registration = {
  id: number;
  created_at: string;
  event_name?: string;
  name?: string;
};

async function fetchRegistrations(): Promise<Registration[]> {
  const res = await apiClient.get('/events/registrations/user');
  return res.data.data;
}

export default function RegistrationsPage() {
  const { data, isLoading, isError } = useQuery<Registration[]>({
    queryKey: ['registrations'],
    queryFn: fetchRegistrations,
  });

  return (
    <div className="container-max space-y-8 py-10 sm:py-12">
      <PageHeader
        title="My event registrations"
        description="Events you have signed up for."
        breadcrumb={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'My registrations' }]}
        actions={
          <Button asChild variant="secondary">
            <Link href="/events">Browse events</Link>
          </Button>
        }
      />

      {isLoading ? (
        <div className="space-y-3" role="status">
          <span className="sr-only">Loading…</span>
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : isError ? (
        <EmptyState icon={CalendarCheck} title="Your registrations couldn't load right now" message="Please try again in a moment." />
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title="No registrations yet"
          message="When you register for an event it will be listed here."
          action={
            <Button asChild>
              <Link href="/events">Find an event</Link>
            </Button>
          }
        />
      ) : (
        <Card>
          <ul className="divide-y divide-border">
            {data.map((r) => (
              <li key={r.id} className="flex items-start gap-4 p-5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <CalendarCheck className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="break-words font-semibold text-foreground">{r.event_name || r.name}</p>
                  <p className="text-sm text-muted">Registered at: {new Date(r.created_at).toLocaleString()}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
