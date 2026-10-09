'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Radio } from 'lucide-react';
import { useLiveStream } from '@/hooks/useApi';

const POLL_INTERVAL_MS = 60_000;

export default function LiveBanner() {
  const pathname = usePathname();
  const { data } = useLiveStream(POLL_INTERVAL_MS);

  if (!data?.is_live || pathname === '/live') return null;

  return (
    <Link
      href="/live"
      className="flex items-center justify-center gap-2 bg-danger-solid px-4 py-2 text-sm font-semibold text-danger-solid-foreground transition-colors hover:bg-danger-solid/90"
    >
      <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-75" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-current" />
      </span>
      <Radio className="h-4 w-4" aria-hidden="true" />
      <span className="truncate">We&apos;re live: {data.title || 'Join us now'}</span>
    </Link>
  );
}
