'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, CalendarDays, MapPin, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEvent, useRegisterEvent, useUserEventRegistrations } from '@/hooks/useApi';
import { useAuthStore } from '@/lib/store';

export default function EventDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ? Number(params.id) : 0;
  const { isAuthenticated } = useAuthStore();
  const { data, isLoading, error } = useEvent(id);
  const registrationsQuery = useUserEventRegistrations(isAuthenticated);
  const register = useRegisterEvent();
  const registeredIds = new Set((registrationsQuery.data || []).map((item: any) => item.id));
  const isRegistered = data?.id ? registeredIds.has(data.id) : false;

  const handleRegister = () => {
    if (!id || isRegistered) return;
    register.mutate(id);
  };

  const registeredCount = Number(data?.registered_count || 0);
  const maxRegistrations = Number(data?.max_registrations || 0);

  return (
    <div className="container-max py-10">
      <Link
        href="/events"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-sky-700 hover:text-sky-800 dark:text-cyan-300 dark:hover:text-cyan-200"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to events
      </Link>

      {isLoading && <DetailState text="Loading event..." />}
      {!isLoading && error && <DetailState text="Failed to load event." />}
      {!isLoading && !error && !data && <DetailState text="Event not found." />}

      {data && (
        <article className="overflow-hidden rounded-[1.8rem] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="h-56 bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600 sm:h-72" />
          <div className="grid gap-8 p-6 sm:p-10 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-5">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-600 dark:text-amber-300">
                Event Detail
              </p>
              <h1 className="text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-4xl">
                {data.name}
              </h1>
              <p className="leading-relaxed text-ui-muted">
                {data.description || 'Open this event to review the full details and complete your registration.'}
              </p>

              <div className="grid gap-3 text-sm text-ui-subtle">
                <p className="inline-flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-sky-700 dark:text-cyan-300" />
                  {data.location || 'Location to be announced'}
                </p>
                <p className="inline-flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-sky-700 dark:text-cyan-300" />
                  {new Date(data.event_date || data.eventDate).toLocaleString()}
                </p>
                <p className="inline-flex items-center gap-2">
                  <Users className="h-4 w-4 text-sky-700 dark:text-cyan-300" />
                  {maxRegistrations > 0
                    ? `${registeredCount}/${maxRegistrations} registered`
                    : `${registeredCount} registered`}
                </p>
              </div>
            </div>

            <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-xl font-bold text-slate-950 dark:text-white">Registration</h2>
              <p className="mt-3 text-sm leading-relaxed text-ui-muted">
                Reserve your place through the live registration flow connected to the ANT PRESS backend.
              </p>
              <Button
                onClick={handleRegister}
                disabled={register.isPending || !data || isRegistered}
                className="mt-5 h-12 w-full rounded-xl bg-amber-500 text-slate-950 hover:bg-amber-400"
              >
                {isRegistered ? 'Already Registered' : register.isPending ? 'Registering...' : 'Register for Event'}
              </Button>

              {register.isSuccess && (
                <p className="mt-3 text-sm font-medium text-emerald-700 dark:text-emerald-300">
                  Registration completed successfully.
                </p>
              )}
              {isRegistered && !register.isSuccess && (
                <p className="mt-3 text-sm font-medium text-emerald-700 dark:text-emerald-300">
                  You are already registered for this event.
                </p>
              )}
              {register.isError && (
                <p className="mt-3 text-sm font-medium text-red-700 dark:text-red-300">
                  {(register.error as any)?.response?.data?.message || 'Could not complete registration. Please try again.'}
                </p>
              )}
            </div>
          </div>
        </article>
      )}
    </div>
  );
}

function DetailState({ text }: { text: string }) {
  return (
    <div className="rounded-[1.4rem] border border-dashed border-slate-300 bg-white p-10 text-center text-ui-subtle dark:border-slate-700 dark:bg-slate-950">
      <p>{text}</p>
    </div>
  );
}
