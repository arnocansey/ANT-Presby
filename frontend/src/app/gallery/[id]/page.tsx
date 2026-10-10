'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { Download, ExternalLink, ImageIcon, Share2 } from 'lucide-react';
import PhotoViewer from '@/components/gallery/PhotoViewer';
import BackLink from '@/components/site/BackLink';
import SkeletonGrid from '@/components/site/SkeletonGrid';
import { Button } from '@/components/ui/button';
import EmptyState from '@/components/ui/empty-state';
import { useAlbum, useAlbumDownload } from '@/hooks/useApi';

export default function AlbumPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params?.id) || undefined;
  const { data: album, isLoading, error } = useAlbum(id);
  const download = useAlbumDownload();
  const [viewing, setViewing] = React.useState<number | null>(null);
  const closeViewer = React.useCallback(() => setViewing(null), []);
  const notFound = !error || (error as any)?.response?.status === 404;

  const downloadAll = () => {
    if (!id) return;
    download.mutate(id, {
      onSuccess: (url) => {
        if (url) window.location.href = url;
      },
    });
  };

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied');
    } catch {
      toast.error('Could not copy the link');
    }
  };

  return (
    <div className="container-max space-y-8 py-10 sm:py-12">
      <BackLink href="/gallery" label="Back to the gallery" />

      {isLoading ? (
        <SkeletonGrid count={8} className="grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4" />
      ) : !album ? (
        notFound ? (
          <EmptyState
            icon={ImageIcon}
            title="Album not found"
            message="It may be unpublished or removed."
            action={
              <Button asChild variant="secondary">
                <Link href="/gallery">All albums</Link>
              </Button>
            }
          />
        ) : (
          <EmptyState icon={ImageIcon} title="This album couldn't load right now" message="Please try again in a moment." />
        )
      ) : (
        <>
          <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0 space-y-2">
              <h1 className="break-words text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{album.title}</h1>
              {album.description && <p className="max-w-2xl text-foreground/85">{album.description}</p>}
              <p className="text-sm text-muted">
                {album.photo_count} photo{album.photo_count === 1 ? '' : 's'}
                {album.event_id && album.event_name ? (
                  <>
                    {' · '}
                    <Link href={`/events/${album.event_id}`} className="text-link hover:underline">
                      {album.event_name}
                    </Link>
                  </>
                ) : null}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={downloadAll} disabled={album.photos.length === 0} loading={download.isPending}>
                {!download.isPending && <Download className="h-4 w-4" aria-hidden="true" />}
                {download.isPending ? 'Preparing...' : 'Download all'}
              </Button>
              {album.external_url && (
                <Button asChild variant="secondary">
                  <a href={album.external_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" aria-hidden="true" />
                    Open folder
                  </a>
                </Button>
              )}
              <Button variant="secondary" onClick={share}>
                <Share2 className="h-4 w-4" aria-hidden="true" />
                Share
              </Button>
            </div>
          </header>

          {album.photos.length === 0 ? (
            <EmptyState icon={ImageIcon} title="No photos yet" message="Photos will appear here once they are uploaded." />
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {album.photos.map((photo, index) => (
                <div key={photo.id} className="group relative overflow-hidden rounded-lg bg-surface">
                  <button
                    type="button"
                    onClick={() => setViewing(index)}
                    className="block w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                    aria-label={`Open photo ${index + 1}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo.thumb_url} alt="" loading="lazy" className="aspect-square w-full object-cover" />
                  </button>
                  {/* Photo overlay: black/white allowed on photo surfaces. */}
                  <a
                    href={photo.download_url}
                    aria-label={`Download photo ${index + 1}`}
                    className="absolute bottom-2 right-2 flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-white opacity-90 hover:bg-black/80 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:opacity-0 sm:group-hover:opacity-100"
                  >
                    <Download className="h-4 w-4" aria-hidden="true" />
                  </a>
                </div>
              ))}
            </div>
          )}

          {viewing !== null && (
            <PhotoViewer photos={album.photos} index={viewing} title={album.title} onIndexChange={setViewing} onClose={closeViewer} />
          )}
        </>
      )}
    </div>
  );
}
