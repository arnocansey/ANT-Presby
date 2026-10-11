import React from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { AppButton } from '@/components/ui/button';
import { AppCard } from '@/components/ui/card';
import { Space } from '@/constants/tokens';
import { getApiErrorMessage, useAdjustHeadcount, type EventAttendance } from '@/hooks/use-api';

// Adults and children counters, added on top of the people checked in by name.
export function HeadcountCard({ sheet, disabled }: { sheet: EventAttendance; disabled: boolean }) {
  const adjust = useAdjustHeadcount(sheet.event.id);
  const change = (delta: { adults?: 1 | -1; children?: 1 | -1 }) =>
    adjust.mutate(delta, {
      onError: (error) => Alert.alert('Could not update the count', getApiErrorMessage(error, 'Please try again.')),
    });

  const rows = [
    { key: 'adults' as const, label: 'Adults', value: sheet.headcount.adults },
    { key: 'children' as const, label: 'Children', value: sheet.headcount.children },
  ];

  return (
    <AppCard>
      <AppText variant="bodyStrong">Headcount</AppText>
      {rows.map((row) => (
        <View key={row.key} style={styles.row}>
          <AppText style={styles.flex}>{row.label}</AppText>
          <AppButton
            label="−"
            size="sm"
            variant="secondary"
            accessibilityLabel={`One fewer ${row.label.toLowerCase()}`}
            disabled={disabled || row.value === 0}
            onPress={() => change({ [row.key]: -1 })}
          />
          <AppText variant="title" style={styles.value} accessibilityLiveRegion="polite">
            {String(row.value)}
          </AppText>
          <AppButton
            label="+"
            size="sm"
            accessibilityLabel={`One more ${row.label.toLowerCase()}`}
            disabled={disabled}
            onPress={() => change({ [row.key]: 1 })}
          />
        </View>
      ))}
      <AppText variant="small" tone="muted">
        {`${sheet.totals.total} present: ${sheet.totals.named} named, ${sheet.totals.adults} adults, ${sheet.totals.children} children counted`}
      </AppText>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Space.sm },
  flex: { flex: 1 },
  value: { minWidth: 56, textAlign: 'center', fontVariant: ['tabular-nums'] },
});
