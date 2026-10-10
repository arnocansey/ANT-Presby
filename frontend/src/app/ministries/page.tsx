'use client';

import Link from 'next/link';
import { Church } from 'lucide-react';
import SkeletonGrid from '@/components/site/SkeletonGrid';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import EmptyState from '@/components/ui/empty-state';
import PageHeader from '@/components/ui/page-header';
import { useMinistries } from '@/hooks/useApi';
import { useAuthStore } from '@/lib/store';

export default function MinistriesPage() {
  const { data, isLoading, error } = useMinistries();
  const { user } = useAuthStore();
  const ministries = (data ?? []) as any[];
  const isAdmin = user?.role === 'admin';

  return (
    <div className="container-max space-y-8 py-10 sm:py-12">
      <PageHeader
        eyebrow="Ministries"
        title="Find a place to serve and belong"
        description="Explore our ministries and open each one to see its sermons and activity."
        actions={
          <>
            {isAdmin && (
              <Button asChild>
                <Link href="/admin/ministries">Manage Ministries</Link>
              </Button>
            )}
            <Button asChild variant="secondary">
              <Link href="/contact">Contact a Ministry</Link>
            </Button>
          </>
        }
      />

      {isLoading ? (
        <SkeletonGrid count={6} className="sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3" />
      ) : error ? (
        <EmptyState icon={Church} title="Ministries couldn't load right now" message="Please try again in a moment." />
      ) : ministries.length === 0 ? (
        <EmptyState icon={Church} title="No ministries listed yet" message="Ministries will appear here once they are added." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ministries.map((ministry: any) => (
            <Card key={ministry.id} className="flex h-full flex-col">
              <CardContent className="flex flex-1 flex-col gap-4 p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Church className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="break-words text-lg font-semibold text-foreground">{ministry.name}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-foreground/85">
                    {ministry.description || 'Open this ministry to explore its connected sermons and content.'}
                  </p>
                </div>
                <Button asChild variant="secondary" className="mt-auto self-start">
                  <Link href={`/ministries/${ministry.id}`}>View Ministry</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
