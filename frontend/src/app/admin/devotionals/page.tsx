'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ConfirmDialog from '@/components/ui/confirm-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  const { data: devotionals, isLoading } = useAdminDevotionals();
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
    <div className="container-max space-y-6 py-12">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Daily Devotionals</h1>
        <p className="mt-2 text-sm text-ui-subtle">
          Write one devotional per day. Save it as a draft, then use &quot;Publish&quot;; on its own day, publishing also
          notifies everyone (once).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{editingId ? 'Edit devotional' : 'New devotional'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4 md:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              save.mutate({ id: editingId, input: toInput(form) }, { onSuccess: resetForm });
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="dev-title">Title</Label>
              <Input id="dev-title" value={form.title} onChange={set('title')} required maxLength={255} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dev-date">Date</Label>
              <Input id="dev-date" type="date" value={form.publishDate} onChange={set('publishDate')} required />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="dev-ref">Scripture reference</Label>
              <Input id="dev-ref" value={form.scriptureReference} onChange={set('scriptureReference')} required maxLength={255} placeholder="Psalm 23:1-3" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="dev-scripture">Scripture text</Label>
              <Textarea id="dev-scripture" rows={3} value={form.scriptureText} onChange={set('scriptureText')} required maxLength={5000} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="dev-body">Reflection</Label>
              <Textarea id="dev-body" rows={8} value={form.body} onChange={set('body')} required maxLength={20000} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="dev-prayer">Closing prayer (optional)</Label>
              <Textarea id="dev-prayer" rows={3} value={form.prayer} onChange={set('prayer')} maxLength={5000} />
            </div>
            <div className="flex gap-3 md:col-span-2">
              <Button type="submit" disabled={save.isPending}>
                {editingId ? 'Save changes' : 'Save draft'}
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

      {isLoading ? (
        <p className="text-sm text-ui-subtle">Loading devotionals...</p>
      ) : !devotionals || devotionals.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-4 text-sm text-ui-subtle">No devotionals yet.</CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {devotionals.map((item) => (
            <Card key={item.id}>
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{item.title}</p>
                  <p className="text-xs text-ui-subtle">
                    {formatDateOnly(item.publish_date)} · {item.status}
                    {item.notified_at ? ' · everyone notified' : ''}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => startEdit(item)}>
                    Edit
                  </Button>
                  {(item.status === 'draft' || !item.notified_at) && (
                    <Button size="sm" disabled={publish.isPending} onClick={() => publish.mutate(item.id)}>
                      {item.status === 'draft' ? 'Publish' : 'Publish & notify'}
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => setPendingDelete(item)}>
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
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
