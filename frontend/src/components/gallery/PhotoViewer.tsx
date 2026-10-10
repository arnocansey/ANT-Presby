'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, Download, X } from 'lucide-react';
import type { AlbumPhoto } from '@/hooks/useApi';

type PhotoViewerProps = {
  photos: AlbumPhoto[];
  index: number;
  title: string;
  onIndexChange: (index: number) => void;
  onClose: () => void;
};

// Full-size viewer: arrow keys move between photos, Escape closes.
export default function PhotoViewer({ photos, index, title, onIndexChange, onClose }: PhotoViewerProps) {
  const count = photos.length;
  const photo = photos[index];

  const go = React.useCallback((step: number) => onIndexChange((index + step + count) % count), [index, count, onIndexChange]);

  React.useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') go(1);
      else if (event.key === 'ArrowLeft') go(-1);
      else if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [go, onClose]);

  if (!photo) return null;

  const stop = (event: React.MouseEvent) => event.stopPropagation();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${title}, photo ${index + 1} of ${count}`}
      className="fixed inset-0 z-50 flex flex-col bg-black/95 text-white"
      onClick={onClose}
    >
      <div className="flex items-center justify-between gap-3 p-4" onClick={stop}>
        <p className="text-sm text-white/80">
          {index + 1} / {count}
        </p>
        <div className="flex items-center gap-2">
          <a
            href={photo.download_url}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm font-medium hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Download
          </a>
          <button type="button" onClick={onClose} aria-label="Close" className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-6">
        {count > 1 && (
          <button
            type="button"
            aria-label="Previous photo"
            onClick={(event) => {
              stop(event);
              go(-1);
            }}
            className="absolute left-2 rounded-full bg-white/10 p-3 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:left-4"
          >
            <ChevronLeft className="h-6 w-6" aria-hidden="true" />
          </button>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo.url} alt={`${title}, photo ${index + 1}`} className="max-h-full max-w-full object-contain" onClick={stop} />
        {count > 1 && (
          <button
            type="button"
            aria-label="Next photo"
            onClick={(event) => {
              stop(event);
              go(1);
            }}
            className="absolute right-2 rounded-full bg-white/10 p-3 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:right-4"
          >
            <ChevronRight className="h-6 w-6" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}
