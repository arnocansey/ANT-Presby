'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ConfirmDialog from '@/components/ui/confirm-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  useAdminGroups,
  useDeactivateGroup,
  useMemberSearch,
  useMinistries,
  useSaveGroup,
  useSetGroupLeaders,
  type GroupInput,
  type GroupSummary,
} from '@/hooks/useApi';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

type FormState = {
  name: string;
  description: string;
  meetingDay: string;
  meetingTime: string;
  location: string;
  capacity: string;
  ministryId: string;
};

const EMPTY: FormState = { name: '', description: '', meetingDay: '', meetingTime: '', location: '', capacity: '', ministryId: '' };

const toInput = (form: FormState): GroupInput => ({
  name: form.name.trim(),
  description: form.description.trim() || null,
  meetingDay: form.meetingDay || null,
  meetingTime: form.meetingTime || null,
  location: form.location.trim() || null,
  capacity: form.capacity ? Number(form.capacity) : null,
  ministryId: form.ministryId ? Number(form.ministryId) : null,
});

type Leader = { user_id: number; name: string };

function LeadersEditor({ group, onDone }: { group: GroupSummary; onDone: () => void }) {
  const [leaders, setLeaders] = React.useState<Leader[]>(
    group.leaders.map((leader) => ({ user_id: leader.user_id, name: `${leader.first_name} ${leader.last_name}`.trim() }))
  );
  const [searchInput, setSearchInput] = React.useState('');
  const [term, setTerm] = React.useState('');
  const { data: results } = useMemberSearch(term);
  const save = useSetGroupLeaders(group.id);

  React.useEffect(() => {
    const timer = setTimeout(() => setTerm(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const add = (leader: Leader) =>
    setLeaders((current) => (current.some((l) => l.user_id === leader.user_id) || current.length >= 10 ? current : [...current, leader]));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Leaders of {group.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {leaders.length === 0 && <span className="text-sm text-ui-subtle">No leaders yet.</span>}
          {leaders.map((leader) => (
            <span key={leader.user_id} className="inline-flex items-center gap-2 rounded-full bg-sky-100 px-3 py-1 text-sm dark:bg-sky-900/40">
              {leader.name || `Member #${leader.user_id}`}
              <button
                type="button"
                aria-label={`Remove ${leader.name}`}
                className="font-bold"
                onClick={() => setLeaders((current) => current.filter((l) => l.user_id !== leader.user_id))}
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="space-y-2">
          <Label htmlFor="leader-search">Add a leader</Label>
          <Input
            id="leader-search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search members by name or email"
          />
          {term.trim().length >= 2 && (
            <ul className="divide-y divide-slate-200 dark:divide-slate-800">
              {(results ?? []).map((member) => (
                <li key={member.id} className="flex items-center justify-between gap-3 py-2">
                  <span className="truncate text-sm">
                    {`${member.first_name} ${member.last_name}`.trim()} <span className="text-ui-subtle">{member.email}</span>
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => add({ user_id: member.id, name: `${member.first_name} ${member.last_name}`.trim() })}
                  >
                    Add
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex gap-3">
          <Button disabled={save.isPending} onClick={() => save.mutate(leaders.map((l) => l.user_id), { onSuccess: onDone })}>
            Save leaders
          </Button>
          <Button variant="outline" onClick={onDone}>
            Close
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminGroupsPage() {
  const { data: groups, isLoading } = useAdminGroups();
  const { data: ministries } = useMinistries();
  const save = useSaveGroup();
  const deactivate = useDeactivateGroup();

  const [editingId, setEditingId] = React.useState<number | undefined>();
  const [form, setForm] = React.useState<FormState>(EMPTY);
  const [leadersFor, setLeadersFor] = React.useState<GroupSummary | null>(null);
  const [pendingDeactivate, setPendingDeactivate] = React.useState<GroupSummary | null>(null);

  const set = (field: keyof FormState) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm((current) => ({ ...current, [field]: event.target.value }));

  const startEdit = (group: GroupSummary) => {
    setEditingId(group.id);
    setForm({
      name: group.name,
      description: group.description || '',
      meetingDay: group.meeting_day || '',
      meetingTime: group.meeting_time || '',
      location: group.location || '',
      capacity: group.capacity !== null ? String(group.capacity) : '',
      ministryId: group.ministry_id !== null ? String(group.ministry_id) : '',
    });
  };

  const resetForm = () => {
    setEditingId(undefined);
    setForm(EMPTY);
  };

  const selectClass =
    'h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950';

  return (
    <div className="container-max space-y-6 py-12">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Small Groups</h1>
        <p className="mt-2 text-sm text-ui-subtle">
          Create groups and assign leaders. Leaders approve join requests on the group&apos;s page.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{editingId ? 'Edit group' : 'New group'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              save.mutate({ id: editingId, input: toInput(form) }, { onSuccess: resetForm });
            }}
            className="grid gap-4 md:grid-cols-2"
          >
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="group-name">Name</Label>
              <Input id="group-name" value={form.name} onChange={set('name')} required maxLength={255} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="group-description">Description</Label>
              <Textarea id="group-description" rows={3} maxLength={2000} value={form.description} onChange={set('description')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="group-day">Meeting day</Label>
              <select id="group-day" value={form.meetingDay} onChange={set('meetingDay')} className={selectClass}>
                <option value="">Not set</option>
                {DAYS.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="group-time">Meeting time</Label>
              <Input id="group-time" type="time" value={form.meetingTime} onChange={set('meetingTime')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="group-location">Location</Label>
              <Input id="group-location" value={form.location} onChange={set('location')} maxLength={255} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="group-capacity">Capacity (blank = no limit)</Label>
              <Input id="group-capacity" type="number" min={1} max={1000} value={form.capacity} onChange={set('capacity')} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="group-ministry">Ministry</Label>
              <select id="group-ministry" value={form.ministryId} onChange={set('ministryId')} className={selectClass}>
                <option value="">None</option>
                {((ministries ?? []) as Array<{ id: number; name: string }>).map((ministry) => (
                  <option key={ministry.id} value={String(ministry.id)}>
                    {ministry.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-3 md:col-span-2">
              <Button type="submit" disabled={save.isPending}>
                {editingId ? 'Save changes' : 'Create group'}
              </Button>
              {editingId && (
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {leadersFor && <LeadersEditor key={leadersFor.id} group={leadersFor} onDone={() => setLeadersFor(null)} />}

      {isLoading ? (
        <p className="text-sm text-ui-subtle">Loading groups...</p>
      ) : !groups || groups.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-4 text-sm text-ui-subtle">No groups yet.</CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {groups.map((group) => (
            <Card key={group.id}>
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate font-semibold">
                    {group.name} {!group.is_active && <span className="text-xs font-normal text-red-700">(inactive)</span>}
                  </p>
                  <p className="text-xs text-ui-subtle">
                    {group.member_count} members{group.capacity !== null ? ` of ${group.capacity}` : ''} ·{' '}
                    {group.leaders.length > 0
                      ? `Led by ${group.leaders.map((l) => `${l.first_name} ${l.last_name}`.trim()).join(', ')}`
                      : 'No leader'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => startEdit(group)}>
                    Edit
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setLeadersFor(group)}>
                    Leaders
                  </Button>
                  {group.is_active ? (
                    <Button size="sm" variant="outline" onClick={() => setPendingDeactivate(group)}>
                      Deactivate
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={save.isPending}
                      onClick={() =>
                        save.mutate({
                          id: group.id,
                          input: {
                            ...toInput({
                              name: group.name,
                              description: group.description || '',
                              meetingDay: group.meeting_day || '',
                              meetingTime: group.meeting_time || '',
                              location: group.location || '',
                              capacity: group.capacity !== null ? String(group.capacity) : '',
                              ministryId: group.ministry_id !== null ? String(group.ministry_id) : '',
                            }),
                            isActive: true,
                          },
                        })
                      }
                    >
                      Reactivate
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {pendingDeactivate && (
        <ConfirmDialog
          title={`Deactivate "${pendingDeactivate.name}"?`}
          description="Members keep their membership, but the group is hidden and stops accepting requests. You can reactivate it later."
          confirmLabel="Deactivate"
          onCancel={() => setPendingDeactivate(null)}
          onConfirm={() => {
            deactivate.mutate(pendingDeactivate.id);
            setPendingDeactivate(null);
          }}
        />
      )}
    </div>
  );
}
