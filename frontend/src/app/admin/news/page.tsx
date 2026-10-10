'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import {
  useAdminNews,
  useAuditLogs,
  useCreateNewsPost,
  useDeleteNewsPost,
  useUploadNewsImage,
} from '@/hooks/useApi';
import ConfirmDialog from '@/components/ui/confirm-dialog';
import PageHeader from '@/components/ui/page-header';
import SimpleTable from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CheckboxField, Field, FormActions, FormSection, formGridClass } from '@/components/admin/form-layout';
import { LoadError, TableSkeleton } from '@/components/admin/states';
import { ADMIN_HOME_CRUMB } from '@/components/admin/admin-nav';
import { statusLabel, statusTone } from '@/components/admin/status';

type NewsStatus = 'draft' | 'review' | 'scheduled' | 'published' | 'archived';

type NewsForm = {
  title: string;
  summary: string;
  content: string;
  slug?: string;
  imageUrl?: string;
  status: NewsStatus;
  scheduledFor?: string;
  featured: boolean;
};

type NewsRow = {
  id: number;
  title: string;
  summary?: string;
  slug?: string;
  status?: string;
  featured?: boolean;
  scheduled_for?: string | null;
};

const statusOptions: NewsStatus[] = ['draft', 'review', 'scheduled', 'published', 'archived'];

