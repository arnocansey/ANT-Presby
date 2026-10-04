'use client';

import React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ConfirmDialog from '@/components/ui/confirm-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  const { data: seriesList, isLoading } = useSermonSeriesList();
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
    <div className="container-max space-y-6 py-12">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Sermon Series</h1>
        <p className="mt-2 text-sm text-ui-subtle">
          Group sermons into series. Deleting a series keeps its sermons; they just lose the series label.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{editingId ? 'Edit series' : 'New series'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="series-title">Title</Label>
              <Input id="series-title" value={form.title} onChange={set('title')} required maxLength={255} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="series-description">Description</Label>
              <Textarea id="series-description" rows={3} value={form.description} onChange={set('description')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="series-start">Start date</Label>
              <Input id="series-start" type="date" value={form.startDate} onChange={set('startDate')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="series-end">End date</Label>
              <Input id="series-end" type="date" value={form.endDate} min={form.startDate || undefined} onChange={set('endDate')} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="series-cover">Cover image</Label>
              <div className="flex flex-wrap items-center gap-3">
                {form.coverImageUrl && (
                  <Image
                    src={resolveAssetUrl(form.coverImageUrl)}
                    alt="Series cover"
                    width={120}
                    height={68}
                    unoptimized
                    className="h-auto w-[120px] rounded-lg object-cover"
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
                  <Button type="button" variant="outline" size="sm" onClick={() => setForm((c) => ({ ...c, coverImageUrl: '' }))}>
                    Remove cover
                  </Button>
                )}
              </div>
            </div>
            <div className="flex gap-3 md:col-span-2">
              <Button type="submit" disabled={save.isPending || upload.isPending}>
                {editingId ? 'Save changes' : 'Create series'}
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
        <p className="text-sm text-ui-subtle">Loading series...</p>
      ) : !seriesList || seriesList.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-4 text-sm text-ui-subtle">No series yet.</CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {seriesList.map((series) => (
            <Card key={series.id}>
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{series.title}</p>
                  <p className="text-xs text-ui-subtle">
                    {series.sermon_count} {series.sermon_count === 1 ? 'sermon' : 'sermons'}
                    {series.start_date ? ` · ${formatDateOnly(series.start_date)}` : ''}
                    {series.end_date ? ` – ${formatDateOnly(series.end_date)}` : ''}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => startEdit(series)}>
                    Edit
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setPendingDelete(series)} disabled={remove.isPending}>
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
