import { useLocalSearchParams, router } from 'expo-router';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';

import { FormMessage, FormTextField, ErrorState, LoadingList, Screen, ScreenHeader, SwitchRow } from '@/components/kit';
import { EmptyState } from '@/components/ui/empty-state';
import { AppButton } from '@/components/ui/button';
import { AppCard } from '@/components/ui/card';
import { getApiErrorMessage, useAdminNews, useUpdateNewsPost } from '@/hooks/use-api';
import { useAuthStore } from '@/store/auth';

type NewsFormValues = {
  title: string;
  excerpt: string;
  content: string;
  status: 'draft' | 'published';
  featured: boolean;
  notifySubscribers: boolean;
};

export default function AdminNewsEditScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'admin';
  const newsQuery = useAdminNews(isAdmin);
  const updateMutation = useUpdateNewsPost();
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

  const post = React.useMemo(
    () => (newsQuery.data || []).find((item: any) => String(item?.id) === String(params.id)),
    [newsQuery.data, params.id]
  );

  React.useEffect(() => {
    if (post) {
      reset({
        title: post.title || '',
        excerpt: post.excerpt || '',
        content: post.content || '',
        status: post.status === 'published' ? 'published' : 'draft',
        featured: Boolean(post.featured),
        notifySubscribers: false,
      });
    }
  }, [post, reset]);

  const onSubmit = async (values: NewsFormValues) => {
    try {
      await updateMutation.mutateAsync({ id: Number(params.id), payload: values });
      router.back();
    } catch {
      // inline error handles this
    }
  };

  if (!user || !isAdmin) {
    return (
      <Screen>
        <ScreenHeader back eyebrow="Edit news" title="Admin access required" subtitle="Sign in with an admin account to edit news posts." />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader back eyebrow="Edit news" title={post?.title || 'Edit news post'} />
      {!post ? (
        newsQuery.isLoading ? (
          <LoadingList count={3} height={72} />
        ) : newsQuery.isError ? (
          <ErrorState title="Could not load this news post" onRetry={() => newsQuery.refetch()} />
        ) : (
          <EmptyState icon="alert-circle-outline" title="News post not found" message="It may have been deleted." />
        )
      ) : (
        <AppCard>
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
            render={({ field: { onChange, value } }) => (
              <SwitchRow label="Feature this post" value={Boolean(value)} onValueChange={onChange} />
            )}
          />
          <Controller
            control={control}
            name="notifySubscribers"
            render={({ field: { onChange, value } }) => (
              <SwitchRow label="Notify subscribers" value={Boolean(value)} onValueChange={onChange} />
            )}
          />
          <AppButton label="Save changes" onPress={handleSubmit(onSubmit)} loading={updateMutation.isPending} />
          {updateMutation.isError ? (
            <FormMessage tone="danger">{getApiErrorMessage(updateMutation.error, 'Failed to update news post.')}</FormMessage>
          ) : null}
        </AppCard>
      )}
    </Screen>
  );
}
