import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function TabsLayout() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <>
      <AnimatedSplashOverlay />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: theme.tint,
          tabBarInactiveTintColor: theme.textSecondary,
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '700',
            marginBottom: Platform.OS === 'android' ? 2 : 0,
          },
          tabBarStyle: {
            position: 'absolute',
            left: Spacing.two,
            right: Spacing.two,
            bottom: Math.max(insets.bottom, Spacing.two),
            height: 62,
            paddingTop: 6,
            paddingBottom: 6,
            borderTopWidth: 1,
            borderTopColor: '#252A3D',
            borderRadius: Radius.large,
            backgroundColor: '#111424',
          },
          tabBarItemStyle: {
            borderRadius: Radius.small,
            marginHorizontal: 2,
          },
          sceneStyle: {
            backgroundColor: theme.background,
          },
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'home' : 'home-outline'} size={20} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="sermons"
          options={{
            title: 'Sermons',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'play-circle' : 'play-circle-outline'} size={20} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="events"
          options={{
            title: 'Events',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'calendar-clear' : 'calendar-clear-outline'} size={20} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="give"
          options={{
            title: 'Give',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'gift' : 'gift-outline'} size={20} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="account"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'person-circle' : 'person-circle-outline'} size={20} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="news"
          options={{
            href: null,
          }}
        />
      </Tabs>
    </>
  );
}
