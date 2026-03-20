'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Heart } from 'lucide-react';
import { useMinistries } from '@/hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type Ministry = {
  id: number;
  name: string;
  description?: string;
};

export default function MinistriesPage() {
  const { data, isLoading, error } = useMinistries();
  const ministries = (data ?? []) as Ministry[];

  return (
    <div className="container-max py-12 sm:py-16">
      <div className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Our Ministries</h1>
          <p className="mt-3 max-w-2xl text-ui-subtle">
            Discover teams and communities where you can serve, grow, and connect.
          </p>
        </div>
        <Button asChild variant="outline" className="w-full sm:w-auto">
          <Link href="/contact">Contact a Ministry</Link>
        </Button>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="p-6">
              <div className="h-5 w-2/3 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
              <div className="mt-4 h-16 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
              <div className="mt-6 h-9 w-28 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
            </Card>
          ))}
        </div>
      )}

      {!isLoading && error && (
        <Card className="border-red-200 bg-red-50/70 dark:border-red-900 dark:bg-red-950/30">
          <CardContent className="p-6 text-sm font-medium text-red-700 dark:text-red-300">
            Failed to load ministries.
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && ministries.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center text-ui-subtle">
            No ministries available right now.
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && ministries.length > 0 && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {ministries.map((ministry) => (
            <Card
              key={ministry.id}
              className="group h-full transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              <CardHeader className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-sky-700 dark:text-cyan-300">
                  <Heart className="h-4 w-4" />
                  Ministry
                </div>
                <CardTitle className="text-xl tracking-tight">{ministry.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {ministry.description && (
                  <p className="text-sm leading-relaxed text-ui-muted">{ministry.description}</p>
                )}
                <Button
                  asChild
                  variant="outline"
                  className="group-hover:border-cyan-400 group-hover:text-sky-700 dark:group-hover:text-cyan-300"
                >
                  <Link href={`/ministries/${ministry.id}`}>
                    View Sermons <ArrowRight className="ml-2 h-4 w-4" />
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
