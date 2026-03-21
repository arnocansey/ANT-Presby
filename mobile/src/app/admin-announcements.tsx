import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, StyleSheet, Switch, TextInput, View } from 'react-native';

import { AdminShell } from '@/components/admin-shell';
import { BrandButton, BrandCard, BrandPill } from '@/components/brand-ui';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useAdminNews, useCreateNewsPost } from '@/hooks/use-api';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/store/auth';

type FormValues = {
  title: string;
  message: string;
  urgent: boolean;
};

export default function AdminAnnouncementsScreen() {
  const theme = useTheme();
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'admin';
  const newsQuery = useAdminNews(isAdmin);
  const createMutation = useCreateNewsPost();
  const { control, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: { title: '', message: '', urgent: false },
  });

  if (!user || !isAdmin) return null;

  const onSubmit = async (values: FormValues) => {
    await createMutation.mutateAsync({
      title: values.title,
      content: values.message,
      excerpt: values.message.slice(0, 160),
      status: 'published',
      featured: values.urgent,
      notifySubscribers: true,
    });
    reset();
  };

  const posts = Array.isArray(newsQuery.data) ? newsQuery.data : [];

  return (
    <AdminShell activeTab="/admin-news">
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} style={[styles.iconButton, { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: theme.border }]}>
          <Ionicons name="chevron-back" size={16} color={theme.textSecondary} />
        </Pressable>
        <View style={styles.headerCopy}>
          <ThemedText type="smallBold" style={{ color: '#818CF8', textTransform: 'uppercase', letterSpacing: 1 }}>
            Admin
          </ThemedText>
          <ThemedText type="subtitle">Send Announcement</ThemedText>
        </View>
      </View>

      <BrandCard>
        <Field control={control} name="title" label="Announcement Title" placeholder="Sunday service update" />
        <Field control={control} name="message" label="Message Body" placeholder="Write your announcement..." multiline />
        <View style={styles.switchRow}>
          <ThemedText type="smallBold">Mark as urgent</ThemedText>
          <Controller
            control={control}
            name="urgent"
            render={({ field: { value, onChange } }) => <Switch value={value} onValueChange={onChange} />}
          />
        </View>
        <BrandButton label="Send Now" onPress={handleSubmit(onSubmit)} variant="secondary" />
      </BrandCard>

      <BrandCard>
        <ThemedText type="defaultSemiBold">Recent announcements</ThemedText>
        {posts.slice(0, 6).map((post: any) => (
          <View key={String(post?.id)} style={styles.postRow}>
            <View style={styles.postCopy}>
              <ThemedText type="defaultSemiBold">{post?.title || 'Announcement'}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {post?.excerpt || post?.content || 'No message'}
              </ThemedText>
            </View>
            <BrandPill>{post?.status || 'published'}</BrandPill>
          </View>
        ))}
      </BrandCard>
    </AdminShell>
  );
}

function Field({
  control, name, label, placeholder, multiline = false,
}: {
  control: any; name: keyof FormValues; label: string; placeholder: string; multiline?: boolean;
}) {
  const theme = useTheme();
  return (
    <View style={styles.field}>
      <ThemedText type="smallBold">{label}</ThemedText>
      <Controller
        control={control}
        name={name}
        render={({ field: { value, onChange, onBlur } }) => (
          <TextInput
            value={String(value ?? '')}
            onChangeText={onChange}
            onBlur={onBlur}
            placeholder={placeholder}
            placeholderTextColor={theme.textSecondary}
            multiline={multiline}
            style={[
              styles.input,
              multiline && styles.multiline,
              { backgroundColor: theme.background, borderColor: theme.border, color: theme.text },
            ]}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  headerCopy: { flex: 1, gap: 2 },
  iconButton: { width: 38, height: 38, borderRadius: Radius.pill, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  field: { gap: Spacing.one },
  input: { borderWidth: 1, borderRadius: Radius.medium, paddingHorizontal: Spacing.three, paddingVertical: Spacing.three, fontSize: 16 },
  multiline: { minHeight: 110, textAlignVertical: 'top' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  postRow: { gap: Spacing.one, paddingVertical: Spacing.two, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  postCopy: { gap: 4 },
});
