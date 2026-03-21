import { useLocalSearchParams, router } from 'expo-router';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, Switch, TextInput, View } from 'react-native';

import { BrandButton, BrandCard, BrandHero, BrandPill, BrandScreen, BrandSectionHeader } from '@/components/brand-ui';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { getApiErrorMessage, useAdminNews, useUpdateNewsPost } from '@/hooks/use-api';
import { useTheme } from '@/hooks/use-theme';
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
      <BrandScreen>
        <BrandHero eyebrow="Edit News" title="Admin access required" description="Sign in with an admin account to edit news posts." />
      </BrandScreen>
    );
  }

  return (
    <BrandScreen>
      <BrandHero eyebrow="Edit News" title={post?.title || 'Edit news post'} description="Update the post and push changes back through the live admin backend." />
      <BrandCard>
        <BrandPill>Edit</BrandPill>
        <BrandSectionHeader title="Edit post" description="Make changes and save them back to ANT PRESS." />
        {!post ? (
          <ThemedText type="small">Loading post...</ThemedText>
        ) : (
          <>
            <Field control={control} name="title" label="Title" placeholder="News title" />
            <Field control={control} name="excerpt" label="Excerpt" placeholder="Short summary" multiline />
            <Field control={control} name="content" label="Content" placeholder="Write the announcement" multiline />
            <Toggle control={control} name="status" label="Publish immediately" />
            <Toggle control={control} name="featured" label="Feature this post" booleanValue />
            <Toggle control={control} name="notifySubscribers" label="Notify subscribers" booleanValue />
            <BrandButton label="Save Changes" onPress={handleSubmit(onSubmit)} variant="secondary" />
            {updateMutation.isError ? (
              <ThemedText style={styles.errorText}>{getApiErrorMessage(updateMutation.error, 'Failed to update news post.')}</ThemedText>
            ) : null}
          </>
        )}
      </BrandCard>
    </BrandScreen>
  );
}

function Field({ control, name, label, placeholder, multiline = false }: { control: any; name: keyof NewsFormValues; label: string; placeholder: string; multiline?: boolean }) {
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
            style={[styles.input, multiline && styles.multiline, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
          />
        )}
      />
    </View>
  );
}

function Toggle({ control, name, label, booleanValue = false }: { control: any; name: keyof NewsFormValues; label: string; booleanValue?: boolean }) {
  return (
    <View style={styles.toggleRow}>
      <ThemedText type="smallBold">{label}</ThemedText>
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, value } }) => (
          <Switch
            value={booleanValue ? Boolean(value) : value === 'published'}
            onValueChange={(enabled) => onChange(booleanValue ? enabled : enabled ? 'published' : 'draft')}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: Spacing.one },
  input: {
    borderWidth: 1,
    borderRadius: Radius.medium,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    fontSize: 16,
  },
  multiline: { minHeight: 110, textAlignVertical: 'top' },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.two },
  errorText: { color: '#B91C1C' },
});
