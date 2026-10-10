import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useTheme } from '@/hooks/use-theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const icon = (active: IconName, idle: IconName) => {
  function TabIcon({ color, focused }: { color: string; focused: boolean }) {
    return <Ionicons name={focused ? active : idle} size={22} color={color} />;
  }
  return TabIcon;
};

// Route files keep their names (sermons = Watch, account = Me) so every existing link still works.
// While phase 8d is in progress, each tab's bar uses `legacy` until that tab's screen is on the tokens;
// then it uses `tokens`. Task 6 removes `legacy` once all five tabs are on the tokens.
export default function TabsLayout() {
  const theme = useTheme();
  const { colors } = useAppTheme();
  const legacy = {
    tabBarActiveTintColor: theme.tint,
    tabBarInactiveTintColor: theme.textSecondary,
    tabBarStyle: { backgroundColor: theme.backgroundElement, borderTopColor: theme.border },
    sceneStyle: { backgroundColor: theme.background },
  };
  const tokens = {
    tabBarActiveTintColor: colors.primary,
    tabBarInactiveTintColor: colors.muted,
    tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
    sceneStyle: { backgroundColor: colors.background },
  };

  return (
    <>
      <AnimatedSplashOverlay />
      <Tabs screenOptions={{ headerShown: false, tabBarLabelStyle: { fontSize: 12, fontWeight: '600' } }}>
        <Tabs.Screen name="index" options={{ ...legacy, title: 'Home', tabBarIcon: icon('home', 'home-outline') }} />
        <Tabs.Screen name="sermons" options={{ ...legacy, title: 'Watch', tabBarIcon: icon('play-circle', 'play-circle-outline') }} />
        <Tabs.Screen name="events" options={{ ...legacy, title: 'Events', tabBarIcon: icon('calendar-clear', 'calendar-clear-outline') }} />
        <Tabs.Screen name="give" options={{ ...legacy, title: 'Give', tabBarIcon: icon('heart', 'heart-outline') }} />
        <Tabs.Screen name="account" options={{ ...legacy, title: 'Me', tabBarIcon: icon('person-circle', 'person-circle-outline') }} />
        <Tabs.Screen name="news" options={{ ...legacy, href: null }} />
      </Tabs>
    </>
  );
}
