'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowRight, Mic, PlayCircle } from 'lucide-react';
import { useMinistry } from '@/hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type MinistrySermon = {
  id: number;
  title: string;
  speaker?: string;
};

type MinistryData = {
  name: string;
  description?: string;
  sermons?: MinistrySermon[];
};

export default function MinistryDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ? Number(params.id) : 0;
  const { data, isLoading, error } = useMinistry(id);
  const ministry = data as MinistryData | undefined;

  return (
    <div className="container-max py-12 sm:py-16">
      <Card>
        <CardHeader className="space-y-3 border-b border-slate-100 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/70">
          <div className="flex items-center gap-2 text-sm font-medium text-sky-700 dark:text-cyan-300">
            <PlayCircle className="h-4 w-4" />
            Ministry
          </div>
          <CardTitle className="text-2xl tracking-tight sm:text-3xl">
            {ministry?.name || 'Ministry'}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6 p-6 sm:p-8">
          {isLoading && (
            <div className="space-y-4">
              <div className="h-6 w-2/3 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
              <div className="h-20 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
            </div>
          )}

          {!isLoading && error && (
            <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
              Failed to load ministry.
            </p>
          )}

          {!isLoading && !error && !ministry && (
            <p className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-ui-subtle dark:border-slate-700">
              Ministry not found.
            </p>
          )}

          {ministry && (
            <div className="space-y-6">
              {ministry.description && (
                <p className="leading-relaxed text-ui-muted">{ministry.description}</p>
              )}

              <section aria-labelledby="ministry-sermons">
                <h2 id="ministry-sermons" className="text-lg font-bold tracking-tight">
                  Sermons
                </h2>

                {!ministry.sermons || ministry.sermons.length === 0 ? (
                  <p className="mt-3 rounded-lg border border-dashed border-slate-300 p-4 text-sm text-ui-subtle dark:border-slate-700">
                    No sermons found for this ministry.
                  </p>
                ) : (
                  <ul className="mt-3 space-y-3">
                    {ministry.sermons.map((sermon) => (
                      <li
                        key={sermon.id}
                        className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700 dark:bg-slate-950"
                      >
                        <div>
                          <p className="font-semibold">{sermon.title}</p>
                          {sermon.speaker && (
                            <p className="mt-1 flex items-center gap-1 text-sm text-ui-subtle">
                              <Mic className="h-3.5 w-3.5" />
                              {sermon.speaker}
                            </p>
                          )}
                        </div>
                        <Link
                          href={`/sermons/${sermon.id}`}
                          className="inline-flex items-center text-sm font-semibold text-sky-700 hover:text-sky-800 dark:text-cyan-300 dark:hover:text-cyan-200"
                        >
                          Open sermon <ArrowRight className="ml-1 h-4 w-4" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
