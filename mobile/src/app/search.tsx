import { router } from 'expo-router';
import React from 'react';

import { ListGroup, ListRow, LoadingList, Screen, ScreenHeader, SectionHeader } from '@/components/kit';
import { AppText } from '@/components/ui/app-text';
import { TextField } from '@/components/ui/text-field';
import { useGlobalSearch } from '@/hooks/use-api';

export default function SearchScreen() {
  const [query, setQuery] = React.useState('');
  const searchQuery = useGlobalSearch(query);
  const sermons = searchQuery.data?.sermons || [];
  const events = searchQuery.data?.events || [];

  return (
    <Screen>
      <ScreenHeader back title="Search" subtitle="Find sermons and events" />

      <TextField
        label="Search"
        value={query}
        onChangeText={setQuery}
        placeholder="Search sermons, speakers, events..."
        returnKeyType="search"
      />

      {query.trim().length < 2 ? (
        <AppText variant="small" tone="muted">
          Enter at least 2 characters to search.
        </AppText>
      ) : searchQuery.isLoading ? (
        <LoadingList count={2} height={56} />
      ) : (
        <>
          <SectionHeader title={`Sermons (${sermons.length})`} />
          {sermons.length > 0 ? (
            <ListGroup>
              {sermons.map((sermon: any) => (
                <ListRow
                  key={String(sermon?.id)}
                  icon="play-outline"
                  label={sermon?.title || 'Sermon'}
                  description={sermon?.speaker || undefined}
                  onPress={() => router.push(`/sermons/${sermon?.id}` as never)}
                />
              ))}
            </ListGroup>
          ) : (
            <AppText variant="small" tone="muted">
              No sermons found.
            </AppText>
          )}

          <SectionHeader title={`Events (${events.length})`} />
          {events.length > 0 ? (
            <ListGroup>
              {events.map((event: any) => (
                <ListRow
                  key={String(event?.id)}
                  icon="calendar-outline"
                  label={event?.name || 'Event'}
                  onPress={() => router.push({ pathname: '/events/[id]', params: { id: String(event?.id) } })}
                />
              ))}
            </ListGroup>
          ) : (
            <AppText variant="small" tone="muted">
              No events found.
            </AppText>
          )}
        </>
      )}
    </Screen>
  );
}
