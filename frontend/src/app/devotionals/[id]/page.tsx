'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import DevotionalBody from '@/components/devotionals/DevotionalBody';
import { useDevotional } from '@/hooks/useApi';

export default function DevotionalDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params?.id);
  const devotionalId = Number.isInteger(id) && id > 0 ? id : undefined;
  const { data, isLoading, error } = useDevotional(devotionalId);

  return (
    <div className="container-max space-y-6 py-12 sm:py-16">
      <Link href="/devotionals" className="text-sm font-semibold text-sky-700 dark:text-cyan-300">
        ← All devotionals
      </Link>
      {!devotionalId || error ? (
        <p className="text-ui-subtle">This devotional could not be found.</p>
      ) : isLoading || !data ? (
        <p className="text-ui-subtle">Loading...</p>
      ) : (
        <DevotionalBody devotional={data} />
      )}
    </div>
  );
}
