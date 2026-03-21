'use client';

import Link from 'next/link';
import { ArrowLeft, Mic, PlayCircle } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useMinistry } from '@/hooks/useApi';

export default function MinistryDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ? Number(params.id) : 0;
  const { data, isLoading, error } = useMinistry(id);
  const ministry = data as any;

  return (
    <div className="container-max py-10">
      <Link
        href="/ministries"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-sky-700 hover:text-sky-800 dark:text-cyan-300 dark:hover:text-cyan-200"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to ministries
      </Link>

      {isLoading && <DetailState text="Loading ministry..." />}
      {!isLoading && error && <DetailState text="Failed to load ministry." />}
      {!isLoading && !error && !ministry && <DetailState text="Ministry not found." />}

      {ministry && (
        <div className="overflow-hidden rounded-[1.8rem] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="h-52 bg-gradient-to-br from-sky-700 via-cyan-600 to-blue-600 sm:h-72" />
          <div className="space-y-6 p-6 sm:p-10">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-700 dark:text-cyan-300">
                Ministry
              </p>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-4xl">
                {ministry.name || 'Ministry'}
              </h1>
              {ministry.description && (
                <p className="mt-4 max-w-3xl leading-relaxed text-ui-muted">{ministry.description}</p>
              )}
            </div>

            <section aria-labelledby="ministry-sermons">
              <h2
                id="ministry-sermons"
                className="text-2xl font-black tracking-tight text-slate-950 dark:text-white"
              >
                Sermons
              </h2>

              {!ministry.sermons || ministry.sermons.length === 0 ? (
                <DetailState text="No sermons found for this ministry." />
              ) : (
                <div className="mt-4 grid gap-4">
                  {ministry.sermons.map((sermon: any, index: number) => (
                    <div
                      key={sermon.id}
                      className="flex flex-col gap-4 rounded-[1.4rem] border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-950"
                    >
                      <div className="flex items-start gap-4">
                        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${index % 2 === 0 ? 'bg-sky-100 text-sky-700 dark:bg-cyan-950/50 dark:text-cyan-300' : 'bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300'}`}>
                          <PlayCircle className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-950 dark:text-white">{sermon.title}</p>
                          {sermon.speaker && (
                            <p className="mt-2 inline-flex items-center gap-1 text-sm text-ui-subtle">
                              <Mic className="h-3.5 w-3.5" />
                              {sermon.speaker}
                            </p>
                          )}
                        </div>
                      </div>
                      <Link
                        href={`/sermons/${sermon.id}`}
                        className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-sky-300 hover:text-sky-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-cyan-500/40 dark:hover:text-cyan-300"
                      >
                        Open sermon
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailState({ text }: { text: string }) {
  return (
    <div className="rounded-[1.4rem] border border-dashed border-slate-300 bg-white p-10 text-center text-ui-subtle dark:border-slate-700 dark:bg-slate-950">
      <p>{text}</p>
    </div>
  );
}
