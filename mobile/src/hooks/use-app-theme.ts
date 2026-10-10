import React from 'react';
import { Platform, useColorScheme } from 'react-native';

import { Palette, type AppPalette } from '@/constants/tokens';

// On the web build the static HTML is rendered in light; switch to the browser's scheme only after
// hydration so the first client render matches the server output.
function useHydrated() {
  const [hydrated, setHydrated] = React.useState(Platform.OS !== 'web');
  React.useEffect(() => {
    if (!hydrated) setHydrated(true);
  }, [hydrated]);
  return hydrated;
}

// Light or dark, following the phone's setting (app.json userInterfaceStyle: "automatic").
export function useAppTheme(): { scheme: 'light' | 'dark'; colors: AppPalette } {
  const deviceScheme = useColorScheme();
  const hydrated = useHydrated();
  const scheme = hydrated && deviceScheme === 'dark' ? 'dark' : 'light';
  return { scheme, colors: Palette[scheme] };
}
