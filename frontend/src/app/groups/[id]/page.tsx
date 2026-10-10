'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { UsersRound } from 'lucide-react';
import BackLink from '@/components/site/BackLink';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ConfirmDialog from '@/components/ui/confirm-dialog';
import EmptyState from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useDecideGroupRequest, useGroup, useGroupRequests, useJoinGroup, useLeaveGroup, useSendAnnouncement } from '@/hooks/useApi';
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
  const { data: requests, isLoading: requestsLoading, isError: requestsError } = useGroupRequests(groupId, canManage);
  const decide = useDecideGroupRequest(groupId);
  const sendMessage = useSendAnnouncement();
  const [messageTitle, setMessageTitle] = React.useState('');
  const [messageBody, setMessageBody] = React.useState('');

  if (!groupId || (error as any)?.response?.status === 404) {
    return (
      <div className="container-max space-y-6 py-10 sm:py-12">
        <BackLink href="/groups" label="All groups" />
        <EmptyState
          icon={UsersRound}
          title="This group could not be found"
          message="It may have been closed or removed."
          action={
            <Button asChild variant="secondary">
              <Link href="/groups">Browse groups</Link>
            </Button>
          }
        />
      </div>
    );
  }

  if (isLoading || !group) {
    return (
      <div className="container-max space-y-6 py-10 sm:py-12">
        <BackLink href="/groups" label="All groups" />
        {error ? (
          <EmptyState icon={UsersRound} title="This group couldn't load right now" message="Please try again in a moment." />
        ) : (
          <div className="space-y-4" role="status">
            <span className="sr-only">Loading…</span>
            <Skeleton className="h-9 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-24 w-full" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="container-max space-y-8 py-10 sm:py-12">
      <BackLink href="/groups" label="All groups" />

      <header className="space-y-3 border-b border-border pb-6">
        <h1 className="break-words text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{group.name}</h1>
        {group.ministry_name && <p className="text-sm text-muted">{group.ministry_name}</p>}
        {!group.is_active && <Badge tone="danger">This group is inactive.</Badge>}
        {meetingLine(group) && <p className="text-sm text-foreground">{meetingLine(group)}</p>}
        <p className="text-sm text-muted">
          {group.member_count} {group.member_count === 1 ? 'member' : 'members'}
          {group.capacity !== null ? ` of ${group.capacity}` : ''}
          {group.leaders.length > 0 ? ` · Led by ${group.leaders.map(personName).join(', ')}` : ''}
        </p>
        {group.description && <p className="max-w-2xl whitespace-pre-line pt-1 text-foreground/85">{group.description}</p>}

        <div className="pt-2">
          {!isAuthenticated ? (
            <Button asChild variant="secondary">
              <Link href={`/login?next=${encodeURIComponent(`/groups/${group.id}`)}`}>Sign in to join</Link>
            </Button>
          ) : group.my_status === 'active' ? (
            <Button variant="secondary" disabled={leave.isPending} onClick={() => setConfirmLeave(true)}>
              Leave group
            </Button>
          ) : group.my_status === 'pending' ? (
            <div className="flex flex-wrap items-center gap-3">
              <Badge tone="warning">Request pending</Badge>
              <Button size="sm" variant="secondary" disabled={leave.isPending} onClick={() => leave.mutate(group.id)}>
                Cancel request
              </Button>
            </div>
          ) : isGroupFull(group) ? (
            <Badge tone="neutral">This group is full.</Badge>
          ) : group.is_active ? (
            <Button loading={join.isPending} onClick={() => join.mutate(group.id)}>
              Ask to join
            </Button>
          ) : null}
        </div>
      </header>

      {canManage && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Join requests ({requests?.length ?? 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {requestsLoading ? (
              <div className="space-y-2" role="status">
                <span className="sr-only">Loading…</span>
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : requestsError ? (
              <p className="text-sm text-danger">Join requests couldn&apos;t load right now.</p>
            ) : !requests || requests.length === 0 ? (
              <p className="text-sm text-muted">No pending requests.</p>
            ) : (
              <ul className="divide-y divide-border">
                {requests.map((request) => (
                  <li key={request.user_id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-foreground">{personName(request)}</span>
                      <span className="block truncate text-xs text-muted">
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
                        variant="secondary"
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

      {canManage && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Message the group</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                sendMessage.mutate(
                  { audience: 'group', groupId: group.id, title: messageTitle.trim(), message: messageBody.trim() },
                  {
                    onSuccess: () => {
                      setMessageTitle('');
                      setMessageBody('');
                    },
                  }
                );
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="group-message-title">Title</Label>
                <Input
                  id="group-message-title"
                  value={messageTitle}
                  onChange={(event) => setMessageTitle(event.target.value)}
                  placeholder="Title"
                  maxLength={255}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="group-message-body">Message</Label>
                <Textarea
                  id="group-message-body"
                  value={messageBody}
                  onChange={(event) => setMessageBody(event.target.value)}
                  placeholder="Message"
                  rows={3}
                  maxLength={2000}
                  required
                />
              </div>
              <Button
                type="submit"
                loading={sendMessage.isPending}
                disabled={!messageTitle.trim() || !messageBody.trim()}
              >
                Send to members
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {group.members && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Members ({group.members.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {group.members.length === 0 ? (
              <p className="text-sm text-muted">No members yet.</p>
            ) : (
              <ul className="divide-y divide-border">
                {group.members.map((member) => (
                  <li key={member.user_id} className="flex items-center justify-between gap-3 py-3">
                    <span className="min-w-0 truncate text-foreground">{personName(member)}</span>
                    {member.role === 'leader' && <Badge tone="gold">Leader</Badge>}
                  </li>
                ))}
              </ul>
            )}
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
