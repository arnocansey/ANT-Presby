import { Ionicons } from '@expo/vector-icons';
import { Tabs, TabList, TabSlot, TabTrigger, TabTriggerSlotProps } from 'expo-router/ui';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type TabIconName = React.ComponentProps<typeof Ionicons>['name'];

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={styles.slot} />
      <TabList asChild>
        <View style={styles.tabListContainer}>
          <TabTrigger name="index" href="/" asChild>
            <TabButton icon="home-outline" selectedIcon="home">
              Home
            </TabButton>
          </TabTrigger>
          <TabTrigger name="news" href="/news" asChild>
            <TabButton icon="newspaper-outline" selectedIcon="newspaper">
              News
            </TabButton>
          </TabTrigger>
          <TabTrigger name="events" href="/events" asChild>
            <TabButton icon="calendar-clear-outline" selectedIcon="calendar-clear">
              Events
            </TabButton>
          </TabTrigger>
          <TabTrigger name="account" href="/account" asChild>
            <TabButton icon="person-circle-outline" selectedIcon="person-circle">
              Account
            </TabButton>
          </TabTrigger>
        </View>
      </TabList>
    </Tabs>
  );
}

function TabButton({
  children,
  isFocused,
  icon,
  selectedIcon,
  ...props
}: TabTriggerSlotProps & {
  children: React.ReactNode;
  icon: TabIconName;
  selectedIcon: TabIconName;
}) {
  const theme = useTheme();
  const active = Boolean(isFocused);

  return (
    <Pressable {...props} style={({ pressed }) => [styles.tabButton, pressed && styles.pressed]}>
      <ThemedView
        type={active ? 'backgroundSelected' : 'backgroundElement'}
        style={[
          styles.tabButtonView,
          {
            borderColor: active ? theme.tint : theme.border,
          },
        ]}>
        <Ionicons
          name={active ? selectedIcon : icon}
          size={20}
          color={active ? theme.tint : theme.textSecondary}
        />
        <ThemedText type="smallBold" themeColor={active ? 'text' : 'textSecondary'}>
          {children}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  slot: {
    height: '100%',
  },
  tabListContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.four,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.two,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  tabButton: {
    flex: 1,
  },
  tabButtonView: {
    minHeight: 60,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    borderWidth: 1,
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 1,
  },
  pressed: {
    opacity: 0.8,
  },
});
