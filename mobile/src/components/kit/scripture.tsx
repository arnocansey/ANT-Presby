import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Space } from '@/constants/tokens';
import { useAppTheme } from '@/hooks/use-app-theme';

// Scripture and quotes: serif text with the 3px gold left rule (spec §2.2).
export function Scripture({ text, reference, lines }: { text: string; reference?: string | null; lines?: number }) {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.rule, { borderLeftColor: colors.gold }]}>
      <AppText serif numberOfLines={lines} style={styles.text}>
        {text}
      </AppText>
      {reference ? (
        <AppText variant="small" tone="muted" style={styles.reference}>
          {reference}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  rule: { borderLeftWidth: 3, paddingLeft: Space.md, gap: Space.xs },
  text: { fontSize: 18, lineHeight: 28, fontStyle: 'italic' },
  reference: { fontWeight: '600' },
});
