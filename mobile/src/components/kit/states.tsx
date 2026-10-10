import React from 'react';
import { StyleSheet, View } from 'react-native';

import type { IconName } from '@/components/kit/icon-button';
import { AppButton } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Corner, Space } from '@/constants/tokens';

export function LoadingList({ count = 3, height = 88 }: { count?: number; height?: number }) {
  return (
    <View accessibilityLabel="Loading" style={styles.list}>
      {Array.from({ length: count }, (_, index) => (
        <Skeleton key={index} height={height} radius={Corner.card} />
      ))}
    </View>
  );
}

export function ErrorState({
  title = 'Could not load this',
  message = 'Check your connection and try again.',
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <EmptyState
      icon="cloud-offline-outline"
      title={title}
      message={message}
      action={onRetry ? <AppButton label="Try again" variant="secondary" onPress={onRetry} /> : undefined}
    />
  );
}

export function SignInPrompt({
  title,
  message,
  onSignIn,
  label = 'Sign in',
  icon = 'person-circle-outline',
}: {
  title: string;
  message: string;
  onSignIn: () => void;
  label?: string;
  icon?: IconName;
}) {
  return (
    <EmptyState
      icon={icon}
      title={title}
      message={message}
      action={
        <View style={styles.action}>
          <AppButton label={label} onPress={onSignIn} />
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  list: { gap: Space.sm },
  action: { alignSelf: 'stretch' },
});
