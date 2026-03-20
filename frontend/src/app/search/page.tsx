'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import { useGlobalSearch } from '@/hooks/useApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = React.useState(initialQuery);
  const { data, isLoading } = useGlobalSearch(initialQuery, 1, 12);

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = query.trim();
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  const sermons = data?.sermons || [];
  const events = data?.events || [];

  return (
    <div className="container-max py-12 sm:py-16">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Search</h1>
        <p className="mt-2 text-ui-subtle">Find sermons and events in one place.</p>
      </div>

      <form onSubmit={onSubmit} className="mb-8 flex gap-3">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search sermons, speakers, events..."
        />
        <Button type="submit">
          <Search className="mr-2 h-4 w-4" />
          Search
        </Button>
      </form>

      {initialQuery.trim().length < 2 && (
        <Card className="border-dashed">
          <CardContent className="p-6 text-ui-subtle">
            Enter at least 2 characters to search.
          </CardContent>
        </Card>
      )}

      {initialQuery.trim().length >= 2 && isLoading && (
        <Card>
          <CardContent className="p-6 text-ui-subtle">Searching...</CardContent>
        </Card>
      )}

      {initialQuery.trim().length >= 2 && !isLoading && (
        <div className="space-y-8">
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xl font-bold tracking-tight">Sermons</h2>
              <span className="text-sm text-ui-subtle">{sermons.length} results</span>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {sermons.map((sermon: any) => (
                <Link key={sermon.id} href={`/sermons/${sermon.id}`}>
                  <Card className="h-full transition-all hover:-translate-y-0.5 hover:shadow-md">
                    <CardHeader>
                      <CardTitle className="text-lg">{sermon.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-ui-subtle">{sermon.speaker}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
              {sermons.length === 0 && (
                <Card className="border-dashed">
                  <CardContent className="p-6 text-sm text-ui-subtle">No sermons found.</CardContent>
                </Card>
              )}
            </div>
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xl font-bold tracking-tight">Events</h2>
              <span className="text-sm text-ui-subtle">{events.length} results</span>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {events.map((event: any) => (
                <Link key={event.id} href={`/events/${event.id}`}>
                  <Card className="h-full transition-all hover:-translate-y-0.5 hover:shadow-md">
                    <CardHeader>
                      <CardTitle className="text-lg">{event.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-ui-subtle">{event.location}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
              {events.length === 0 && (
                <Card className="border-dashed">
                  <CardContent className="p-6 text-sm text-ui-subtle">No events found.</CardContent>
                </Card>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="container-max py-12 text-sm text-ui-subtle">Loading search...</div>}>
      <SearchContent />
    </Suspense>
  );
}
