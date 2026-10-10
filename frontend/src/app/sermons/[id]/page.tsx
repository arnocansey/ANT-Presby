'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Mic, PlayCircle } from 'lucide-react';
import BackLink from '@/components/site/BackLink';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import EmptyState from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useSermon } from '@/hooks/useApi';

export default function SermonDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ? Number(params.id) : 0;
  const { data, isLoading, error } = useSermon(id);

  return (
    <div className="container-max space-y-6 py-10 sm:py-12">
      <BackLink href="/sermons" label="Back to sermons" />

      {isLoading && (
        <div className="space-y-4" role="status">
          <span className="sr-only">Loading…</span>
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="aspect-video w-full rounded-panel" />
        </div>
      )}
      {!isLoading && error && (
        <EmptyState icon={PlayCircle} title="This sermon couldn't load right now" message="Please try again in a moment." />
      )}
      {!isLoading && !error && !data && (
        <EmptyState
          icon={PlayCircle}
          title="Sermon not found"
          message="It may have been moved or removed."
          action={
            <Button asChild variant="secondary">
              <Link href="/sermons">Browse sermons</Link>
            </Button>
          }
        />
      )}

      {data && (
        <article className="space-y-8">
          <header className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold-ink">Sermon</p>
            <h1 className="break-words text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{data.title}</h1>
            {data.speaker && (
              <p className="inline-flex items-center gap-2 text-sm text-muted">
                <Mic className="h-4 w-4" aria-hidden="true" />
                {data.speaker}
              </p>
            )}
          </header>

          {/* Video surface: black in both themes (allowed exception). */}
          <div className="overflow-hidden rounded-panel border border-border bg-black">
            <div className="aspect-video">
              {data.video_url ? (
                <iframe title={data.title} src={data.video_url} className="h-full w-full" allowFullScreen />
              ) : (
                <div className="flex h-full items-center justify-center p-6 text-center text-white/80">
                  <div>
                    <PlayCircle className="mx-auto mb-3 h-12 w-12 opacity-60" aria-hidden="true" />
                    <p>No video available for this sermon yet.</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <p className="leading-relaxed text-foreground/85">
              {data.description || 'This sermon is available in the ANT PRESS library and can be revisited here whenever you need it.'}
            </p>

            <Card>
              <CardContent className="space-y-4 p-6">
                <h2 className="text-lg font-semibold text-foreground">Keep exploring</h2>
                <p className="text-sm text-muted">Browse the wider sermon library or continue into connected ministry content.</p>
                <div className="flex flex-col gap-3">
                  <Button asChild>
                    <Link href="/sermons">More sermons</Link>
                  </Button>
                  <Button asChild variant="secondary">
                    <Link href="/ministries">Explore ministries</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </article>
      )}
    </div>
  );
}
