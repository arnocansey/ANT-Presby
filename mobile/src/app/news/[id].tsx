import { useLocalSearchParams } from 'expo-router';
import React from 'react';

import { BrandCard, BrandHero, BrandPill, BrandScreen } from '@/components/brand-ui';
import { ThemedText } from '@/components/themed-text';
import { useNewsPost } from '@/hooks/use-api';

export default function NewsDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const newsId = params.id;
  const newsQuery = useNewsPost(newsId);
  const post = newsQuery.data;

  return (
    <BrandScreen>
      <BrandHero
        eyebrow="Announcement"
        title={post?.title || 'News detail'}
        description={post?.excerpt || post?.summary || 'Read the full update from ANT PRESS.'}
      />

      {newsQuery.isLoading ? (
        <BrandCard>
          <ThemedText type="small">Loading announcement...</ThemedText>
        </BrandCard>
      ) : post ? (
        <>
          <BrandCard>
            <BrandPill>{post?.published_at || post?.publishedAt || 'Published'}</BrandPill>
            <ThemedText type="defaultSemiBold">{post?.title}</ThemedText>
            <ThemedText type="small">{post?.excerpt || post?.summary || 'Announcement summary.'}</ThemedText>
          </BrandCard>
          <BrandCard>
            <ThemedText type="defaultSemiBold">Full announcement</ThemedText>
            <ThemedText type="small">{post?.content || post?.excerpt || post?.summary || 'No content available.'}</ThemedText>
          </BrandCard>
        </>
      ) : (
        <BrandCard>
          <ThemedText type="small">Announcement not found.</ThemedText>
        </BrandCard>
      )}
    </BrandScreen>
  );
}
