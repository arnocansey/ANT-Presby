import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { BrandButton, BrandCard, BrandHero, BrandScreen, BrandSectionHeader } from '@/components/brand-ui';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useGlobalSearch } from '@/hooks/use-api';
import { useTheme } from '@/hooks/use-theme';

export default function SearchScreen() {
  const theme = useTheme();
  const [query, setQuery] = React.useState('');
  const searchQuery = useGlobalSearch(query);
  const sermons = searchQuery.data?.sermons || [];
  const events = searchQuery.data?.events || [];

  return (
    <BrandScreen>
      <BrandHero
        eyebrow="Search"
        title="Find sermons and events"
        description="The same website search idea, shaped into a mobile-first content finder."
      />

      <BrandCard>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search sermons, speakers, events..."
          placeholderTextColor={theme.textSecondary}
          style={[
            styles.input,
            {
              backgroundColor: theme.background,
              borderColor: theme.border,
              color: theme.text,
            },
          ]}
        />
      </BrandCard>

      {query.trim().length < 2 ? (
        <BrandCard>
          <ThemedText type="small">Enter at least 2 characters to search.</ThemedText>
        </BrandCard>
      ) : (
        <>
          <BrandCard>
            <BrandSectionHeader title="Sermons" description={`${sermons.length} results`} />
            {sermons.length > 0 ? (
              <View style={styles.list}>
                {sermons.map((sermon: any) => (
                  <BrandButton
                    key={String(sermon?.id)}
                    label={sermon?.title || 'Sermon'}
                    onPress={() => router.push(`/sermons/${sermon?.id}` as never)}
                    variant="outline"
                  />
                ))}
              </View>
            ) : (
              <ThemedText type="small">No sermons found.</ThemedText>
            )}
          </BrandCard>

          <BrandCard>
            <BrandSectionHeader title="Events" description={`${events.length} results`} />
            {events.length > 0 ? (
              <View style={styles.list}>
                {events.map((event: any) => (
                  <BrandButton
                    key={String(event?.id)}
                    label={event?.name || 'Event'}
                    onPress={() => router.push({ pathname: '/events/[id]', params: { id: String(event?.id) } })}
                    variant="outline"
                  />
                ))}
              </View>
            ) : (
              <ThemedText type="small">No events found.</ThemedText>
            )}
          </BrandCard>
        </>
      )}
    </BrandScreen>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderRadius: Radius.medium,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    fontSize: 16,
  },
  list: {
    gap: Spacing.two,
  },
});
