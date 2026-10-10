// Clean & classic design tokens: the same values as frontend/src/styles/tokens.css.
// New UI uses these through useAppTheme(); legacy screens still use Colors/useTheme until phase 8d.
export const Palette = {
  light: {
    background: '#FFFFFF',
    surface: '#F6F8FC',
    card: '#FFFFFF',
    border: '#E6EAF2',
    input: '#CBD3E4',
    text: '#13224A',
    muted: '#56607A',
    primary: '#1E3A8A',
    primaryHover: '#172E6E',
    onPrimary: '#FFFFFF',
    link: '#1E3A8A',
    gold: '#C9A227',
    goldSoft: '#FBF6E5',
    goldInk: '#7A6216',
    success: '#15803D',
    warning: '#B45309',
    danger: '#B91C1C',
    dangerSolid: '#B91C1C',
    onDangerSolid: '#FFFFFF',
  },
  dark: {
    background: '#0B1530',
    surface: '#12204A',
    card: '#12204A',
    border: '#1F2F5C',
    input: '#2A3B6E',
    text: '#EEF2FB',
    muted: '#A9B4D0',
    primary: '#6F8FE8',
    primaryHover: '#8CA6EE',
    onPrimary: '#0B1530',
    link: '#9DB4F2',
    gold: '#E3C35A',
    goldSoft: '#3A3214',
    goldInk: '#E3C35A',
    success: '#4ADE80',
    warning: '#FBBF24',
    danger: '#F87171',
    dangerSolid: '#EF4444',
    onDangerSolid: '#0B1530',
  },
} as const;

export type AppPalette = { [K in keyof typeof Palette.light]: string };

export const TypeScale = {
  title: { fontSize: 24, lineHeight: 30, fontWeight: '700' },
  section: { fontSize: 20, lineHeight: 28, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
  bodyStrong: { fontSize: 16, lineHeight: 24, fontWeight: '600' },
  small: { fontSize: 14, lineHeight: 20, fontWeight: '400' },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '600' },
} as const;

export const Space = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 } as const;
export const Corner = { control: 8, card: 12, panel: 16, pill: 999 } as const;
export const MIN_TOUCH = 44;

// Colours that never change with the phone theme: the photo viewer, text on photos and the dialog scrim.
export const Fixed = {
  viewer: '#000000',
  onMedia: '#FFFFFF',
  mediaShade: 'rgba(0, 0, 0, 0.45)',
  scrim: 'rgba(11, 21, 48, 0.55)',
} as const;

// Content column cap for tablets and the web build.
export const MAX_CONTENT_WIDTH = 880;
