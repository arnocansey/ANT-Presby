'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { CalendarDays, MapPin } from 'lucide-react';
import { useEvent, useRegisterEvent } from '@/hooks/useApi';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function EventDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ? Number(params.id) : 0;
  const { data, isLoading, error } = useEvent(id);
  const register = useRegisterEvent();

  const handleRegister = () => {
    if (!id) return;
    register.mutate(id);
  };

  return (
    <div className="container-max py-12 sm:py-16">
      <Card>
        <CardHeader className="space-y-3 border-b border-slate-100 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/70">
          <div className="flex items-center gap-2 text-sm font-medium text-sky-700 dark:text-cyan-300">
            <CalendarDays className="h-4 w-4" />
            Event Detail
          </div>
          <CardTitle className="text-2xl tracking-tight sm:text-3xl">
            {data?.name || 'Event'}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-5 p-6 sm:p-8">
          {isLoading && (
            <div className="space-y-4">
              <div className="h-6 w-2/3 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
              <div className="h-24 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
            </div>
          )}

          {!isLoading && error && (
            <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
              Failed to load event.
            </p>
          )}

          {!isLoading && !error && !data && (
            <p className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-ui-subtle dark:border-slate-700">
              Event not found.
            </p>
          )}

          {data && (
            <div className="space-y-5">
              {data.description && (
                <p className="leading-relaxed text-ui-muted">{data.description}</p>
              )}

              <div className="grid gap-3 text-sm text-ui-subtle">
                <p className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-sky-700 dark:text-cyan-300" />
                  {data.location || 'Location to be announced'}
                </p>
                <p className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-sky-700 dark:text-cyan-300" />
                  {new Date(data.event_date).toLocaleString()}
                </p>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="border-t border-slate-100 p-6 dark:border-slate-800">
          <div className="w-full space-y-3">
            <Button onClick={handleRegister} disabled={register.isPending || !data} className="w-full sm:w-auto">
              {register.isPending ? 'Registering...' : 'Register for Event'}
            </Button>

            {register.isSuccess && (
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                Registration completed successfully.
              </p>
            )}
            {register.isError && (
              <p className="text-sm font-medium text-red-700 dark:text-red-300">
                Could not complete registration. Please try again.
              </p>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
