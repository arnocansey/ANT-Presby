# ANT PRESS Design System (Clean & classic)

Source of truth for every screen on the website, the admin and the mobile app. Spec: `docs/superpowers/specs/2026-10-08-ui-ux-redesign-design.md`.

## Colours
Web: `frontend/src/styles/tokens.css` (CSS variables) → Tailwind classes. App: `mobile/src/constants/tokens.ts` → `useAppTheme().colors`. `npm run check:tokens` (frontend) keeps them identical; `npm run check:contrast` keeps every text pair at WCAG AA.

| Purpose | Web class | App key |
|---|---|---|
| Page background | `bg-background` | `background` |
| Panels, table headers, tiles | `bg-surface` | `surface` |
| Cards | `bg-card` | `card` |
| Borders / dividers | `border-border` | `border` |
| Inputs, secondary buttons | `border-input` | `input` |
| Body text, headings | `text-foreground` | `text` |
| Secondary text | `text-muted` | `muted` |
| Primary buttons, active nav | `bg-primary text-primary-foreground` | `primary` / `onPrimary` |
| Links | `text-link` | `link` |
| Gold highlight / badge | `bg-gold-soft text-gold-ink`, `border-gold` | `goldSoft` / `goldInk` / `gold` |
| Status text | `text-success`, `text-warning`, `text-danger` | `success`, `warning`, `danger` |
| Danger button, live pill | `bg-danger-solid text-danger-solid-foreground` | `dangerSolid` / `onDangerSolid` |

**Never** use raw palette classes (`sky-`, `cyan-`, `amber-`, `slate-`, `gray-`…) or hex values in restyled screens.

## Type
Inter (web via `next/font`, app uses the system font). Scripture and quotes: Source Serif 4 on web (`font-serif`, `<Scripture>`), Georgia/serif on the app (`<AppText serif>`).
Page title 30 bold (24 on phones) · section 20 semibold · body 16 · small 14 · caption 12.

## Shape and spacing
8-point spacing. Corners: 8px controls (`rounded-lg` / `Corner.control`), 12px cards (`rounded-card` / `Corner.card`), 16px panels (`rounded-panel` / `Corner.panel`). Touch targets ≥ 44px (`h-11` / `MIN_TOUCH`). One soft card shadow in light (`shadow-card`), none in dark.

## Web components (`frontend/src/components/ui`)
Button (`primary`/`secondary`/`ghost`/`link`/`danger`; old names `default`/`outline`/`destructive` still work; `loading`), Card, Input, Textarea, Select, Label, Badge (`neutral`/`gold`/`success`/`warning`/`danger`/`live`), PageHeader, Section, Tile, EmptyState, Skeleton/SkeletonCard, Tabs, Scripture, SimpleTable (`emptyMessage`), ConfirmDialog, DropdownMenu, ThemeToggle.

## App components (`mobile/src/components/ui`)
AppText, AppButton, AppCard, AppBadge, AppTile, EmptyState, Skeleton, TextField — all read `useAppTheme()` and follow the phone's light/dark setting.

## Navigation
Links live in `frontend/src/lib/navigation.ts` (`PRIMARY_NAV`, `GIVE_LINK`, `HUB_LINKS`, `MEMBER_HUB_LINK`, `FOOTER_GROUPS`). Header: Home · Watch · Events · About + Give. Everything else is a Home tile. App tabs (8d): Home · Watch · Events · Give · Me. Admin sidebar (8c): Overview · Content · Church life · People & giving · Settings.

## Every list and page
Loading → skeletons; empty → `EmptyState` with a friendly message; error → `EmptyState` saying it couldn't load. Status is never colour alone — badges carry text.
