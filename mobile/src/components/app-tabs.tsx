import { Ionicons } from '@expo/vector-icons';
import { Tabs, TabList, TabSlot, TabTrigger, TabTriggerSlotProps } from 'expo-router/ui';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type TabIconName = React.ComponentProps<typeof Ionicons>['name'];

export default function AppTabs() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs>
      <TabSlot style={styles.slot} />
      <TabList asChild>
        <View
          style={[
            styles.tabListContainer,
            {
              bottom: Math.max(insets.bottom, Spacing.two),
              paddingBottom: Spacing.one,
            },
          ]}>
          <TabTrigger name="index" href="/" asChild>
            <TabButton icon="home-outline" selectedIcon="home">
              Home
            </TabButton>
          </TabTrigger>
          <TabTrigger name="sermons" href={'/sermons' as never} asChild>
            <TabButton icon="play-circle-outline" selectedIcon="play-circle">
              Sermons
            </TabButton>
          </TabTrigger>
          <TabTrigger name="events" href="/events" asChild>
            <TabButton icon="calendar-clear-outline" selectedIcon="calendar-clear">
              Events
            </TabButton>
          </TabTrigger>
          <TabTrigger name="give" href={'/give' as never} asChild>
            <TabButton icon="gift-outline" selectedIcon="gift">
              Give
            </TabButton>
          </TabTrigger>
          <TabTrigger name="account" href="/account" asChild>
            <TabButton icon="person-circle-outline" selectedIcon="person-circle">
              Profile
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
            backgroundColor: active ? theme.backgroundSelected : theme.backgroundElement,
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
    paddingHorizontal: Spacing.two,
    paddingTop: Spacing.one,
    paddingBottom: Spacing.two,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.one,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    backgroundColor: '#111424',
    borderTopWidth: 1,
    borderTopColor: '#252A3D',
    borderRadius: Radius.large,
    marginHorizontal: Spacing.two,
  },
  tabButton: {
    flex: 1,
  },
  tabButtonView: {
    minHeight: 50,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.one,
    borderRadius: Radius.small,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    borderWidth: 0,
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  pressed: {
    opacity: 0.8,
  },
});
