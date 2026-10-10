'use client';

import React from 'react';
import Link from 'next/link';
import { ImageIcon } from 'lucide-react';
import MediaPlaceholder from '@/components/site/MediaPlaceholder';
import SkeletonGrid from '@/components/site/SkeletonGrid';
import { Button } from '@/components/ui/button';
import EmptyState from '@/components/ui/empty-state';
import PageHeader from '@/components/ui/page-header';
import { useAlbums } from '@/hooks/useApi';

export default function GalleryPage() {
  const [page, setPage] = React.useState(1);
  const { data, isLoading, isError } = useAlbums(page);
  const albums = data?.data ?? [];

  return (
    <div className="container-max space-y-8 py-10 sm:py-12">
      <PageHeader
        title="Photo gallery"
        description="Photos from our services and events. View them here or download them to keep."
      />

      {isLoading ? (
        <SkeletonGrid count={6} className="sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3" />
      ) : isError ? (
        <EmptyState icon={ImageIcon} title="The gallery couldn't load right now" message="Please try again in a moment." />
      ) : albums.length === 0 ? (
        <EmptyState icon={ImageIcon} title="No albums yet" message="Photos from services and events will appear here." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {albums.map((album) => (
            <Link
              key={album.id}
              href={`/gallery/${album.id}`}
              className="group overflow-hidden rounded-card border border-border bg-card transition-colors hover:border-primary/40"
            >
              {album.cover_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={album.cover_url} alt="" loading="lazy" className="aspect-square w-full object-cover" />
              ) : (
                <MediaPlaceholder icon={ImageIcon} className="aspect-square w-full" />
              )}
              <div className="space-y-1 p-4">
                <p className="truncate font-semibold text-foreground group-hover:underline">{album.title}</p>
                <p className="text-xs text-muted">
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
          <Button variant="secondary" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            Newer
          </Button>
          <Button variant="secondary" disabled={!data?.hasMore} onClick={() => setPage((p) => p + 1)}>
            Older
          </Button>
        </div>
      )}
    </div>
  );
}
