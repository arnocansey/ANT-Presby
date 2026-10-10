'use client';

import React from 'react';
import Link from 'next/link';
import { Users, UsersRound } from 'lucide-react';
import SkeletonGrid from '@/components/site/SkeletonGrid';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import EmptyState from '@/components/ui/empty-state';
import PageHeader from '@/components/ui/page-header';
import { useGroups, useJoinGroup, type GroupSummary } from '@/hooks/useApi';
import { isGroupFull, meetingLine } from '@/lib/groups';
import { useAuthStore } from '@/lib/store';

function GroupCard({ group, signedIn }: { group: GroupSummary; signedIn: boolean }) {
  const join = useJoinGroup();
  const leaders = group.leaders.map((leader) => `${leader.first_name} ${leader.last_name}`.trim()).join(', ');

  const action = () => {
    if (!signedIn) {
      return (
        <Button asChild variant="secondary" size="sm">
          <Link href={`/login?next=${encodeURIComponent('/groups')}`}>Sign in to join</Link>
        </Button>
      );
    }
    if (group.my_status === 'active') {
      return (
        <Button asChild size="sm" variant="secondary">
          <Link href={`/groups/${group.id}`}>Open group</Link>
        </Button>
      );
    }
    if (group.my_status === 'pending') {
      return <Badge tone="warning">Request pending</Badge>;
    }
    if (isGroupFull(group)) {
      return <Badge tone="neutral">Group is full</Badge>;
    }
    return (
      <Button size="sm" loading={join.isPending} onClick={() => join.mutate(group.id)}>
        Ask to join
      </Button>
    );
  };

  return (
    <Card className="flex h-full flex-col">
      <CardContent className="flex flex-1 flex-col gap-3 p-6">
        <div className="flex items-start justify-between gap-3">
          <Link href={`/groups/${group.id}`} className="min-w-0 hover:underline">
            <h2 className="truncate text-lg font-semibold text-foreground">{group.name}</h2>
            {group.ministry_name && <p className="text-xs text-muted">{group.ministry_name}</p>}
          </Link>
          <Badge tone="neutral" className="shrink-0">
            <Users className="h-3.5 w-3.5" aria-hidden="true" />
            {group.member_count}
            {group.capacity !== null ? ` / ${group.capacity}` : ''}
            <span className="sr-only"> members</span>
          </Badge>
        </div>
        {group.description && <p className="line-clamp-3 text-sm text-foreground/85">{group.description}</p>}
        {meetingLine(group) && <p className="text-sm text-muted">{meetingLine(group)}</p>}
        {leaders && <p className="text-xs text-muted">Led by {leaders}</p>}
        <div className="mt-auto pt-1">{action()}</div>
      </CardContent>
    </Card>
  );
}

export default function GroupsPage() {
  const { data, isLoading, error } = useGroups();
  const { isAuthenticated } = useAuthStore();
  const groups = data ?? [];

  return (
    <div className="container-max space-y-8 py-10 sm:py-12">
      <PageHeader title="Small groups" description="Find a group to grow, pray and do life with during the week." />

      {isLoading ? (
        <SkeletonGrid count={4} className="md:grid-cols-2" />
      ) : error ? (
        <EmptyState icon={UsersRound} title="Groups couldn't load right now" message="Please try again in a moment." />
      ) : groups.length === 0 ? (
        <EmptyState icon={UsersRound} title="No groups are open yet" message="New groups will appear here." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {groups.map((group) => (
            <GroupCard key={group.id} group={group} signedIn={Boolean(isAuthenticated)} />
          ))}
        </div>
      )}
    </div>
  );
}
