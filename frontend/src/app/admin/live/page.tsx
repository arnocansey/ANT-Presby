'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useEndLive, useLiveStream, useStartLive } from '@/hooks/useApi';
import { formatDateTime } from '@/lib/utils';

export default function AdminLivePage() {
  const { data: live, isLoading } = useLiveStream();
  const start = useStartLive();
  const end = useEndLive();

  const [title, setTitle] = React.useState('');
  const [youtubeUrl, setYoutubeUrl] = React.useState('');
  const [facebookUrl, setFacebookUrl] = React.useState('');
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

  const onEnd = () => {
    if (!window.confirm('End the livestream? The live banner will disappear for everyone.')) return;
    end.mutate();
  };

  return (
    <div className="container-max space-y-6 py-12">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Livestream</h1>
        <p className="mt-2 text-sm text-ui-subtle">
          Paste the YouTube and/or Facebook link and go live. Everyone is notified once when you go live; updating the links
          while live does not notify again.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Status</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-ui-subtle">Loading...</p>
          ) : isLive ? (
            <div className="space-y-1">
              <p className="flex items-center gap-2 font-semibold text-red-600">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-600" aria-hidden="true" />
                Live now: {live?.title}
              </p>
              {live?.started_at && <p className="text-sm text-ui-subtle">Since {formatDateTime(live.started_at)}</p>}
              <Link href="/live" className="text-sm font-medium text-sky-700 hover:underline dark:text-cyan-300">
                Open the live page
              </Link>
            </div>
          ) : (
            <p className="text-sm text-ui-subtle">Not live.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{isLive ? 'Update the livestream' : 'Go live'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="live-title">Title</Label>
              <Input
                id="live-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Sunday Worship Service"
                required
                maxLength={255}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="live-youtube">YouTube link</Label>
              <Input
                id="live-youtube"
                type="url"
                value={youtubeUrl}
                onChange={(event) => setYoutubeUrl(event.target.value)}
                placeholder="https://www.youtube.com/live/..."
                maxLength={500}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="live-facebook">Facebook link</Label>
              <Input
                id="live-facebook"
                type="url"
                value={facebookUrl}
                onChange={(event) => setFacebookUrl(event.target.value)}
                placeholder="https://www.facebook.com/.../videos/..."
                maxLength={500}
              />
            </div>
            <p className="text-xs text-ui-subtle">Add at least one link. YouTube streams are shown on the website; Facebook opens as a link.</p>
            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={start.isPending || !title.trim() || !hasLink}>
                {isLive ? 'Update links' : 'Go live'}
              </Button>
              {isLive && (
                <Button type="button" variant="destructive" onClick={onEnd} disabled={end.isPending}>
                  End livestream
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
