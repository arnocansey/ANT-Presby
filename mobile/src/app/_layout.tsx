import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import React from 'react';

import AppProviders from '@/providers/AppProviders';
import { useAuthStore } from '@/store/auth';

export default function RootLayout() {
  const hydrate = useAuthStore((state) => state.hydrate);

  React.useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <AppProviders>
      <ThemeProvider value={DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="login" options={{ presentation: 'modal' }} />
        </Stack>
      </ThemeProvider>
    </AppProviders>
  );
}
