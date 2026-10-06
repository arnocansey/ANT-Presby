'use client';

import React from 'react';
import Link from 'next/link';
import { Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useGroups, useJoinGroup, type GroupSummary } from '@/hooks/useApi';
import { isGroupFull, meetingLine } from '@/lib/groups';
import { useAuthStore } from '@/lib/store';

function GroupCard({ group, signedIn }: { group: GroupSummary; signedIn: boolean }) {
  const join = useJoinGroup();
  const leaders = group.leaders.map((leader) => `${leader.first_name} ${leader.last_name}`.trim()).join(', ');

  const action = () => {
    if (!signedIn) {
      return (
        <Button asChild variant="outline" size="sm">
          <Link href={`/login?next=${encodeURIComponent('/groups')}`}>Sign in to join</Link>
        </Button>
      );
    }
    if (group.my_status === 'active') {
      return (
        <Button asChild size="sm" variant="outline">
          <Link href={`/groups/${group.id}`}>Open group</Link>
        </Button>
      );
    }
    if (group.my_status === 'pending') {
      return <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">Request pending</span>;
    }
    if (isGroupFull(group)) {
      return <span className="text-sm text-ui-subtle">Group is full</span>;
    }
    return (
      <Button size="sm" disabled={join.isPending} onClick={() => join.mutate(group.id)}>
        Ask to join
      </Button>
    );
  };

  return (
    <Card className="rounded-[1.5rem] border-slate-200 shadow-sm dark:border-slate-800">
      <CardContent className="space-y-3 p-6">
        <div className="flex items-start justify-between gap-3">
          <Link href={`/groups/${group.id}`} className="min-w-0">
            <h2 className="truncate text-lg font-bold tracking-tight hover:text-sky-700 dark:hover:text-cyan-300">{group.name}</h2>
            {group.ministry_name && <p className="text-xs text-ui-subtle">{group.ministry_name}</p>}
          </Link>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold dark:bg-slate-800">
            <Users className="h-3.5 w-3.5" />
            {group.member_count}
            {group.capacity !== null ? ` / ${group.capacity}` : ''}
          </span>
        </div>
        {group.description && <p className="line-clamp-3 text-sm text-slate-700 dark:text-slate-300">{group.description}</p>}
        {meetingLine(group) && <p className="text-sm text-ui-subtle">{meetingLine(group)}</p>}
        {leaders && <p className="text-xs text-ui-subtle">Led by {leaders}</p>}
        <div className="pt-1">{action()}</div>
      </CardContent>
    </Card>
  );
}

export default function GroupsPage() {
  const { data, isLoading, error } = useGroups();
  const { isAuthenticated } = useAuthStore();
  const groups = data ?? [];

  return (
    <div className="container-max space-y-6 py-12 sm:py-16">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Small Groups</h1>
        <p className="mt-2 text-sm text-ui-subtle">Find a group to grow, pray and do life with during the week.</p>
      </div>

      {isLoading ? (
        <p className="text-sm text-ui-subtle">Loading groups...</p>
      ) : error ? (
        <p className="text-sm text-red-700 dark:text-red-300">Could not load groups.</p>
      ) : groups.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center text-sm text-ui-subtle">No groups are open yet.</CardContent>
        </Card>
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
