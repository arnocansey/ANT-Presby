'use client';

import React from 'react';
import ConfirmDialog from '@/components/ui/confirm-dialog';
import PageHeader from '@/components/ui/page-header';
import SimpleTable from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field, FormActions, FormSection, formGridClass } from '@/components/admin/form-layout';
import { LoadError, TableSkeleton } from '@/components/admin/states';
import { ADMIN_HOME_CRUMB } from '@/components/admin/admin-nav';
import { statusLabel, statusTone } from '@/components/admin/status';
import {
  useAdminDevotionals,
  useDeleteDevotional,
  usePublishDevotional,
  useSaveDevotional,
  type Devotional,
  type DevotionalInput,
} from '@/hooks/useApi';
import { formatDateOnly } from '@/lib/utils';

type FormState = { title: string; scriptureReference: string; scriptureText: string; body: string; prayer: string; publishDate: string };
const EMPTY: FormState = { title: '', scriptureReference: '', scriptureText: '', body: '', prayer: '', publishDate: '' };

const toInput = (form: FormState): DevotionalInput => ({
  title: form.title.trim(),
  scriptureReference: form.scriptureReference.trim(),
  scriptureText: form.scriptureText.trim(),
  body: form.body.trim(),
  prayer: form.prayer.trim() || null,
  publishDate: form.publishDate,
});

export default function AdminDevotionalsPage() {
  const { data: devotionals, isLoading, isError, refetch } = useAdminDevotionals();
  const save = useSaveDevotional();
  const remove = useDeleteDevotional();
  const publish = usePublishDevotional();
  const [editingId, setEditingId] = React.useState<number | undefined>();
  const [form, setForm] = React.useState<FormState>(EMPTY);
  const [pendingDelete, setPendingDelete] = React.useState<Devotional | null>(null);

  const set = (field: keyof FormState) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((current) => ({ ...current, [field]: event.target.value }));

  const startEdit = (item: Devotional) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      scriptureReference: item.scripture_reference,
      scriptureText: item.scripture_text,
      body: item.body,
      prayer: item.prayer || '',
      publishDate: item.publish_date,
    });
  };
  const resetForm = () => {
    setEditingId(undefined);
    setForm(EMPTY);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={[ADMIN_HOME_CRUMB, { label: 'Devotionals' }]}
        title="Daily devotionals"
        description="Write one devotional per day. Save it as a draft, then use Publish; on its own day, publishing also notifies everyone (once)."
      />

      <FormSection title={editingId ? 'Edit devotional' : 'New devotional'}>
        <form
          className={formGridClass}
          onSubmit={(event) => {
            event.preventDefault();
            save.mutate({ id: editingId, input: toInput(form) }, { onSuccess: resetForm });
          }}
        >
          <Field label="Title" htmlFor="dev-title">
            <Input id="dev-title" value={form.title} onChange={set('title')} required maxLength={255} />
          </Field>
          <Field label="Date" htmlFor="dev-date">
            <Input id="dev-date" type="date" value={form.publishDate} onChange={set('publishDate')} required />
          </Field>
          <Field label="Scripture reference" htmlFor="dev-ref" full>
            <Input
              id="dev-ref"
              value={form.scriptureReference}
              onChange={set('scriptureReference')}
              required
              maxLength={255}
              placeholder="Psalm 23:1-3"
            />
          </Field>
          <Field label="Scripture text" htmlFor="dev-scripture" full>
            <Textarea id="dev-scripture" rows={3} value={form.scriptureText} onChange={set('scriptureText')} required maxLength={5000} />
          </Field>
          <Field label="Reflection" htmlFor="dev-body" full>
            <Textarea id="dev-body" rows={8} value={form.body} onChange={set('body')} required maxLength={20000} />
          </Field>
          <Field label="Closing prayer (optional)" htmlFor="dev-prayer" full>
            <Textarea id="dev-prayer" rows={3} value={form.prayer} onChange={set('prayer')} maxLength={5000} />
          </Field>
          <FormActions>
            <Button type="submit" disabled={save.isPending}>
              {editingId ? 'Save changes' : 'Save draft'}
            </Button>
            {editingId && (
              <Button type="button" variant="secondary" onClick={resetForm}>
                Cancel
              </Button>
            )}
          </FormActions>
        </form>
      </FormSection>

      {isLoading ? (
        <TableSkeleton label="Loading devotionals" />
      ) : isError && !devotionals ? (
        <LoadError what="devotionals" onRetry={() => refetch()} />
      ) : (
        <SimpleTable
          emptyMessage="No devotionals yet."
          columns={[
            {
              key: 'title',
              header: 'Devotional',
              render: (item: Devotional) => (
                <div>
                  <p className="font-semibold text-foreground">{item.title}</p>
                  <p className="text-xs text-muted">{item.scripture_reference}</p>
                </div>
              ),
            },
            {
              key: 'publish_date',
              header: 'Date',
              render: (item: Devotional) => formatDateOnly(item.publish_date),
            },
            {
              key: 'status',
              header: 'Status',
              render: (item: Devotional) => (
                <div className="flex flex-wrap gap-2">
                  <Badge tone={statusTone(item.status)}>{statusLabel(item.status)}</Badge>
                  {item.notified_at && <Badge tone="neutral">Everyone notified</Badge>}
                </div>
              ),
            },
            {
              key: 'actions',
              header: 'Actions',
              render: (item: Devotional) => (
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary" onClick={() => startEdit(item)} aria-label={`Edit ${item.title}`}>
                    Edit
                  </Button>
                  {(item.status === 'draft' || !item.notified_at) && (
                    <Button size="sm" disabled={publish.isPending} onClick={() => publish.mutate(item.id)}>
                      {item.status === 'draft' ? 'Publish' : 'Publish & notify'}
                    </Button>
                  )}
                  <Button size="sm" variant="secondary" onClick={() => setPendingDelete(item)} aria-label={`Delete ${item.title}`}>
                    Delete
                  </Button>
                </div>
              ),
            },
          ]}
          data={devotionals ?? []}
        />
      )}

      {pendingDelete && (
        <ConfirmDialog
          title={`Delete "${pendingDelete.title}"?`}
          description="This cannot be undone."
          confirmLabel="Delete"
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => {
            remove.mutate(pendingDelete.id);
            if (editingId === pendingDelete.id) resetForm();
            setPendingDelete(null);
          }}
        />
      )}
    </div>
  );
}
