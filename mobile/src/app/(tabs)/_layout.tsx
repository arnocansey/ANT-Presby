import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { useAppTheme } from '@/hooks/use-app-theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const icon = (active: IconName, idle: IconName) => {
  function TabIcon({ color, focused }: { color: string; focused: boolean }) {
    return <Ionicons name={focused ? active : idle} size={22} color={color} />;
  }
  return TabIcon;
};

// Route files keep their names (sermons = Watch, account = Me) so every existing link still works.
export default function TabsLayout() {
  const { colors } = useAppTheme();

  return (
    <>
      <AnimatedSplashOverlay />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.muted,
          tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
          tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
          sceneStyle: { backgroundColor: colors.background },
        }}>
        <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: icon('home', 'home-outline') }} />
        <Tabs.Screen name="sermons" options={{ title: 'Watch', tabBarIcon: icon('play-circle', 'play-circle-outline') }} />
        <Tabs.Screen name="events" options={{ title: 'Events', tabBarIcon: icon('calendar-clear', 'calendar-clear-outline') }} />
        <Tabs.Screen name="give" options={{ title: 'Give', tabBarIcon: icon('heart', 'heart-outline') }} />
        <Tabs.Screen name="account" options={{ title: 'Me', tabBarIcon: icon('person-circle', 'person-circle-outline') }} />
        <Tabs.Screen name="news" options={{ href: null }} />
      </Tabs>
    </>
  );
}
