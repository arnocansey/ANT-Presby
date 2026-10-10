'use client';

import React from 'react';
import PageHeader from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Field, FormActions, FormSection, formGridClass } from '@/components/admin/form-layout';
import { CardListSkeleton, LoadError } from '@/components/admin/states';
import { ADMIN_HOME_CRUMB } from '@/components/admin/admin-nav';
import {
  useAdminGroups,
  useCheckInEvents,
  useSendAnnouncement,
  useSentAnnouncements,
  type AnnouncementInput,
} from '@/hooks/useApi';
import { formatDateTime } from '@/lib/utils';

type Audience = 'everyone' | 'group' | 'event';

export default function AdminAnnouncementsPage() {
  const { data: groups } = useAdminGroups();
  const { data: events } = useCheckInEvents();
  const { data: sent, isLoading, isError, refetch } = useSentAnnouncements();
  const send = useSendAnnouncement();

  const [title, setTitle] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [audience, setAudience] = React.useState<Audience>('everyone');
  const [targetId, setTargetId] = React.useState('');

  const needsTarget = audience !== 'everyone';

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const base = { title: title.trim(), message: message.trim() };
    const input: AnnouncementInput =
      audience === 'group'
        ? { ...base, audience, groupId: Number(targetId) }
        : audience === 'event'
          ? { ...base, audience, eventId: Number(targetId) }
          : { ...base, audience: 'everyone' };
    send.mutate(input, {
      onSuccess: () => {
        setTitle('');
        setMessage('');
      },
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={[ADMIN_HOME_CRUMB, { label: 'Announcements' }]}
        title="Announcements"
        description="Sends an in-app notification, and a push notification to phones with the app installed."
      />

      <FormSection title="New announcement">
        <form onSubmit={onSubmit} className={formGridClass}>
          <Field label="Send to" htmlFor="ann-audience">
            <Select
              id="ann-audience"
              value={audience}
              onChange={(event) => {
                setAudience(event.target.value as Audience);
                setTargetId('');
              }}
            >
              <option value="everyone">Everyone</option>
              <option value="group">A small group</option>
              <option value="event">An event&apos;s attendees</option>
            </Select>
          </Field>
          {needsTarget && (
            <Field label={audience === 'group' ? 'Group' : 'Event'} htmlFor="ann-target">
              <Select id="ann-target" value={targetId} onChange={(event) => setTargetId(event.target.value)} required>
                <option value="">Choose...</option>
                {audience === 'group'
                  ? (groups ?? []).filter((g) => g.is_active).map((g) => (
                      <option key={g.id} value={String(g.id)}>
                        {g.name}
                      </option>
                    ))
                  : (events ?? []).map((e) => (
                      <option key={e.id} value={String(e.id)}>
                        {e.name} · {formatDateTime(e.event_date)}
                      </option>
                    ))}
              </Select>
            </Field>
          )}
          <Field label="Title" htmlFor="ann-title" full>
            <Input id="ann-title" value={title} onChange={(event) => setTitle(event.target.value)} required maxLength={255} />
          </Field>
          <Field label="Message" htmlFor="ann-message" full>
            <Textarea
              id="ann-message"
              rows={4}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              required
              maxLength={2000}
            />
          </Field>
          <FormActions>
            <Button type="submit" disabled={send.isPending || !title.trim() || !message.trim() || (needsTarget && !targetId)}>
              Send announcement
            </Button>
          </FormActions>
        </form>
      </FormSection>

      <FormSection title="Sent">
        {isLoading ? (
          <CardListSkeleton count={2} label="Loading sent announcements" />
        ) : isError && !sent ? (
          <LoadError what="sent announcements" onRetry={() => refetch()} />
        ) : !sent || sent.length === 0 ? (
          <p className="rounded-lg border border-dashed border-input bg-surface/50 px-4 py-6 text-center text-sm text-muted">
            Nothing sent yet.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {sent.map((item) => (
              <li key={item.id} className="space-y-2 py-4 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-foreground">{item.title}</p>
                  <Badge tone="neutral">
                    {item.audience === 'everyone'
                      ? 'Everyone'
                      : item.audience === 'group'
                        ? item.group_name || 'Group'
                        : item.event_name || 'Event'}
                  </Badge>
                </div>
                <p className="line-clamp-2 text-sm text-muted">{item.message}</p>
                <p className="text-xs text-muted">
                  {formatDateTime(item.created_at)} · {item.recipient_count} people · {item.push_count} phones
                  {item.sender_name ? ` · by ${item.sender_name}` : ''}
                </p>
              </li>
            ))}
          </ul>
        )}
      </FormSection>
    </div>
  );
}
