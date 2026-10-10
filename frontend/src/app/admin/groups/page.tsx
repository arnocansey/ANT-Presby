'use client';

import React from 'react';
import { X } from 'lucide-react';
import ConfirmDialog from '@/components/ui/confirm-dialog';
import PageHeader from '@/components/ui/page-header';
import SimpleTable from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Field, FormActions, FormSection, formGridClass } from '@/components/admin/form-layout';
import { LoadError, TableSkeleton } from '@/components/admin/states';
import { ADMIN_HOME_CRUMB } from '@/components/admin/admin-nav';
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
    <FormSection title={`Leaders of ${group.name}`} description="Up to 10 leaders. Leaders approve join requests on the group's page.">
      <div className="space-y-5">
        <div className="flex flex-wrap gap-2">
          {leaders.length === 0 && <span className="text-sm text-muted">No leaders yet.</span>}
          {leaders.map((leader) => (
            <span
              key={leader.user_id}
              className="inline-flex items-center gap-1 rounded-full bg-gold-soft py-1 pl-3 pr-1 text-sm font-medium text-gold-ink"
            >
              {leader.name || `Member #${leader.user_id}`}
              <button
                type="button"
                aria-label={`Remove ${leader.name}`}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-gold/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => setLeaders((current) => current.filter((l) => l.user_id !== leader.user_id))}
              >
                <X className="h-4 w-4" aria-hidden="true" />
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
            <ul className="divide-y divide-border">
              {(results ?? []).map((member) => (
                <li key={member.id} className="flex items-center justify-between gap-3 py-2">
                  <span className="min-w-0 truncate text-sm text-foreground">
                    {`${member.first_name} ${member.last_name}`.trim()} <span className="text-muted">{member.email}</span>
                  </span>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => add({ user_id: member.id, name: `${member.first_name} ${member.last_name}`.trim() })}
                  >
                    Add
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex flex-wrap gap-3 border-t border-border pt-5">
          <Button disabled={save.isPending} onClick={() => save.mutate(leaders.map((l) => l.user_id), { onSuccess: onDone })}>
            Save leaders
          </Button>
          <Button variant="secondary" onClick={onDone}>
            Close
          </Button>
        </div>
      </div>
    </FormSection>
  );
}

export default function AdminGroupsPage() {
  const { data: groups, isLoading, isError, refetch } = useAdminGroups();
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

  const reactivate = (group: GroupSummary) =>
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
    });

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={[ADMIN_HOME_CRUMB, { label: 'Small groups' }]}
        title="Small groups"
        description="Create groups and assign leaders. Leaders approve join requests on the group's page."
      />

      <FormSection title={editingId ? 'Edit group' : 'New group'}>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            save.mutate({ id: editingId, input: toInput(form) }, { onSuccess: resetForm });
          }}
          className={formGridClass}
        >
          <Field label="Name" htmlFor="group-name" full>
            <Input id="group-name" value={form.name} onChange={set('name')} required maxLength={255} />
          </Field>
          <Field label="Description" htmlFor="group-description" full>
            <Textarea id="group-description" rows={3} maxLength={2000} value={form.description} onChange={set('description')} />
          </Field>
          <Field label="Meeting day" htmlFor="group-day">
            <Select id="group-day" value={form.meetingDay} onChange={set('meetingDay')}>
              <option value="">Not set</option>
              {DAYS.map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Meeting time" htmlFor="group-time">
            <Input id="group-time" type="time" value={form.meetingTime} onChange={set('meetingTime')} />
          </Field>
          <Field label="Location" htmlFor="group-location">
            <Input id="group-location" value={form.location} onChange={set('location')} maxLength={255} />
          </Field>
          <Field label="Capacity" htmlFor="group-capacity" hint="Leave blank for no limit.">
            <Input id="group-capacity" type="number" min={1} max={1000} value={form.capacity} onChange={set('capacity')} />
          </Field>
          <Field label="Ministry" htmlFor="group-ministry" full>
            <Select id="group-ministry" value={form.ministryId} onChange={set('ministryId')}>
              <option value="">None</option>
              {((ministries ?? []) as Array<{ id: number; name: string }>).map((ministry) => (
                <option key={ministry.id} value={String(ministry.id)}>
                  {ministry.name}
                </option>
              ))}
            </Select>
          </Field>
          <FormActions>
            <Button type="submit" disabled={save.isPending}>
              {editingId ? 'Save changes' : 'Create group'}
            </Button>
            {editingId && (
              <Button type="button" variant="secondary" onClick={resetForm}>
                Cancel
              </Button>
            )}
          </FormActions>
        </form>
      </FormSection>

      {leadersFor && <LeadersEditor key={leadersFor.id} group={leadersFor} onDone={() => setLeadersFor(null)} />}

      {isLoading ? (
        <TableSkeleton label="Loading groups" />
      ) : isError && !groups ? (
        <LoadError what="groups" onRetry={() => refetch()} />
      ) : (
        <SimpleTable
          emptyMessage="No groups yet."
          columns={[
            {
              key: 'name',
              header: 'Group',
              render: (group: GroupSummary) => (
                <div className="space-y-1">
                  <p className="font-semibold text-foreground">{group.name}</p>
                  <p className="text-xs text-muted">
                    {group.leaders.length > 0
                      ? `Led by ${group.leaders.map((l) => `${l.first_name} ${l.last_name}`.trim()).join(', ')}`
                      : 'No leader'}
                  </p>
                </div>
              ),
            },
            {
              key: 'member_count',
              header: 'Members',
              render: (group: GroupSummary) =>
                `${group.member_count} members${group.capacity !== null ? ` of ${group.capacity}` : ''}`,
            },
            {
              key: 'is_active',
              header: 'Status',
              render: (group: GroupSummary) => (
                <Badge tone={group.is_active ? 'success' : 'danger'}>{group.is_active ? 'Active' : 'Inactive'}</Badge>
              ),
            },
            {
              key: 'actions',
              header: 'Actions',
              render: (group: GroupSummary) => (
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary" onClick={() => startEdit(group)} aria-label={`Edit ${group.name}`}>
                    Edit
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => setLeadersFor(group)} aria-label={`Leaders of ${group.name}`}>
                    Leaders
                  </Button>
                  {group.is_active ? (
                    <Button size="sm" variant="secondary" onClick={() => setPendingDeactivate(group)} aria-label={`Deactivate ${group.name}`}>
                      Deactivate
                    </Button>
                  ) : (
                    <Button size="sm" variant="secondary" disabled={save.isPending} onClick={() => reactivate(group)}>
                      Reactivate
                    </Button>
                  )}
                </div>
              ),
            },
          ]}
          data={groups ?? []}
        />
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
