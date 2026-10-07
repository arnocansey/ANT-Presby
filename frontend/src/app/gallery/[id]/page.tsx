'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { ArrowLeft, Download, ExternalLink, Share2 } from 'lucide-react';
import PhotoViewer from '@/components/gallery/PhotoViewer';
import { Button } from '@/components/ui/button';
import { useAlbum, useAlbumDownload } from '@/hooks/useApi';

export default function AlbumPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params?.id) || undefined;
  const { data: album, isLoading } = useAlbum(id);
  const download = useAlbumDownload();
  const [viewing, setViewing] = React.useState<number | null>(null);
  const closeViewer = React.useCallback(() => setViewing(null), []);

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
    <div className="container-max space-y-8 py-10">
      <Link
        href="/gallery"
        className="inline-flex items-center gap-2 text-sm font-medium text-sky-700 hover:text-sky-800 dark:text-cyan-300 dark:hover:text-cyan-200"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to the gallery
      </Link>

      {isLoading ? (
        <p className="text-sm text-ui-subtle">Loading album...</p>
      ) : !album ? (
        <p className="text-sm text-ui-subtle">Album not found.</p>
      ) : (
        <>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{album.title}</h1>
              {album.description && <p className="max-w-2xl text-sm text-ui-muted">{album.description}</p>}
              <p className="text-xs text-ui-subtle">
                {album.photo_count} photo{album.photo_count === 1 ? '' : 's'}
                {album.event_id && album.event_name ? (
                  <>
                    {' · '}
                    <Link href={`/events/${album.event_id}`} className="text-sky-700 hover:underline dark:text-cyan-300">
                      {album.event_name}
                    </Link>
                  </>
                ) : null}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={downloadAll} disabled={download.isPending || album.photos.length === 0}>
                <Download className="mr-2 h-4 w-4" />
                {download.isPending ? 'Preparing...' : 'Download all'}
              </Button>
              {album.external_url && (
                <Button asChild variant="outline">
                  <a href={album.external_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open folder
                  </a>
                </Button>
              )}
              <Button variant="outline" onClick={share}>
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
            </div>
          </div>

          {album.photos.length === 0 ? (
            <p className="text-sm text-ui-subtle">No photos yet.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {album.photos.map((photo, index) => (
                <div key={photo.id} className="group relative overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-900">
                  <button type="button" onClick={() => setViewing(index)} className="block w-full" aria-label={`Open photo ${index + 1}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo.thumb_url} alt="" loading="lazy" className="aspect-square w-full object-cover" />
                  </button>
                  <a
                    href={photo.download_url}
                    aria-label={`Download photo ${index + 1}`}
                    className="absolute bottom-2 right-2 rounded-full bg-black/60 p-2 text-white opacity-90 hover:bg-black/80 sm:opacity-0 sm:group-hover:opacity-100"
                  >
                    <Download className="h-4 w-4" />
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
