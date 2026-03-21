'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Mic, PlayCircle } from 'lucide-react';
import { useSermon } from '@/hooks/useApi';

export default function SermonDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ? Number(params.id) : 0;
  const { data, isLoading, error } = useSermon(id);

  return (
    <div className="container-max py-10">
      <Link
        href="/sermons"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-sky-700 hover:text-sky-800 dark:text-cyan-300 dark:hover:text-cyan-200"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to sermons
      </Link>

      {isLoading && <DetailState text="Loading sermon..." />}
      {!isLoading && error && <DetailState text="Failed to load sermon." />}
      {!isLoading && !error && !data && <DetailState text="Sermon not found." />}

      {data && (
        <article className="overflow-hidden rounded-[1.8rem] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-600 px-6 py-12 text-white sm:px-10">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-fuchsia-100">
              Sermon Message
            </p>
            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">{data.title}</h1>
          </div>

          <div className="space-y-6 p-6 sm:p-10">
            <div className="overflow-hidden rounded-[1.4rem] border border-slate-200 bg-black shadow-sm dark:border-slate-700">
              <div className="aspect-video">
                {data.video_url ? (
                  <iframe
                    title={data.title}
                    src={data.video_url}
                    className="h-full w-full"
                    allowFullScreen
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-slate-950 text-slate-300">
                    <div className="text-center">
                      <PlayCircle className="mx-auto mb-3 h-12 w-12 opacity-50" />
                      <p>No video available for this sermon yet.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-4">
                {data.speaker && (
                  <p className="inline-flex items-center gap-2 text-sm font-medium text-ui-muted">
                    <Mic className="h-4 w-4 text-sky-700 dark:text-cyan-300" />
                    {data.speaker}
                  </p>
                )}
                <p className="leading-relaxed text-ui-muted">
                  {data.description || 'This sermon is available in the ANT PRESS library and can be revisited here whenever you need it.'}
                </p>
              </div>

              <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900">
                <h2 className="text-xl font-bold text-slate-950 dark:text-white">Keep Exploring</h2>
                <p className="mt-3 text-sm leading-relaxed text-ui-muted">
                  Browse the wider sermon library or continue into connected ministry content.
                </p>
                <div className="mt-5 flex flex-col gap-3">
                  <Link
                    href="/sermons"
                    className="inline-flex items-center justify-center rounded-full bg-amber-500 px-4 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-amber-400"
                  >
                    More Sermons
                  </Link>
                  <Link
                    href="/ministries"
                    className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-sky-300 hover:text-sky-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-cyan-500/40 dark:hover:text-cyan-300"
                  >
                    Explore Ministries
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </article>
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
