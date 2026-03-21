'use client';

import React from 'react';
import Link from 'next/link';
import { BookOpen, Clock, Play, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useSermons } from '@/hooks/useApi';

const sermonGradients = [
  'from-indigo-600 to-purple-600',
  'from-teal-600 to-cyan-600',
  'from-rose-600 to-pink-600',
  'from-orange-600 to-amber-600',
];

export default function SermonsPage() {
  const { data, isLoading, error } = useSermons(1, 24);
  const [search, setSearch] = React.useState('');
  const sermons = (data?.data ?? []) as any[];

  const speakers = React.useMemo(() => {
    const values = Array.from(
      new Set(sermons.map((sermon) => sermon?.speaker).filter(Boolean))
    ) as string[];
    return ['All Speakers', ...values];
  }, [sermons]);

  const [selectedSpeaker, setSelectedSpeaker] = React.useState('All Speakers');

  const filtered = sermons.filter((sermon) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      String(sermon?.title || '').toLowerCase().includes(q) ||
      String(sermon?.speaker || '').toLowerCase().includes(q) ||
      String(sermon?.description || '').toLowerCase().includes(q);
    const matchesSpeaker =
      selectedSpeaker === 'All Speakers' || sermon?.speaker === selectedSpeaker;
    return matchesSearch && matchesSpeaker;
  });

  return (
    <div className="container-max py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-950 dark:text-white">Sermon Library</h1>
        <p className="mt-2 text-ui-subtle">
          Watch and revisit messages from the real ANT PRESS sermon collection.
        </p>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ui-subtle" />
          <Input
            className="h-12 rounded-xl border-slate-200 bg-white pl-10 dark:border-slate-800 dark:bg-slate-950"
            placeholder="Search sermons, speakers, and descriptions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
          value={selectedSpeaker}
          onChange={(e) => setSelectedSpeaker(e.target.value)}
        >
          {speakers.map((speaker) => (
            <option key={speaker} value={speaker}>
              {speaker}
            </option>
          ))}
        </select>
      </div>

      {isLoading && <StatusState text="Loading sermons..." />}
      {!isLoading && error && <StatusState text="Failed to load sermons." />}
      {!isLoading && !error && filtered.length === 0 && (
        <StatusState text="No sermons match your search right now." />
      )}

      {!isLoading && !error && filtered.length > 0 && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {filtered.map((sermon, index) => (
            <Link key={sermon.id} href={`/sermons/${sermon.id}`}>
              <div className="group cursor-pointer overflow-hidden rounded-[1.4rem] border border-slate-200 bg-white transition-colors hover:border-sky-300 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-cyan-500/40">
                <div className={`relative flex h-40 items-center justify-center bg-gradient-to-br ${sermonGradients[index % sermonGradients.length]}`}>
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 transition-transform group-hover:scale-110">
                    <Play className="ml-1 h-7 w-7 fill-white text-white" />
                  </div>
                  <div className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-black/35 px-2 py-1 text-xs text-white">
                    <Clock className="h-3 w-3" />
                    Message
                  </div>
                </div>
                <div className="space-y-2 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700 dark:text-cyan-300">
                    Sermon
                  </p>
                  <h3 className="line-clamp-2 text-lg font-bold text-slate-950 dark:text-white">
                    {sermon.title}
                  </h3>
                  <p className="text-sm text-ui-subtle">{sermon.speaker || 'ANT PRESS'}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusState({ text }: { text: string }) {
  return (
    <div className="rounded-[1.4rem] border border-dashed border-slate-300 bg-white p-10 text-center text-ui-subtle dark:border-slate-700 dark:bg-slate-950">
      <BookOpen className="mx-auto mb-4 h-10 w-10 opacity-30" />
      <p>{text}</p>
    </div>
  );
}
