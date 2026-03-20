'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, CalendarDays, MapPin } from 'lucide-react';
import { useEvents } from '@/hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type EventItem = {
  id: number;
  name: string;
  description?: string;
  location?: string;
  event_date: string;
};

export default function EventsPage() {
  const { data, isLoading, error } = useEvents(1, 12);
  const events = (data?.data ?? []) as EventItem[];

  return (
    <div className="container-max py-12 sm:py-16">
      <div className="mb-8 sm:mb-10">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Events</h1>
        <p className="mt-3 max-w-2xl text-ui-subtle">
          Stay updated with worship services, conferences, and community gatherings.
        </p>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="p-6">
              <div className="h-5 w-2/3 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
              <div className="mt-4 h-16 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
              <div className="mt-6 h-9 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
            </Card>
          ))}
        </div>
      )}

      {!isLoading && error && (
        <Card className="border-red-200 bg-red-50/70 dark:border-red-900 dark:bg-red-950/30">
          <CardContent className="p-6 text-sm font-medium text-red-700 dark:text-red-300">
            Failed to load events.
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && events.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center text-ui-subtle">
            No events available right now.
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && events.length > 0 && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <Card
              key={event.id}
              className="group h-full transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              <CardHeader className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-sky-700 dark:text-cyan-300">
                  <CalendarDays className="h-4 w-4" />
                  {new Date(event.event_date).toLocaleDateString()}
                </div>
                <CardTitle className="text-xl tracking-tight">{event.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {event.description && (
                  <p className="text-sm leading-relaxed text-ui-muted">{event.description}</p>
                )}
                {event.location && (
                  <p className="flex items-center gap-2 text-sm text-ui-subtle">
                    <MapPin className="h-4 w-4" />
                    {event.location}
                  </p>
                )}
                <Button
                  asChild
                  variant="outline"
                  className="group-hover:border-cyan-400 group-hover:text-sky-700 dark:group-hover:text-cyan-300"
                >
                  <Link href={`/events/${event.id}`}>
                    Details <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
