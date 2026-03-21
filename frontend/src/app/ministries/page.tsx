'use client';

import Link from 'next/link';
import { Heart, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMinistries } from '@/hooks/useApi';
import { useAuthStore } from '@/lib/store';

export default function MinistriesPage() {
  const { data, isLoading, error } = useMinistries();
  const { user } = useAuthStore();
  const ministries = (data ?? []) as any[];
  const isAdmin = user?.role === 'admin';

  return (
    <div className="container-max py-10">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-600 dark:text-amber-300">
            Ministries
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 dark:text-white">
            Discover teams and communities where you can grow
          </h1>
          <p className="mt-3 text-ui-subtle">
            Explore the real ministry list and open each one to see related sermon content and connected activity.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {isAdmin && (
            <Button asChild className="rounded-full bg-amber-500 text-slate-950 hover:bg-amber-400">
              <Link href="/admin/ministries">Manage Ministries</Link>
            </Button>
          )}
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/contact">Contact a Ministry</Link>
          </Button>
        </div>
      </div>

      {isLoading && <MinistryState text="Loading ministries..." />}
      {!isLoading && error && <MinistryState text="Failed to load ministries." />}
      {!isLoading && !error && ministries.length === 0 && (
        <MinistryState text="No ministries available right now." />
      )}

      {!isLoading && !error && ministries.length > 0 && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {ministries.map((ministry: any, index: number) => (
            <div
              key={ministry.id}
              className="group h-full rounded-[1.5rem] border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800 dark:bg-slate-950"
            >
              <div className={`h-36 rounded-t-[1.5rem] ${index % 3 === 0 ? 'bg-gradient-to-br from-amber-500 to-orange-600' : index % 3 === 1 ? 'bg-gradient-to-br from-sky-600 to-cyan-600' : 'bg-gradient-to-br from-purple-600 to-fuchsia-600'}`} />
              <div className="space-y-4 p-6">
                <div className="inline-flex rounded-2xl bg-sky-100 p-3 text-sky-700 dark:bg-cyan-950/50 dark:text-cyan-300">
                  <Heart className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-slate-950 dark:text-white">
                    {ministry.name}
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-ui-muted">
                    {ministry.description || 'Open this ministry to explore its connected sermons and content.'}
                  </p>
                </div>
                <Button asChild variant="outline" className="rounded-full">
                  <Link href={`/ministries/${ministry.id}`}>View Ministry</Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MinistryState({ text }: { text: string }) {
  return (
    <div className="rounded-[1.4rem] border border-dashed border-slate-300 bg-white p-10 text-center text-ui-subtle dark:border-slate-700 dark:bg-slate-950">
      <Users className="mx-auto mb-4 h-10 w-10 opacity-30" />
      <p>{text}</p>
    </div>
  );
}
