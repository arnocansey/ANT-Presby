'use client';

import React from 'react';
import Image from 'next/image';
import ConfirmDialog from '@/components/ui/confirm-dialog';
import PageHeader from '@/components/ui/page-header';
import SimpleTable from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import AdminSubNav from '@/components/admin/sub-nav';
import { Field, FormActions, FormSection, formGridClass } from '@/components/admin/form-layout';
import { LoadError, TableSkeleton } from '@/components/admin/states';
import { ADMIN_HOME_CRUMB, SERMON_TABS } from '@/components/admin/admin-nav';
import {
  useDeleteSermonSeries,
  useSaveSermonSeries,
  useSermonSeriesList,
  useUploadSeriesCover,
  type SeriesInput,
  type SermonSeriesSummary,
} from '@/hooks/useApi';
import { formatDateOnly, resolveAssetUrl } from '@/lib/utils';

const EMPTY: SeriesInput = { title: '', description: '', coverImageUrl: '', startDate: '', endDate: '' };

// Date inputs need YYYY-MM-DD; the API sends ISO timestamps at midnight UTC.
const toDateInput = (value: string | null) => (value ? value.slice(0, 10) : '');

export default function AdminSeriesPage() {
  const { data: seriesList, isLoading, isError, refetch } = useSermonSeriesList();
  const save = useSaveSermonSeries();
  const remove = useDeleteSermonSeries();
  const upload = useUploadSeriesCover();

  const [editingId, setEditingId] = React.useState<number | undefined>();
  const [form, setForm] = React.useState<SeriesInput>(EMPTY);
  const [pendingDelete, setPendingDelete] = React.useState<SermonSeriesSummary | null>(null);

  const set = (field: keyof SeriesInput) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setForm((current) => ({ ...current, [field]: event.target.value }));

  const startEdit = (series: SermonSeriesSummary) => {
    setEditingId(series.id);
    setForm({
      title: series.title,
      description: series.description || '',
      coverImageUrl: series.cover_image_url || '',
      startDate: toDateInput(series.start_date),
      endDate: toDateInput(series.end_date),
    });
  };

  const resetForm = () => {
    setEditingId(undefined);
    setForm(EMPTY);
  };

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    save.mutate({ id: editingId, input: form }, { onSuccess: resetForm });
  };

  const onCoverChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    upload.mutate(file, {
      onSuccess: ({ url }) => setForm((current) => ({ ...current, coverImageUrl: url })),
    });
    event.target.value = '';
  };

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={[ADMIN_HOME_CRUMB, { label: 'Series' }]}
        title="Sermon series"
        description="Group sermons into series. Deleting a series keeps its sermons; they just lose the series label."
      />
      <AdminSubNav label="Sermons and series" items={SERMON_TABS} />

      <FormSection title={editingId ? 'Edit series' : 'New series'}>
        <form onSubmit={onSubmit} className={formGridClass}>
          <Field label="Title" htmlFor="series-title" full>
            <Input id="series-title" value={form.title} onChange={set('title')} required maxLength={255} />
          </Field>
          <Field label="Description" htmlFor="series-description" full>
            <Textarea id="series-description" rows={3} value={form.description} onChange={set('description')} />
          </Field>
          <Field label="Start date" htmlFor="series-start">
            <Input id="series-start" type="date" value={form.startDate} onChange={set('startDate')} />
          </Field>
          <Field label="End date" htmlFor="series-end">
            <Input
              id="series-end"
              type="date"
              value={form.endDate}
              min={form.startDate || undefined}
              onChange={set('endDate')}
            />
          </Field>
          <Field label="Cover image" htmlFor="series-cover" full>
            <div className="flex flex-wrap items-center gap-3">
              {form.coverImageUrl && (
                <Image
                  src={resolveAssetUrl(form.coverImageUrl)}
                  alt="Series cover"
                  width={120}
                  height={68}
                  unoptimized
                  className="h-auto w-[120px] rounded-lg border border-border object-cover"
                />
              )}
              <Input
                id="series-cover"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={onCoverChange}
                disabled={upload.isPending}
                className="max-w-xs"
              />
              {form.coverImageUrl && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setForm((c) => ({ ...c, coverImageUrl: '' }))}
                >
                  Remove cover
                </Button>
              )}
            </div>
          </Field>
          <FormActions>
            <Button type="submit" disabled={save.isPending || upload.isPending}>
              {editingId ? 'Save changes' : 'Create series'}
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
        <TableSkeleton rows={3} label="Loading series" />
      ) : isError && !seriesList ? (
        <LoadError what="series" onRetry={() => refetch()} />
      ) : (
        <SimpleTable
          emptyMessage="No series yet."
          columns={[
            {
              key: 'title',
              header: 'Series',
              render: (series: SermonSeriesSummary) => <p className="font-semibold text-foreground">{series.title}</p>,
            },
            {
              key: 'sermon_count',
              header: 'Sermons',
              render: (series: SermonSeriesSummary) =>
                `${series.sermon_count} ${series.sermon_count === 1 ? 'sermon' : 'sermons'}`,
            },
            {
              key: 'start_date',
              header: 'Dates',
              render: (series: SermonSeriesSummary) =>
                series.start_date || series.end_date ? (
                  <span>
                    {series.start_date ? formatDateOnly(series.start_date) : ''}
                    {series.end_date ? ` – ${formatDateOnly(series.end_date)}` : ''}
                  </span>
                ) : (
                  <span className="text-muted">No dates</span>
                ),
            },
            {
              key: 'actions',
              header: 'Actions',
              render: (series: SermonSeriesSummary) => (
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary" onClick={() => startEdit(series)} aria-label={`Edit ${series.title}`}>
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setPendingDelete(series)}
                    disabled={remove.isPending}
                    aria-label={`Delete ${series.title}`}
                  >
                    Delete
                  </Button>
                </div>
              ),
            },
          ]}
          data={seriesList ?? []}
        />
      )}

      {pendingDelete && (
        <ConfirmDialog
          title={`Delete "${pendingDelete.title}"?`}
          description={`Its ${pendingDelete.sermon_count} sermon(s) will stay in the library without a series.`}
          confirmLabel="Delete series"
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
