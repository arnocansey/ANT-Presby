import { useLocalSearchParams, router } from 'expo-router';
import React from 'react';

import { ListGroup, ListRow, LoadingList, Screen, ScreenHeader } from '@/components/kit';
import { EmptyState } from '@/components/ui/empty-state';
import { useMinistrySermons } from '@/hooks/use-api';

export default function MinistryDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const ministryId = params.id;
  const sermonsQuery = useMinistrySermons(ministryId);
  const sermons = sermonsQuery.data || [];

  return (
    <Screen>
      <ScreenHeader back eyebrow="Ministry" title="Sermons from this ministry" />

      {sermonsQuery.isLoading ? (
        <LoadingList />
      ) : sermons.length > 0 ? (
        <ListGroup>
          {sermons.map((sermon: any) => (
            <ListRow
              key={String(sermon?.id)}
              icon="play-outline"
              label={sermon?.title || 'Untitled sermon'}
              description={[sermon?.speaker, sermon?.description].filter(Boolean).join(' · ') || 'No description provided.'}
              onPress={() => router.push(`/sermons/${sermon?.id}` as never)}
            />
          ))}
        </ListGroup>
      ) : (
        <EmptyState icon="play-circle-outline" title="No sermons found for this ministry" />
      )}
    </Screen>
  );
}
