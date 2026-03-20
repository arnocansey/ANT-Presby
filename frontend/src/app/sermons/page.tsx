'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Mic, PlayCircle } from 'lucide-react';
import { useSermons } from '@/hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type SermonItem = {
  id: number;
  title: string;
  speaker?: string;
  description?: string;
  created_at?: string;
};

export default function SermonsPage() {
  const { data, isLoading, error } = useSermons(1, 12);
  const sermons = (data?.data ?? []) as SermonItem[];

  return (
    <div className="container-max py-12 sm:py-16">
      <div className="mb-8 sm:mb-10">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Sermons</h1>
        <p className="mt-3 max-w-2xl text-ui-subtle">
          Watch and revisit messages that strengthen your faith journey.
        </p>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="p-6">
              <div className="h-5 w-2/3 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
              <div className="mt-4 h-14 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
              <div className="mt-6 h-9 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
            </Card>
          ))}
        </div>
      )}

      {!isLoading && error && (
        <Card className="border-red-200 bg-red-50/70 dark:border-red-900 dark:bg-red-950/30">
          <CardContent className="p-6 text-sm font-medium text-red-700 dark:text-red-300">
            Failed to load sermons.
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && sermons.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center text-ui-subtle">
            No sermons available yet.
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && sermons.length > 0 && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sermons.map((sermon) => (
            <Card
              key={sermon.id}
              className="group h-full transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              <CardHeader className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-sky-700 dark:text-cyan-300">
                  <PlayCircle className="h-4 w-4" />
                  Sermon
                </div>
                <CardTitle className="text-xl tracking-tight">{sermon.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {sermon.description && (
                  <p className="text-sm leading-relaxed text-ui-muted">{sermon.description}</p>
                )}
                {sermon.speaker && (
                  <p className="flex items-center gap-2 text-sm text-ui-subtle">
                    <Mic className="h-4 w-4" />
                    {sermon.speaker}
                  </p>
                )}
                <Button
                  asChild
                  variant="outline"
                  className="group-hover:border-cyan-400 group-hover:text-sky-700 dark:group-hover:text-cyan-300"
                >
                  <Link href={`/sermons/${sermon.id}`}>
                    Watch <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
