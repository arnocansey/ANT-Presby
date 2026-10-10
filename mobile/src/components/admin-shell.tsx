import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { MAX_CONTENT_WIDTH, Space } from '@/constants/tokens';
import { useAppTheme } from '@/hooks/use-app-theme';

const navItems = [
  { icon: 'grid-outline', label: 'Dashboard', href: '/admin' },
  { icon: 'people-outline', label: 'Members', href: '/admin-users' },
  { icon: 'play-circle-outline', label: 'Sermons', href: '/admin-sermons' },
  { icon: 'calendar-outline', label: 'Events', href: '/admin-events' },
  { icon: 'cash-outline', label: 'Finance', href: '/admin-donations' },
  { icon: 'settings-outline', label: 'Settings', href: '/admin-settings' },
] as const;

type AdminTabHref =
  | (typeof navItems)[number]['href']
  | '/admin-news'
  | '/admin-audit';

// Frame for the mobile admin screens: scrolling content above a docked six-item admin bar.
export function AdminShell({
  children,
  activeTab,
}: {
  children: React.ReactNode;
  activeTab: AdminTabHref;
}) {
  const { colors } = useAppTheme();

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <View style={styles.content}>{children}</View>
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={[styles.nav, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <View accessibilityRole="tablist" style={styles.navRow}>
          {navItems.map((item) => {
            const active = item.href === activeTab;
            const color = active ? colors.primary : colors.muted;

            return (
              <Pressable
                key={item.href}
                onPress={() => router.push(item.href as never)}
                accessibilityRole="tab"
                accessibilityLabel={item.label}
                accessibilityState={{ selected: active }}
                style={styles.navItem}>
                <Ionicons name={item.icon} size={20} color={color} />
                <AppText
                  variant="caption"
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.8}
                  style={{ color }}>
                  {item.label}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </SafeAreaView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  content: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    padding: Space.md,
    paddingBottom: Space.xl,
    gap: Space.md,
  },
  nav: { borderTopWidth: StyleSheet.hairlineWidth },
  navRow: { flexDirection: 'row', paddingHorizontal: Space.xs },
  navItem: { flex: 1, minHeight: 56, alignItems: 'center', justifyContent: 'center', gap: 2, paddingHorizontal: 2 },
});
