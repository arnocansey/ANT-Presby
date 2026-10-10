import { router } from 'expo-router';
import React from 'react';

import { ListGroup, ListRow, LoadingList, Screen, ScreenHeader } from '@/components/kit';
import { EmptyState } from '@/components/ui/empty-state';
import { useMinistries } from '@/hooks/use-api';

export default function MinistriesScreen() {
  const ministriesQuery = useMinistries();
  const ministries = ministriesQuery.data || [];

  return (
    <Screen>
      <ScreenHeader back title="Ministries" subtitle="Serve, grow and connect. Open a ministry to see its sermons." />

      {ministriesQuery.isLoading ? (
        <LoadingList />
      ) : ministries.length > 0 ? (
        <ListGroup>
          {ministries.map((ministry: any) => (
            <ListRow
              key={String(ministry?.id)}
              icon="sparkles-outline"
              label={ministry?.name || 'Ministry'}
              description={ministry?.description || 'No ministry description provided yet.'}
              accessibilityLabel={`View sermons from ${ministry?.name || 'this ministry'}`}
              onPress={() => router.push(`/ministries/${ministry?.id}` as never)}
            />
          ))}
        </ListGroup>
      ) : (
        <EmptyState icon="sparkles-outline" title="No ministries available right now" />
      )}
    </Screen>
  );
}
