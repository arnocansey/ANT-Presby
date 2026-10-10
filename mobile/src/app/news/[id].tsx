import { useLocalSearchParams } from 'expo-router';
import React from 'react';

import { LoadingList, Screen, ScreenHeader } from '@/components/kit';
import { AppText } from '@/components/ui/app-text';
import { AppBadge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { useNewsPost } from '@/hooks/use-api';

const formatPublished = (value?: string) => {
  if (!value) return 'Published';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
};

export default function NewsDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const newsId = params.id;
  const newsQuery = useNewsPost(newsId);
  const post = newsQuery.data;

  return (
    <Screen>
      <ScreenHeader back eyebrow="News" title={post?.title || 'News'} />

      {newsQuery.isLoading ? (
        <LoadingList count={2} height={120} />
      ) : post ? (
        <>
          <AppBadge>{formatPublished(post?.published_at || post?.publishedAt)}</AppBadge>
          {post?.excerpt || post?.summary ? (
            <AppText variant="bodyStrong" tone="muted">
              {post?.excerpt || post?.summary}
            </AppText>
          ) : null}
          <AppText>{post?.content || post?.excerpt || post?.summary || 'No content available.'}</AppText>
        </>
      ) : (
        <EmptyState icon="newspaper-outline" title="Announcement not found" />
      )}
    </Screen>
  );
}
