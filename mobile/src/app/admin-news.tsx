import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, Switch, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { AdminShell } from '@/components/admin-shell';
import {
  BrandButton,
  BrandCard,
  BrandHero,
  BrandPill,
  BrandScreen,
  BrandSectionHeader,
} from '@/components/brand-ui';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
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
      <BrandScreen>
        <BrandHero
          eyebrow="Admin News"
          title="Admin access required"
          description="Sign in with an admin account to create and manage news posts from mobile."
        />
      </BrandScreen>
    );
  }

  const posts = newsQuery.data || [];
  const createErrorMessage = createMutation.isError
    ? getApiErrorMessage(createMutation.error, 'Failed to create news post.')
    : '';

  return (
    <AdminShell activeTab="/admin-news">
      <BrandHero
        eyebrow="Admin News"
        title="Manage news on mobile"
        description="Create new posts quickly and remove outdated announcements without opening the desktop dashboard."
      />

      <BrandCard>
        <BrandPill>Compose</BrandPill>
        <BrandSectionHeader
          title="Create a news post"
          description="A compact mobile composer for draft or published announcements."
        />

        <FormField control={control} name="title" label="Title" placeholder="News title" />
        <FormField control={control} name="excerpt" label="Excerpt" placeholder="Short summary" multiline />
        <FormField control={control} name="content" label="Content" placeholder="Write the announcement" multiline />

        <View style={styles.toggleRow}>
          <ThemedText type="smallBold">Publish immediately</ThemedText>
          <Controller
            control={control}
            name="status"
            render={({ field: { onChange, value } }) => (
              <Switch value={value === 'published'} onValueChange={(enabled) => onChange(enabled ? 'published' : 'draft')} />
            )}
          />
        </View>

        <View style={styles.toggleRow}>
          <ThemedText type="smallBold">Feature this post</ThemedText>
          <Controller
            control={control}
            name="featured"
            render={({ field: { onChange, value } }) => <Switch value={value} onValueChange={onChange} />}
          />
        </View>

        <View style={styles.toggleRow}>
          <ThemedText type="smallBold">Notify subscribers</ThemedText>
          <Controller
            control={control}
            name="notifySubscribers"
            render={({ field: { onChange, value } }) => <Switch value={value} onValueChange={onChange} />}
          />
        </View>

        <BrandButton label="Create News Post" onPress={handleSubmit(onSubmit)} variant="secondary" />

        {createMutation.isError ? (
          <ThemedText style={styles.errorText}>{createErrorMessage}</ThemedText>
        ) : null}
      </BrandCard>

      <BrandCard>
        <BrandPill>Library</BrandPill>
        <BrandSectionHeader
          title="Recent news posts"
          description="Review the latest posts and remove any that should no longer be visible."
        />
        {newsQuery.isLoading ? (
          <ThemedText type="small">Loading news posts...</ThemedText>
        ) : posts.length > 0 ? (
          <View style={styles.list}>
            {posts.slice(0, 8).map((post: any) => (
              <View key={String(post?.id)} style={styles.listItem}>
                <View style={styles.headerRow}>
                  <ThemedText type="defaultSemiBold">{post?.title || 'News post'}</ThemedText>
                  <BrandPill>{String(post?.status || 'draft')}</BrandPill>
                </View>
                <ThemedText type="small">{post?.excerpt || post?.content || 'No summary available.'}</ThemedText>
                <BrandButton
                  label="Edit Post"
                  onPress={() => router.push(`/admin-news/${post?.id}` as never)}
                  variant="secondary"
                />
                <BrandButton
                  label="Delete Post"
                  onPress={() => deleteMutation.mutate(Number(post?.id))}
                  variant="outline"
                />
              </View>
            ))}
          </View>
        ) : (
          <ThemedText type="small">No news posts yet.</ThemedText>
        )}
      </BrandCard>
    </AdminShell>
  );
}

function FormField({
  control,
  name,
  label,
  placeholder,
  multiline = false,
}: {
  control: any;
  name: keyof NewsFormValues;
  label: string;
  placeholder: string;
  multiline?: boolean;
}) {
  const theme = useTheme();

  return (
    <View style={styles.field}>
      <ThemedText type="smallBold">{label}</ThemedText>
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            value={String(value ?? '')}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder={placeholder}
            placeholderTextColor={theme.textSecondary}
            multiline={multiline}
            style={[
              styles.input,
              multiline && styles.multilineInput,
              {
                backgroundColor: theme.background,
                borderColor: theme.border,
                color: theme.text,
              },
            ]}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: Spacing.one,
  },
  input: {
    borderWidth: 1,
    borderRadius: Radius.medium,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    fontSize: 16,
  },
  multilineInput: {
    minHeight: 110,
    textAlignVertical: 'top',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  list: {
    gap: Spacing.two,
  },
  listItem: {
    gap: Spacing.one,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
  },
  errorText: {
    color: '#B91C1C',
  },
});
