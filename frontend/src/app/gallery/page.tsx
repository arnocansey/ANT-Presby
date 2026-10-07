'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAlbums } from '@/hooks/useApi';

export default function GalleryPage() {
  const [page, setPage] = React.useState(1);
  const { data, isLoading, isError } = useAlbums(page);
  const albums = data?.data ?? [];

  return (
    <div className="container-max space-y-8 py-12 sm:py-16">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Photo Gallery</h1>
        <p className="mt-2 text-sm text-ui-subtle">Photos from our services and events. View them here or download them to keep.</p>
      </div>

      {isLoading ? (
        <p className="text-sm text-ui-subtle">Loading albums...</p>
      ) : isError ? (
        <p className="text-sm text-ui-subtle">Could not load the gallery. Please try again.</p>
      ) : albums.length === 0 ? (
        <p className="text-sm text-ui-subtle">No albums yet.</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {albums.map((album) => (
            <Link
              key={album.id}
              href={`/gallery/${album.id}`}
              className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-950"
            >
              {album.cover_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={album.cover_url} alt="" loading="lazy" className="aspect-square w-full object-cover" />
              ) : (
                <div className="aspect-square w-full bg-gradient-to-br from-sky-600 via-cyan-500 to-amber-400" />
              )}
              <div className="space-y-1 p-4">
                <p className="truncate font-semibold group-hover:text-sky-700 dark:group-hover:text-cyan-300">{album.title}</p>
                <p className="text-xs text-ui-subtle">
                  {album.photo_count} photo{album.photo_count === 1 ? '' : 's'}
                  {album.event_name ? ` · ${album.event_name}` : ''} · {new Date(album.created_at).toLocaleDateString()}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {(page > 1 || data?.hasMore) && (
        <div className="flex gap-3">
          <Button variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            Newer
          </Button>
          <Button variant="outline" disabled={!data?.hasMore} onClick={() => setPage((p) => p + 1)}>
            Older
          </Button>
        </div>
      )}
    </div>
  );
}
