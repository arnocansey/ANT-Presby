'use client';

import React from 'react';
import Link from 'next/link';
import ConfirmDialog from '@/components/ui/confirm-dialog';
import PageHeader from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Field, FormActions, FormSection, formGridClass } from '@/components/admin/form-layout';
import { LoadError } from '@/components/admin/states';
import { ADMIN_HOME_CRUMB } from '@/components/admin/admin-nav';
import { useEndLive, useLiveStream, useStartLive } from '@/hooks/useApi';
import { formatDateTime } from '@/lib/utils';

export default function AdminLivePage() {
  const { data: live, isLoading, isError, refetch } = useLiveStream();
  const start = useStartLive();
  const end = useEndLive();

  const [title, setTitle] = React.useState('');
  const [youtubeUrl, setYoutubeUrl] = React.useState('');
  const [facebookUrl, setFacebookUrl] = React.useState('');
  const [confirmEnd, setConfirmEnd] = React.useState(false);
  const filledFromLive = React.useRef(false);

  // While live, start from the current title and links so they can be corrected.
  React.useEffect(() => {
    if (filledFromLive.current || !live?.is_live) return;
    filledFromLive.current = true;
    setTitle(live.title ?? '');
    setYoutubeUrl(live.youtube_url ?? '');
    setFacebookUrl(live.facebook_url ?? '');
  }, [live]);

  const isLive = Boolean(live?.is_live);
  const hasLink = Boolean(youtubeUrl.trim() || facebookUrl.trim());

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    start.mutate({
      title: title.trim(),
      youtubeUrl: youtubeUrl.trim() || undefined,
      facebookUrl: facebookUrl.trim() || undefined,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={[ADMIN_HOME_CRUMB, { label: 'Livestream' }]}
        title="Livestream"
        description="Paste the YouTube and/or Facebook link and go live. Everyone is notified once when you go live; updating the links while live does not notify again."
      />

      <FormSection title="Status">
        {isLoading ? (
          <Skeleton className="h-6 w-48" />
        ) : isError && !live ? (
          <LoadError what="the livestream status" onRetry={() => refetch()} />
        ) : isLive ? (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="live">Live now</Badge>
              <p className="font-semibold text-foreground">{live?.title}</p>
            </div>
            {live?.started_at && <p className="text-sm text-muted">Since {formatDateTime(live.started_at)}</p>}
            <Link href="/live" className="text-sm font-semibold text-link hover:underline">
              Open the live page
            </Link>
          </div>
        ) : (
          <Badge tone="neutral">Not live</Badge>
        )}
      </FormSection>

      <FormSection title={isLive ? 'Update the livestream' : 'Go live'}>
        <form onSubmit={onSubmit} className={formGridClass}>
          <Field label="Title" htmlFor="live-title" full>
            <Input
              id="live-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Sunday Worship Service"
              required
              maxLength={255}
            />
          </Field>
          <Field label="YouTube link" htmlFor="live-youtube">
            <Input
              id="live-youtube"
              type="url"
              value={youtubeUrl}
              onChange={(event) => setYoutubeUrl(event.target.value)}
              placeholder="https://www.youtube.com/live/..."
              maxLength={500}
            />
          </Field>
          <Field label="Facebook link" htmlFor="live-facebook">
            <Input
              id="live-facebook"
              type="url"
              value={facebookUrl}
              onChange={(event) => setFacebookUrl(event.target.value)}
              placeholder="https://www.facebook.com/.../videos/..."
              maxLength={500}
            />
          </Field>
          <p className="text-xs text-muted md:col-span-2">
            Add at least one link. YouTube streams are shown on the website; Facebook opens as a link.
          </p>
          <FormActions>
            <Button type="submit" disabled={start.isPending || !title.trim() || !hasLink}>
              {isLive ? 'Update links' : 'Go live'}
            </Button>
            {isLive && (
              <Button type="button" variant="danger" onClick={() => setConfirmEnd(true)} disabled={end.isPending}>
                End livestream
              </Button>
            )}
          </FormActions>
        </form>
      </FormSection>

      {/* Ruling 7: the same question the old browser confirm asked, in the admin's own dialog. */}
      {confirmEnd && (
        <ConfirmDialog
          title="End the livestream?"
          description="The live banner will disappear for everyone."
          confirmLabel="End livestream"
          onCancel={() => setConfirmEnd(false)}
          onConfirm={() => {
            setConfirmEnd(false);
            end.mutate();
          }}
        />
      )}
    </div>
  );
}
