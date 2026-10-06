'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  const { data: sent, isLoading } = useSentAnnouncements();
  const send = useSendAnnouncement();

  const [title, setTitle] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [audience, setAudience] = React.useState<Audience>('everyone');
  const [targetId, setTargetId] = React.useState('');

  const selectClass = 'h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950';
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
    <div className="container-max space-y-6 py-12">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Announcements</h1>
        <p className="mt-2 text-sm text-ui-subtle">
          Sends an in-app notification, and a push notification to phones with the app installed.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">New announcement</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ann-audience">Send to</Label>
              <select
                id="ann-audience"
                value={audience}
                onChange={(event) => {
                  setAudience(event.target.value as Audience);
                  setTargetId('');
                }}
                className={selectClass}
              >
                <option value="everyone">Everyone</option>
                <option value="group">A small group</option>
                <option value="event">An event&apos;s attendees</option>
              </select>
            </div>
            {needsTarget && (
              <div className="space-y-2">
                <Label htmlFor="ann-target">{audience === 'group' ? 'Group' : 'Event'}</Label>
                <select id="ann-target" value={targetId} onChange={(event) => setTargetId(event.target.value)} className={selectClass} required>
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
                </select>
              </div>
            )}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="ann-title">Title</Label>
              <Input id="ann-title" value={title} onChange={(event) => setTitle(event.target.value)} required maxLength={255} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="ann-message">Message</Label>
              <Textarea id="ann-message" rows={4} value={message} onChange={(event) => setMessage(event.target.value)} required maxLength={2000} />
            </div>
            <div className="md:col-span-2">
              <Button type="submit" disabled={send.isPending || !title.trim() || !message.trim() || (needsTarget && !targetId)}>
                Send announcement
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sent</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-ui-subtle">Loading...</p>
          ) : !sent || sent.length === 0 ? (
            <p className="text-sm text-ui-subtle">Nothing sent yet.</p>
          ) : (
            <ul className="divide-y divide-slate-200 dark:divide-slate-800">
              {sent.map((item) => (
                <li key={item.id} className="space-y-1 py-3">
                  <p className="font-semibold">{item.title}</p>
                  <p className="line-clamp-2 text-sm text-slate-700 dark:text-slate-300">{item.message}</p>
                  <p className="text-xs text-ui-subtle">
                    {formatDateTime(item.created_at)} ·{' '}
                    {item.audience === 'everyone' ? 'Everyone' : item.audience === 'group' ? item.group_name || 'Group' : item.event_name || 'Event'} ·{' '}
                    {item.recipient_count} people · {item.push_count} phones
                    {item.sender_name ? ` · by ${item.sender_name}` : ''}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
