import { router } from 'expo-router';
import React from 'react';

import { ErrorState, ListGroup, ListRow, LoadingList, Screen, ScreenHeader, Scripture, SectionHeader } from '@/components/kit';
import { AppText } from '@/components/ui/app-text';
import { AppCard } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { useDevotionalArchive, useTodayDevotional, type Devotional } from '@/hooks/use-api';

// publish_date is YYYY-MM-DD; format in UTC so it never shifts a day.
const formatDay = (ymd: string) =>
  new Date(`${ymd}T00:00:00Z`).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' });

export default function DailyDevotionalScreen() {
  const todayQuery = useTodayDevotional();
  const archiveQuery = useDevotionalArchive();
  const [selected, setSelected] = React.useState<Devotional | null>(null);
  const devotional = selected ?? todayQuery.data ?? null;
  const archive = (archiveQuery.data ?? []).filter((item) => item.id !== devotional?.id);
  const subtitle = devotional
    ? `${formatDay(devotional.publish_date)}${devotional.is_today === false && !selected ? ' · latest' : ''}`
    : undefined;

  return (
    <Screen>
      <ScreenHeader
        onBack={() => (selected ? setSelected(null) : router.back())}
        eyebrow="Daily devotional"
        title={devotional?.title || 'Daily devotional'}
        subtitle={subtitle}
      />

      {todayQuery.isLoading ? (
        <LoadingList count={2} height={140} />
      ) : todayQuery.isError ? (
        <ErrorState title="Could not load the devotional" onRetry={() => todayQuery.refetch()} />
      ) : !devotional ? (
        <EmptyState icon="book-outline" title="No devotional yet" message="No devotional has been published yet." />
      ) : (
        <>
          <Scripture text={devotional.scripture_text} reference={devotional.scripture_reference} />
          <AppCard>
            <AppText>{devotional.body}</AppText>
          </AppCard>
          {devotional.prayer ? (
            <AppCard>
              <AppText variant="caption" tone="gold">
                PRAYER
              </AppText>
              <AppText serif>{devotional.prayer}</AppText>
            </AppCard>
          ) : null}
        </>
      )}

      {archive.length > 0 ? (
        <>
          <SectionHeader title="Earlier devotionals" />
          <ListGroup>
            {archive.map((item) => (
              <ListRow key={item.id} icon="book-outline" label={item.title} description={formatDay(item.publish_date)} onPress={() => setSelected(item)} />
            ))}
          </ListGroup>
        </>
      ) : null}
    </Screen>
  );
}
