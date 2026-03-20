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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

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

const statusOptions: NewsStatus[] = ['draft', 'review', 'scheduled', 'published', 'archived'];

export default function AdminNewsPage() {
  const [statusFilter, setStatusFilter] = React.useState<string>('');
  const [search, setSearch] = React.useState('');
  const { data, isLoading } = useAdminNews(1, 30, statusFilter || undefined, search || undefined);
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
  const posts = data?.data || [];
  const auditLogs = auditData?.data || [];

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
    <div className="container-max space-y-8 py-12">
      <section>
        <h1 className="mb-4 text-2xl font-extrabold tracking-tight sm:text-3xl">News Workflow</h1>
        <Card>
          <CardHeader>
            <CardTitle>Create Announcement</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="news-title">Title</Label>
                <Input id="news-title" {...register('title')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="news-slug">Slug</Label>
                <Input id="news-slug" {...register('slug')} placeholder="optional-custom-slug" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="news-summary">Summary</Label>
                <Textarea id="news-summary" rows={3} {...register('summary')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="news-content">Content</Label>
                <Textarea id="news-content" rows={6} {...register('content')} />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="news-status">Status</Label>
                  <select
                    id="news-status"
                    {...register('status')}
                    className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="news-scheduled-for">Scheduled For</Label>
                  <Input
                    id="news-scheduled-for"
                    type="datetime-local"
                    {...register('scheduledFor')}
                    disabled={selectedStatus !== 'scheduled'}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="news-image-upload">Upload Image</Label>
                <Input
                  id="news-image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="news-image-url">Image URL</Label>
                <Input id="news-image-url" {...register('imageUrl')} />
              </div>
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" {...register('featured')} className="h-4 w-4" />
                Mark as featured
              </label>
              <div className="flex justify-end">
                <Button type="submit" disabled={createNews.isPending || uploadNewsImage.isPending}>
                  {createNews.isPending ? 'Saving...' : 'Create Post'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[2fr,1fr]">
        <div>
          <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="text-xl font-bold tracking-tight">Existing Posts</h2>
            <div className="flex flex-col gap-3 md:flex-row">
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search title, summary, content..."
              />
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
              >
                <option value="">All statuses</option>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid gap-4">
            {isLoading && (
              <Card>
                <CardContent className="p-4 text-ui-subtle">Loading news posts...</CardContent>
              </Card>
            )}

            {!isLoading && posts.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="p-4 text-ui-subtle">No news posts match the current filters.</CardContent>
              </Card>
            )}

            {posts.map((post: any) => (
              <Card key={post.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{post.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-ui-subtle">{post.summary}</p>
                  <p className="text-xs text-ui-subtle">Slug: {post.slug}</p>
                  <p className="text-xs text-ui-subtle">
                    Status: {post.status} {post.featured ? '• Featured' : ''}
                  </p>
                  {post.scheduled_for && (
                    <p className="text-xs text-ui-subtle">
                      Scheduled: {new Date(post.scheduled_for).toLocaleString()}
                    </p>
                  )}
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      onClick={() => deleteNews.mutate(post.id)}
                      disabled={deleteNews.isPending}
                    >
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-3 text-xl font-bold tracking-tight">Recent Audit Trail</h2>
          <div className="grid gap-4">
            {auditLogs.map((log: any) => (
              <Card key={log.id}>
                <CardContent className="space-y-1 p-4">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">{log.summary}</p>
                  <p className="text-xs text-ui-subtle">
                    {log.actor_name || log.actor_email || 'System'}
                  </p>
                  <p className="text-xs text-ui-subtle">
                    {new Date(log.created_at).toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            ))}
            {!auditLogs.length && (
              <Card className="border-dashed">
                <CardContent className="p-4 text-ui-subtle">No audit entries yet.</CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
