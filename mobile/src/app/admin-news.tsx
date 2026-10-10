import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { AdminShell } from '@/components/admin-shell';
import { FormMessage, FormTextField, LoadingList, Screen, ScreenHeader, SectionHeader, SwitchRow, statusTone } from '@/components/kit';
import { AppText } from '@/components/ui/app-text';
import { AppBadge } from '@/components/ui/badge';
import { AppButton } from '@/components/ui/button';
import { AppCard } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Space } from '@/constants/tokens';
import { useAdminNews, useCreateNewsPost, useDeleteNewsPost, getApiErrorMessage } from '@/hooks/use-api';
import { useAuthStore } from '@/store/auth';

type NewsFormValues = {
  title: string;
  excerpt: string;
  content: string;
  status: 'draft' | 'published';
  featured: boolean;
  notifySubscribers: boolean;
};

export default function AdminNewsScreen() {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'admin';
  const newsQuery = useAdminNews(isAdmin);
  const createMutation = useCreateNewsPost();
  const deleteMutation = useDeleteNewsPost();

  const { control, handleSubmit, reset } = useForm<NewsFormValues>({
    defaultValues: {
      title: '',
      excerpt: '',
      content: '',
      status: 'draft',
      featured: false,
      notifySubscribers: false,
    },
  });

  const onSubmit = async (values: NewsFormValues) => {
    try {
      await createMutation.mutateAsync(values);
      reset();
    } catch {
      // Inline error state handles this.
    }
  };

  if (!user || !isAdmin) {
    return (
      <Screen>
        <ScreenHeader
          back
          eyebrow="Admin news"
          title="Admin access required"
          subtitle="Sign in with an admin account to create and manage news posts from mobile."
        />
      </Screen>
    );
  }

  const posts = newsQuery.data || [];
  const createErrorMessage = createMutation.isError
    ? getApiErrorMessage(createMutation.error, 'Failed to create news post.')
    : '';

  return (
    <AdminShell activeTab="/admin-news">
      <ScreenHeader back eyebrow="Admin" title="News" subtitle="Create posts and remove outdated announcements." />

      <AppCard>
        <AppText variant="section">Create a news post</AppText>
        <FormTextField control={control} name="title" label="Title" placeholder="News title" />
        <FormTextField control={control} name="excerpt" label="Excerpt" placeholder="Short summary" multiline />
        <FormTextField control={control} name="content" label="Content" placeholder="Write the announcement" multiline />
        <Controller
          control={control}
          name="status"
          render={({ field: { onChange, value } }) => (
            <SwitchRow
              label="Publish immediately"
              value={value === 'published'}
              onValueChange={(enabled) => onChange(enabled ? 'published' : 'draft')}
            />
          )}
        />
        <Controller
          control={control}
          name="featured"
          render={({ field: { onChange, value } }) => <SwitchRow label="Feature this post" value={value} onValueChange={onChange} />}
        />
        <Controller
          control={control}
          name="notifySubscribers"
          render={({ field: { onChange, value } }) => <SwitchRow label="Notify subscribers" value={value} onValueChange={onChange} />}
        />
        <AppButton label="Create news post" onPress={handleSubmit(onSubmit)} loading={createMutation.isPending} />
        {createMutation.isError ? <FormMessage tone="danger">{createErrorMessage}</FormMessage> : null}
      </AppCard>

      <SectionHeader title="Recent news posts" />
      {newsQuery.isLoading ? (
        <LoadingList count={3} height={120} />
      ) : posts.length > 0 ? (
        posts.slice(0, 8).map((post: any) => (
          <AppCard key={String(post?.id)}>
            <View style={styles.row}>
              <AppText variant="bodyStrong" style={styles.flex}>
                {post?.title || 'News post'}
              </AppText>
              <AppBadge tone={statusTone(post?.status || 'draft')}>{String(post?.status || 'draft')}</AppBadge>
            </View>
            <AppText variant="small" tone="muted" numberOfLines={3}>
              {post?.excerpt || post?.content || 'No summary available.'}
            </AppText>
            <View style={styles.actions}>
              <View style={styles.flex}>
                <AppButton label="Edit post" size="sm" variant="secondary" onPress={() => router.push(`/admin-news/${post?.id}` as never)} />
              </View>
              <View style={styles.flex}>
                <AppButton label="Delete post" size="sm" variant="danger" onPress={() => deleteMutation.mutate(Number(post?.id))} />
              </View>
            </View>
          </AppCard>
        ))
      ) : (
        <EmptyState icon="newspaper-outline" title="No news posts yet" />
      )}
    </AdminShell>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Space.sm },
  flex: { flex: 1 },
  actions: { flexDirection: 'row', gap: Space.sm },
});
