import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Corner, Space } from '@/constants/tokens';
import { useAppTheme } from '@/hooks/use-app-theme';

export function EmptyState({
  icon = 'file-tray-outline',
  title,
  message,
  action,
}: {
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  message?: string;
  action?: React.ReactNode;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.box, { borderColor: colors.input, backgroundColor: colors.surface }]}>
      <Ionicons name={icon} size={28} color={colors.muted} />
      <AppText variant="bodyStrong" style={styles.center}>
        {title}
      </AppText>
      {message ? (
        <AppText variant="small" tone="muted" style={styles.center}>
          {message}
        </AppText>
      ) : null}
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', gap: Space.sm, borderWidth: 1, borderStyle: 'dashed', borderRadius: Corner.card, padding: Space.lg },
  center: { textAlign: 'center' },
});

export default EmptyState;