export default function AdminNewsPage() {
  const [statusFilter, setStatusFilter] = React.useState<string>('');
  const [search, setSearch] = React.useState('');
  const [pendingDelete, setPendingDelete] = React.useState<NewsRow | null>(null);
  const { data, isLoading, isError, refetch } = useAdminNews(1, 30, statusFilter || undefined, search || undefined);
  const { data: auditData } = useAuditLogs(1, 8, 'news_post');
  const createNews = useCreateNewsPost();
  const deleteNews = useDeleteNewsPost();
  const uploadNewsImage = useUploadNewsImage();
  const { register, handleSubmit, reset, watch, setValue } = useForm<NewsForm>({
    defaultValues: {
      status: 'draft',
      featured: false,
    },
  });

  const selectedStatus = watch('status');
  const posts = (data?.data || []) as NewsRow[];
  const auditLogs = auditData?.data || [];
  const filtering = Boolean(search.trim() || statusFilter);

  const onSubmit = async (values: NewsForm) => {
    await createNews.mutateAsync({
      ...values,
      imageUrl: values.imageUrl?.trim() || undefined,
      slug: values.slug?.trim() || undefined,
      scheduledFor: values.status === 'scheduled' ? values.scheduledFor || undefined : undefined,
    });
    reset({
      title: '',
      summary: '',
      content: '',
      slug: '',
      imageUrl: '',
      status: 'draft',
      scheduledFor: '',
      featured: false,
    });
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const uploaded = await uploadNewsImage.mutateAsync(file);
    setValue('imageUrl', uploaded.url, { shouldDirty: true });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={[ADMIN_HOME_CRUMB, { label: 'News' }]}
        title="News"
        description="Write, review, schedule and publish news posts."
      />

      <FormSection title="New post">
        <form onSubmit={handleSubmit(onSubmit)} className={formGridClass}>
          <Field label="Title" htmlFor="news-title">
            <Input id="news-title" {...register('title')} />
          </Field>
          <Field label="Slug" htmlFor="news-slug" hint="Optional. Made from the title when left blank.">
            <Input id="news-slug" {...register('slug')} placeholder="optional-custom-slug" />
          </Field>
          <Field label="Summary" htmlFor="news-summary" full>
            <Textarea id="news-summary" rows={3} {...register('summary')} />
          </Field>
          <Field label="Content" htmlFor="news-content" full>
            <Textarea id="news-content" rows={6} {...register('content')} />
          </Field>
          <Field label="Status" htmlFor="news-status">
            <Select id="news-status" {...register('status')}>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {statusLabel(status)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Scheduled for" htmlFor="news-scheduled-for" hint="Only used when the status is Scheduled.">
            <Input
              id="news-scheduled-for"
              type="datetime-local"
              {...register('scheduledFor')}
              disabled={selectedStatus !== 'scheduled'}
            />
          </Field>
          <Field label="Upload image" htmlFor="news-image-upload">
            <Input id="news-image-upload" type="file" accept="image/*" onChange={handleImageUpload} />
          </Field>
          <Field label="Image URL" htmlFor="news-image-url">
            <Input id="news-image-url" {...register('imageUrl')} />
          </Field>
          <CheckboxField label="Mark as featured" {...register('featured')} />
          <FormActions>
            <Button type="submit" disabled={createNews.isPending || uploadNewsImage.isPending}>
              {createNews.isPending ? 'Saving...' : 'Create post'}
            </Button>
          </FormActions>
        </form>
      </FormSection>

      <section className="grid gap-6 xl:grid-cols-[2fr,1fr]">
        <div className="min-w-0 space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="text-xl font-semibold text-foreground">Posts</h2>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Input
                aria-label="Search posts"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search title, summary, content..."
              />
              <Select
                aria-label="Filter by status"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="sm:w-44"
              >
                <option value="">All statuses</option>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {statusLabel(status)}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {isLoading ? (
            <TableSkeleton label="Loading news posts" />
          ) : isError && posts.length === 0 ? (
            <LoadError what="news posts" onRetry={() => refetch()} />
          ) : (
            <SimpleTable
              emptyMessage={filtering ? 'No news posts match the current filters.' : 'No news posts yet.'}
              columns={[
                {
                  key: 'title',
                  header: 'Post',
                  render: (post: NewsRow) => (
                    <div className="space-y-1">
                      <p className="font-semibold text-foreground">{post.title}</p>
                      {post.summary && <p className="line-clamp-2 text-sm text-muted">{post.summary}</p>}
                      <p className="text-xs text-muted">Slug: {post.slug}</p>
                    </div>
                  ),
                },
                {
                  key: 'status',
                  header: 'Status',
                  render: (post: NewsRow) => (
                    <div className="space-y-1">
                      <div className="flex flex-wrap gap-2">
                        <Badge tone={statusTone(post.status)}>{statusLabel(post.status)}</Badge>
                        {post.featured && <Badge tone="gold">Featured</Badge>}
                      </div>
                      {post.scheduled_for && (
                        <p className="text-xs text-muted">Scheduled: {new Date(post.scheduled_for).toLocaleString()}</p>
                      )}
                    </div>
                  ),
                },
                {
                  key: 'actions',
                  header: 'Actions',
                  render: (post: NewsRow) => (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setPendingDelete(post)}
                      disabled={deleteNews.isPending}
                      aria-label={`Delete ${post.title}`}
                    >
                      Delete
                    </Button>
                  ),
                },
              ]}
              data={posts}
            />
          )}
        </div>

        <aside className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Recent changes</h2>
          {auditLogs.length === 0 ? (
            <p className="rounded-card border border-dashed border-input bg-surface/50 px-4 py-6 text-center text-sm text-muted">
              No audit entries yet.
            </p>
          ) : (
            <ul className="divide-y divide-border rounded-card border border-border bg-card">
              {auditLogs.map((log: any) => (
                <li key={log.id} className="space-y-1 p-4">
                  <p className="text-sm font-semibold text-foreground">{log.summary}</p>
                  <p className="text-xs text-muted">{log.actor_name || log.actor_email || 'System'}</p>
                  <p className="text-xs text-muted">{new Date(log.created_at).toLocaleString()}</p>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </section>

      {/* Ruling 7: deleting a post now asks first, like every other delete in admin. */}
      {pendingDelete && (
        <ConfirmDialog
          title={`Delete "${pendingDelete.title}"?`}
          description="This post will be removed for everyone. This cannot be undone."
          confirmLabel="Delete post"
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => {
            deleteNews.mutate(pendingDelete.id);
            setPendingDelete(null);
          }}
        />
      )}
    </div>
  );
}
