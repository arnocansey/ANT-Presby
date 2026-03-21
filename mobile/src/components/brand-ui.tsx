import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  ViewProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Radius, BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export function BrandScreen({
  children,
  scroll = true,
}: {
  children: React.ReactNode;
  scroll?: boolean;
}) {
  const theme = useTheme();

  const content = (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.screenGlowTop, { backgroundColor: theme.tint }]} />
      <View style={[styles.screenGlowBottom, { backgroundColor: theme.accent }]} />
      <ThemedView style={styles.content}>{children}</ThemedView>
    </ThemedView>
  );

  if (!scroll) {
    return <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>{content}</SafeAreaView>;
  }

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled">
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
        {content}
      </SafeAreaView>
    </ScrollView>
  );
}

export function BrandHero({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.hero,
        {
          backgroundColor: theme.backgroundElement,
          borderColor: theme.border,
        },
      ]}>
      <View style={[styles.heroGlow, { backgroundColor: theme.tint }]} />
      <View style={[styles.heroGlowAlt, { backgroundColor: theme.accent }]} />
      <View style={[styles.heroStripe, { backgroundColor: theme.heroEnd }]} />
      <View style={styles.heroContent}>
        {eyebrow ? (
          <ThemedText type="smallBold" style={styles.eyebrow}>
            {eyebrow}
          </ThemedText>
        ) : null}
        <ThemedText type="title" style={styles.heroTitle}>
          {title}
        </ThemedText>
        {description ? (
          <ThemedText type="default" style={styles.heroDescription}>
            {description}
          </ThemedText>
        ) : null}
        {children}
      </View>
    </View>
  );
}

export function BrandCard({ children, style }: ViewProps) {
  const theme = useTheme();

  return (
    <ThemedView
      type="backgroundElement"
      style={[
        styles.card,
        {
          borderColor: theme.border,
          shadowColor: '#0F172A',
        },
        style,
      ]}>
      {children}
    </ThemedView>
  );
}

export function BrandSectionHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionCopy}>
        <ThemedText type="subtitle">{title}</ThemedText>
        {description ? <ThemedText type="small">{description}</ThemedText> : null}
      </View>
      {action}
    </View>
  );
}

export function BrandButton({
  label,
  onPress,
  variant = 'primary',
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
}) {
  const theme = useTheme();

  const palette =
    variant === 'primary'
      ? {
          backgroundColor: theme.tint,
          color: '#111827',
          borderColor: theme.tint,
        }
      : variant === 'secondary'
        ? {
            backgroundColor: theme.accent,
            color: theme.white,
            borderColor: theme.accent,
          }
        : {
            backgroundColor: theme.backgroundSelected,
            color: theme.text,
            borderColor: theme.border,
          };

  return (
    <Pressable onPress={onPress}>
      {({ pressed }) => (
        <View
          style={[
            styles.button,
            palette,
            {
              opacity: pressed ? 0.88 : 1,
              borderWidth: 1,
            },
          ]}>
          <ThemedText style={[styles.buttonText, { color: palette.color }]}>{label}</ThemedText>
        </View>
      )}
    </Pressable>
  );
}

export function BrandMetric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  const theme = useTheme();

  return (
    <BrandCard style={styles.metricCard}>
      <ThemedText type="smallBold" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="subtitle" style={{ color: theme.text }}>
        {String(value)}
      </ThemedText>
    </BrandCard>
  );
}

export function BrandPill({ children }: { children: React.ReactNode }) {
  const theme = useTheme();

  return (
    <ThemedView
      style={[
        styles.pill,
        {
          backgroundColor: theme.accentSoft,
        },
      ]}>
      <ThemedText type="smallBold" style={{ color: theme.tint }}>
        {children}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    padding: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.three,
  },
  hero: {
    overflow: 'hidden',
    borderRadius: Radius.large,
    padding: Spacing.four,
    position: 'relative',
    borderWidth: 1,
    minHeight: 220,
  },
  heroContent: {
    gap: Spacing.two,
    zIndex: 1,
  },
  heroGlow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: Radius.pill,
    opacity: 0.22,
    top: -55,
    right: -30,
  },
  heroGlowAlt: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: Radius.pill,
    opacity: 0.18,
    bottom: -60,
    left: -40,
  },
  heroStripe: {
    position: 'absolute',
    inset: 0,
    opacity: 0.08,
  },
  eyebrow: {
    color: '#FACC15',
    textTransform: 'uppercase',
    letterSpacing: 2.5,
  },
  heroTitle: {
    color: '#FFFFFF',
    maxWidth: 460,
  },
  heroDescription: {
    color: '#D6DCFF',
    maxWidth: 540,
  },
  card: {
    borderRadius: Radius.medium,
    padding: Spacing.four,
    gap: Spacing.two,
    borderWidth: 1,
    shadowOpacity: 0.18,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 4,
  },
  sectionHeader: {
    gap: Spacing.two,
  },
  sectionCopy: {
    gap: Spacing.one,
  },
  button: {
    minHeight: 50,
    borderRadius: Radius.medium,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '800',
  },
  metricCard: {
    minWidth: '47%',
  },
  pill: {
    alignSelf: 'flex-start',
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  screenGlowTop: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: Radius.pill,
    opacity: 0.08,
    top: -140,
    right: -90,
  },
  screenGlowBottom: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: Radius.pill,
    opacity: 0.06,
    bottom: -100,
    left: -80,
  },
});
