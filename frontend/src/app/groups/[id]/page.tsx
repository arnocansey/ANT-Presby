'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ConfirmDialog from '@/components/ui/confirm-dialog';
import { useDecideGroupRequest, useGroup, useGroupRequests, useJoinGroup, useLeaveGroup } from '@/hooks/useApi';
import { isGroupFull, meetingLine } from '@/lib/groups';
import { useAuthStore } from '@/lib/store';
import { formatDateTime } from '@/lib/utils';

const personName = (person: { first_name: string; last_name: string }) =>
  `${person.first_name || ''} ${person.last_name || ''}`.trim() || 'Member';

export default function GroupDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params?.id);
  const groupId = Number.isInteger(id) && id > 0 ? id : undefined;
  const { user, isAuthenticated } = useAuthStore();

  const { data: group, isLoading, error } = useGroup(groupId);
  const join = useJoinGroup();
  const leave = useLeaveGroup();
  const [confirmLeave, setConfirmLeave] = React.useState(false);

  const isAdmin = user?.role === 'admin';
  const isLeader = group?.my_role === 'leader' && group?.my_status === 'active';
  const canManage = Boolean(isAdmin || isLeader);
  const { data: requests } = useGroupRequests(groupId, canManage);
  const decide = useDecideGroupRequest(groupId);

  if (!groupId || (error as any)?.response?.status === 404) {
    return (
      <div className="container-max py-12">
        <p className="text-ui-subtle">This group could not be found.</p>
        <Link href="/groups" className="text-sm font-semibold text-sky-700">
          ← All groups
        </Link>
      </div>
    );
  }

  if (isLoading || !group) {
    return (
      <div className="container-max py-12 text-sm text-ui-subtle">
        {error ? 'Could not load this group.' : 'Loading group...'}
      </div>
    );
  }

  return (
    <div className="container-max space-y-6 py-12 sm:py-16">
      <div className="space-y-2">
        <Link href="/groups" className="text-sm font-semibold text-sky-700 dark:text-cyan-300">
          ← All groups
        </Link>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{group.name}</h1>
        {group.ministry_name && <p className="text-sm text-ui-subtle">{group.ministry_name}</p>}
        {!group.is_active && <p className="text-sm font-semibold text-red-700">This group is inactive.</p>}
        {meetingLine(group) && <p className="text-sm">{meetingLine(group)}</p>}
        <p className="text-sm text-ui-subtle">
          {group.member_count} {group.member_count === 1 ? 'member' : 'members'}
          {group.capacity !== null ? ` of ${group.capacity}` : ''}
          {group.leaders.length > 0 ? ` · Led by ${group.leaders.map(personName).join(', ')}` : ''}
        </p>
        {group.description && <p className="max-w-2xl whitespace-pre-line pt-2">{group.description}</p>}

        <div className="pt-2">
          {!isAuthenticated ? (
            <Button asChild variant="outline">
              <Link href={`/login?next=${encodeURIComponent(`/groups/${group.id}`)}`}>Sign in to join</Link>
            </Button>
          ) : group.my_status === 'active' ? (
            <Button variant="outline" disabled={leave.isPending} onClick={() => setConfirmLeave(true)}>
              Leave group
            </Button>
          ) : group.my_status === 'pending' ? (
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">Request pending</span>
              <Button size="sm" variant="outline" disabled={leave.isPending} onClick={() => leave.mutate(group.id)}>
                Cancel request
              </Button>
            </div>
          ) : isGroupFull(group) ? (
            <span className="text-sm text-ui-subtle">This group is full.</span>
          ) : group.is_active ? (
            <Button disabled={join.isPending} onClick={() => join.mutate(group.id)}>
              Ask to join
            </Button>
          ) : null}
        </div>
      </div>

      {canManage && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Join requests ({requests?.length ?? 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {!requests || requests.length === 0 ? (
              <p className="text-sm text-ui-subtle">No pending requests.</p>
            ) : (
              <ul className="divide-y divide-slate-200 dark:divide-slate-800">
                {requests.map((request) => (
                  <li key={request.user_id} className="flex flex-wrap items-center justify-between gap-3 py-2">
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{personName(request)}</span>
                      <span className="block truncate text-xs text-ui-subtle">
                        {request.email} · asked {formatDateTime(request.requested_at)}
                      </span>
                    </span>
                    <span className="flex gap-2">
                      <Button
                        size="sm"
                        disabled={decide.isPending}
                        onClick={() => decide.mutate({ userId: request.user_id, decision: 'approve' })}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={decide.isPending}
                        onClick={() => decide.mutate({ userId: request.user_id, decision: 'decline' })}
                      >
                        Decline
                      </Button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      {group.members && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Members ({group.members.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-slate-200 dark:divide-slate-800">
              {group.members.map((member) => (
                <li key={member.user_id} className="flex items-center justify-between gap-3 py-2">
                  <span className="truncate">{personName(member)}</span>
                  {member.role === 'leader' && (
                    <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-semibold text-sky-800 dark:bg-sky-900/40 dark:text-sky-200">
                      Leader
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {confirmLeave && (
        <ConfirmDialog
          title={`Leave ${group.name}?`}
          description="You can ask to join again later."
          confirmLabel="Leave group"
          onCancel={() => setConfirmLeave(false)}
          onConfirm={() => {
            setConfirmLeave(false);
            leave.mutate(group.id);
          }}
        />
      )}
    </div>
  );
}
