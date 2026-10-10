import { router } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IconButton } from '@/components/kit/icon-button';
import { AppText } from '@/components/ui/app-text';
import { MAX_CONTENT_WIDTH, Space } from '@/constants/tokens';
import { useAppTheme } from '@/hooks/use-app-theme';

// Page frame for every screen: token background, safe top edge, a centred column with 16px gutters.
export function Screen({ children, scroll = true }: { children: React.ReactNode; scroll?: boolean }) {
  const { colors } = useAppTheme();
  const body = <View style={styles.content}>{children}</View>;

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.safe, { backgroundColor: colors.background }]}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {body}
        </ScrollView>
      ) : (
        body
      )}
    </SafeAreaView>
  );
}

// Page title with an optional back button (router.back() unless onBack is given) and a right-hand slot.
export function ScreenHeader({
  title,
  subtitle,
  eyebrow,
  back = false,
  onBack,
  right,
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  back?: boolean;
  onBack?: () => void;
  right?: React.ReactNode;
}) {
  const showBack = back || Boolean(onBack);

  return (
    <View style={styles.header}>
      {showBack ? (
        <IconButton icon="chevron-back" accessibilityLabel="Go back" onPress={onBack ?? (() => router.back())} />
      ) : null}
      <View style={styles.headerCopy}>
        {eyebrow ? (
          <AppText variant="caption" tone="gold" style={styles.eyebrow}>
            {eyebrow}
          </AppText>
        ) : null}
        <AppText variant="title" accessibilityRole="header">
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="small" tone="muted">
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {right ? <View style={styles.headerRight}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flexGrow: 1 },
  content: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    padding: Space.md,
    paddingBottom: Space.xxl,
    gap: Space.md,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: Space.sm },
  headerCopy: { flex: 1, gap: 2 },
  eyebrow: { textTransform: 'uppercase', letterSpacing: 1 },
  headerRight: { flexDirection: 'row', gap: Space.sm },
});
