'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { CalendarDays, ImageIcon, MapPin, Users } from 'lucide-react';
import BackLink from '@/components/site/BackLink';
import MediaPlaceholder from '@/components/site/MediaPlaceholder';
import StatusMessage from '@/components/site/StatusMessage';
import { Button } from '@/components/ui/button';
import EmptyState from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useEvent, useRegisterEvent, useUserEventRegistrations } from '@/hooks/useApi';
import { useAuthStore } from '@/lib/store';
import { resolveAssetUrl } from '@/lib/utils';

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
    <div className="container-max space-y-6 py-10 sm:py-12">
      <BackLink href="/events" label="Back to events" />

      {isLoading && (
        <div className="space-y-4" role="status">
          <span className="sr-only">Loading…</span>
          <Skeleton className="h-56 w-full rounded-panel" />
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      )}
      {!isLoading && error && (
        <EmptyState icon={CalendarDays} title="This event couldn't load right now" message="Please try again in a moment." />
      )}
      {!isLoading && !error && !data && (
        <EmptyState
          icon={CalendarDays}
          title="Event not found"
          message="It may have been moved or removed."
          action={
            <Button asChild variant="secondary">
              <Link href="/events">See all events</Link>
            </Button>
          }
        />
      )}

      {data && (
        <article className="overflow-hidden rounded-panel border border-border bg-card">
          {data.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={resolveAssetUrl(data.image_url)} alt={data.name} className="h-56 w-full object-cover sm:h-72" />
          ) : (
            <MediaPlaceholder icon={CalendarDays} className="h-40 sm:h-56" />
          )}
          <div className="grid gap-8 p-6 sm:p-10 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="min-w-0 space-y-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold-ink">Event</p>
              <h1 className="break-words text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{data.name}</h1>
              <p className="leading-relaxed text-foreground/85">
                {data.description || 'Open this event to review the full details and complete your registration.'}
              </p>

              <ul className="grid gap-3 text-sm text-muted">
                <li className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  {data.location || 'Location to be announced'}
                </li>
                <li className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  {new Date(data.event_date || data.eventDate).toLocaleString()}
                </li>
                <li className="flex items-center gap-2">
                  <Users className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  {maxRegistrations > 0
                    ? `${registeredCount}/${maxRegistrations} registered`
                    : `${registeredCount} registered`}
                </li>
              </ul>
              {data.album_id ? (
                <Link
                  href={`/gallery/${data.album_id}`}
                  className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-link hover:underline"
                >
                  <ImageIcon className="h-4 w-4" aria-hidden="true" />
                  View photos from this event
                </Link>
              ) : null}
            </div>

            <div className="h-fit rounded-card border border-border bg-surface p-5">
              <h2 className="text-lg font-semibold text-foreground">Registration</h2>
              <p className="mt-2 text-sm text-muted">Reserve your place for this event.</p>
              <Button
                onClick={handleRegister}
                disabled={!data || isRegistered}
                loading={register.isPending}
                size="lg"
                className="mt-5 w-full"
              >
                {isRegistered ? 'Already Registered' : register.isPending ? 'Registering...' : 'Register for Event'}
              </Button>

              <div className="mt-3 space-y-2" aria-live="polite">
                {register.isSuccess && <StatusMessage tone="success">Registration completed successfully.</StatusMessage>}
                {isRegistered && !register.isSuccess && (
                  <StatusMessage tone="success">You are already registered for this event.</StatusMessage>
                )}
                {register.isError && (
                  <StatusMessage tone="danger">
                    {(register.error as any)?.response?.data?.message || 'Could not complete registration. Please try again.'}
                  </StatusMessage>
                )}
              </div>
            </div>
          </div>
        </article>
      )}
    </div>
  );
}
