import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const NAV_HEIGHT = 72;

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

export function AdminShell({
  children,
  activeTab,
}: {
  children: React.ReactNode;
  activeTab: AdminTabHref;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.glowTop, { backgroundColor: theme.tint }]} />
        <View style={[styles.glowBottom, { backgroundColor: theme.accent }]} />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: NAV_HEIGHT + insets.bottom + Spacing.four },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>

        <View
          pointerEvents="box-none"
          style={[
            styles.navWrap,
            {
              bottom: Math.max(insets.bottom, Spacing.two),
            },
          ]}>
          <View
            style={[
              styles.navBar,
              {
                backgroundColor: '#111827',
                borderColor: 'rgba(255,255,255,0.1)',
              },
            ]}>
            {navItems.map((item) => {
              const active = item.href === activeTab;

              return (
                <Pressable
                  key={item.href}
                  onPress={() => router.push(item.href as never)}
                  style={styles.navItem}>
                  <Ionicons
                    name={item.icon}
                    size={18}
                    color={active ? theme.tint : theme.textSecondary}
                  />
                  <ThemedText
                    type="small"
                    style={[
                      styles.navLabel,
                      { color: active ? theme.tint : theme.textSecondary },
                    ]}>
                    {item.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  scroll: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  glowTop: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: Radius.pill,
    opacity: 0.08,
    top: -140,
    right: -90,
  },
  glowBottom: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: Radius.pill,
    opacity: 0.06,
    bottom: -100,
    left: -80,
  },
  navWrap: {
    position: 'absolute',
    left: Spacing.two,
    right: Spacing.two,
  },
  navBar: {
    minHeight: NAV_HEIGHT,
    borderWidth: 1,
    borderRadius: Radius.large,
    paddingHorizontal: Spacing.one,
    paddingVertical: Spacing.two,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  navLabel: {
    fontSize: 10,
    lineHeight: 12,
  },
});
