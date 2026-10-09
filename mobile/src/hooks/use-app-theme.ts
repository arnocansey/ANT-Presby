import { useColorScheme } from 'react-native';

import { Palette, type AppPalette } from '@/constants/tokens';

// Light or dark, following the phone's setting (app.json userInterfaceStyle: "automatic").
export function useAppTheme(): { scheme: 'light' | 'dark'; colors: AppPalette } {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  return { scheme, colors: Palette[scheme] };
}
