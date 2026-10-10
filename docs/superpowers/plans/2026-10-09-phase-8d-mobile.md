# Phase 8d: Mobile App Restyle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle every screen of the Expo app on the Clean & classic tokens, in light and dark following the phone. That covers:
- the new five tabs: Home · Watch · Events · Give · Me
- the hub Home
- the Me screen
- every public, member and admin screen
- retiring the legacy dark theme (`useTheme()`, `Colors`, `brand-ui.tsx`)

**Architecture:**
- **Shared screen kit:** a small set of screen-level components lives in `mobile/src/components/kit/`, built only from the 8a primitives (`components/ui/*`) and `useAppTheme()`. Examples: `Screen`, `ScreenHeader`, `ListGroup`/`ListRow`, `ChipGroup`, `FormTextField`, `ConfirmDialog`. Spec §6 says a stage keeps missing components in its own folder; they can be promoted to `components/ui` later.
- **Screens become composition:** each screen keeps its hooks, handlers and routes line-for-line and swaps only its JSX and styles.
- **One theme per screen, always:** migration runs shells first, then screens by area. A screen is only ever fully legacy or fully token-based. Shared chrome that spans several screens (the tab bar, the admin shell) changes colour in the same task as the last screen it frames.
- **The legacy theme is deleted at the end:** `Colors`, `useTheme()`, `brand-ui.tsx`, `themed-text`/`themed-view` and the template leftovers go in Task 10, once nothing imports them.

**Tech Stack:** Expo SDK 55, expo-router 55 (file routes, `Tabs`), React Native 0.83, React 19.2 with the React Compiler, `@expo/vector-icons` (Ionicons), react-hook-form 7 + zod 4, TanStack Query 5, zustand.

**Spec:** `docs/superpowers/specs/2026-10-08-ui-ux-redesign-design.md` (§1, §2, §3.2, §4 "8d", §5, §6). Read it with `docs/design-system.md` and Task 6 of `docs/superpowers/plans/2026-10-08-phase-8a-ui-foundation.md` (Ruling 2).

## Global Constraints

- **No behaviour, data, API or route changes.** Every screen keeps the same hooks, mutations, validation, `router.push`/`router.replace` targets and alerts.
  - Allowed exceptions, each recorded as a ruling below:
    - removing controls that did nothing
    - removing fake numbers
    - replacing free-text inputs for enum values with choice chips that write the same values
- **Route files stay where they are.** The tabs are relabelled, not renamed. `(tabs)/sermons.tsx` is shown as **Watch** and `(tabs)/account.tsx` as **Me**, so every existing `router.push('/sermons')`, `'/account'`, `'/events'` and `'/give'`, plus `routeForNotification()` in `lib/push.ts`, keep working untouched.
- **Colours come from `useAppTheme().colors` only.** No hex, `rgb(` or `rgba(` literals in any file this phase writes. The only exception is `mobile/src/constants/tokens.ts`.
  - **Colour scan:** `grep -nE "#[0-9A-Fa-f]{3,8}\b|rgba?\(" <files>` must print nothing.
  - **Colours that never change with the theme** (the photo viewer's black, the scrim behind dialogs, white text on photos) come from a new `Fixed` export added to `tokens.ts`. Existing token values are not edited.
- **Type and shape:** use `AppText` variants (`title` 24, `section` 20, `body`/`bodyStrong` 16, `small` 14, `caption` 12) plus `Space`, `Corner` and `MIN_TOUCH` from `constants/tokens.ts`. No raw font sizes except where a step shows one.
- **Touch targets:** every pressable is at least 44×44 (`MIN_TOUCH`). That covers icon buttons, chips, list rows, tabs and the photo viewer controls.
- **Accessibility:**
  - every icon-only button has an `accessibilityLabel`
  - status badges always carry text
  - images that convey content have labels
  - headers use `accessibilityRole="header"`
- **Light and dark:** every restyled screen follows the phone setting (`app.json` already has `"userInterfaceStyle": "automatic"`). One subtle look per theme. Cards have borders, with no shadows in dark.
- **File ownership:**
  - **May edit:** `mobile/**`. In `mobile/src/constants/tokens.ts` you may add exports and edit comments, but never change a value.
  - **Docs:** appends only, to `docs/qa-checklist.md` and `docs/features.md`.
  - **Never edit:** `frontend/` or `backend/`.
- **No new dependencies.** Everything used is already in `mobile/package.json` (`expo-status-bar`, `@react-navigation/native`, `expo-image`, `@expo/vector-icons`).
- **Platform:** Windows + Git Bash, no Python. Files may be CRLF; prefer the Edit/Write tools. Never use `String.replace` with `$` in the replacement.
- **Commits:** each message ends with a blank line then `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Never push or merge.
- **Secrets:** none are needed; never write keys, tokens or passwords into any file.

### Rulings (decided while planning; reviewers should not re-open them)

1. **Tab routes.** Keep `(tabs)/sermons.tsx` and `(tabs)/account.tsx`; only the tab titles change, to "Watch" and "Me". Renaming the files would break `/sermons` deep links, the `/account` redirects in `login.tsx`, `register.tsx`, `admin.tsx` and `admin-donations.tsx`, and typed hrefs, for no user-visible gain.
2. **Tab bar.**
   - The tab bar becomes a standard docked bar instead of a floating one.
   - Its *layout and labels* change in Task 1.
   - Its *colours are set per tab*: each `Tabs.Screen` spreads either `legacy` or `tokens` options, and React Navigation styles the bar from the focused screen. A tab switches from `legacy` to `tokens` in the same task as its screen: Home and News in T2, Watch in T3, Events in T4, Give in T5, Me in T6. So a tab screen is never shown with a tab bar from the other theme. Task 6 deletes `legacy`.
   - The hidden `(tabs)/news` screen also sits under the tab bar, so it migrates in Task 2 with Home.
3. **Admin shell.** `admin-shell.tsx` frames every admin screen, so it flips in Task 9 together with all admin screens, in one task.
4. **Navigation chrome.** The root `ThemeProvider` (navigation theme) and `StatusBar` move to tokens in Task 6, with the tab bar. Non-tab screens paint their own backgrounds, so the nav theme only shows during transitions.
5. **Legacy theme retirement order:**
   - Task 1: shells and kit
   - then screens by area: Home → Watch → Events → Give → Me/auth → community → other public → admin
   - Task 10 deletes `brand-ui.tsx`, `themed-text.tsx`, `themed-view.tsx`, `hooks/use-theme.ts`, `hooks/use-color-scheme*.ts`, `constants/theme.ts` (and with it `Colors`), `global.css` and the unused template components
   - **Decision:** remove, not re-point. Nothing reads them after Task 9.
6. **Splash overlay** (`animated-icon.tsx`): this is a brand moment, so it is always navy (`Palette.dark`) in both themes, read from tokens.
7. **Home contents follow spec §3.2 exactly:** greeting, live card, today's devotional, the eight hub tiles, upcoming events.
   - The old Home "Latest sermon" card and the "Quick actions" row move out; Watch shows the latest sermon, and the actions are tabs or tiles.
   - The **Live** tile opens Watch (`/sermons`), which shows the live card; the app has no separate `/live` screen. The tile shows a red "Live" badge while live.
8. **Me contents follow spec §3.2:**
   - profile, my groups, my registrations, activity (notifications, donations, prayer requests, dashboard), settings and help, Admin (admins only), sign out
   - "My groups" reads the existing `useGroups()` (`my_status` active/pending). The old Account screen listed ministries under a "Small Groups" heading, which was mislabelled; ministries stay one tap away on the Home tile.
   - "My registrations" reads the existing `useMyEventRegistrations()`, already used by the Events tab.
   - Community, prayer wall, devotional, gallery and news leave the Account list because they are now Home tiles (two taps from Home).
9. **Removed because they did nothing, or showed made-up data:**
   - fake "3" and "15" notification counts on the Home and admin bells
   - fake sermon durations, "1.2K views" and the "42:15" badges
   - the read-only search box and filter button on Sermons (replaced by a working Search icon button that goes to the existing `/search`)
   - the "Calendar View" link and the Events/Give segmented switch (Give is a tab)
   - share, heart and reminder icon buttons on sermon and event detail
   - the decorative "Playback" progress bar and the "Notes… next" placeholder on sermon detail
   - "Forgot password?" text and the Apple button on login (neither had a handler)
   - the fake "Step 1 of 2 · 50%" bar on register
   - "Member since <this year>" and the fake Profile/Account stat cards on profile
   - the fake "+1 (555)…" phone row on Account
   - admin trend arrows ("+12", "+8.2%"), the no-op download, settings and add-member icons, and the "Config Live / Mode Admin" metrics
   - "Secure / Linked" metrics on Give
   - the invented event "type" fallback ("Prayer"/"Community" when the API sends none)
10. **Enum inputs become chips writing the same values:**
    - donation type and payment method on Give
    - the ministry on admin sermon create and edit: chips write the same `String(id)` into `ministryId`, falling back to the numeric text field when no ministries load
11. **Busy buttons:** where the old screen showed a spinner while submitting (login, register, donate, prayers, profile), the new `AppButton loading` also ignores taps while busy. Every other button keeps its old press behaviour.
12. **Back buttons:** every pushed screen gets a 44×44 back button in `ScreenHeader` calling `router.back()`, as the screens with one already did. Tab roots have none, except the hidden News tab, which is reached from a Home tile.

## Review Focus

1. **A screen left half-migrated.** For example: legacy `BrandScreen` around new kit components; a kit screen still importing `useTheme`; or the tab bar or admin shell in one theme while its screen is in the other. *(Every task's colour scan plus its import scan; Ruling 2/3 ordering; Task 10's whole-scope scan.)*
2. **`router.push` targets broken by the tab work.** `/sermons`, `/account`, `/events`, `/give`, `/news`, `/donate?amount=…`, `/donate?reference=…`, every `push`/`replace` in the screens, and push-notification routing must open the same screens as before. *(Task 1 Step 10 route-file check; Task 10 Step 3 route diff against `fc3fd49`.)*
3. **Text unreadable in one theme.** Examples: white text left on a light card; `primary` text on `primary` backgrounds; badges on `surface`; the live card in dark. *(The by-eye light/dark checklist in every task; the kit only pairs AA-checked tokens.)*
4. **An admin screen losing an action.** Every admin create/edit/delete/publish/check-in/undo/role/status/upload/cover/retry/go-live/end action must still exist with the same guard (`!busy && …`) and confirm dialog. *(Task 9 Step 1 builds the action inventory before editing; Step 23 re-checks it.)*
5. **Touch targets under 44.** Watch chips, icon buttons, list rows, the admin bottom nav, the photo viewer arrows and the album cover/delete icons. *(The kit fixes `minHeight: MIN_TOUCH` in one place; the by-eye checklists name each control.)*

---

## File Map

| File | Change | Task |
|---|---|---|
| `mobile/src/constants/tokens.ts` | Add `Fixed` and `MAX_CONTENT_WIDTH` exports (values unchanged) | 1 |
| `mobile/src/components/kit/*` (14 files) | Create: screen kit on 8a primitives | 1 |
| `mobile/src/app/(tabs)/_layout.tsx` | Docked tab bar, Watch/Me labels, per-tab colours (T1); each tab flips to tokens with its screen (T2–T6); `legacy` removed (T6) | 1–6 |
| `mobile/src/components/animated-icon.tsx` | Splash on `Palette.dark` | 1 |
| `mobile/src/components/app-tabs.tsx`, `app-tabs.web.tsx`, `animated-icon.module.css` | Delete (unused template files) | 1 |
| `mobile/src/app/(tabs)/index.tsx`, `(tabs)/news.tsx`, `components/live-card.tsx` | Rewrite | 2 |
| `mobile/src/screens/SermonsScreen.tsx`, `app/sermons/[id].tsx`, `app/search.tsx` | Rewrite | 3 |
| `mobile/src/app/(tabs)/events.tsx`, `app/events/[id].tsx` | Rewrite | 4 |
| `mobile/src/app/donate.tsx`, `app/donations.tsx` | Rewrite | 5 |
| `mobile/src/app/(tabs)/account.tsx`, `profile.tsx`, `dashboard.tsx`, `notifications.tsx`, `login.tsx`, `register.tsx`, `app/_layout.tsx` | Rewrite | 6 |
| `mobile/src/app/community.tsx`, `small-groups.tsx`, `prayer-wall.tsx`, `prayers.tsx`, `gallery/index.tsx`, `gallery/[id].tsx` | Rewrite | 7 |
| `mobile/src/app/daily-devotional.tsx`, `ministries.tsx`, `ministries/[id].tsx`, `news/[id].tsx`, `about.tsx`, `contact.tsx`, `faq.tsx`, `privacy.tsx`, `terms.tsx` | Rewrite | 8 |
| `mobile/src/components/admin-shell.tsx` + 19 `mobile/src/app/admin*` files | Rewrite | 9 |
| `brand-ui.tsx`, `themed-text.tsx`, `themed-view.tsx`, `hint-row.tsx`, `web-badge.tsx`, `ui/collapsible.tsx`, `hooks/use-theme.ts`, `hooks/use-color-scheme.ts`, `hooks/use-color-scheme.web.ts`, `constants/theme.ts`, `global.css` | Delete | 10 |
| `docs/qa-checklist.md`, `docs/features.md` | Append | 10 |

`(tabs)/give.tsx` (re-exports `donate.tsx`) and `(tabs)/sermons.tsx` (re-exports `SermonsScreen`) do not change.

### Verification used by every task

```bash
cd mobile && npm run -s lint && npx tsc --noEmit && echo mobile-ok
```
Expected: `mobile-ok`. If lint reports stale "unable to resolve" errors for files that exist, delete `mobile/.expo/cache/eslint` and rerun.

Colour scan for the task's files (listed in each task). It must print nothing:
```bash
grep -nE "#[0-9A-Fa-f]{3,8}\b|rgba?\(" <the task's files>
```

Legacy-import scan for the task's files. It must print nothing:
```bash
grep -nE "brand-ui|themed-text|themed-view|hooks/use-theme'|constants/theme'" <the task's files>
```

The by-eye checklist is done by the user on a phone or simulator. Switch the phone between Light and Dark (iOS: Settings → Display; Android: Quick settings → Dark theme) and check each listed screen in both.

---

### Task 1: Shells, tabs and the shared screen kit

You are on branch `feature/ui-mobile` at `fc3fd49` (the tip of `feature/ui-foundation`, Phase 8a). Confirm with `git branch --show-current && git log --oneline -1`.

**Files:**
- Modify: `mobile/src/constants/tokens.ts` (append exports only)
- Create: `mobile/src/components/kit/icon-button.tsx`, `screen.tsx`, `section.tsx`, `list.tsx`, `chips.tsx`, `stat.tsx`, `confirm-dialog.tsx`, `form.tsx`, `states.tsx`, `avatar.tsx`, `media.tsx`, `scripture.tsx`, `status.ts`, `index.ts`
- Modify: `mobile/src/app/(tabs)/_layout.tsx`
- Modify: `mobile/src/components/animated-icon.tsx`
- Delete: `mobile/src/components/app-tabs.tsx`, `mobile/src/components/app-tabs.web.tsx`, `mobile/src/components/animated-icon.module.css`

**Interfaces:**
- Consumes (8a): `Palette`, `TypeScale`, `Space`, `Corner`, `MIN_TOUCH` from `@/constants/tokens`; `useAppTheme() → { scheme, colors }`; `AppText`, `AppButton`, `AppCard`, `AppBadge`, `AppTile`, `EmptyState`, `Skeleton`, `TextField` from `@/components/ui/*`.
- Produces, imported by Tasks 2–9 from `@/components/kit`:
  - `Fixed: { viewer, onMedia, mediaShade, scrim }`, `MAX_CONTENT_WIDTH` (in `@/constants/tokens`)
  - `type IconName`; `IconButton({ icon, accessibilityLabel, onPress?, variant?: 'secondary'|'primary'|'ghost'|'danger', disabled? })`
  - `Screen({ children, scroll? = true })`; `ScreenHeader({ title, subtitle?, eyebrow?, back?, onBack?, right? })`
  - `SectionHeader({ title, actionLabel?, onAction? })`
  - `ListGroup({ children })`; `ListRow({ label, icon?, description?, value?, trailing?, onPress?, tone?: 'default'|'danger', accessibilityLabel? })`; `InfoLine({ icon, children, selectable? })`
  - `Chip({ label, onPress, selected?, icon?, disabled?, accessibilityLabel? })`; `ChipGroup<T>({ options: {value,label}[], value, onChange, scroll? })`; `UnderlineTabs<T extends string>({ options, value, onChange })`
  - `StatTile({ label, value, icon? })`; `StatGrid({ children, minTileWidth? = 140 })`
  - `ConfirmDialog({ visible, title, message?, confirmLabel, cancelLabel?, icon?, destructive?, onConfirm, onCancel })`
  - `FormTextField<T>({ control, name, label, error?, hint?, ...TextInputProps })`; `ChoiceField<T>({ label, options, value, onChange, error? })`; `SwitchRow({ label, description?, value, onValueChange })`; `CheckboxRow({ label, checked, onToggle })`; `FormMessage({ tone: 'danger'|'success', children: string })`
  - `LoadingList({ count? = 3, height? = 88 })`; `ErrorState({ title?, message?, onRetry? })`; `SignInPrompt({ title, message, onSignIn, label? = 'Sign in', icon? })`
  - `Avatar({ initials, size? = 48, tone?: 'primary'|'gold' })`
  - `MediaFrame({ uri?, icon?, height? = 180, radius? })`
  - `Scripture({ text, reference?, lines? })`
  - `statusTone(status?: string | null) → 'neutral'|'success'|'warning'|'danger'`

- [ ] **Step 1: Install dependencies (background)**

Run with `run_in_background: true`:
```bash
cd mobile && npm ci --no-audit --no-fund
```
Wait for it to finish before Step 12. If lint later reports stale unresolved modules, delete `mobile/.expo/cache/eslint`.

- [ ] **Step 2: Add the fixed colours and content width to the tokens**

Append to the end of `mobile/src/constants/tokens.ts` (do not edit any existing value):

```ts

// Colours that never change with the phone theme: the photo viewer, text on photos and the dialog scrim.
export const Fixed = {
  viewer: '#000000',
  onMedia: '#FFFFFF',
  mediaShade: 'rgba(0, 0, 0, 0.45)',
  scrim: 'rgba(11, 21, 48, 0.55)',
} as const;

// Content column cap for tablets and the web build.
export const MAX_CONTENT_WIDTH = 880;
```

- [ ] **Step 3: Icon button**

Create `mobile/src/components/kit/icon-button.tsx`:

```tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { Corner, MIN_TOUCH } from '@/constants/tokens';
import { useAppTheme } from '@/hooks/use-app-theme';

export type IconName = React.ComponentProps<typeof Ionicons>['name'];

// A 44×44 round button with only an icon; the label is spoken by screen readers.
export function IconButton({
  icon,
  accessibilityLabel,
  onPress,
  variant = 'secondary',
  disabled = false,
}: {
  icon: IconName;
  accessibilityLabel: string;
  onPress?: () => void;
  variant?: 'secondary' | 'primary' | 'ghost' | 'danger';
  disabled?: boolean;
}) {
  const { colors } = useAppTheme();
  const look = {
    secondary: { bg: colors.background, fg: colors.text, border: colors.input },
    primary: { bg: colors.primary, fg: colors.onPrimary, border: colors.primary },
    ghost: { bg: 'transparent', fg: colors.muted, border: 'transparent' },
    danger: { bg: colors.background, fg: colors.danger, border: colors.input },
  }[variant];

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: look.bg, borderColor: look.border, opacity: disabled ? 0.5 : pressed ? 0.7 : 1 },
      ]}>
      <Ionicons name={icon} size={20} color={look.fg} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: MIN_TOUCH,
    height: MIN_TOUCH,
    borderRadius: Corner.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default IconButton;
```

- [ ] **Step 4: Screen and ScreenHeader**

Create `mobile/src/components/kit/screen.tsx`:

```tsx
import { router } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IconButton } from '@/components/kit/icon-button';
import { AppText } from '@/components/ui/app-text';
import { MAX_CONTENT_WIDTH, Space } from '@/constants/tokens';
import { useAppTheme } from '@/hooks/use-app-theme';

// Page frame for every screen: token background, safe top edge, a centred column with 16px gutters.
export function Screen({ children, scroll = true }: { children: React.ReactNode; scroll?: boolean }) {
  const { colors } = useAppTheme();
  const body = <View style={styles.content}>{children}</View>;

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.safe, { backgroundColor: colors.background }]}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {body}
        </ScrollView>
      ) : (
        body
      )}
    </SafeAreaView>
  );
}

// Page title with an optional back button (router.back() unless onBack is given) and a right-hand slot.
export function ScreenHeader({
  title,
  subtitle,
  eyebrow,
  back = false,
  onBack,
  right,
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  back?: boolean;
  onBack?: () => void;
  right?: React.ReactNode;
}) {
  const showBack = back || Boolean(onBack);

  return (
    <View style={styles.header}>
      {showBack ? (
        <IconButton icon="chevron-back" accessibilityLabel="Go back" onPress={onBack ?? (() => router.back())} />
      ) : null}
      <View style={styles.headerCopy}>
        {eyebrow ? (
          <AppText variant="caption" tone="gold" style={styles.eyebrow}>
            {eyebrow}
          </AppText>
        ) : null}
        <AppText variant="title" accessibilityRole="header">
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="small" tone="muted">
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {right ? <View style={styles.headerRight}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flexGrow: 1 },
  content: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    padding: Space.md,
    paddingBottom: Space.xxl,
    gap: Space.md,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: Space.sm },
  headerCopy: { flex: 1, gap: 2 },
  eyebrow: { textTransform: 'uppercase', letterSpacing: 1 },
  headerRight: { flexDirection: 'row', gap: Space.sm },
});
```

- [ ] **Step 5: Section header, lists, chips, stats**

Create `mobile/src/components/kit/section.tsx`:

```tsx
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { MIN_TOUCH, Space } from '@/constants/tokens';

export function SectionHeader({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.row}>
      <AppText variant="section" accessibilityRole="header" style={styles.title}>
        {title}
      </AppText>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} accessibilityRole="link" style={styles.action}>
          <AppText variant="small" tone="link" style={styles.actionText}>
            {actionLabel}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Space.sm, marginTop: Space.sm },
  title: { flex: 1 },
  action: { minHeight: MIN_TOUCH, justifyContent: 'center', paddingHorizontal: Space.xs },
  actionText: { fontWeight: '600' },
});
```

Create `mobile/src/components/kit/list.tsx`:

```tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { IconName } from '@/components/kit/icon-button';
import { AppText } from '@/components/ui/app-text';
import { Corner, MIN_TOUCH, Space } from '@/constants/tokens';
import { useAppTheme } from '@/hooks/use-app-theme';

// A bordered card whose rows are separated by hairlines.
export function ListGroup({ children }: { children: React.ReactNode }) {
  const { colors } = useAppTheme();
  const items = React.Children.toArray(children);
  return (
    <View style={[styles.group, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {items.map((child, index) => (
        <View key={index} style={index > 0 ? [styles.divider, { borderTopColor: colors.border }] : undefined}>
          {child}
        </View>
      ))}
    </View>
  );
}

export function ListRow({
  label,
  icon,
  description,
  value,
  trailing,
  onPress,
  tone = 'default',
  accessibilityLabel,
}: {
  label: string;
  icon?: IconName;
  description?: string;
  value?: string;
  trailing?: React.ReactNode;
  onPress?: () => void;
  tone?: 'default' | 'danger';
  accessibilityLabel?: string;
}) {
  const { colors } = useAppTheme();
  const accent = tone === 'danger' ? colors.danger : colors.primary;
  const content = (
    <>
      {icon ? (
        <View style={[styles.icon, { backgroundColor: colors.surface }]}>
          <Ionicons name={icon} size={18} color={accent} />
        </View>
      ) : null}
      <View style={styles.copy}>
        <AppText variant="bodyStrong" numberOfLines={2} style={tone === 'danger' ? { color: colors.danger } : undefined}>
          {label}
        </AppText>
        {description ? (
          <AppText variant="small" tone="muted" numberOfLines={2}>
            {description}
          </AppText>
        ) : null}
      </View>
      {value ? (
        <AppText variant="small" tone="muted">
          {value}
        </AppText>
      ) : null}
      {trailing}
      {onPress ? <Ionicons name="chevron-forward" size={18} color={colors.muted} /> : null}
    </>
  );

  if (!onPress) return <View style={styles.row}>{content}</View>;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? (value ? `${label}, ${value}` : label)}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.surface }]}>
      {content}
    </Pressable>
  );
}

// An icon followed by a short muted line, e.g. a time or a place.
export function InfoLine({ icon, children, selectable }: { icon: IconName; children: React.ReactNode; selectable?: boolean }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.info}>
      <Ionicons name={icon} size={16} color={colors.muted} />
      <AppText variant="small" tone="muted" selectable={selectable} style={styles.infoText}>
        {children}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  group: { borderWidth: 1, borderRadius: Corner.card, overflow: 'hidden' },
  divider: { borderTopWidth: StyleSheet.hairlineWidth },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.sm + 4,
    minHeight: MIN_TOUCH + 12,
    paddingHorizontal: Space.md,
    paddingVertical: Space.sm + 4,
  },
  icon: { width: 36, height: 36, borderRadius: Corner.control, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, gap: 2 },
  info: { flexDirection: 'row', alignItems: 'center', gap: Space.sm },
  infoText: { flex: 1 },
});
```

Create `mobile/src/components/kit/chips.tsx`:

```tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import type { IconName } from '@/components/kit/icon-button';
import { AppText } from '@/components/ui/app-text';
import { Corner, MIN_TOUCH, Space } from '@/constants/tokens';
import { useAppTheme } from '@/hooks/use-app-theme';

export function Chip({
  label,
  onPress,
  selected = false,
  icon,
  disabled = false,
  accessibilityLabel,
}: {
  label: string;
  onPress: () => void;
  selected?: boolean;
  icon?: IconName;
  disabled?: boolean;
  accessibilityLabel?: string;
}) {
  const { colors } = useAppTheme();
  const fg = selected ? colors.onPrimary : colors.text;
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected, disabled }}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? colors.primary : colors.background,
          borderColor: selected ? colors.primary : colors.input,
          opacity: disabled ? 0.5 : pressed ? 0.8 : 1,
        },
      ]}>
      {icon ? <Ionicons name={icon} size={16} color={fg} /> : null}
      <AppText variant="small" style={[styles.label, { color: fg }]}>
        {label}
      </AppText>
    </Pressable>
  );
}

// Single choice from a short list. `scroll` keeps long lists on one swipeable line.
export function ChipGroup<T extends string | number | undefined>({
  options,
  value,
  onChange,
  scroll = false,
}: {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  scroll?: boolean;
}) {
  const chips = options.map((option, index) => (
    <Chip
      key={`${String(option.value)}-${index}`}
      label={option.label}
      selected={option.value === value}
      onPress={() => onChange(option.value)}
    />
  ));
  if (scroll) {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {chips}
      </ScrollView>
    );
  }
  return <View style={[styles.row, styles.wrap]}>{chips}</View>;
}

// Underline tabs (spec §2.4 "Tabs"): equal-width, 44px tall.
export function UnderlineTabs<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  const { colors } = useAppTheme();
  return (
    <View accessibilityRole="tablist" style={[styles.tabs, { borderBottomColor: colors.border }]}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={[styles.tab, { borderBottomColor: active ? colors.primary : 'transparent' }]}>
            <AppText variant="bodyStrong" style={{ color: active ? colors.primary : colors.muted }}>
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: MIN_TOUCH,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.xs,
    borderWidth: 1,
    borderRadius: Corner.pill,
    paddingHorizontal: Space.md,
  },
  label: { fontWeight: '600' },
  row: { flexDirection: 'row', gap: Space.sm },
  wrap: { flexWrap: 'wrap' },
  tabs: { flexDirection: 'row', borderBottomWidth: 1 },
  tab: { flex: 1, minHeight: MIN_TOUCH, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 2, marginBottom: -1 },
});
```

Create `mobile/src/components/kit/stat.tsx`:

```tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import type { IconName } from '@/components/kit/icon-button';
import { AppText } from '@/components/ui/app-text';
import { Corner, Space } from '@/constants/tokens';
import { useAppTheme } from '@/hooks/use-app-theme';

const TileWidth = React.createContext(140);

export function StatGrid({ children, minTileWidth = 140 }: { children: React.ReactNode; minTileWidth?: number }) {
  return (
    <TileWidth.Provider value={minTileWidth}>
      <View style={styles.grid}>{children}</View>
    </TileWidth.Provider>
  );
}

export function StatTile({ label, value, icon }: { label: string; value: string | number; icon?: IconName }) {
  const { colors } = useAppTheme();
  const minWidth = React.useContext(TileWidth);
  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${value}`}
      style={[styles.tile, { minWidth, backgroundColor: colors.surface, borderColor: colors.border }]}>
      {icon ? <Ionicons name={icon} size={18} color={colors.primary} /> : null}
      <AppText variant="section">{String(value)}</AppText>
      <AppText variant="small" tone="muted">
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.sm },
  tile: { flexGrow: 1, flexBasis: 0, borderWidth: 1, borderRadius: Corner.card, padding: Space.md, gap: Space.xs },
});
```

- [ ] **Step 6: Dialog, form helpers, states, avatar, media, scripture, status**

Create `mobile/src/components/kit/confirm-dialog.tsx`:

```tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, StyleSheet, View } from 'react-native';

import type { IconName } from '@/components/kit/icon-button';
import { AppText } from '@/components/ui/app-text';
import { AppButton } from '@/components/ui/button';
import { Corner, Fixed, MAX_CONTENT_WIDTH, Space } from '@/constants/tokens';
import { useAppTheme } from '@/hooks/use-app-theme';

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancel',
  icon,
  destructive = false,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel?: string;
  icon?: IconName;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { colors } = useAppTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={[styles.backdrop, { backgroundColor: Fixed.scrim }]}>
        <View accessibilityViewIsModal style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {icon ? (
            <View style={[styles.icon, { backgroundColor: colors.surface }]}>
              <Ionicons name={icon} size={22} color={destructive ? colors.danger : colors.primary} />
            </View>
          ) : null}
          <AppText variant="section" accessibilityRole="header" style={styles.center}>
            {title}
          </AppText>
          {message ? (
            <AppText variant="small" tone="muted" style={styles.center}>
              {message}
            </AppText>
          ) : null}
          <View style={styles.actions}>
            <View style={styles.action}>
              <AppButton label={cancelLabel} variant="secondary" onPress={onCancel} />
            </View>
            <View style={styles.action}>
              <AppButton label={confirmLabel} variant={destructive ? 'danger' : 'primary'} onPress={onConfirm} />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Space.lg },
  card: { width: '100%', maxWidth: MAX_CONTENT_WIDTH / 2, borderWidth: 1, borderRadius: Corner.panel, padding: Space.lg, gap: Space.md },
  icon: { width: 48, height: 48, borderRadius: Corner.pill, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  center: { textAlign: 'center' },
  actions: { flexDirection: 'row', gap: Space.sm },
  action: { flex: 1 },
});
```

Create `mobile/src/components/kit/form.tsx`:

```tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';
import { Pressable, StyleSheet, Switch, View } from 'react-native';

import { ChipGroup } from '@/components/kit/chips';
import { AppText } from '@/components/ui/app-text';
import { TextField } from '@/components/ui/text-field';
import { Corner, MIN_TOUCH, Space } from '@/constants/tokens';
import { useAppTheme } from '@/hooks/use-app-theme';

type TextFieldProps = React.ComponentProps<typeof TextField>;

// TextField wired to react-hook-form. Values are shown as strings; empty for null/undefined.
export function FormTextField<T extends FieldValues>({
  control,
  name,
  ...props
}: Omit<TextFieldProps, 'value' | 'onChangeText' | 'onBlur'> & {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<T, any, any>;
  name: Path<T>;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur, value } }) => (
        <TextField
          {...props}
          value={value === undefined || value === null ? '' : String(value)}
          onChangeText={onChange}
          onBlur={onBlur}
        />
      )}
    />
  );
}

export function ChoiceField<T extends string | number | undefined>({
  label,
  options,
  value,
  onChange,
  error,
}: {
  label: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  error?: string;
}) {
  return (
    <View style={styles.field} accessibilityLabel={label}>
      <AppText variant="small" style={styles.bold}>
        {label}
      </AppText>
      <ChipGroup options={options} value={value} onChange={onChange} />
      {error ? (
        <AppText variant="small" tone="danger">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

export function SwitchRow({
  label,
  description,
  value,
  onValueChange,
}: {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.switchRow}>
      <View style={styles.switchCopy}>
        <AppText variant="bodyStrong">{label}</AppText>
        {description ? (
          <AppText variant="small" tone="muted">
            {description}
          </AppText>
        ) : null}
      </View>
      <Switch
        accessibilityLabel={label}
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.input, true: colors.primary }}
        thumbColor={value ? colors.onPrimary : colors.muted}
        ios_backgroundColor={colors.input}
      />
    </View>
  );
}

export function CheckboxRow({ label, checked, onToggle }: { label: string; checked: boolean; onToggle: () => void }) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
      style={styles.checkRow}>
      <View
        style={[
          styles.box,
          { borderColor: checked ? colors.primary : colors.input, backgroundColor: checked ? colors.primary : colors.background },
        ]}>
        {checked ? <Ionicons name="checkmark" size={16} color={colors.onPrimary} /> : null}
      </View>
      <AppText variant="small" style={styles.checkLabel}>
        {label}
      </AppText>
    </Pressable>
  );
}

// Inline result line under a form; the icon and the words carry the meaning, not just the colour.
export function FormMessage({ tone, children }: { tone: 'danger' | 'success'; children: string }) {
  const { colors } = useAppTheme();
  const color = tone === 'danger' ? colors.danger : colors.success;
  return (
    <View accessibilityLiveRegion="polite" style={[styles.message, { borderColor: color, backgroundColor: colors.surface }]}>
      <Ionicons name={tone === 'danger' ? 'alert-circle-outline' : 'checkmark-circle-outline'} size={18} color={color} />
      <AppText variant="small" style={[styles.messageText, { color }]}>
        {children}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: Space.xs },
  bold: { fontWeight: '600' },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: Space.md, minHeight: MIN_TOUCH },
  switchCopy: { flex: 1, gap: 2 },
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Space.sm + 4, minHeight: MIN_TOUCH, paddingVertical: Space.xs },
  box: { width: 24, height: 24, borderRadius: 6, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  checkLabel: { flex: 1 },
  message: { flexDirection: 'row', alignItems: 'flex-start', gap: Space.sm, borderWidth: 1, borderRadius: Corner.control, padding: Space.sm + 4 },
  messageText: { flex: 1 },
});
```

Note: if `npm run lint` reports "Definition for rule '@typescript-eslint/no-explicit-any' was not found", delete the `eslint-disable-next-line` comment line (the Expo config may not load that plugin). Keep it if lint is quiet.

Create `mobile/src/components/kit/states.tsx`:

```tsx
import React from 'react';
import { StyleSheet, View } from 'react-native';

import type { IconName } from '@/components/kit/icon-button';
import { AppButton } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Corner, Space } from '@/constants/tokens';

export function LoadingList({ count = 3, height = 88 }: { count?: number; height?: number }) {
  return (
    <View accessibilityLabel="Loading" style={styles.list}>
      {Array.from({ length: count }, (_, index) => (
        <Skeleton key={index} height={height} radius={Corner.card} />
      ))}
    </View>
  );
}

export function ErrorState({
  title = 'Could not load this',
  message = 'Check your connection and try again.',
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <EmptyState
      icon="cloud-offline-outline"
      title={title}
      message={message}
      action={onRetry ? <AppButton label="Try again" variant="secondary" onPress={onRetry} /> : undefined}
    />
  );
}

export function SignInPrompt({
  title,
  message,
  onSignIn,
  label = 'Sign in',
  icon = 'person-circle-outline',
}: {
  title: string;
  message: string;
  onSignIn: () => void;
  label?: string;
  icon?: IconName;
}) {
  return (
    <EmptyState
      icon={icon}
      title={title}
      message={message}
      action={
        <View style={styles.action}>
          <AppButton label={label} onPress={onSignIn} />
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  list: { gap: Space.sm },
  action: { alignSelf: 'stretch' },
});
```

Create `mobile/src/components/kit/avatar.tsx`:

```tsx
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Corner } from '@/constants/tokens';
import { useAppTheme } from '@/hooks/use-app-theme';

export function Avatar({ initials, size = 48, tone = 'primary' }: { initials: string; size?: number; tone?: 'primary' | 'gold' }) {
  const { colors } = useAppTheme();
  const bg = tone === 'gold' ? colors.goldSoft : colors.primary;
  const fg = tone === 'gold' ? colors.goldInk : colors.onPrimary;
  return (
    <View
      accessible={false}
      style={[styles.avatar, { width: size, height: size, backgroundColor: bg }]}>
      <AppText variant={size >= 72 ? 'title' : 'bodyStrong'} style={{ color: fg }}>
        {initials}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: { borderRadius: Corner.pill, alignItems: 'center', justifyContent: 'center' },
});
```

Create `mobile/src/components/kit/media.tsx`:

```tsx
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import type { IconName } from '@/components/kit/icon-button';
import { Corner } from '@/constants/tokens';
import { useAppTheme } from '@/hooks/use-app-theme';

// A picture, or a calm surface-coloured placeholder with an icon when there is none.
export function MediaFrame({
  uri,
  icon = 'image-outline',
  height = 180,
  radius = Corner.card,
  accessibilityLabel,
}: {
  uri?: string | null;
  icon?: IconName;
  height?: number;
  radius?: number;
  accessibilityLabel?: string;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.frame, { height, borderRadius: radius, backgroundColor: colors.surface }]}>
      {uri ? (
        <Image
          source={{ uri }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          accessibilityLabel={accessibilityLabel}
          accessible={Boolean(accessibilityLabel)}
        />
      ) : (
        <Ionicons name={icon} size={36} color={colors.muted} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { width: '100%', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
});
```

Create `mobile/src/components/kit/scripture.tsx`:

```tsx
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Space } from '@/constants/tokens';
import { useAppTheme } from '@/hooks/use-app-theme';

// Scripture and quotes: serif text with the 3px gold left rule (spec §2.2).
export function Scripture({ text, reference, lines }: { text: string; reference?: string | null; lines?: number }) {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.rule, { borderLeftColor: colors.gold }]}>
      <AppText serif numberOfLines={lines} style={styles.text}>
        {text}
      </AppText>
      {reference ? (
        <AppText variant="small" tone="muted" style={styles.reference}>
          {reference}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  rule: { borderLeftWidth: 3, paddingLeft: Space.md, gap: Space.xs },
  text: { fontSize: 18, lineHeight: 28, fontStyle: 'italic' },
  reference: { fontWeight: '600' },
});
```

Create `mobile/src/components/kit/status.ts`:

```ts
// Maps an API status word to a badge tone. The badge always shows the word itself too.
export function statusTone(status?: string | null): 'neutral' | 'success' | 'warning' | 'danger' {
  const value = String(status || '').toLowerCase();
  if (['completed', 'paid', 'published', 'answered', 'active', 'approved', 'verified'].includes(value)) return 'success';
  if (['pending', 'processing', 'draft', 'scheduled'].includes(value)) return 'warning';
  if (['failed', 'cancelled', 'canceled', 'rejected', 'declined'].includes(value)) return 'danger';
  return 'neutral';
}
```

Create `mobile/src/components/kit/index.ts`:

```ts
// Phase 8d screen kit, built on the 8a primitives in components/ui. Candidates for promotion after 8d merges.
export { Avatar } from './avatar';
export { Chip, ChipGroup, UnderlineTabs } from './chips';
export { ConfirmDialog } from './confirm-dialog';
export { CheckboxRow, ChoiceField, FormMessage, FormTextField, SwitchRow } from './form';
export { IconButton, type IconName } from './icon-button';
export { InfoLine, ListGroup, ListRow } from './list';
export { MediaFrame } from './media';
export { Screen, ScreenHeader } from './screen';
export { Scripture } from './scripture';
export { SectionHeader } from './section';
export { StatGrid, StatTile } from './stat';
export { ErrorState, LoadingList, SignInPrompt } from './states';
export { statusTone } from './status';
```

- [ ] **Step 7: Tabs: Home · Watch · Events · Give · Me (bar colour chosen per screen)**

The bar's colours are set per tab (React Navigation applies the focused screen's `tabBarStyle`). Each tab uses `legacy` until its screen moves to the tokens, then `tokens`. Each of Tasks 2–6 changes only its own tab's spread (Ruling 2).

Replace `mobile/src/app/(tabs)/_layout.tsx` with:

```tsx
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useTheme } from '@/hooks/use-theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const icon =
  (active: IconName, idle: IconName) =>
  ({ color, focused }: { color: string; focused: boolean }) => <Ionicons name={focused ? active : idle} size={22} color={color} />;

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
```

If lint flags `react/display-name` on the `icon` factory, give the inner function a name: `function TabIcon({ color, focused }: …) { return …; }` and `return TabIcon;`.

- [ ] **Step 8: Splash overlay on tokens (always navy, Ruling 6)**

In `mobile/src/components/animated-icon.tsx`:

1. Add the import after the `react-native-worklets` import:
   ```ts
   import { Palette } from '@/constants/tokens';

   const brand = Palette.dark;
   ```
2. In `styles.background`, replace `backgroundColor: '#16213a'` with `backgroundColor: brand.surface`, `borderColor: 'rgba(255,255,255,0.08)'` with `borderColor: brand.border`, and `shadowColor: '#208AEF'` with `shadowColor: brand.primary`.
3. In `styles.backgroundSolidColor`, replace `backgroundColor: '#0f172a'` with `backgroundColor: brand.background`.
4. In `styles.wordmarkTitle`, replace `color: '#F8FAFC'` with `color: brand.text`.
5. In `styles.wordmarkSubtitle`, replace `color: '#FBBF24'` with `color: brand.gold`.

Leave the animation code untouched.

- [ ] **Step 9: Delete unused template tab and CSS files**

First prove nothing imports them (each grep must print nothing):
```bash
cd mobile && grep -rn "app-tabs" src; grep -rn "animated-icon.module" src
```
Then:
```bash
git rm mobile/src/components/app-tabs.tsx mobile/src/components/app-tabs.web.tsx mobile/src/components/animated-icon.module.css
```

- [ ] **Step 10: Route check (Review Focus 2)**

The baseline of route targets is commit `fc3fd49` itself; Task 10 compares the final tree against it with `git grep`, so nothing needs saving now. Confirm that `src/app/(tabs)/` still holds `index.tsx`, `sermons.tsx`, `events.tsx`, `give.tsx`, `account.tsx` and `news.tsx`:
```bash
ls "src/app/(tabs)"
```

- [ ] **Step 11: Colour and import scans**

```bash
cd mobile && grep -nE "#[0-9A-Fa-f]{3,8}\b|rgba?\(" src/components/kit/* "src/app/(tabs)/_layout.tsx" src/components/animated-icon.tsx
```
Expected: no output.
```bash
cd mobile && grep -nE "brand-ui|themed-text|themed-view|hooks/use-theme'|constants/theme'" src/components/kit/*
```
Expected: no output. (`(tabs)/_layout.tsx` deliberately still imports `use-theme` until Task 6.)

- [ ] **Step 12: Lint and type-check**

Run: `cd mobile && npm run -s lint && npx tsc --noEmit && echo mobile-ok`
Expected: `mobile-ok`.

- [ ] **Step 13: By-eye check (user, light and dark)**

- On a cold start, the splash is navy with "ANT PRESS" in near-white and the gold subtitle, in both phone themes.
- The bottom bar is docked (not floating) and reads **Home · Watch · Events · Give · Me**, with icons. Each tab opens the same screen as before (Watch shows the sermons screen; Me shows the account screen).
- Each tab icon and label is easy to hit (the tab bar height is at least 49).
- Tapping a notification with no entity, or any Home quick action, still lands where it did before.

- [ ] **Step 14: Commit**

```bash
git add mobile/src/constants/tokens.ts mobile/src/components/kit "mobile/src/app/(tabs)/_layout.tsx" mobile/src/components/animated-icon.tsx
git commit -m "feat(mobile): screen kit on the 8a tokens, Home/Watch/Events/Give/Me tab labels, navy splash

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: The hub Home, the live card and News

**Files:**
- Rewrite: `mobile/src/app/(tabs)/index.tsx`
- Rewrite: `mobile/src/components/live-card.tsx`
- Rewrite: `mobile/src/app/(tabs)/news.tsx` (the hidden tab behind the Home "News" tile; Ruling 2)
- Modify: `mobile/src/app/(tabs)/_layout.tsx` (the `index` and `news` tabs switch to `tokens`)

**Interfaces:**
- Consumes: the kit from Task 1 (`Screen`, `ScreenHeader`, `SectionHeader`, `IconButton`, `ListGroup`, `ListRow`, `Scripture`, `LoadingList`, `ErrorState`); `AppTile`, `AppBadge`, `AppCard`, `AppText`, `EmptyState`, `Skeleton`; `useLiveStream`, `useTodayDevotional`, `useUpcomingEvents`, `useNews`.
- Produces: `LiveCard()` (no props; renders nothing when not live), reused by Watch in Task 3.

Home layout (spec §3.2, Ruling 7), top to bottom:
1. greeting row (with Search and Notifications icon buttons)
2. live card
3. today's devotional
4. the eight hub tiles
5. upcoming events

- [ ] **Step 1: Live card on tokens**

Replace `mobile/src/components/live-card.tsx` with:

```tsx
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import React from 'react';
import { Alert, Linking, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Corner, MIN_TOUCH, Space } from '@/constants/tokens';
import { useLiveStream } from '@/hooks/use-api';
import { useAppTheme } from '@/hooks/use-app-theme';

const openLink = async (url: string) => {
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert('Could not open the link', 'Please try again in a moment.');
  }
};

// Shown on Home and Watch only while the church is live; refreshed whenever the screen gains focus.
export function LiveCard() {
  const { colors } = useAppTheme();
  const { data: live, refetch } = useLiveStream();

  useFocusEffect(
    React.useCallback(() => {
      refetch();
    }, [refetch])
  );

  if (!live?.is_live) return null;

  return (
    <View style={[styles.card, { backgroundColor: colors.dangerSolid }]}>
      <View style={[styles.pill, { borderColor: colors.onDangerSolid }]}>
        <View style={[styles.dot, { backgroundColor: colors.onDangerSolid }]} />
        <AppText variant="caption" style={[styles.pillText, { color: colors.onDangerSolid }]}>
          Live now
        </AppText>
      </View>
      <AppText variant="section" accessibilityRole="header" style={{ color: colors.onDangerSolid }}>
        {live.title || "We're live"}
      </AppText>
      <View style={styles.buttons}>
        {live.youtube_url ? <WatchButton icon="logo-youtube" label="Watch on YouTube" url={live.youtube_url} /> : null}
        {live.facebook_url ? <WatchButton icon="logo-facebook" label="Watch on Facebook" url={live.facebook_url} /> : null}
      </View>
    </View>
  );
}

function WatchButton({ icon, label, url }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; url: string }) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      onPress={() => openLink(url)}
      accessibilityRole="link"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.watch, { backgroundColor: colors.onDangerSolid, opacity: pressed ? 0.85 : 1 }]}>
      <Ionicons name={icon} size={18} color={colors.dangerSolid} />
      <AppText variant="bodyStrong" style={{ color: colors.dangerSolid }}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: Corner.panel, padding: Space.lg, gap: Space.sm },
  pill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.xs,
    borderWidth: 1,
    borderRadius: Corner.pill,
    paddingHorizontal: Space.sm + 2,
    paddingVertical: 2,
  },
  dot: { width: 8, height: 8, borderRadius: Corner.pill },
  pillText: { textTransform: 'uppercase', letterSpacing: 1 },
  buttons: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.sm, marginTop: Space.xs },
  watch: {
    minHeight: MIN_TOUCH,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.sm,
    borderRadius: Corner.pill,
    paddingHorizontal: Space.md,
  },
});
```

- [ ] **Step 2: Home hub**

Replace `mobile/src/app/(tabs)/index.tsx` with:

```tsx
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import {
  ErrorState,
  IconButton,
  ListGroup,
  ListRow,
  LoadingList,
  Screen,
  Scripture,
  SectionHeader,
} from '@/components/kit';
import { LiveCard } from '@/components/live-card';
import { AppText } from '@/components/ui/app-text';
import { AppBadge } from '@/components/ui/badge';
import { AppCard } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { AppTile } from '@/components/ui/tile';
import { Corner, Space } from '@/constants/tokens';
import { useLiveStream, useTodayDevotional, useUpcomingEvents } from '@/hooks/use-api';
import { APP_NAME } from '@/lib/config';
import { useAuthStore } from '@/store/auth';

type TileIcon = React.ComponentProps<typeof AppTile>['icon'];

// The same destinations as the website hub (frontend/src/lib/navigation.ts HUB_LINKS), mapped to app routes.
// The app has no /live screen; Watch shows the live card, so "Live" opens Watch.
const HUB_TILES: { label: string; description: string; icon: TileIcon; href: string; live?: boolean }[] = [
  { label: 'Live', description: 'Join the service online', icon: 'radio-outline', href: '/sermons', live: true },
  { label: 'Devotional', description: "Today's reading and prayer", icon: 'book-outline', href: '/daily-devotional' },
  { label: 'Small groups', description: 'Grow together in the week', icon: 'people-outline', href: '/small-groups' },
  { label: 'Prayer wall', description: 'Pray for one another', icon: 'heart-outline', href: '/prayer-wall' },
  { label: 'Gallery', description: 'Photos from services and events', icon: 'images-outline', href: '/gallery' },
  { label: 'News', description: 'Updates from the church', icon: 'newspaper-outline', href: '/news' },
  { label: 'Community', description: 'Stories from members', icon: 'chatbubbles-outline', href: '/community' },
  { label: 'Ministries', description: 'Serve and connect', icon: 'sparkles-outline', href: '/ministries' },
];

const formatEventDate = (value?: string) =>
  value
    ? new Date(value).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    : 'Date to be announced';

export default function HomeScreen() {
  const user = useAuthStore((state) => state.user);
  const upcomingEventsQuery = useUpcomingEvents();
  const devotionalQuery = useTodayDevotional();
  const liveQuery = useLiveStream();
  const events = Array.isArray(upcomingEventsQuery.data) ? upcomingEventsQuery.data.slice(0, 3) : [];
  const devotional = devotionalQuery.data;
  const isLive = Boolean(liveQuery.data?.is_live);
  const title = APP_NAME.replace(/\s+Mobile$/i, '');
  const name = user?.first_name ? `, ${user.first_name}` : '';

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <AppText variant="small" tone="muted">
            {`${getGreeting()}${name}`}
          </AppText>
          <AppText variant="title" accessibilityRole="header">
            {title}
          </AppText>
        </View>
        <IconButton icon="search-outline" accessibilityLabel="Search" onPress={() => router.push('/search' as never)} />
        <IconButton
          icon="notifications-outline"
          accessibilityLabel={user ? 'Notifications' : 'News'}
          onPress={() => router.push(user ? '/notifications' : ('/news' as never))}
        />
      </View>

      <LiveCard />

      <SectionHeader
        title={devotional && devotional.is_today === false ? 'Latest devotional' : "Today's devotional"}
        actionLabel="Open"
        onAction={() => router.push('/daily-devotional' as never)}
      />
      {devotionalQuery.isLoading ? (
        <Skeleton height={132} radius={Corner.card} />
      ) : devotionalQuery.isError ? (
        <ErrorState title="Could not load the devotional" onRetry={() => devotionalQuery.refetch()} />
      ) : devotional ? (
        <AppCard
          onPress={() => router.push('/daily-devotional' as never)}
          accessibilityLabel={`Devotional: ${devotional.title}`}>
          <AppText variant="bodyStrong">{devotional.title}</AppText>
          <Scripture text={devotional.scripture_text} reference={devotional.scripture_reference} lines={3} />
        </AppCard>
      ) : (
        <EmptyState icon="book-outline" title="No devotional yet" message="Today's reading will appear here once it is published." />
      )}

      <SectionHeader title="Explore" />
      <View style={styles.grid}>
        {HUB_TILES.map((tile) => (
          <View key={tile.label} style={styles.gridItem}>
            <AppTile
              icon={tile.icon}
              label={tile.label}
              description={tile.description}
              onPress={() => router.push(tile.href as never)}
              badge={tile.live && isLive ? <AppBadge tone="live">Live</AppBadge> : undefined}
            />
          </View>
        ))}
      </View>

      <SectionHeader title="Upcoming events" actionLabel="See all" onAction={() => router.push('/events')} />
      {upcomingEventsQuery.isLoading ? (
        <LoadingList count={2} height={64} />
      ) : upcomingEventsQuery.isError ? (
        <ErrorState title="Could not load events" onRetry={() => upcomingEventsQuery.refetch()} />
      ) : events.length === 0 ? (
        <EmptyState icon="calendar-outline" title="No upcoming events" message="New events will show here." />
      ) : (
        <ListGroup>
          {events.map((event: any) => (
            <ListRow
              key={String(event.id)}
              icon="calendar-outline"
              label={event.name || 'Event'}
              description={[formatEventDate(event.event_date), event.location].filter(Boolean).join(' · ')}
              onPress={() => router.push({ pathname: '/events/[id]', params: { id: String(event.id) } })}
            />
          ))}
        </ListGroup>
      )}
    </Screen>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: Space.sm },
  headerCopy: { flex: 1, gap: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.sm },
  gridItem: { flexBasis: '47%', flexGrow: 1 },
});
```

- [ ] **Step 3: News (hidden tab)**

Replace `mobile/src/app/(tabs)/news.tsx` with:

```tsx
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ErrorState, LoadingList, Screen, ScreenHeader } from '@/components/kit';
import { AppText } from '@/components/ui/app-text';
import { AppBadge } from '@/components/ui/badge';
import { AppCard } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Space } from '@/constants/tokens';
import { useNews } from '@/hooks/use-api';

export default function NewsScreen() {
  const { data, isLoading, isError, refetch } = useNews();
  const items = Array.isArray(data) ? data : [];

  return (
    <Screen>
      <ScreenHeader back title="News" subtitle="Updates and announcements from the church" />

      {isLoading ? (
        <LoadingList />
      ) : isError ? (
        <ErrorState title="Could not load news" onRetry={() => refetch()} />
      ) : items.length === 0 ? (
        <EmptyState icon="newspaper-outline" title="No news yet" message="Posts published by the church will appear here." />
      ) : (
        items.map((item: any, index: number) => (
          <AppCard
            key={String(item.id)}
            onPress={() => router.push(`/news/${item.id}` as never)}
            accessibilityLabel={`Read ${item.title}`}>
            <View style={styles.meta}>
              {index === 0 ? <AppBadge tone="gold">Featured</AppBadge> : null}
              <AppText variant="caption" tone="muted">
                {item.published_at ? new Date(item.published_at).toLocaleDateString() : 'Published'}
              </AppText>
            </View>
            <AppText variant="bodyStrong">{item.title}</AppText>
            {item.summary ? (
              <AppText variant="small" tone="muted" numberOfLines={3}>
                {item.summary}
              </AppText>
            ) : null}
            <AppText variant="small" tone="link">
              Read more
            </AppText>
          </AppCard>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  meta: { flexDirection: 'row', alignItems: 'center', gap: Space.sm },
});
```

The old screen was titled "Sermons" and had three filter pills that did nothing (Ruling 9). The first post keeps its "Featured" mark.

- [ ] **Step 4: Tab bar for Home and News on tokens**

In `mobile/src/app/(tabs)/_layout.tsx`, change exactly these two lines:
- `<Tabs.Screen name="index" options={{ ...legacy, title: 'Home', …` → `<Tabs.Screen name="index" options={{ ...tokens, title: 'Home', …`
- `<Tabs.Screen name="news" options={{ ...legacy, href: null }} />` → `<Tabs.Screen name="news" options={{ ...tokens, href: null }} />`

- [ ] **Step 5: Scans**

```bash
cd mobile
grep -nE "#[0-9A-Fa-f]{3,8}\b|rgba?\(" "src/app/(tabs)/index.tsx" "src/app/(tabs)/news.tsx" src/components/live-card.tsx "src/app/(tabs)/_layout.tsx"
grep -nE "brand-ui|themed-text|themed-view|hooks/use-theme'|constants/theme'" "src/app/(tabs)/index.tsx" "src/app/(tabs)/news.tsx" src/components/live-card.tsx
```
Expected: no output from either grep.

- [ ] **Step 6: Lint and type-check**

Run: `cd mobile && npm run -s lint && npx tsc --noEmit && echo mobile-ok`
Expected: `mobile-ok`.

- [ ] **Step 7: By-eye check (user, light and dark)**

Tab bar:
- On Home (and on News) the bottom bar is white with a navy active tab in light, and navy with a blue active tab in dark.
- Switching to Watch/Events/Give/Me shows the old dark bar with those still-old screens. That is expected until their tasks.

Home:
- The greeting reads "Good morning/afternoon/evening" (with your first name when signed in). Search and bell buttons sit on the right and are easy to tap. The bell opens Notifications when signed in and News when signed out.
- Today's devotional card shows the title and a serif scripture with a gold left rule; tapping opens the devotional. With no devotional, a friendly empty card shows. Offline, a "Could not load" card with "Try again" shows.
- Eight tiles in two columns: Live, Devotional, Small groups, Prayer wall, Gallery, News, Community, Ministries. Each opens its screen; Live opens Watch.
- While a stream is live (start one from admin Livestream), the red live card shows on Home and the Live tile carries a red "Live" badge. Both YouTube/Facebook buttons open the app. In dark the card is a brighter red with navy text, still readable.
- Upcoming events lists up to three; each opens its event; "See all" opens the Events tab.

News:
- Home → News tile opens News, with a back button and readable cards in both themes. A card opens the post.

Confirm in both themes that no text is white-on-white or navy-on-navy.

- [ ] **Step 8: Commit**

```bash
git add "mobile/src/app/(tabs)/index.tsx" "mobile/src/app/(tabs)/news.tsx" mobile/src/components/live-card.tsx "mobile/src/app/(tabs)/_layout.tsx"
git commit -m "feat(mobile): hub Home with devotional, tiles and events; live card and News on tokens

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Watch (sermons, live card, series), sermon detail and search

**Files:**
- Rewrite: `mobile/src/screens/SermonsScreen.tsx` (shown by `(tabs)/sermons.tsx`, which is unchanged)
- Rewrite: `mobile/src/app/sermons/[id].tsx`
- Rewrite: `mobile/src/app/search.tsx` (opened from Watch and Home)
- Modify: `mobile/src/app/(tabs)/_layout.tsx` (the `sermons` tab switches to `tokens`)

**Interfaces:**
- Consumes: `LiveCard` (Task 2); kit `Screen`, `ScreenHeader`, `SectionHeader`, `IconButton`, `ChipGroup`, `ListGroup`, `ListRow`, `InfoLine`, `MediaFrame`, `LoadingList`, `ErrorState`; `useSermons`, `useSermonSeriesList`, `useSermonById`, `useGlobalSearch`.
- Produces: nothing new.

- [ ] **Step 1: Watch screen**

Replace `mobile/src/screens/SermonsScreen.tsx` with:

```tsx
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import {
  ChipGroup,
  ErrorState,
  IconButton,
  ListGroup,
  ListRow,
  LoadingList,
  MediaFrame,
  Screen,
  ScreenHeader,
  SectionHeader,
} from '@/components/kit';
import { LiveCard } from '@/components/live-card';
import { AppText } from '@/components/ui/app-text';
import { AppBadge } from '@/components/ui/badge';
import { AppCard } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Space } from '@/constants/tokens';
import { useSermons, useSermonSeriesList } from '@/hooks/use-api';

const formatDate = (value?: string) => (value ? new Date(value).toLocaleDateString() : '');

// The Watch tab: live card while live, series filter, the latest sermon, then recent messages.
export default function SermonsScreen() {
  const [selectedSeriesId, setSelectedSeriesId] = React.useState<number | undefined>();
  const sermonsQuery = useSermons(1, 12, true, selectedSeriesId);
  const seriesQuery = useSermonSeriesList();
  const sermons = Array.isArray(sermonsQuery.data) ? sermonsQuery.data : [];
  const seriesOptions = [
    { value: undefined as number | undefined, label: 'All' },
    ...(seriesQuery.data || []).map((item) => ({ value: item.id as number | undefined, label: item.title })),
  ];
  const featured = sermons[0];
  const recent = featured ? sermons.slice(1) : sermons;

  return (
    <Screen>
      <ScreenHeader
        title="Watch"
        subtitle="Live services, sermons and series"
        right={
          <IconButton
            icon="search-outline"
            accessibilityLabel="Search sermons and events"
            onPress={() => router.push('/search' as never)}
          />
        }
      />

      <LiveCard />

      {seriesOptions.length > 1 ? (
        <>
          <SectionHeader title="Series" />
          <ChipGroup scroll options={seriesOptions} value={selectedSeriesId} onChange={setSelectedSeriesId} />
        </>
      ) : null}

      {sermonsQuery.isLoading ? (
        <LoadingList count={3} height={96} />
      ) : sermonsQuery.isError ? (
        <ErrorState title="Could not load sermons" onRetry={() => sermonsQuery.refetch()} />
      ) : !featured ? (
        <EmptyState
          icon="play-circle-outline"
          title="No sermons yet"
          message={selectedSeriesId ? 'This series has no sermons yet.' : 'New sermons will appear here.'}
        />
      ) : (
        <>
          <SectionHeader title="Latest sermon" />
          <AppCard
            onPress={() => router.push(`/sermons/${featured.id}` as never)}
            accessibilityLabel={`Latest sermon: ${featured.title || 'Untitled sermon'}`}
            style={styles.featured}>
            <MediaFrame icon="play-circle-outline" height={168} radius={0} />
            <View style={styles.featuredBody}>
              {featured.series_title ? <AppBadge tone="gold">{String(featured.series_title)}</AppBadge> : null}
              <AppText variant="section">{featured.title || 'Untitled sermon'}</AppText>
              <AppText variant="small" tone="muted">
                {[featured.speaker || 'Speaker unavailable', formatDate(featured.sermon_date)].filter(Boolean).join(' · ')}
              </AppText>
            </View>
          </AppCard>

          {recent.length > 0 ? (
            <>
              <SectionHeader title="Recent messages" actionLabel="Search" onAction={() => router.push('/search' as never)} />
              <ListGroup>
                {recent.map((sermon: any) => (
                  <ListRow
                    key={String(sermon?.id)}
                    icon="play-outline"
                    label={sermon?.title || 'Untitled sermon'}
                    description={[sermon?.series_title, sermon?.speaker, sermon?.duration].filter(Boolean).join(' · ') || undefined}
                    onPress={() => router.push(`/sermons/${sermon?.id}` as never)}
                  />
                ))}
              </ListGroup>
            </>
          ) : null}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  featured: { padding: 0, gap: 0, overflow: 'hidden' },
  featuredBody: { padding: Space.md, gap: Space.xs },
});
```

What changed besides the look (Ruling 9):
- The read-only search box and filter button become one Search icon button (same `/search` target as the old "Explore" link).
- The fake durations and view counts are gone; a real `duration` still shows in the row description.
- The decorative bookmark/heart icons are gone.

- [ ] **Step 2: Sermon detail**

Replace `mobile/src/app/sermons/[id].tsx` with:

```tsx
import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { InfoLine, LoadingList, MediaFrame, Screen, ScreenHeader } from '@/components/kit';
import { AppText } from '@/components/ui/app-text';
import { AppBadge } from '@/components/ui/badge';
import { AppCard } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Space } from '@/constants/tokens';
import { useSermonById } from '@/hooks/use-api';

export default function SermonDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const sermonId = params.id;
  const sermonQuery = useSermonById(sermonId);
  const sermon = sermonQuery.data;
  const videoUrl = sermon?.video_url || sermon?.videoUrl;

  return (
    <Screen>
      <ScreenHeader back eyebrow={sermon?.series || 'Sermon'} title={sermon?.title || 'Sermon'} />

      {sermonQuery.isLoading ? (
        <LoadingList count={2} height={140} />
      ) : sermon ? (
        <>
          <MediaFrame icon="play-circle-outline" height={200} />
          <View style={styles.meta}>
            <AppBadge>{sermon?.speaker || 'Speaker not listed'}</AppBadge>
            <AppText variant="small" tone="muted">
              {sermon?.sermon_date ? new Date(sermon.sermon_date).toLocaleDateString() : 'Date unavailable'}
            </AppText>
          </View>
          <AppText>{sermon?.description || 'No description provided.'}</AppText>
          <AppCard>
            <AppText variant="bodyStrong">Video</AppText>
            {videoUrl ? (
              <InfoLine icon="videocam-outline" selectable>
                {videoUrl}
              </InfoLine>
            ) : (
              <AppText variant="small" tone="muted">
                No video link attached yet.
              </AppText>
            )}
          </AppCard>
        </>
      ) : (
        <EmptyState icon="play-circle-outline" title="Sermon not found" message="It may have been removed." />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  meta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Space.sm },
});
```

The decorative share/heart/play buttons, the fake progress bar and the "Notes … next" placeholder are gone (Ruling 9). The video link is still shown as selectable text, exactly as before; it was never a link.

- [ ] **Step 3: Search**

Replace `mobile/src/app/search.tsx` with:

```tsx
import { router } from 'expo-router';
import React from 'react';

import { ListGroup, ListRow, LoadingList, Screen, ScreenHeader, SectionHeader } from '@/components/kit';
import { AppText } from '@/components/ui/app-text';
import { TextField } from '@/components/ui/text-field';
import { useGlobalSearch } from '@/hooks/use-api';

export default function SearchScreen() {
  const [query, setQuery] = React.useState('');
  const searchQuery = useGlobalSearch(query);
  const sermons = searchQuery.data?.sermons || [];
  const events = searchQuery.data?.events || [];

  return (
    <Screen>
      <ScreenHeader back title="Search" subtitle="Find sermons and events" />

      <TextField
        label="Search"
        value={query}
        onChangeText={setQuery}
        placeholder="Search sermons, speakers, events..."
        returnKeyType="search"
      />

      {query.trim().length < 2 ? (
        <AppText variant="small" tone="muted">
          Enter at least 2 characters to search.
        </AppText>
      ) : searchQuery.isLoading ? (
        <LoadingList count={2} height={56} />
      ) : (
        <>
          <SectionHeader title={`Sermons (${sermons.length})`} />
          {sermons.length > 0 ? (
            <ListGroup>
              {sermons.map((sermon: any) => (
                <ListRow
                  key={String(sermon?.id)}
                  icon="play-outline"
                  label={sermon?.title || 'Sermon'}
                  description={sermon?.speaker || undefined}
                  onPress={() => router.push(`/sermons/${sermon?.id}` as never)}
                />
              ))}
            </ListGroup>
          ) : (
            <AppText variant="small" tone="muted">
              No sermons found.
            </AppText>
          )}

          <SectionHeader title={`Events (${events.length})`} />
          {events.length > 0 ? (
            <ListGroup>
              {events.map((event: any) => (
                <ListRow
                  key={String(event?.id)}
                  icon="calendar-outline"
                  label={event?.name || 'Event'}
                  onPress={() => router.push({ pathname: '/events/[id]', params: { id: String(event?.id) } })}
                />
              ))}
            </ListGroup>
          ) : (
            <AppText variant="small" tone="muted">
              No events found.
            </AppText>
          )}
        </>
      )}
    </Screen>
  );
}
```

- [ ] **Step 4: Tab bar for Watch on tokens**

In `mobile/src/app/(tabs)/_layout.tsx`, change `<Tabs.Screen name="sermons" options={{ ...legacy, …` to `<Tabs.Screen name="sermons" options={{ ...tokens, …`.

- [ ] **Step 5: Scans**

```bash
cd mobile
grep -nE "#[0-9A-Fa-f]{3,8}\b|rgba?\(" src/screens/SermonsScreen.tsx "src/app/sermons/[id].tsx" src/app/search.tsx "src/app/(tabs)/_layout.tsx"
grep -nE "brand-ui|themed-text|themed-view|hooks/use-theme'|constants/theme'" src/screens/SermonsScreen.tsx "src/app/sermons/[id].tsx" src/app/search.tsx
```
Expected: no output from either grep.

- [ ] **Step 6: Lint and type-check**

Run: `cd mobile && npm run -s lint && npx tsc --noEmit && echo mobile-ok`
Expected: `mobile-ok`.

- [ ] **Step 7: By-eye check (user, light and dark)**

Watch:
- The Watch tab title reads "Watch" with a Search button.
- While live, the red live card shows at the top.
- Series chips scroll sideways; each is at least 44 tall; the selected chip is filled navy (light) or blue (dark) with readable text. Picking a series filters the list; "All" resets it.
- The latest sermon card shows a placeholder frame, an optional gold series badge, the title and "speaker · date". Tapping it opens the sermon.
- Recent messages are rows with chevrons; each opens its sermon. "Search" opens Search.
- Offline or empty: a friendly card, not a blank screen.

Sermon detail:
- The back button works. Speaker badge and date, description, and a Video card (link or "No video link attached yet.").

Search:
- Typing one letter shows the hint; two or more show Sermons and Events sections. Each row opens the right screen.

Tab bar:
- On Watch, the bar is on the new colours (same as Home).

- [ ] **Step 8: Commit**

```bash
git add mobile/src/screens/SermonsScreen.tsx "mobile/src/app/sermons/[id].tsx" mobile/src/app/search.tsx "mobile/src/app/(tabs)/_layout.tsx"
git commit -m "feat(mobile): Watch tab with live card, series chips and latest sermon; sermon detail and search on tokens

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Events tab and event detail

**Files:**
- Rewrite: `mobile/src/app/(tabs)/events.tsx`
- Rewrite: `mobile/src/app/events/[id].tsx`
- Modify: `mobile/src/app/(tabs)/_layout.tsx` (the `events` tab switches to `tokens`)

**Interfaces:**
- Consumes: kit `Screen`, `ScreenHeader`, `SectionHeader`, `IconButton`, `InfoLine`, `ListGroup`, `ListRow`, `MediaFrame`, `LoadingList`, `ErrorState`, `statusTone`; `AppButton`, `AppCard`, `AppBadge`, `AppText`, `EmptyState`; hooks `useUpcomingEvents`, `useMyEventRegistrations`, `useRegisterForEvent`, `useEventById`, `useCancelEventRegistration`; `formatCedis`, `resolveImageUrl`.
- Produces: nothing new.

Behaviour kept exactly:
- **Next-event button:** signed out → `/events/<id>`; registered → event page; otherwise → `registerMutation.mutate`.
- **Row action:** signed out → `/login`; registered → event page; otherwise → register.
- **Amount buttons:** → `/donate?amount=N`.
- **Give now:** → `/donate`.
- **Detail page:** register/cancel; "View event photos" → `/gallery/<album_id>`; signed out → `/login`.

- [ ] **Step 1: Events tab**

Replace `mobile/src/app/(tabs)/events.tsx` with:

```tsx
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ErrorState, IconButton, InfoLine, LoadingList, Screen, ScreenHeader, SectionHeader } from '@/components/kit';
import { AppText } from '@/components/ui/app-text';
import { AppBadge } from '@/components/ui/badge';
import { AppButton } from '@/components/ui/button';
import { AppCard } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Corner, Space } from '@/constants/tokens';
import { useMyEventRegistrations, useRegisterForEvent, useUpcomingEvents } from '@/hooks/use-api';
import { useAppTheme } from '@/hooks/use-app-theme';
import { formatCedis } from '@/lib/currency';
import { resolveImageUrl } from '@/lib/media';
import { useAuthStore } from '@/store/auth';

export default function EventsScreen() {
  const user = useAuthStore((state) => state.user);
  const { data, isLoading, isError, refetch } = useUpcomingEvents();
  const registrationsQuery = useMyEventRegistrations(Boolean(user));
  const registerMutation = useRegisterForEvent();
  const items = Array.isArray(data) ? data : [];
  const registeredIds = new Set((registrationsQuery.data || []).map((item: any) => item.id));
  const nextEvent = items[0];

  return (
    <Screen>
      <ScreenHeader title="Events" subtitle="Services, gatherings and ways to serve" />

      {nextEvent ? (
        <AppCard>
          <AppBadge tone="gold">Next event</AppBadge>
          <AppText variant="section">{nextEvent.name}</AppText>
          <InfoLine icon="time-outline">{formatBannerDate(nextEvent.event_date)}</InfoLine>
          <InfoLine icon="location-outline">{nextEvent.location || 'Location will be announced'}</InfoLine>
          <AppButton
            label={registeredIds.has(nextEvent.id) ? 'Already registered' : 'Register now'}
            variant={registeredIds.has(nextEvent.id) ? 'secondary' : 'primary'}
            onPress={() =>
              user
                ? registeredIds.has(nextEvent.id)
                  ? router.push({ pathname: '/events/[id]', params: { id: String(nextEvent.id) } })
                  : registerMutation.mutate(nextEvent.id)
                : router.push(`/events/${nextEvent.id}` as never)
            }
          />
        </AppCard>
      ) : null}

      <SectionHeader title="All events" />

      {isLoading ? (
        <LoadingList count={3} height={96} />
      ) : isError ? (
        <ErrorState title="Could not load events" onRetry={() => refetch()} />
      ) : items.length === 0 ? (
        <EmptyState icon="calendar-outline" title="No upcoming events" message="When events are created, they will show here." />
      ) : (
        items.map((item: any) => {
          const isRegistered = registeredIds.has(item.id);
          const image = resolveImageUrl(item.image_url);

          return (
            <AppCard
              key={String(item.id)}
              onPress={() => router.push({ pathname: '/events/[id]', params: { id: String(item.id) } })}
              accessibilityLabel={`Open ${item.name}`}
              style={styles.eventCard}>
              <DateBox value={item.event_date} />
              <View style={styles.eventBody}>
                {item.type ? <AppBadge>{String(item.type)}</AppBadge> : null}
                <AppText variant="bodyStrong">{item.name}</AppText>
                <InfoLine icon="time-outline">{item.event_time || formatTime(item.event_date)}</InfoLine>
                <InfoLine icon="location-outline">{item.location || 'Location will be announced'}</InfoLine>
                <AppText variant="small" tone="muted">
                  {`${item.attendees || item.registration_count || 0} attending`}
                </AppText>
              </View>
              {image ? (
                <Image source={{ uri: image }} style={styles.thumb} contentFit="cover" accessibilityIgnoresInvertColors />
              ) : null}
              <IconButton
                icon={user && isRegistered ? 'checkmark' : 'chevron-forward'}
                variant="ghost"
                accessibilityLabel={!user ? 'Sign in to register' : isRegistered ? `Registered for ${item.name}` : `Register for ${item.name}`}
                onPress={() => {
                  if (!user) {
                    router.push('/login');
                    return;
                  }
                  if (isRegistered) {
                    router.push({ pathname: '/events/[id]', params: { id: String(item.id) } });
                  } else {
                    registerMutation.mutate(item.id);
                  }
                }}
              />
            </AppCard>
          );
        })
      )}

      <AppCard>
        <AppText variant="bodyStrong">Support the mission</AppText>
        <AppText variant="small" tone="muted">
          Tithes, offerings and donations
        </AppText>
        <View style={styles.amountRow}>
          {[25, 50, 100].map((amount) => (
            <View key={amount} style={styles.amount}>
              <AppButton
                label={formatCedis(amount, 0)}
                variant="secondary"
                size="sm"
                onPress={() => router.push(`/donate?amount=${amount}` as never)}
              />
            </View>
          ))}
        </View>
        <AppButton label="Give now" onPress={() => router.push('/donate' as never)} />
      </AppCard>
    </Screen>
  );
}

function DateBox({ value }: { value?: string }) {
  const { colors } = useAppTheme();
  const month = value ? new Date(value).toLocaleString(undefined, { month: 'short' }).toUpperCase() : 'TBD';
  const day = value ? String(new Date(value).getDate()).padStart(2, '0') : '--';
  return (
    <View style={[styles.dateBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <AppText variant="caption" tone="primary">
        {month}
      </AppText>
      <AppText variant="section">{day}</AppText>
    </View>
  );
}

const formatBannerDate = (value?: string) => {
  if (!value) return 'Upcoming date will be announced';
  return new Date(value).toLocaleString(undefined, { month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' });
};

const formatTime = (value?: string) => {
  if (!value) return 'Time to be announced';
  return new Date(value).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
};

const styles = StyleSheet.create({
  eventCard: { flexDirection: 'row', alignItems: 'center', gap: Space.sm + 4 },
  eventBody: { flex: 1, gap: 2 },
  dateBox: { width: 52, minHeight: 60, borderRadius: Corner.control, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  thumb: { width: 56, height: 56, borderRadius: Corner.control },
  amountRow: { flexDirection: 'row', gap: Space.sm },
  amount: { flex: 1 },
});
```

Removed (Ruling 9): the Events/Give segmented switch (Give is now a tab), "Calendar View" (no handler), and the invented event type when the API sends none.

- [ ] **Step 2: Event detail**

Replace `mobile/src/app/events/[id].tsx` with:

```tsx
import { useLocalSearchParams, router } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ListGroup, ListRow, LoadingList, MediaFrame, Screen, ScreenHeader, statusTone } from '@/components/kit';
import { AppText } from '@/components/ui/app-text';
import { AppBadge } from '@/components/ui/badge';
import { AppButton } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Space } from '@/constants/tokens';
import {
  useCancelEventRegistration,
  useEventById,
  useMyEventRegistrations,
  useRegisterForEvent,
} from '@/hooks/use-api';
import { resolveImageUrl } from '@/lib/media';
import { useAuthStore } from '@/store/auth';

export default function EventDetailScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const user = useAuthStore((state) => state.user);
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const { data, isLoading } = useEventById(id, Boolean(id));
  const registrationsQuery = useMyEventRegistrations(Boolean(user));
  const registerMutation = useRegisterForEvent();
  const cancelMutation = useCancelEventRegistration();
  const registeredIds = new Set((registrationsQuery.data || []).map((item: any) => item.id));
  const isRegistered = data?.id ? registeredIds.has(data.id) : false;

  return (
    <Screen>
      <ScreenHeader back title={data?.name || 'Event'} />

      {isLoading ? (
        <LoadingList count={2} height={160} />
      ) : !data ? (
        <EmptyState
          icon="calendar-outline"
          title="Event not found"
          message="This event may have been removed or is no longer available."
        />
      ) : (
        <>
          <MediaFrame
            uri={resolveImageUrl(data.image_url)}
            icon="calendar-clear-outline"
            height={200}
            accessibilityLabel={`Picture for ${data.name}`}
          />
          <View style={styles.badges}>
            <AppBadge tone={statusTone(data.status)}>{String(data.status || 'Event')}</AppBadge>
          </View>
          <AppText>{data.description || 'Community event details from ANT PRESS.'}</AppText>

          <ListGroup>
            <ListRow
              icon="calendar-outline"
              label={data.event_date ? new Date(data.event_date).toLocaleDateString() : 'Scheduled'}
              description="Date"
            />
            <ListRow
              icon="time-outline"
              label={data.event_date ? new Date(data.event_date).toLocaleTimeString() : 'Time TBD'}
              description="Time"
            />
            <ListRow icon="location-outline" label={data.location || 'No location set'} description="Location" />
            <ListRow icon="people-outline" label={`${data.registered_count ?? 0} registered`} description="Attendees" />
          </ListGroup>

          {data.album_id ? (
            <AppButton
              label="View event photos"
              variant="secondary"
              onPress={() => router.push(`/gallery/${data.album_id}` as never)}
            />
          ) : null}

          {user ? (
            <AppButton
              label={isRegistered ? 'Cancel registration' : 'Reserve my spot'}
              variant={isRegistered ? 'secondary' : 'primary'}
              onPress={() => (isRegistered ? cancelMutation.mutate(data.id) : registerMutation.mutate(data.id))}
            />
          ) : (
            <AppButton label="Sign in to register" onPress={() => router.push('/login')} />
          )}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  badges: { flexDirection: 'row', gap: Space.sm },
});
```

Removed (Ruling 9): the share, heart and reminder buttons (none had a handler) and the hard-coded "Starts soon" label. "Status: …" now shows as the status badge.

- [ ] **Step 3: Tab bar for Events on tokens**

In `mobile/src/app/(tabs)/_layout.tsx`, change `<Tabs.Screen name="events" options={{ ...legacy, …` to `<Tabs.Screen name="events" options={{ ...tokens, …`.

- [ ] **Step 4: Scans**

```bash
cd mobile
grep -nE "#[0-9A-Fa-f]{3,8}\b|rgba?\(" "src/app/(tabs)/events.tsx" "src/app/events/[id].tsx" "src/app/(tabs)/_layout.tsx"
grep -nE "brand-ui|themed-text|themed-view|hooks/use-theme'|constants/theme'" "src/app/(tabs)/events.tsx" "src/app/events/[id].tsx"
```
Expected: no output from either grep.

- [ ] **Step 5: Lint and type-check**

Run: `cd mobile && npm run -s lint && npx tsc --noEmit && echo mobile-ok`
Expected: `mobile-ok`.

- [ ] **Step 6: By-eye check (user, light and dark)**

Events tab:
- Header "Events". The "Next event" card has a gold badge, time, place and a full-width button: "Register now" (navy) or "Already registered" (outline).
- Each event card shows a date box (month in the primary colour, day large), an optional type badge, name, time, place and attendance, plus an image thumbnail when there is one. The right-hand round button is 44×44 and shows a check when registered.
- Signed out: the round button opens Sign in. Signed in and not registered: tapping it registers (the check appears after refresh).
- "Support the mission": three amount buttons (GH₵ 25/50/100) open Give; "Give now" opens Give.
- Offline: a "Could not load events" card with Try again.

Event detail:
- The picture or a placeholder; the status badge with text; Date/Time/Location/Attendees rows readable in both themes.
- "View event photos" appears only for events with an album.
- Register/Cancel works and the label flips.

Tab bar:
- On Events, the bar is on the new colours.

- [ ] **Step 7: Commit**

```bash
git add "mobile/src/app/(tabs)/events.tsx" "mobile/src/app/events/[id].tsx" "mobile/src/app/(tabs)/_layout.tsx"
git commit -m "feat(mobile): Events tab and event detail on tokens

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Give and donation history

**Files:**
- Rewrite: `mobile/src/app/donate.tsx` (also the Give tab, through the unchanged `(tabs)/give.tsx`)
- Rewrite: `mobile/src/app/donations.tsx`
- Modify: `mobile/src/app/(tabs)/_layout.tsx` (the `give` tab switches to `tokens`)

**Interfaces:**
- Consumes: kit `Screen`, `ScreenHeader`, `IconButton`, `FormTextField`, `ChoiceField`, `SignInPrompt`, `StatGrid`, `StatTile`, `ListGroup`, `ListRow`, `LoadingList`, `ErrorState`, `statusTone`; `useInitializeDonationPayment`, `useVerifyDonationPayment`, `useMyDonations`; `formatCedis`.
- Produces: nothing new.

Behaviour kept exactly:
- **Unchanged code:** the zod schema, default values, `WebBrowser.maybeCompleteAuthSession()`, the reference-verify effect, `onSubmit` (Paystack auth session, `router.replace('/donate?reference=…')`, the cancel early-return, the `Linking.openURL` fallback), and the quick-amount `control._reset` hack.
- **Enum fields (Ruling 10):** donation type and payment method become chips that write the same enum strings.

- [ ] **Step 1: Give**

Replace `mobile/src/app/donate.tsx` with:

```tsx
import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { z } from 'zod';

import { ChoiceField, FormTextField, IconButton, Screen, ScreenHeader, SignInPrompt } from '@/components/kit';
import { AppText } from '@/components/ui/app-text';
import { AppBadge } from '@/components/ui/badge';
import { AppButton } from '@/components/ui/button';
import { AppCard } from '@/components/ui/card';
import { Space } from '@/constants/tokens';
import { useInitializeDonationPayment, useVerifyDonationPayment } from '@/hooks/use-api';
import { formatCedis } from '@/lib/currency';
import { useAuthStore } from '@/store/auth';

const donationSchema = z.object({
  amount: z.coerce.number().min(0.01, 'Enter an amount greater than 0'),
  donationType: z.enum(['tithe', 'offering', 'ministry', 'emergency', 'general']),
  paymentMethod: z.enum(['bank_transfer', 'momo', 'card', 'cash']),
  notes: z.string().optional(),
});

type DonationFormValues = z.infer<typeof donationSchema>;
type DonationFormInput = z.input<typeof donationSchema>;

const DONATION_TYPES: { value: DonationFormValues['donationType']; label: string }[] = [
  { value: 'general', label: 'General' },
  { value: 'tithe', label: 'Tithe' },
  { value: 'offering', label: 'Offering' },
  { value: 'ministry', label: 'Ministry' },
  { value: 'emergency', label: 'Emergency' },
];

const PAYMENT_METHODS: { value: DonationFormValues['paymentMethod']; label: string }[] = [
  { value: 'card', label: 'Card' },
  { value: 'momo', label: 'Mobile money' },
  { value: 'bank_transfer', label: 'Bank transfer' },
  { value: 'cash', label: 'Cash' },
];

export default function DonateScreen() {
  const user = useAuthStore((state) => state.user);
  const params = useLocalSearchParams<{ reference?: string | string[] }>();
  const donationMutation = useInitializeDonationPayment();
  const verifyDonationMutation = useVerifyDonationPayment();
  const [verifiedReference, setVerifiedReference] = React.useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DonationFormInput, unknown, DonationFormValues>({
    resolver: zodResolver(donationSchema),
    defaultValues: {
      amount: 10,
      donationType: 'general',
      paymentMethod: 'card',
      notes: '',
    },
  });

  const incomingReference = Array.isArray(params.reference) ? params.reference[0] : params.reference;

  React.useEffect(() => {
    WebBrowser.maybeCompleteAuthSession();
  }, []);

  React.useEffect(() => {
    const verify = async () => {
      if (!user || !incomingReference || verifiedReference === incomingReference) return;
      try {
        await verifyDonationMutation.mutateAsync(incomingReference);
      } finally {
        setVerifiedReference(incomingReference);
      }
    };

    void verify();
  }, [incomingReference, user, verifiedReference, verifyDonationMutation]);

  const onSubmit = async (values: DonationFormValues) => {
    const callbackUrl = Linking.createURL('donate');
    const result = await donationMutation.mutateAsync({
      ...values,
      callbackUrl,
    });
    const authUrl =
      result?.payment?.authorization_url || result?.payment?.authorizationUrl || result?.payment?.url;

    if (authUrl) {
      const authResult = await WebBrowser.openAuthSessionAsync(authUrl, callbackUrl);

      if (authResult.type === 'success' && authResult.url) {
        const parsed = Linking.parse(authResult.url);
        const returnedReference =
          typeof parsed.queryParams?.reference === 'string'
            ? parsed.queryParams.reference
            : undefined;

        if (returnedReference) {
          router.replace(`/donate?reference=${encodeURIComponent(returnedReference)}` as never);
          return;
        }
      }

      if (authResult.type === 'cancel') {
        return;
      }

      await Linking.openURL(authUrl);
    }
  };

  if (!user) {
    return (
      <Screen>
        <ScreenHeader title="Give" subtitle="Support the mission securely" />
        <SignInPrompt
          icon="heart-outline"
          title="Sign in before you give"
          message="Your giving history, payment checks and receipts stay linked to your ANT PRESS account."
          label="Go to sign in"
          onSignIn={() => router.push('/login')}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader
        title="Give"
        subtitle="Support the mission from your phone"
        right={<IconButton icon="receipt-outline" accessibilityLabel="Donation history" onPress={() => router.push('/donations')} />}
      />

      {incomingReference ? (
        <AppCard>
          <AppBadge tone={verifyDonationMutation.isSuccess ? 'success' : 'neutral'}>
            {verifyDonationMutation.isSuccess ? 'Donation verified' : 'Donation return'}
          </AppBadge>
          <AppText variant="small">
            {verifyDonationMutation.isPending
              ? `Verifying donation reference ${incomingReference}...`
              : verifyDonationMutation.isSuccess
                ? `Status: ${verifyDonationMutation.data?.donation?.status || 'completed'}`
                : 'We received the return reference and will confirm the payment status.'}
          </AppText>
        </AppCard>
      ) : null}

      <AppCard>
        <AppText variant="section">Start a donation</AppText>
        <AppText variant="small" tone="muted">
          Choose an amount, giving type and payment method to continue.
        </AppText>

        <View style={styles.amountRow}>
          {[25, 50, 100].map((amount) => (
            <View key={amount} style={styles.amount}>
              <AppButton
                label={formatCedis(amount, 0)}
                variant="secondary"
                size="sm"
                onPress={() => {
                  const currentValues = control._formValues as DonationFormInput;
                  control._reset({
                    ...currentValues,
                    amount,
                  });
                }}
              />
            </View>
          ))}
        </View>

        <FormTextField
          control={control}
          name="amount"
          label="Amount"
          placeholder="Amount"
          keyboardType="decimal-pad"
          error={errors.amount?.message}
        />
        <Controller
          control={control}
          name="donationType"
          render={({ field: { value, onChange } }) => (
            <ChoiceField
              label="Giving type"
              options={DONATION_TYPES}
              value={value}
              onChange={onChange}
              error={errors.donationType?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="paymentMethod"
          render={({ field: { value, onChange } }) => (
            <ChoiceField
              label="Payment method"
              options={PAYMENT_METHODS}
              value={value}
              onChange={onChange}
              error={errors.paymentMethod?.message}
            />
          )}
        />
        <FormTextField
          control={control}
          name="notes"
          label="Notes"
          placeholder="Optional note"
          multiline
          error={errors.notes?.message}
        />

        <AppButton label="Start donation" loading={isSubmitting} onPress={handleSubmit(onSubmit)} />
      </AppCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  amountRow: { flexDirection: 'row', gap: Space.sm },
  amount: { flex: 1 },
});
```

Removed (Ruling 9): the "Mode: Secure" and "Account: Linked" metrics, and the orange hero art. New: a Donation history icon button on Give (an existing route) so Give and history are one tap apart.

- [ ] **Step 2: Donation history**

Replace `mobile/src/app/donations.tsx` with:

```tsx
import React from 'react';
import { router } from 'expo-router';

import {
  ErrorState,
  ListGroup,
  ListRow,
  LoadingList,
  Screen,
  ScreenHeader,
  SignInPrompt,
  StatGrid,
  StatTile,
  statusTone,
} from '@/components/kit';
import { AppBadge } from '@/components/ui/badge';
import { AppButton } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { useMyDonations } from '@/hooks/use-api';
import { formatCedis } from '@/lib/currency';
import { useAuthStore } from '@/store/auth';

export default function DonationsScreen() {
  const user = useAuthStore((state) => state.user);
  const { data, isLoading, isError, refetch } = useMyDonations(Boolean(user));
  const donations = Array.isArray(data) ? data : [];
  const completed = donations.filter((item: any) => String(item.status || '').toLowerCase() === 'completed').length;

  if (!user) {
    return (
      <Screen>
        <ScreenHeader back title="Donation history" />
        <SignInPrompt
          icon="receipt-outline"
          title="Sign in to see your giving"
          message="Your donations and their payment status appear here."
          label="Go to sign in"
          onSignIn={() => router.replace('/login')}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader back title="Donation history" subtitle="Your recent gifts and their status" />

      <StatGrid>
        <StatTile label="Total" value={donations.length} icon="receipt-outline" />
        <StatTile label="Completed" value={completed} icon="checkmark-circle-outline" />
      </StatGrid>

      <AppButton label="Make a donation" onPress={() => router.push('/donate')} />

      {isLoading ? (
        <LoadingList />
      ) : isError ? (
        <ErrorState title="Could not load your donations" onRetry={() => refetch()} />
      ) : donations.length === 0 ? (
        <EmptyState icon="receipt-outline" title="No donations yet" message="Your completed and pending giving will appear here." />
      ) : (
        <ListGroup>
          {donations.map((item: any) => (
            <ListRow
              key={String(item.id)}
              label={formatCedis(item.amount)}
              description={[
                item.donation_type || item.donationType || 'general',
                item.payment_method || item.paymentMethod || 'payment',
                item.created_at ? new Date(item.created_at).toLocaleString() : 'Recent donation',
              ].join(' · ')}
              trailing={<AppBadge tone={statusTone(item.status || 'pending')}>{String(item.status || 'pending')}</AppBadge>}
            />
          ))}
        </ListGroup>
      )}
    </Screen>
  );
}
```

- [ ] **Step 3: Tab bar for Give on tokens**

In `mobile/src/app/(tabs)/_layout.tsx`, change `<Tabs.Screen name="give" options={{ ...legacy, …` to `<Tabs.Screen name="give" options={{ ...tokens, …`.

- [ ] **Step 4: Scans**

```bash
cd mobile
grep -nE "#[0-9A-Fa-f]{3,8}\b|rgba?\(" src/app/donate.tsx src/app/donations.tsx "src/app/(tabs)/_layout.tsx"
grep -nE "brand-ui|themed-text|themed-view|hooks/use-theme'|constants/theme'" src/app/donate.tsx src/app/donations.tsx
```
Expected: no output from either grep.

- [ ] **Step 5: Lint and type-check**

Run: `cd mobile && npm run -s lint && npx tsc --noEmit && echo mobile-ok`
Expected: `mobile-ok`. If TypeScript rejects `onChange` on `ChoiceField` because the Controller value is typed as the input union, write `onChange={(next) => onChange(next)}`.

- [ ] **Step 6: By-eye check (user, light and dark)**

Give, signed out:
- A centred card "Sign in before you give" with a "Go to sign in" button that opens Sign in.

Give, signed in:
- The receipt icon (top right) opens Donation history.
- GH₵ 25/50/100 buttons fill the Amount field.
- The Giving type and Payment method chips show one selected chip each (General, Card by default), are 44 tall, and the selection is readable in both themes.
- With an empty amount, "Start donation" shows the red error under Amount.
- With a valid amount, Paystack opens; returning shows the "Donation return/verified" card. While starting, the button shows a spinner and ignores taps.

Donation history:
- Back button; Total/Completed tiles; "Make a donation"; rows with amount, "type · method · date" and a status badge with words (green completed, amber pending, red failed).
- Empty and offline states are friendly.

Tab bar:
- On Give, the bar is on the new colours.

- [ ] **Step 7: Commit**

```bash
git add mobile/src/app/donate.tsx mobile/src/app/donations.tsx "mobile/src/app/(tabs)/_layout.tsx"
git commit -m "feat(mobile): Give and donation history on tokens, giving type and method as chips

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Me, profile, dashboard, notifications and sign-in; finish the tab bar and navigation chrome

**Files:**
- Rewrite: `mobile/src/app/(tabs)/account.tsx` (the Me tab)
- Rewrite: `mobile/src/app/profile.tsx`, `mobile/src/app/dashboard.tsx`, `mobile/src/app/notifications.tsx`
- Rewrite: `mobile/src/app/login.tsx`, `mobile/src/app/register.tsx`
- Rewrite: `mobile/src/app/(tabs)/_layout.tsx` (all tabs on tokens; `legacy` and `useTheme` removed)
- Rewrite: `mobile/src/app/_layout.tsx` (navigation theme and status bar from tokens; Ruling 4)

**Interfaces:**
- Consumes: the whole kit (Task 1); `useGroups` (`GroupSummary.my_status`), `useMyEventRegistrations`, `useMyNotifications`, `useMyPrayerRequests`, `useMyProfile`, `useMyDonations`, `useUpdateProfile`, `useMarkNotificationRead`, `useMarkAllNotificationsRead`, `useLogin`, `useGoogleLogin`, `useRegister`, `getApiErrorMessage`.
- Produces: `HELP_LINKS` stays local to `account.tsx` (the dashboard keeps its own list).

Behaviour kept exactly:
- **Sign out (Me and profile):** confirm, then `clearSession()`, then `router.replace('/login')`.
- **Sign-in redirects:** login and Google send admins to `/admin` and others to `/account`.
- **Register:** shows the "Check your email" panel.
- **Notifications:** tapping an unread one marks it read; "Mark all as read" calls the same mutation.
- **Profile:** same zod schema and reset; save calls `mutateAsync`.
- **Unchanged code:** every query's `enabled` flag.

- [ ] **Step 1: Me**

Replace `mobile/src/app/(tabs)/account.tsx` with:

```tsx
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Avatar, ConfirmDialog, type IconName, ListGroup, ListRow, Screen, ScreenHeader, SectionHeader } from '@/components/kit';
import { AppText } from '@/components/ui/app-text';
import { AppBadge } from '@/components/ui/badge';
import { AppButton } from '@/components/ui/button';
import { AppCard } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Corner, Space } from '@/constants/tokens';
import { useGroups, useMyEventRegistrations, useMyNotifications, useMyPrayerRequests, useMyProfile } from '@/hooks/use-api';
import { useAuthStore } from '@/store/auth';

const HELP_LINKS: { label: string; icon: IconName; href: string }[] = [
  { label: 'About ANT PRESS', icon: 'information-circle-outline', href: '/about' },
  { label: 'FAQ', icon: 'help-circle-outline', href: '/faq' },
  { label: 'Contact us', icon: 'mail-outline', href: '/contact' },
  { label: 'Privacy', icon: 'shield-checkmark-outline', href: '/privacy' },
  { label: 'Terms', icon: 'document-text-outline', href: '/terms' },
];

export default function AccountScreen() {
  const { user, clearSession } = useAuthStore();
  const [showSignOutConfirm, setShowSignOutConfirm] = React.useState(false);
  const profileQuery = useMyProfile(Boolean(user));
  const notificationsQuery = useMyNotifications(Boolean(user));
  const prayersQuery = useMyPrayerRequests(Boolean(user));
  const registrationsQuery = useMyEventRegistrations(Boolean(user));
  const groupsQuery = useGroups();

  const displayName = [
    profileQuery.data?.first_name || profileQuery.data?.firstName,
    profileQuery.data?.last_name || profileQuery.data?.lastName,
  ]
    .filter(Boolean)
    .join(' ');

  const initials = (displayName || user?.email || 'GP')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const myGroups = (groupsQuery.data ?? []).filter((group) => group.my_status === 'active' || group.my_status === 'pending');
  const registrations = Array.isArray(registrationsQuery.data) ? registrationsQuery.data : [];
  const unread = notificationsQuery.data?.unread_count ?? 0;

  const helpRows = HELP_LINKS.map((link) => (
    <ListRow key={link.href} icon={link.icon} label={link.label} onPress={() => router.push(link.href as never)} />
  ));

  if (!user) {
    return (
      <Screen>
        <ScreenHeader title="Me" subtitle="Your profile, groups and giving" />
        <EmptyState
          icon="person-circle-outline"
          title="Sign in to see your space"
          message="Your profile, prayer requests, groups, registrations and giving live in one ANT PRESS account."
          action={
            <View style={styles.guestActions}>
              <AppButton label="Sign in" onPress={() => router.push('/login')} />
              <AppButton label="Create account" variant="secondary" onPress={() => router.push('/register' as never)} />
            </View>
          }
        />
        <SectionHeader title="Help and information" />
        <ListGroup>{helpRows}</ListGroup>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader title="Me" subtitle="Your profile, groups and giving" />

      <AppCard onPress={() => router.push('/profile')} accessibilityLabel="Edit your profile" style={styles.profile}>
        <Avatar initials={initials} size={56} />
        <View style={styles.profileCopy}>
          <AppText variant="bodyStrong" numberOfLines={1}>
            {displayName || user.email}
          </AppText>
          <AppText variant="small" tone="muted" numberOfLines={1}>
            {user.email}
          </AppText>
          <AppBadge tone={user.role === 'admin' ? 'gold' : 'neutral'}>
            {user.role === 'admin' ? 'Admin account' : 'Member account'}
          </AppBadge>
        </View>
        <AppText variant="small" tone="link">
          Edit
        </AppText>
      </AppCard>

      <SectionHeader title="My groups" actionLabel="All groups" onAction={() => router.push('/small-groups' as never)} />
      {groupsQuery.isLoading ? (
        <Skeleton height={64} radius={Corner.card} />
      ) : myGroups.length > 0 ? (
        <ListGroup>
          {myGroups.slice(0, 3).map((group) => (
            <ListRow
              key={group.id}
              icon="people-outline"
              label={group.name}
              description={[group.meeting_day, group.meeting_time].filter(Boolean).join(' · ') || undefined}
              trailing={
                <AppBadge tone={group.my_status === 'active' ? 'success' : 'warning'}>
                  {group.my_status === 'active' ? 'Member' : 'Pending'}
                </AppBadge>
              }
              onPress={() => router.push('/small-groups' as never)}
            />
          ))}
        </ListGroup>
      ) : (
        <EmptyState
          icon="people-outline"
          title="No groups yet"
          message="Join a small group to grow and pray together during the week."
          action={<AppButton label="Find a group" variant="secondary" onPress={() => router.push('/small-groups' as never)} />}
        />
      )}

      <SectionHeader title="My registrations" actionLabel="Events" onAction={() => router.push('/events')} />
      {registrationsQuery.isLoading ? (
        <Skeleton height={64} radius={Corner.card} />
      ) : registrations.length > 0 ? (
        <ListGroup>
          {registrations.slice(0, 3).map((event: any) => (
            <ListRow
              key={String(event.id)}
              icon="calendar-outline"
              label={event.name || 'Event'}
              description={event.event_date ? new Date(event.event_date).toLocaleDateString() : undefined}
              onPress={() => router.push({ pathname: '/events/[id]', params: { id: String(event.id) } })}
            />
          ))}
        </ListGroup>
      ) : (
        <EmptyState icon="calendar-outline" title="No registrations" message="Events you register for will show here." />
      )}

      <SectionHeader title="Activity" />
      <ListGroup>
        <ListRow
          icon="notifications-outline"
          label="Notifications"
          trailing={unread > 0 ? <AppBadge tone="danger">{`${unread} new`}</AppBadge> : undefined}
          onPress={() => router.push('/notifications')}
        />
        <ListRow icon="receipt-outline" label="Donation history" onPress={() => router.push('/donations')} />
        <ListRow
          icon="heart-outline"
          label="Prayer requests"
          value={String(prayersQuery.data?.length ?? 0)}
          onPress={() => router.push('/prayers')}
        />
        <ListRow icon="grid-outline" label="My dashboard" onPress={() => router.push('/dashboard')} />
      </ListGroup>

      <SectionHeader title="Settings and help" />
      <ListGroup>
        <ListRow icon="person-outline" label="Edit profile" onPress={() => router.push('/profile')} />
        {helpRows}
      </ListGroup>

      {user.role === 'admin' ? (
        <>
          <SectionHeader title="Admin" />
          <ListGroup>
            <ListRow icon="shield-outline" label="Admin console" onPress={() => router.push('/admin')} />
            <ListRow icon="bar-chart-outline" label="Analytics" onPress={() => router.push('/admin-analytics' as never)} />
            <ListRow icon="megaphone-outline" label="Send announcement" onPress={() => router.push('/admin-announcements' as never)} />
          </ListGroup>
        </>
      ) : null}

      <ListGroup>
        <ListRow icon="log-out-outline" label="Sign out" tone="danger" onPress={() => setShowSignOutConfirm(true)} />
      </ListGroup>

      <ConfirmDialog
        visible={showSignOutConfirm}
        icon="log-out-outline"
        destructive
        title="Sign out?"
        message="You will need to sign in again to access your profile, giving, and prayer history."
        confirmLabel="Sign out"
        onCancel={() => setShowSignOutConfirm(false)}
        onConfirm={async () => {
          setShowSignOutConfirm(false);
          await clearSession();
          router.replace('/login');
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  guestActions: { alignSelf: 'stretch', gap: Space.sm },
  profile: { flexDirection: 'row', alignItems: 'center', gap: Space.md },
  profileCopy: { flex: 1, gap: Space.xs },
});
```

Moved or removed (Rulings 8 and 9):
- The community, prayer wall, devotional, gallery and news rows are now Home tiles.
- The prayer-request card becomes the "Prayer requests" row (same `/prayers`).
- The ministries list under "Small Groups" becomes the user's real groups.
- The fake phone number and the decorative stars are gone.

- [ ] **Step 2: Profile**

Replace `mobile/src/app/profile.tsx` with:

```tsx
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import React from 'react';
import { useForm } from 'react-hook-form';
import { StyleSheet } from 'react-native';
import { z } from 'zod';

import {
  Avatar,
  ConfirmDialog,
  FormMessage,
  FormTextField,
  IconButton,
  ListGroup,
  ListRow,
  LoadingList,
  Screen,
  ScreenHeader,
  SignInPrompt,
} from '@/components/kit';
import { AppText } from '@/components/ui/app-text';
import { AppBadge } from '@/components/ui/badge';
import { AppButton } from '@/components/ui/button';
import { AppCard } from '@/components/ui/card';
import { useMyDonations, useMyProfile, useUpdateProfile } from '@/hooks/use-api';
import { useAuthStore } from '@/store/auth';

const profileSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required'),
  lastName: z.string().trim().min(1, 'Last name is required'),
  phone: z.string().trim().min(1, 'Phone number is required'),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfileScreen() {
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);
  const [showSignOutConfirm, setShowSignOutConfirm] = React.useState(false);
  const { data, isLoading } = useMyProfile(Boolean(user));
  const donationsQuery = useMyDonations(Boolean(user));
  const updateProfileMutation = useUpdateProfile();
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      phone: '',
    },
  });

  React.useEffect(() => {
    if (data) {
      reset({
        firstName: data.first_name || data.firstName || '',
        lastName: data.last_name || data.lastName || '',
        phone: data.phone || '',
      });
    }
  }, [data, reset]);

  const onSubmit = async (values: ProfileFormValues) => {
    await updateProfileMutation.mutateAsync(values);
  };

  if (!user) {
    return (
      <Screen>
        <ScreenHeader back title="My profile" />
        <SignInPrompt
          title="Sign in required"
          message="You need to sign in before managing your ANT PRESS member profile."
          label="Go to sign in"
          onSignIn={() => router.replace('/login')}
        />
      </Screen>
    );
  }

  const displayName = [data?.first_name || data?.firstName, data?.last_name || data?.lastName]
    .filter(Boolean)
    .join(' ');
  const initials = (displayName || user.email || 'U')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const donations = donationsQuery.data ?? [];

  return (
    <Screen>
      <ScreenHeader
        back
        title="My profile"
        right={<IconButton icon="log-out-outline" variant="danger" accessibilityLabel="Sign out" onPress={() => setShowSignOutConfirm(true)} />}
      />

      <AppCard style={styles.identity}>
        <Avatar initials={initials} size={80} />
        <AppText variant="section" style={styles.center}>
          {displayName || 'Member profile'}
        </AppText>
        <AppText variant="small" tone="muted" style={styles.center}>
          {data?.email || user.email}
        </AppText>
        <AppBadge tone={user.role === 'admin' ? 'gold' : 'neutral'}>{user.role === 'admin' ? 'Admin' : 'Member'}</AppBadge>
      </AppCard>

      <AppCard>
        <AppText variant="section">Profile details</AppText>
        {isLoading ? (
          <LoadingList count={3} height={44} />
        ) : (
          <>
            <FormTextField control={control} name="firstName" label="First name" placeholder="First name" error={errors.firstName?.message} />
            <FormTextField control={control} name="lastName" label="Last name" placeholder="Last name" error={errors.lastName?.message} />
            <FormTextField
              control={control}
              name="phone"
              label="Phone"
              placeholder="Phone number"
              keyboardType="phone-pad"
              error={errors.phone?.message}
            />
            <AppButton label={isSubmitting ? 'Saving...' : 'Save profile'} loading={isSubmitting} onPress={handleSubmit(onSubmit)} />
            {updateProfileMutation.isError ? <FormMessage tone="danger">Could not save your profile right now.</FormMessage> : null}
          </>
        )}
      </AppCard>

      <ListGroup>
        <ListRow icon="notifications-outline" label="Notifications" onPress={() => router.push('/notifications')} />
        <ListRow
          icon="receipt-outline"
          label="Donation history"
          value={String(donations.length)}
          onPress={() => router.push('/donations')}
        />
      </ListGroup>

      <ConfirmDialog
        visible={showSignOutConfirm}
        icon="log-out-outline"
        destructive
        title="Sign out?"
        message="You will need to sign in again to access your member tools."
        confirmLabel="Sign out"
        onCancel={() => setShowSignOutConfirm(false)}
        onConfirm={async () => {
          setShowSignOutConfirm(false);
          await clearSession();
          router.replace('/login');
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  identity: { alignItems: 'center' },
  center: { textAlign: 'center' },
});
```

Removed (Ruling 9): "Member since <this year>", the decorative "ANT PRESS" badge, and the fake Profile/Account stat cards. The donation count moved onto the Donation history row.

- [ ] **Step 3: Member dashboard**

Replace `mobile/src/app/dashboard.tsx` with:

```tsx
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import {
  ListGroup,
  ListRow,
  Screen,
  ScreenHeader,
  SectionHeader,
  SignInPrompt,
  StatGrid,
  StatTile,
} from '@/components/kit';
import { AppText } from '@/components/ui/app-text';
import { AppBadge } from '@/components/ui/badge';
import { AppButton } from '@/components/ui/button';
import { AppCard } from '@/components/ui/card';
import { Space } from '@/constants/tokens';
import {
  useMyDonations,
  useMyEventRegistrations,
  useMyNotifications,
  useMyPrayerRequests,
  useMyProfile,
} from '@/hooks/use-api';
import { useAuthStore } from '@/store/auth';

export default function MemberDashboardScreen() {
  const user = useAuthStore((state) => state.user);
  const profileQuery = useMyProfile(Boolean(user));
  const donationsQuery = useMyDonations(Boolean(user));
  const prayersQuery = useMyPrayerRequests(Boolean(user));
  const registrationsQuery = useMyEventRegistrations(Boolean(user));
  const notificationsQuery = useMyNotifications(Boolean(user));

  if (!user) {
    return (
      <Screen>
        <ScreenHeader back title="My dashboard" />
        <SignInPrompt
          title="Your connected space"
          message="Sign in to unlock giving history, prayer activity, notifications, and your event registrations."
          label="Go to sign in"
          onSignIn={() => router.replace('/login')}
        />
      </Screen>
    );
  }

  const displayName = [
    profileQuery.data?.first_name || profileQuery.data?.firstName || user.first_name,
    profileQuery.data?.last_name || profileQuery.data?.lastName || user.last_name,
  ]
    .filter(Boolean)
    .join(' ');

  const go = (href: string) => () => router.push(href as never);

  return (
    <Screen>
      <ScreenHeader
        back
        eyebrow="Dashboard"
        title={displayName || 'Member dashboard'}
        subtitle="Your profile, giving, prayer requests, notifications and registrations in one place."
      />

      <View style={styles.actions}>
        <View style={styles.action}>
          <AppButton label="Edit profile" variant="secondary" onPress={() => router.push('/profile')} />
        </View>
        <View style={styles.action}>
          <AppButton label="Give now" onPress={() => router.push('/donate')} />
        </View>
      </View>

      <StatGrid>
        <StatTile label="Unread" value={notificationsQuery.data?.unread_count ?? 0} icon="notifications-outline" />
        <StatTile label="Donations" value={donationsQuery.data?.length ?? 0} icon="receipt-outline" />
        <StatTile label="Prayers" value={prayersQuery.data?.length ?? 0} icon="heart-outline" />
        <StatTile label="Events" value={registrationsQuery.data?.length ?? 0} icon="calendar-outline" />
      </StatGrid>

      <SectionHeader title="Quick actions" />
      <ListGroup>
        <ListRow icon="notifications-outline" label="Notifications" onPress={go('/notifications')} />
        <ListRow icon="heart-outline" label="Prayer requests" onPress={go('/prayers')} />
        <ListRow icon="receipt-outline" label="Donation history" onPress={go('/donations')} />
        <ListRow icon="newspaper-outline" label="News and updates" onPress={go('/news')} />
        <ListRow icon="chatbubbles-outline" label="Community feed" onPress={go('/community')} />
        <ListRow icon="play-circle-outline" label="Browse sermons" onPress={go('/sermons')} />
        <ListRow icon="people-outline" label="Small groups" onPress={go('/small-groups')} />
        <ListRow icon="sparkles-outline" label="Explore ministries" onPress={go('/ministries')} />
        <ListRow icon="hand-left-outline" label="Prayer wall" onPress={go('/prayer-wall')} />
        <ListRow icon="book-outline" label="Daily devotional" onPress={go('/daily-devotional')} />
        <ListRow icon="search-outline" label="Search content" onPress={go('/search')} />
      </ListGroup>

      <SectionHeader title="Profile snapshot" />
      <AppCard>
        <AppText variant="bodyStrong">{displayName || 'Member account'}</AppText>
        <AppText variant="small" tone="muted">
          {profileQuery.data?.email || user.email}
        </AppText>
        <AppText variant="small" tone="muted">
          {profileQuery.data?.phone || 'No phone number saved yet.'}
        </AppText>
        <AppBadge tone={user.role === 'admin' ? 'gold' : 'neutral'}>
          {user.role === 'admin' ? 'Admin-enabled account' : 'Faithful member'}
        </AppBadge>
      </AppCard>

      <SectionHeader title="Help and information" />
      <ListGroup>
        <ListRow icon="information-circle-outline" label="About ANT PRESS" onPress={go('/about')} />
        <ListRow icon="help-circle-outline" label="FAQ" onPress={go('/faq')} />
        <ListRow icon="mail-outline" label="Contact the team" onPress={go('/contact')} />
        <ListRow icon="shield-checkmark-outline" label="Privacy" onPress={go('/privacy')} />
        <ListRow icon="document-text-outline" label="Terms" onPress={go('/terms')} />
      </ListGroup>
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', gap: Space.sm },
  action: { flex: 1 },
});
```

- [ ] **Step 4: Notifications**

Replace `mobile/src/app/notifications.tsx` with:

```tsx
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  IconButton,
  type IconName,
  ListGroup,
  LoadingList,
  Screen,
  ScreenHeader,
  SectionHeader,
  SignInPrompt,
} from '@/components/kit';
import { AppText } from '@/components/ui/app-text';
import { AppBadge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Corner, MIN_TOUCH, Space } from '@/constants/tokens';
import { useMarkAllNotificationsRead, useMarkNotificationRead, useMyNotifications } from '@/hooks/use-api';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useAuthStore } from '@/store/auth';

const notificationIcons: Record<string, IconName> = {
  sermon: 'play-circle-outline',
  event: 'calendar-outline',
  prayer: 'heart-outline',
  giving: 'gift-outline',
  group: 'people-outline',
  announcement: 'notifications-outline',
};

export default function NotificationsScreen() {
  const user = useAuthStore((state) => state.user);
  const notificationsQuery = useMyNotifications(Boolean(user));
  const markReadMutation = useMarkNotificationRead();
  const markAllMutation = useMarkAllNotificationsRead();

  if (!user) {
    return (
      <Screen>
        <ScreenHeader back title="Notifications" />
        <SignInPrompt
          icon="notifications-outline"
          title="Stay in sync"
          message="Sign in to view personal updates, reminders, and announcements from ANT PRESS."
          label="Go to sign in"
          onSignIn={() => router.replace('/login')}
        />
      </Screen>
    );
  }

  const notifications = notificationsQuery.data?.notifications ?? [];
  const unreadCount = notificationsQuery.data?.unread_count ?? 0;
  const todayItems = notifications.slice(0, 3);
  const olderItems = notifications.slice(3);

  const renderItem = (item: any) => (
    <NotificationRow
      key={String(item.id)}
      item={item}
      unread={!item.is_read}
      onPress={() => !item.is_read && markReadMutation.mutate(item.id)}
    />
  );

  return (
    <Screen>
      <ScreenHeader
        back
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} unread` : undefined}
        right={<IconButton icon="checkmark-done-outline" accessibilityLabel="Mark all as read" onPress={() => markAllMutation.mutate()} />}
      />

      {notificationsQuery.isLoading ? (
        <LoadingList />
      ) : notifications.length === 0 ? (
        <EmptyState
          icon="notifications-outline"
          title="No notifications yet"
          message="Personal updates, event reminders, and announcements will appear here."
        />
      ) : (
        <>
          {todayItems.length > 0 ? (
            <>
              <SectionHeader title="Today" />
              <ListGroup>{todayItems.map(renderItem)}</ListGroup>
            </>
          ) : null}
          {olderItems.length > 0 ? (
            <>
              <SectionHeader title="Earlier" />
              <ListGroup>{olderItems.map(renderItem)}</ListGroup>
            </>
          ) : null}
        </>
      )}
    </Screen>
  );
}

function NotificationRow({ item, unread, onPress }: { item: any; unread: boolean; onPress: () => void }) {
  const { colors } = useAppTheme();
  const type = String(item?.type || item?.category || 'announcement').toLowerCase();
  const icon = notificationIcons[type] ?? notificationIcons.announcement;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${unread ? 'Unread. ' : ''}${item?.title || 'Notification'}`}
      accessibilityHint={unread ? 'Marks it as read' : undefined}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.surface }]}>
      <View style={[styles.icon, { backgroundColor: colors.surface }]}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <View style={styles.copy}>
        <View style={styles.titleRow}>
          <AppText variant="bodyStrong" style={styles.title}>
            {item?.title || 'Notification'}
          </AppText>
          {unread ? <AppBadge tone="danger">New</AppBadge> : null}
        </View>
        <AppText variant="small" tone="muted">
          {item?.message || 'No message available.'}
        </AppText>
        <AppText variant="caption" tone="muted">
          {item?.created_at ? new Date(item.created_at).toLocaleString() : 'Recently'}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: Space.sm + 4, padding: Space.md, minHeight: MIN_TOUCH },
  icon: { width: 40, height: 40, borderRadius: Corner.control, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, gap: Space.xs },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Space.sm },
  title: { flex: 1 },
});
```

- [ ] **Step 5: Login**

Replace `mobile/src/app/login.tsx` with:

```tsx
import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import * as Google from 'expo-auth-session/providers/google';
import { Link, router } from 'expo-router';
import React from 'react';
import { useForm } from 'react-hook-form';
import { Pressable, StyleSheet, View } from 'react-native';
import { z } from 'zod';

import { CheckboxRow, FormMessage, FormTextField, Screen } from '@/components/kit';
import { AppText } from '@/components/ui/app-text';
import { AppButton } from '@/components/ui/button';
import { Corner, MIN_TOUCH, Space } from '@/constants/tokens';
import { getApiErrorMessage, useGoogleLogin, useLogin } from '@/hooks/use-api';
import { useAppTheme } from '@/hooks/use-app-theme';

const loginSchema = z.object({
  email: z.email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const { colors } = useAppTheme();
  const loginMutation = useLogin();
  const googleLoginMutation = useGoogleLogin();
  const [showPassword, setShowPassword] = React.useState(false);
  const [googleRequest, googleResponse, googlePromptAsync] = Google.useAuthRequest({
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    scopes: ['openid', 'profile', 'email'],
    responseType: 'token',
  });
  const loginErrorMessage = loginMutation.isError
    ? getApiErrorMessage(loginMutation.error, 'Could not sign in. Please confirm your email and password.')
    : '';
  const googleErrorMessage = googleLoginMutation.isError
    ? getApiErrorMessage(googleLoginMutation.error, 'Google sign-in failed.')
    : '';
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      const session = await loginMutation.mutateAsync(values);
      router.replace(session.user?.role === 'admin' ? '/admin' : '/account');
    } catch {
      // Inline error panel handles feedback.
    }
  };

  React.useEffect(() => {
    const handleGoogleResponse = async () => {
      if (googleResponse?.type !== 'success') {
        return;
      }

      const accessToken =
        googleResponse.authentication?.accessToken ||
        (typeof googleResponse.params?.access_token === 'string'
          ? googleResponse.params.access_token
          : '');

      if (!accessToken) {
        return;
      }

      try {
        const session = await googleLoginMutation.mutateAsync(accessToken);
        router.replace(session.user?.role === 'admin' ? '/admin' : '/account');
      } catch {
        // Inline error panel handles feedback.
      }
    };

    handleGoogleResponse();
  }, [googleLoginMutation, googleResponse]);

  return (
    <Screen>
      <View style={styles.brand}>
        <View style={[styles.mark, { backgroundColor: colors.primary }]}>
          <Ionicons name="add" size={34} color={colors.onPrimary} />
        </View>
        <AppText variant="title" accessibilityRole="header" style={styles.center}>
          Welcome back
        </AppText>
        <AppText variant="small" tone="muted" style={styles.center}>
          Sign in to ANT PRESS
        </AppText>
      </View>

      <FormTextField
        control={control}
        name="email"
        label="Email address"
        placeholder="you@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        error={errors.email?.message}
      />
      <FormTextField
        control={control}
        name="password"
        label="Password"
        placeholder="Enter your password"
        secureTextEntry={!showPassword}
        autoCapitalize="none"
        error={errors.password?.message}
      />
      <CheckboxRow label="Show password" checked={showPassword} onToggle={() => setShowPassword((value) => !value)} />

      <AppButton label="Sign in" loading={isSubmitting} onPress={handleSubmit(onSubmit)} />
      {loginMutation.isError ? <FormMessage tone="danger">{loginErrorMessage}</FormMessage> : null}

      <View style={styles.dividerRow}>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <AppText variant="small" tone="muted">
          or continue with
        </AppText>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
      </View>

      <AppButton
        label={googleLoginMutation.isPending ? 'Connecting...' : 'Continue with Google'}
        variant="secondary"
        icon={<Ionicons name="logo-google" size={18} color={colors.text} />}
        disabled={!googleRequest || googleLoginMutation.isPending}
        onPress={() => googlePromptAsync()}
      />
      {googleLoginMutation.isError ? <FormMessage tone="danger">{googleErrorMessage}</FormMessage> : null}

      <View style={styles.footer}>
        <AppText variant="small" tone="muted" style={styles.center}>
          Don&apos;t have an account?
        </AppText>
        <AppButton label="Create account" variant="ghost" onPress={() => router.push('/register' as never)} />
        <Link href="/" asChild>
          <Pressable accessibilityRole="link" style={styles.link}>
            <AppText variant="small" tone="link">
              Back to home
            </AppText>
          </Pressable>
        </Link>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  brand: { alignItems: 'center', gap: Space.sm, paddingVertical: Space.lg },
  mark: { width: 72, height: 72, borderRadius: Corner.panel, alignItems: 'center', justifyContent: 'center' },
  center: { textAlign: 'center' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: Space.sm },
  divider: { flex: 1, height: StyleSheet.hairlineWidth },
  footer: { alignItems: 'center', gap: Space.xs, paddingTop: Space.md },
  link: { minHeight: MIN_TOUCH, justifyContent: 'center' },
});
```

Removed (Ruling 9): "Forgot Password?" (plain text, no handler) and the Apple button (no handler). The eye toggle becomes a "Show password" checkbox with the same state.

- [ ] **Step 6: Register**

Replace `mobile/src/app/register.tsx` with:

```tsx
import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import * as Google from 'expo-auth-session/providers/google';
import { router } from 'expo-router';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { z } from 'zod';

import { CheckboxRow, FormMessage, FormTextField, Screen, ScreenHeader } from '@/components/kit';
import { AppText } from '@/components/ui/app-text';
import { AppButton } from '@/components/ui/button';
import { AppCard } from '@/components/ui/card';
import { Space } from '@/constants/tokens';
import { getApiErrorMessage, useGoogleLogin, useRegister } from '@/hooks/use-api';
import { useAppTheme } from '@/hooks/use-app-theme';

const registerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.email('Enter a valid email address'),
  phone: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  acceptedTerms: z.literal(true, {
    error: () => ({ message: 'You must accept the terms and agreement' }),
  }),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterScreen() {
  const { colors } = useAppTheme();
  const registerMutation = useRegister();
  const googleLoginMutation = useGoogleLogin();
  const [showPassword, setShowPassword] = React.useState(false);
  const [registeredEmail, setRegisteredEmail] = React.useState('');
  const [googleRequest, googleResponse, googlePromptAsync] = Google.useAuthRequest({
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    scopes: ['openid', 'profile', 'email'],
    responseType: 'token',
  });
  const registerErrorMessage = registerMutation.isError
    ? getApiErrorMessage(registerMutation.error, 'Could not create your account right now.')
    : '';
  const googleErrorMessage = googleLoginMutation.isError
    ? getApiErrorMessage(googleLoginMutation.error, 'Google sign-in failed.')
    : '';

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      acceptedTerms: false as true,
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    try {
      const response = await registerMutation.mutateAsync(values);
      setRegisteredEmail(response?.data?.email || values.email);
    } catch {
      // Inline error panel handles feedback.
    }
  };

  React.useEffect(() => {
    const handleGoogleResponse = async () => {
      if (googleResponse?.type !== 'success') {
        return;
      }

      const accessToken =
        googleResponse.authentication?.accessToken ||
        (typeof googleResponse.params?.access_token === 'string'
          ? googleResponse.params.access_token
          : '');

      if (!accessToken) {
        return;
      }

      try {
        const session = await googleLoginMutation.mutateAsync(accessToken);
        router.replace(session.user?.role === 'admin' ? '/admin' : '/account');
      } catch {
        // Inline error panel handles feedback.
      }
    };

    handleGoogleResponse();
  }, [googleLoginMutation, googleResponse]);

  return (
    <Screen>
      <ScreenHeader
        back
        title="Join ANT PRESS"
        subtitle="Create your account and keep your giving, events, and member activity connected across web and mobile."
      />

      {registeredEmail ? (
        <AppCard>
          <View style={[styles.successIcon, { backgroundColor: colors.surface }]}>
            <Ionicons name="mail-open-outline" size={26} color={colors.success} />
          </View>
          <AppText variant="section" accessibilityRole="header" style={styles.center}>
            Check your email
          </AppText>
          <AppText variant="small" tone="muted" style={styles.center}>
            We sent a verification link to {registeredEmail}. Open that message and verify your account before signing in.
          </AppText>
          <AppButton label="Go to sign in" onPress={() => router.replace('/login')} />
          <AppButton label="Create another account" variant="ghost" onPress={() => setRegisteredEmail('')} />
        </AppCard>
      ) : (
        <>
          <FormTextField control={control} name="firstName" label="First name" placeholder="John" error={errors.firstName?.message} />
          <FormTextField control={control} name="lastName" label="Last name" placeholder="Doe" error={errors.lastName?.message} />
          <FormTextField
            control={control}
            name="email"
            label="Email address"
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email?.message}
          />
          <FormTextField
            control={control}
            name="phone"
            label="Phone number"
            placeholder="Optional phone number"
            keyboardType="default"
            autoCapitalize="none"
            error={errors.phone?.message}
          />
          <FormTextField
            control={control}
            name="password"
            label="Password"
            placeholder="Min. 8 characters"
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            error={errors.password?.message}
          />
          <CheckboxRow label="Show password" checked={showPassword} onToggle={() => setShowPassword((value) => !value)} />

          <Controller
            control={control}
            name="acceptedTerms"
            render={({ field: { value, onChange } }) => (
              <CheckboxRow
                label="I agree to the Terms of Service and Privacy Policy, and consent to receive church communications."
                checked={Boolean(value)}
                onToggle={() => onChange(!value)}
              />
            )}
          />
          {errors.acceptedTerms ? (
            <AppText variant="small" tone="danger">
              {errors.acceptedTerms.message}
            </AppText>
          ) : null}

          <AppButton label="Create account" loading={isSubmitting} onPress={handleSubmit(onSubmit)} />
          {registerMutation.isError ? <FormMessage tone="danger">{registerErrorMessage}</FormMessage> : null}

          <AppButton
            label={googleLoginMutation.isPending ? 'Connecting to Google...' : 'Continue with Google'}
            variant="secondary"
            icon={<Ionicons name="logo-google" size={18} color={colors.text} />}
            disabled={!googleRequest || googleLoginMutation.isPending}
            onPress={() => googlePromptAsync()}
          />
          {googleLoginMutation.isError ? <FormMessage tone="danger">{googleErrorMessage}</FormMessage> : null}

          <View style={styles.footer}>
            <AppText variant="small" tone="muted">
              Already have an account?
            </AppText>
            <AppButton label="Sign in" variant="ghost" onPress={() => router.replace('/login')} />
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  successIcon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  center: { textAlign: 'center' },
  footer: { alignItems: 'center', gap: Space.xs },
});
```

Removed (Ruling 9): the fake "Step 1 of 2 · 50%" progress bar. The back button moves into `ScreenHeader`.

- [ ] **Step 7: Tab bar fully on tokens; drop the legacy palette**

Replace `mobile/src/app/(tabs)/_layout.tsx` with:

```tsx
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { useAppTheme } from '@/hooks/use-app-theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const icon =
  (active: IconName, idle: IconName) =>
  ({ color, focused }: { color: string; focused: boolean }) => <Ionicons name={focused ? active : idle} size={22} color={color} />;

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
```

(If Task 1 needed the named `TabIcon` function for `react/display-name`, keep that form here.)

- [ ] **Step 8: Navigation theme and status bar from tokens**

Replace `mobile/src/app/_layout.tsx` with:

```tsx
import { DarkTheme, DefaultTheme, ThemeProvider, type Theme } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';

import { useAppTheme } from '@/hooks/use-app-theme';
import AppProviders from '@/providers/AppProviders';
import { useAuthStore } from '@/store/auth';

export default function RootLayout() {
  const hydrate = useAuthStore((state) => state.hydrate);
  const { scheme, colors } = useAppTheme();
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const navigationTheme: Theme = {
    ...base,
    colors: {
      ...base.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.card,
      text: colors.text,
      border: colors.border,
      notification: colors.dangerSolid,
    },
  };

  React.useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <AppProviders>
      <ThemeProvider value={navigationTheme}>
        <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="login" options={{ presentation: 'modal' }} />
          <Stack.Screen name="register" options={{ presentation: 'modal' }} />
        </Stack>
      </ThemeProvider>
    </AppProviders>
  );
}
```

- [ ] **Step 9: Scans**

```bash
cd mobile
F='src/app/(tabs)/account.tsx src/app/profile.tsx src/app/dashboard.tsx src/app/notifications.tsx src/app/login.tsx src/app/register.tsx src/app/(tabs)/_layout.tsx src/app/_layout.tsx'
for f in $F; do grep -nE "#[0-9A-Fa-f]{3,8}\b|rgba?\(" "$f"; grep -nE "brand-ui|themed-text|themed-view|hooks/use-theme'|constants/theme'" "$f"; done
```
Expected: no output. (The `for … "$f"` form keeps the `(tabs)` paths intact.)

Then confirm that no tab root or tab layout still uses the legacy theme:
```bash
grep -rnE "use-theme'|brand-ui" "src/app/(tabs)" src/screens
```
Expected: no output.

- [ ] **Step 10: Lint and type-check**

Run: `cd mobile && npm run -s lint && npx tsc --noEmit && echo mobile-ok`
Expected: `mobile-ok`.

- [ ] **Step 11: By-eye check (user, light and dark)**

All five tabs:
- Each shows the new bar: white or card colour, navy (light) or blue (dark) active item, grey inactive labels, all readable. There is no dark bar on any tab.
- The status bar text is dark in light mode and light in dark mode.

Me, signed out:
- "Sign in" and "Create account" buttons, plus the Help list (About, FAQ, Contact, Privacy, Terms); each opens.

Me, signed in:
- The profile card opens My profile.
- My groups lists active/pending groups with Member/Pending badges, or the empty card with "Find a group".
- My registrations lists registered events (each opens), or an empty card.
- Activity rows: Notifications (with a red "N new" badge when unread), Donation history, Prayer requests (count), My dashboard.
- Settings and help.
- Admin rows only for admins.
- Sign out (red) opens the dialog. Cancel closes it; "Sign out" signs out and lands on Sign in. The dialog card is readable over the scrim in both themes.

Profile:
- Back, and a red sign-out icon (44×44) with the same dialog.
- Fields show the saved values. Saving with an empty first name shows the error under the field; a valid save works, and the button spins while saving.

Dashboard:
- Four stat tiles in a 2×2 grid; every quick-action row opens its screen.

Notifications:
- Unread rows show a red "New" badge with text. Tapping one marks it read (the badge disappears). The double-check button marks all as read.

Login:
- Fields have labels; "Show password" toggles masking; a wrong password shows the red message panel.
- Google is disabled until ready. Admins land on the admin console, members on Me.

Register:
- Back button; all fields; the terms checkbox (44 tall) shows the error when unticked; success shows "Check your email" with both buttons.

- [ ] **Step 12: Commit**

```bash
git add "mobile/src/app/(tabs)/account.tsx" mobile/src/app/profile.tsx mobile/src/app/dashboard.tsx mobile/src/app/notifications.tsx mobile/src/app/login.tsx mobile/src/app/register.tsx "mobile/src/app/(tabs)/_layout.tsx" mobile/src/app/_layout.tsx
git commit -m "feat(mobile): Me tab, profile, dashboard, notifications and sign-in on tokens; tab bar and status bar follow the theme

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Community, small groups, prayer and gallery

**Files:**
- Rewrite: `mobile/src/app/community.tsx`
- Rewrite: `mobile/src/app/small-groups.tsx`
- Rewrite: `mobile/src/app/prayer-wall.tsx`
- Rewrite: `mobile/src/app/prayers.tsx`
- Rewrite: `mobile/src/app/gallery/index.tsx`
- Rewrite: `mobile/src/app/gallery/[id].tsx`

**Interfaces:**
- Consumes: kit (`Screen`, `ScreenHeader`, `SectionHeader`, `IconButton`, `Avatar`, `Chip`, `ChoiceField`, `UnderlineTabs`, `SwitchRow`, `FormTextField`, `FormMessage`, `InfoLine`, `MediaFrame`, `Scripture`, `StatGrid`, `StatTile`, `LoadingList`, `ErrorState`, `SignInPrompt`, `statusTone`); `Fixed` from tokens (photo viewer only).
- Produces: nothing new.

Behaviour kept exactly:
- **Community:** post, comment, like toggle, and delete post/comment (the delete permission rules are unchanged).
- **Small groups:** join/leave/cancel with the same `Alert.alert` confirms; leader/admin approve/decline; the `busy` guard.
- **Prayer wall:** "I prayed" only when not yet prayed and not pending; sharing toggle; 404 wording.
- **Prayers:** same zod schema, `setValue('category')`, and reset after submit.
- **Gallery:** download-all, open-folder, save-to-photos, the viewer's step and wrap-around.

- [ ] **Step 1: Community**

Replace `mobile/src/app/community.tsx` with:

```tsx
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import {
  Avatar,
  Chip,
  FormMessage,
  IconButton,
  InfoLine,
  LoadingList,
  Screen,
  ScreenHeader,
} from '@/components/kit';
import { AppText } from '@/components/ui/app-text';
import { AppBadge } from '@/components/ui/badge';
import { AppButton } from '@/components/ui/button';
import { AppCard } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { TextField } from '@/components/ui/text-field';
import { Corner, Space } from '@/constants/tokens';
import {
  getApiErrorMessage,
  useCommunityFeed,
  useCreateCommunityComment,
  useCreateCommunityPost,
  useDeleteCommunityComment,
  useDeleteCommunityPost,
  useToggleCommunityLike,
} from '@/hooks/use-api';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useAuthStore } from '@/store/auth';

function getDisplayName(person: any) {
  const fullName = [person?.first_name || person?.firstName, person?.last_name || person?.lastName]
    .filter(Boolean)
    .join(' ')
    .trim();

  return fullName || person?.email || 'Community Member';
}

function getInitials(person: any) {
  return getDisplayName(person)
    .split(' ')
    .map((part: string) => part.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function CommunityScreen() {
  const { colors } = useAppTheme();
  const user = useAuthStore((state) => state.user);
  const feedQuery = useCommunityFeed();
  const createPost = useCreateCommunityPost();
  const createComment = useCreateCommunityComment();
  const toggleLike = useToggleCommunityLike();
  const deletePost = useDeleteCommunityPost();
  const deleteComment = useDeleteCommunityComment();

  const [draft, setDraft] = React.useState('');
  const [commentDrafts, setCommentDrafts] = React.useState<Record<number, string>>({});
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const posts = Array.isArray(feedQuery.data) ? feedQuery.data : [];

  const handleCreatePost = async () => {
    const content = draft.trim();
    if (!content) return;

    try {
      setErrorMessage(null);
      await createPost.mutateAsync({ content });
      setDraft('');
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, 'Could not create post.'));
    }
  };

  const handleAddComment = async (postId: number) => {
    const content = String(commentDrafts[postId] || '').trim();
    if (!content) return;

    try {
      setErrorMessage(null);
      await createComment.mutateAsync({ postId, content });
      setCommentDrafts((state) => ({ ...state, [postId]: '' }));
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, 'Could not add comment.'));
    }
  };

  return (
    <Screen>
      <ScreenHeader back title="Community" subtitle="Stories, updates and encouragement from members" />

      <View style={styles.badges}>
        <AppBadge>{`${posts.length} posts`}</AppBadge>
        <AppBadge>{`${posts.reduce((sum, post) => sum + Number(post.comment_count || 0), 0)} comments`}</AppBadge>
      </View>

      <AppCard>
        <AppText variant="bodyStrong">Share something with the community</AppText>
        <AppText variant="small" tone="muted">
          {user
            ? 'Post a testimony, update, invitation, or word of encouragement.'
            : 'You can browse the feed now. Sign in when you are ready to post and comment.'}
        </AppText>

        {user ? (
          <>
            <TextField
              label="Your post"
              value={draft}
              onChangeText={setDraft}
              placeholder="What would you like to share today?"
              multiline
            />
            <AppButton label="Share post" onPress={handleCreatePost} />
          </>
        ) : (
          <View style={styles.stack}>
            <AppButton label="Sign in to post" onPress={() => router.push('/login')} />
            <AppButton label="Create account" variant="secondary" onPress={() => router.push('/register' as never)} />
          </View>
        )}

        {errorMessage ? <FormMessage tone="danger">{errorMessage}</FormMessage> : null}
      </AppCard>

      {feedQuery.isLoading ? <LoadingList count={2} height={180} /> : null}

      {!feedQuery.isLoading && posts.length === 0 ? (
        <EmptyState
          icon="chatbubbles-outline"
          title="No posts yet"
          message="The community feed is ready. The first story shared by a member will appear here."
        />
      ) : null}

      {posts.map((post) => {
        const canDeletePost = user?.role === 'admin' || Number(user?.id) === Number(post.author?.id);
        const comments = Array.isArray(post.comments) ? post.comments : [];

        return (
          <AppCard key={post.id}>
            <View style={styles.postHeader}>
              <Avatar initials={getInitials(post.author)} size={44} />
              <View style={styles.flex}>
                <AppText variant="bodyStrong">{getDisplayName(post.author)}</AppText>
                <AppText variant="caption" tone="muted">
                  {post.created_at ? new Date(post.created_at).toLocaleString() : 'Recent post'}
                </AppText>
              </View>
              {canDeletePost ? (
                <IconButton icon="trash-outline" variant="danger" accessibilityLabel="Delete post" onPress={() => deletePost.mutate(post.id)} />
              ) : null}
            </View>

            <AppText>{post.content}</AppText>

            <View style={styles.postActions}>
              <Chip
                icon={post.liked_by_me ? 'heart' : 'heart-outline'}
                label={`${post.like_count || 0} likes`}
                selected={Boolean(post.liked_by_me)}
                disabled={!user || toggleLike.isPending}
                accessibilityLabel={`${post.liked_by_me ? 'Unlike' : 'Like'} this post, ${post.like_count || 0} likes`}
                onPress={() => toggleLike.mutate(post.id)}
              />
              <InfoLine icon="chatbubble-ellipses-outline">{`${post.comment_count || 0} comments`}</InfoLine>
            </View>

            <View style={[styles.comments, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {comments.length > 0 ? (
                comments.map((comment: any) => {
                  const canDeleteThisComment = user?.role === 'admin' || Number(user?.id) === Number(comment.author?.id);

                  return (
                    <View key={comment.id} style={[styles.comment, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      <View style={styles.commentHeader}>
                        <View style={styles.flex}>
                          <AppText variant="small" style={styles.bold}>
                            {getDisplayName(comment.author)}
                          </AppText>
                          <AppText variant="caption" tone="muted">
                            {comment.created_at ? new Date(comment.created_at).toLocaleString() : 'Recent comment'}
                          </AppText>
                        </View>
                        {canDeleteThisComment ? (
                          <IconButton
                            icon="trash-outline"
                            variant="danger"
                            accessibilityLabel="Delete comment"
                            onPress={() => deleteComment.mutate({ postId: post.id, commentId: comment.id })}
                          />
                        ) : null}
                      </View>
                      <AppText variant="small">{comment.content}</AppText>
                    </View>
                  );
                })
              ) : (
                <AppText variant="small" tone="muted">
                  No comments yet. Be the first to respond.
                </AppText>
              )}

              {user ? (
                <View style={styles.stack}>
                  <TextField
                    label="Add a comment"
                    value={commentDrafts[post.id] || ''}
                    onChangeText={(value) => setCommentDrafts((state) => ({ ...state, [post.id]: value }))}
                    placeholder="Add a thoughtful comment..."
                    multiline
                    style={styles.commentInput}
                  />
                  <AppButton label="Reply" variant="secondary" onPress={() => handleAddComment(post.id)} />
                </View>
              ) : (
                <AppText variant="small" tone="muted">
                  Sign in to join the discussion.
                </AppText>
              )}
            </View>
          </AppCard>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  badges: { flexDirection: 'row', gap: Space.sm },
  stack: { gap: Space.sm },
  flex: { flex: 1, gap: 2 },
  bold: { fontWeight: '600' },
  postHeader: { flexDirection: 'row', alignItems: 'center', gap: Space.sm + 4 },
  postActions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: Space.md },
  comments: { borderWidth: 1, borderRadius: Corner.control, padding: Space.sm + 4, gap: Space.sm },
  comment: { borderWidth: 1, borderRadius: Corner.control, padding: Space.sm, gap: Space.xs },
  commentHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: Space.sm },
  commentInput: { minHeight: 84 },
});
```

- [ ] **Step 2: Small groups**

Replace `mobile/src/app/small-groups.tsx` with:

```tsx
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { ErrorState, InfoLine, LoadingList, Screen, ScreenHeader } from '@/components/kit';
import { AppText } from '@/components/ui/app-text';
import { AppBadge } from '@/components/ui/badge';
import { AppButton } from '@/components/ui/button';
import { AppCard } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Corner, Space } from '@/constants/tokens';
import {
  getApiErrorMessage,
  useDecideGroupRequest,
  useGroup,
  useGroupRequests,
  useGroups,
  useJoinGroup,
  useLeaveGroup,
  type GroupSummary,
} from '@/hooks/use-api';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useAuthStore } from '@/store/auth';

const personName = (person: { first_name: string; last_name: string }) =>
  `${person.first_name || ''} ${person.last_name || ''}`.trim() || 'Member';
const meetingLine = (group: GroupSummary) =>
  [group.meeting_day, group.meeting_time, group.location].filter(Boolean).join(' · ');
const isFull = (group: GroupSummary) => group.capacity !== null && group.member_count >= group.capacity;

export default function SmallGroupsScreen() {
  const { colors } = useAppTheme();
  const user = useAuthStore((state) => state.user);
  const [selectedId, setSelectedId] = React.useState<number | undefined>();

  const groupsQuery = useGroups();
  const groupQuery = useGroup(selectedId);
  const group = groupQuery.data;
  const isAdmin = user?.role === 'admin';
  const canManage = Boolean(isAdmin || (group?.my_role === 'leader' && group?.my_status === 'active'));
  const requestsQuery = useGroupRequests(selectedId, canManage);
  const joinMutation = useJoinGroup();
  const leaveMutation = useLeaveGroup();
  const decideMutation = useDecideGroupRequest(selectedId);

  const busy = joinMutation.isPending || leaveMutation.isPending || decideMutation.isPending;
  const showError = (title: string) => (error: unknown) => Alert.alert(title, getApiErrorMessage(error, 'Please try again.'));

  const join = (groupId: number) => {
    if (!user) {
      router.push('/login');
      return;
    }
    joinMutation.mutate(groupId, {
      onSuccess: () => Alert.alert('Request sent', 'The group leaders will review your request.'),
      onError: showError('Could not send your request'),
    });
  };

  const leave = (target: GroupSummary) =>
    Alert.alert(
      target.my_status === 'active' ? `Leave ${target.name}?` : 'Cancel your request?',
      target.my_status === 'active' ? 'You can ask to join again later.' : undefined,
      [
        { text: 'Keep', style: 'cancel' },
        {
          text: target.my_status === 'active' ? 'Leave' : 'Cancel request',
          style: 'destructive',
          onPress: () => leaveMutation.mutate(target.id, { onError: showError('Could not leave the group') }),
        },
      ]
    );

  const decide = (userId: number, decision: 'approve' | 'decline') =>
    decideMutation.mutate({ userId, decision }, { onError: showError('Could not update the request') });

  const statusAction = (target: GroupSummary) => {
    if (target.my_status === 'active') {
      return <AppButton label="Leave group" variant="secondary" onPress={() => !busy && leave(target)} />;
    }
    if (target.my_status === 'pending') {
      return <AppButton label="Request pending · Cancel" variant="secondary" onPress={() => !busy && leave(target)} />;
    }
    if (isFull(target)) {
      return (
        <AppText variant="small" tone="muted">
          This group is full.
        </AppText>
      );
    }
    return <AppButton label={user ? 'Ask to join' : 'Sign in to join'} onPress={() => !busy && join(target.id)} />;
  };

  if (selectedId) {
    return (
      <Screen>
        <ScreenHeader onBack={() => setSelectedId(undefined)} eyebrow="Small group" title={group?.name || 'Group'} />

        {groupQuery.isLoading ? (
          <LoadingList count={2} height={120} />
        ) : groupQuery.isError || !group ? (
          <EmptyState
            icon="people-outline"
            title="This group could not be loaded"
            action={<AppButton label="Back to groups" variant="secondary" onPress={() => setSelectedId(undefined)} />}
          />
        ) : (
          <>
            <AppCard>
              {group.ministry_name ? <AppBadge tone="gold">{group.ministry_name}</AppBadge> : null}
              {group.description ? <AppText variant="small">{group.description}</AppText> : null}
              {meetingLine(group) ? <InfoLine icon="time-outline">{meetingLine(group)}</InfoLine> : null}
              <InfoLine icon="people-outline">
                {`${group.member_count} members${group.capacity !== null ? ` of ${group.capacity}` : ''}`}
                {group.leaders.length > 0 ? ` · Led by ${group.leaders.map(personName).join(', ')}` : ''}
              </InfoLine>
              {statusAction(group)}
            </AppCard>

            {canManage ? (
              <AppCard>
                <AppText variant="bodyStrong">{`Join requests (${requestsQuery.data?.length ?? 0})`}</AppText>
                {(requestsQuery.data ?? []).length === 0 ? (
                  <AppText variant="small" tone="muted">
                    No pending requests.
                  </AppText>
                ) : (
                  (requestsQuery.data ?? []).map((request) => (
                    <View key={request.user_id} style={[styles.request, { borderTopColor: colors.border }]}>
                      <AppText variant="small" numberOfLines={1}>
                        {personName(request)}
                      </AppText>
                      <View style={styles.requestActions}>
                        <View style={styles.flex}>
                          <AppButton label="Approve" size="sm" onPress={() => !busy && decide(request.user_id, 'approve')} />
                        </View>
                        <View style={styles.flex}>
                          <AppButton
                            label="Decline"
                            size="sm"
                            variant="secondary"
                            onPress={() => !busy && decide(request.user_id, 'decline')}
                          />
                        </View>
                      </View>
                    </View>
                  ))
                )}
              </AppCard>
            ) : null}

            {group.members ? (
              <AppCard>
                <AppText variant="bodyStrong">{`Members (${group.members.length})`}</AppText>
                {group.members.map((member) => (
                  <View key={member.user_id} style={styles.memberRow}>
                    <AppText variant="small" style={styles.flex} numberOfLines={1}>
                      {personName(member)}
                    </AppText>
                    {member.role === 'leader' ? <AppBadge tone="gold">Leader</AppBadge> : null}
                  </View>
                ))}
              </AppCard>
            ) : null}
          </>
        )}
      </Screen>
    );
  }

  const groups = Array.isArray(groupsQuery.data) ? groupsQuery.data : [];

  return (
    <Screen>
      <ScreenHeader
        back
        title="Small groups"
        subtitle="Join a small group to grow, pray and do life together during the week."
      />

      {groupsQuery.isLoading ? (
        <LoadingList />
      ) : groupsQuery.isError ? (
        <ErrorState title="Could not load groups" onRetry={() => groupsQuery.refetch()} />
      ) : groups.length === 0 ? (
        <EmptyState icon="people-outline" title="No groups are open yet" message="New groups will appear here." />
      ) : (
        groups.map((item) => (
          <AppCard key={item.id} onPress={() => setSelectedId(item.id)} accessibilityLabel={`Open ${item.name}`} style={styles.groupCard}>
            <View style={[styles.groupIcon, { backgroundColor: colors.surface }]}>
              <Ionicons name="people-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.flex}>
              <AppText variant="bodyStrong">{item.name}</AppText>
              {meetingLine(item) ? (
                <AppText variant="small" tone="muted">
                  {meetingLine(item)}
                </AppText>
              ) : null}
            </View>
            <AppBadge tone={item.my_status === 'active' ? 'success' : item.my_status === 'pending' ? 'warning' : 'neutral'}>
              {item.my_status === 'active'
                ? 'Member'
                : item.my_status === 'pending'
                  ? 'Pending'
                  : `${item.member_count}${item.capacity !== null ? `/${item.capacity}` : ''}`}
            </AppBadge>
          </AppCard>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  request: { gap: Space.sm, paddingTop: Space.sm, borderTopWidth: StyleSheet.hairlineWidth },
  requestActions: { flexDirection: 'row', gap: Space.sm },
  memberRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Space.sm, minHeight: 32 },
  groupCard: { flexDirection: 'row', alignItems: 'center', gap: Space.sm + 4 },
  groupIcon: { width: 44, height: 44, borderRadius: Corner.control, alignItems: 'center', justifyContent: 'center' },
});
```

- [ ] **Step 3: Prayer wall**

Replace `mobile/src/app/prayer-wall.tsx` with:

```tsx
import { router } from 'expo-router';
import React from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import {
  ErrorState,
  IconButton,
  LoadingList,
  Screen,
  ScreenHeader,
  Scripture,
  SignInPrompt,
  UnderlineTabs,
  statusTone,
} from '@/components/kit';
import { AppText } from '@/components/ui/app-text';
import { AppBadge } from '@/components/ui/badge';
import { AppButton } from '@/components/ui/button';
import { AppCard } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Space } from '@/constants/tokens';
import {
  useMyPrayerRequests,
  usePrayerWall,
  usePrayForRequest,
  useSetPrayerSharing,
  type WallPrayer,
} from '@/hooks/use-api';
import { useAuthStore } from '@/store/auth';

type Tab = 'wall' | 'mine';

const TABS: { value: Tab; label: string }[] = [
  { value: 'wall', label: 'Wall' },
  { value: 'mine', label: 'My requests' },
];

export default function PrayerWallScreen() {
  const user = useAuthStore((state) => state.user);
  const [tab, setTab] = React.useState<Tab>('wall');
  const wallQuery = usePrayerWall(Boolean(user));
  const myPrayersQuery = useMyPrayerRequests(Boolean(user) && tab === 'mine');
  const prayMutation = usePrayForRequest();
  const sharingMutation = useSetPrayerSharing();

  const errorMessage = (error: any, fallback: string) =>
    error?.response?.status === 404
      ? 'This request is no longer on the prayer wall.'
      : error?.response?.data?.message || fallback;

  const pray = (id: number) =>
    prayMutation.mutate(id, {
      onError: (error) => Alert.alert('Prayer not recorded', errorMessage(error, 'Please try again.')),
    });

  const toggleSharing = (prayer: any) =>
    sharingMutation.mutate(
      {
        id: prayer.id,
        title: prayer.title,
        description: prayer.description,
        category: prayer.category,
        shareOnWall: !prayer.share_on_wall,
      },
      {
        onError: (error) => Alert.alert('Could not update sharing', errorMessage(error, 'Please try again.')),
      }
    );

  if (!user) {
    return (
      <Screen>
        <ScreenHeader back title="Prayer wall" />
        <SignInPrompt
          icon="heart-outline"
          title="Pray with the church family"
          message="Sign in to see the prayer wall and pray with the church family."
          label="Go to sign in"
          onSignIn={() => router.replace('/login')}
        />
      </Screen>
    );
  }

  const wall = Array.isArray(wallQuery.data) ? wallQuery.data : [];
  const mine = Array.isArray(myPrayersQuery.data) ? myPrayersQuery.data : [];
  const activeQuery = tab === 'wall' ? wallQuery : myPrayersQuery;

  const renderWallItem = (prayer: WallPrayer) => (
    <AppCard key={String(prayer.id)}>
      <View style={styles.head}>
        <View style={styles.flex}>
          <AppText variant="bodyStrong">{prayer.requester_name}</AppText>
          <AppText variant="caption" tone="muted">
            {new Date(prayer.created_at).toLocaleDateString()}
          </AppText>
        </View>
        <View style={styles.badges}>
          {prayer.status === 'answered' ? <AppBadge tone="success">Answered</AppBadge> : null}
          <AppBadge>{prayer.category}</AppBadge>
        </View>
      </View>
      <AppText variant="bodyStrong">{prayer.title}</AppText>
      <AppText variant="small">{prayer.description}</AppText>
      <AppButton
        label={`${prayer.prayed_by_me ? 'You prayed' : 'I prayed'} · ${prayer.prayer_count}`}
        variant={prayer.prayed_by_me ? 'secondary' : 'primary'}
        onPress={() => {
          if (!prayer.prayed_by_me && !prayMutation.isPending) {
            pray(prayer.id);
          }
        }}
      />
    </AppCard>
  );

  return (
    <Screen>
      <ScreenHeader
        back
        title="Prayer wall"
        subtitle="Pray for one another"
        right={
          <IconButton icon="add" variant="primary" accessibilityLabel="Share a prayer request" onPress={() => router.push('/prayers')} />
        }
      />

      <Scripture text="Pray for each other so that you may be healed." reference="James 5:16" />

      <UnderlineTabs options={TABS} value={tab} onChange={setTab} />

      {activeQuery.isLoading ? (
        <LoadingList count={2} height={160} />
      ) : activeQuery.isError ? (
        <ErrorState title="Could not load prayers" onRetry={() => activeQuery.refetch()} />
      ) : tab === 'wall' ? (
        wall.length > 0 ? (
          wall.map(renderWallItem)
        ) : (
          <EmptyState
            icon="heart-outline"
            title="Nothing on the wall yet"
            message="Requests appear here once their owner shares them and they are approved."
            action={<AppButton label="Share a request" variant="secondary" onPress={() => router.push('/prayers')} />}
          />
        )
      ) : mine.length > 0 ? (
        mine.map((prayer: any) => (
          <AppCard key={String(prayer?.id)}>
            <View style={styles.head}>
              <AppText variant="bodyStrong" style={styles.flex}>
                {prayer?.title || 'Prayer request'}
              </AppText>
              <AppBadge tone={statusTone(prayer?.status || 'pending')}>{String(prayer?.status || 'pending')}</AppBadge>
            </View>
            <AppText variant="small">{prayer?.description}</AppText>
            <AppText variant="small" tone="muted">
              {prayer?.share_on_wall
                ? prayer?.status === 'pending'
                  ? 'Will appear on the wall after approval'
                  : `Shared on the wall · ${prayer?.prayer_count ?? 0} prayed`
                : 'Private'}
            </AppText>
            <AppButton
              label={prayer?.share_on_wall ? 'Stop sharing' : 'Share on wall'}
              variant="secondary"
              onPress={() => {
                if (!sharingMutation.isPending) {
                  toggleSharing(prayer);
                }
              }}
            />
          </AppCard>
        ))
      ) : (
        <EmptyState
          icon="heart-outline"
          title="No requests yet"
          action={<AppButton label="Share a request" variant="secondary" onPress={() => router.push('/prayers')} />}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: Space.sm },
  flex: { flex: 1, gap: 2 },
  badges: { flexDirection: 'row', gap: Space.xs },
});
```

- [ ] **Step 4: Prayer requests**

Replace `mobile/src/app/prayers.tsx` with:

```tsx
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { z } from 'zod';

import {
  ChoiceField,
  FormMessage,
  FormTextField,
  LoadingList,
  Screen,
  ScreenHeader,
  SignInPrompt,
  StatGrid,
  StatTile,
  SwitchRow,
} from '@/components/kit';
import { AppText } from '@/components/ui/app-text';
import { AppBadge } from '@/components/ui/badge';
import { AppButton } from '@/components/ui/button';
import { AppCard } from '@/components/ui/card';
import { Space } from '@/constants/tokens';
import { useCreatePrayerRequest, useMyPrayerRequests } from '@/hooks/use-api';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useAuthStore } from '@/store/auth';

const prayerSchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  description: z.string().trim().min(1, 'Description is required'),
  category: z.enum(['personal', 'family', 'health', 'work', 'financial', 'other']),
  isAnonymous: z.boolean().default(false),
  shareOnWall: z.boolean().default(false),
});

type PrayerFormValues = z.infer<typeof prayerSchema>;
type PrayerFormInput = z.input<typeof prayerSchema>;

const categories: PrayerFormValues['category'][] = ['personal', 'family', 'health', 'work', 'financial', 'other'];
const categoryOptions = categories.map((value) => ({ value, label: value.charAt(0).toUpperCase() + value.slice(1) }));

export default function PrayerScreen() {
  const { colors } = useAppTheme();
  const user = useAuthStore((state) => state.user);
  const createPrayerMutation = useCreatePrayerRequest();
  const { data, isLoading } = useMyPrayerRequests(Boolean(user));
  const requests = Array.isArray(data) ? data : [];
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PrayerFormInput, unknown, PrayerFormValues>({
    resolver: zodResolver(prayerSchema),
    defaultValues: {
      title: '',
      description: '',
      category: 'personal',
      isAnonymous: false,
      shareOnWall: false,
    },
  });

  const selectedCategory = watch('category');

  const onSubmit = async (values: PrayerFormValues) => {
    await createPrayerMutation.mutateAsync(values);
    reset({
      title: '',
      description: '',
      category: 'personal',
      isAnonymous: false,
      shareOnWall: false,
    });
  };

  if (!user) {
    return (
      <Screen>
        <ScreenHeader back title="Prayer requests" />
        <SignInPrompt
          icon="heart-outline"
          title="Sign in first"
          message="Prayer requests are personal to your account, so mobile requests start after sign-in."
          label="Go to sign in"
          onSignIn={() => router.replace('/login')}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader back title="Prayer requests" subtitle="Share a request and follow the ones you have sent" />

      <StatGrid>
        <StatTile label="Requests" value={requests.length} icon="heart-outline" />
        <StatTile label="On the wall" value={requests.filter((item: any) => item?.share_on_wall).length} icon="people-outline" />
      </StatGrid>

      <AppCard>
        <AppText variant="section">New request</AppText>

        <FormTextField control={control} name="title" label="Title" placeholder="Prayer request title" error={errors.title?.message} />
        <FormTextField
          control={control}
          name="description"
          label="Description"
          placeholder="Share what you would like prayer for"
          multiline
          error={errors.description?.message}
        />

        <ChoiceField
          label="Category"
          options={categoryOptions}
          value={selectedCategory}
          onChange={(category) => setValue('category', category)}
        />

        <Controller
          control={control}
          name="isAnonymous"
          render={({ field: { onChange, value } }) => (
            <SwitchRow
              label="Submit anonymously"
              description="Your name can be hidden while the request still belongs to your account."
              value={Boolean(value)}
              onValueChange={onChange}
            />
          )}
        />
        <Controller
          control={control}
          name="shareOnWall"
          render={({ field: { onChange, value } }) => (
            <SwitchRow
              label="Share on the prayer wall"
              description="After approval, other signed-in members can see this request and pray for you."
              value={Boolean(value)}
              onValueChange={onChange}
            />
          )}
        />

        <AppButton label="Submit request" loading={isSubmitting} onPress={handleSubmit(onSubmit)} />

        {createPrayerMutation.isError ? (
          <FormMessage tone="danger">Could not submit your prayer request right now.</FormMessage>
        ) : null}
      </AppCard>

      <AppCard>
        <AppText variant="section">Your requests</AppText>
        {isLoading ? (
          <LoadingList count={2} height={72} />
        ) : requests.length === 0 ? (
          <AppText variant="small" tone="muted">
            No prayer requests yet.
          </AppText>
        ) : (
          requests.map((item: any) => (
            <View key={item.id} style={[styles.request, { borderTopColor: colors.border }]}>
              <AppBadge>{String(item.category)}</AppBadge>
              <AppText variant="bodyStrong">{item.title}</AppText>
              <AppText variant="small">{item.description}</AppText>
              <AppText variant="small" tone="muted">
                {`${item.status} - ${item.is_anonymous ? 'Anonymous' : 'Named'}`}
              </AppText>
            </View>
          ))
        )}
      </AppCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  request: { gap: Space.xs, paddingTop: Space.sm, borderTopWidth: StyleSheet.hairlineWidth },
});
```

If TypeScript complains that `setValue('category', category)` receives `PrayerFormValues['category'] | …`, keep `categoryOptions` typed as `{ value: PrayerFormValues['category']; label: string }[]`.

- [ ] **Step 5: Gallery list**

Replace `mobile/src/app/gallery/index.tsx` with:

```tsx
import { router } from 'expo-router';
import React from 'react';

import { ErrorState, LoadingList, MediaFrame, Screen, ScreenHeader } from '@/components/kit';
import { AppText } from '@/components/ui/app-text';
import { AppCard } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Corner } from '@/constants/tokens';
import { useAlbums } from '@/hooks/use-api';

export default function GalleryScreen() {
  const albumsQuery = useAlbums();
  const albums = albumsQuery.data ?? [];

  return (
    <Screen>
      <ScreenHeader back title="Gallery" subtitle="Photos from our services and events" />

      {albumsQuery.isLoading ? (
        <LoadingList count={2} height={240} />
      ) : albumsQuery.isError ? (
        <ErrorState title="Could not load the gallery" onRetry={() => albumsQuery.refetch()} />
      ) : albums.length === 0 ? (
        <EmptyState icon="images-outline" title="No albums yet" message="Photo albums from services and events will appear here." />
      ) : (
        albums.map((album) => (
          <AppCard key={album.id} onPress={() => router.push(`/gallery/${album.id}` as never)} accessibilityLabel={`Open album ${album.title}`}>
            <MediaFrame uri={album.cover_url} icon="images-outline" height={180} radius={Corner.control} />
            <AppText variant="bodyStrong" numberOfLines={1}>
              {album.title}
            </AppText>
            <AppText variant="small" tone="muted">
              {album.photo_count} photo{album.photo_count === 1 ? '' : 's'}
              {album.event_name ? ` · ${album.event_name}` : ''} · {new Date(album.created_at).toLocaleDateString()}
            </AppText>
          </AppCard>
        ))
      )}
    </Screen>
  );
}
```

- [ ] **Step 6: Album and photo viewer**

Replace `mobile/src/app/gallery/[id].tsx` with:

```tsx
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Alert, Linking, Modal, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LoadingList, Screen, ScreenHeader } from '@/components/kit';
import { AppText } from '@/components/ui/app-text';
import { AppButton } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Corner, Fixed, MIN_TOUCH, Space } from '@/constants/tokens';
import { getApiErrorMessage, useAlbum, useAlbumDownloadUrl } from '@/hooks/use-api';
import { savePhotoToLibrary } from '@/lib/save-photo';

export default function AlbumScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const id = Number(params.id) || undefined;
  const albumQuery = useAlbum(id);
  const downloadUrl = useAlbumDownloadUrl();
  const [viewing, setViewing] = React.useState<number | null>(null);
  const [saving, setSaving] = React.useState(false);
  const album = albumQuery.data;
  const photos = album?.photos ?? [];
  const current = viewing !== null ? photos[viewing] : undefined;

  const openInBrowser = async (url?: string | null) => {
    if (!url) return;
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Could not open the link', 'Please try again.');
    }
  };

  const downloadAll = async () => {
    if (!id || downloadUrl.isPending) return;
    try {
      await openInBrowser(await downloadUrl.mutateAsync(id));
    } catch (error) {
      Alert.alert('Could not prepare the download', getApiErrorMessage(error, 'Please try again.'));
    }
  };

  const saveCurrent = async () => {
    if (!current || !album || saving) return;
    setSaving(true);
    try {
      const result = await savePhotoToLibrary(album.id, current);
      if (result === 'denied') {
        Alert.alert('Photo access needed', 'Allow ANT PRESS to add photos in your phone settings, then try again.');
      } else {
        Alert.alert('Saved', 'The photo is in your photo library.');
      }
    } catch {
      Alert.alert('Could not save the photo', 'Check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  const step = (by: number) => setViewing((index) => (index === null ? index : (index + by + photos.length) % photos.length));

  return (
    <Screen>
      <ScreenHeader back eyebrow="Gallery" title={album?.title || 'Album'} subtitle={album?.description || undefined} />

      {albumQuery.isLoading ? (
        <LoadingList count={2} height={160} />
      ) : !album ? (
        <EmptyState icon="images-outline" title="Album not found" message="It may have been unpublished or removed." />
      ) : (
        <>
          <AppText variant="small" tone="muted">
            {album.photo_count} photo{album.photo_count === 1 ? '' : 's'}
            {album.event_name ? ` · ${album.event_name}` : ''}
          </AppText>
          <View style={styles.actions}>
            {photos.length > 0 ? (
              <View style={styles.action}>
                <AppButton label={downloadUrl.isPending ? 'Preparing...' : 'Download all'} onPress={downloadAll} />
              </View>
            ) : null}
            {album.external_url ? (
              <View style={styles.action}>
                <AppButton label="Open folder" variant="secondary" onPress={() => openInBrowser(album.external_url)} />
              </View>
            ) : null}
          </View>

          {photos.length === 0 ? (
            <EmptyState icon="image-outline" title="No photos yet" />
          ) : (
            <View style={styles.grid}>
              {photos.map((photo, index) => (
                <Pressable
                  key={photo.id}
                  onPress={() => setViewing(index)}
                  accessibilityRole="imagebutton"
                  accessibilityLabel={`Open photo ${index + 1} of ${photos.length}`}
                  style={styles.cell}>
                  <Image source={{ uri: photo.thumb_url }} style={styles.thumb} contentFit="cover" />
                </Pressable>
              ))}
            </View>
          )}
        </>
      )}

      <Modal visible={Boolean(current)} animationType="fade" onRequestClose={() => setViewing(null)}>
        <SafeAreaView style={[styles.viewer, { backgroundColor: Fixed.viewer }]}>
          <View style={styles.viewerBar}>
            <AppText style={{ color: Fixed.onMedia }}>
              {viewing !== null ? `${viewing + 1} / ${photos.length}` : ''}
            </AppText>
            <Pressable onPress={() => setViewing(null)} accessibilityRole="button" accessibilityLabel="Close photo" style={styles.viewerIcon}>
              <Ionicons name="close" size={26} color={Fixed.onMedia} />
            </Pressable>
          </View>
          {current ? <Image source={{ uri: current.url }} style={styles.viewerImage} contentFit="contain" /> : null}
          <View style={styles.viewerBar}>
            <Pressable
              onPress={() => step(-1)}
              disabled={photos.length < 2}
              accessibilityRole="button"
              accessibilityLabel="Previous photo"
              style={styles.viewerIcon}>
              <Ionicons name="chevron-back" size={28} color={Fixed.onMedia} />
            </Pressable>
            <AppButton label={saving ? 'Saving...' : 'Save to Photos'} variant="secondary" onPress={saveCurrent} />
            <Pressable
              onPress={() => step(1)}
              disabled={photos.length < 2}
              accessibilityRole="button"
              accessibilityLabel="Next photo"
              style={styles.viewerIcon}>
              <Ionicons name="chevron-forward" size={28} color={Fixed.onMedia} />
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.sm },
  action: { flexGrow: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.xs },
  cell: { width: '32.5%', aspectRatio: 1 },
  thumb: { width: '100%', height: '100%', borderRadius: Corner.control },
  viewer: { flex: 1 },
  viewerBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Space.md },
  viewerIcon: { width: MIN_TOUCH, height: MIN_TOUCH, alignItems: 'center', justifyContent: 'center' },
  viewerImage: { flex: 1 },
});
```

The viewer stays black with white controls in both themes, read from `Fixed` (Ruling 6 reasoning: photos are viewed on black). The `hitSlop` arrows become real 44×44 buttons.

- [ ] **Step 7: Scans**

```bash
cd mobile
F='src/app/community.tsx src/app/small-groups.tsx src/app/prayer-wall.tsx src/app/prayers.tsx src/app/gallery/index.tsx src/app/gallery/[id].tsx'
for f in $F; do grep -nE "#[0-9A-Fa-f]{3,8}\b|rgba?\(" "$f"; grep -nE "brand-ui|themed-text|themed-view|hooks/use-theme'|constants/theme'" "$f"; done
```
Expected: no output.

- [ ] **Step 8: Lint and type-check**

Run: `cd mobile && npm run -s lint && npx tsc --noEmit && echo mobile-ok`
Expected: `mobile-ok`.

- [ ] **Step 9: By-eye check (user, light and dark)**

Community (Home → Community):
- Signed out: "Sign in to post" and "Create account" buttons.
- Signed in:
  - Posting adds the post; an empty post does nothing.
  - The heart chip turns filled navy/blue when liked; its count updates.
  - The red trash buttons (44×44) appear only on your posts and comments (or everything for an admin).
  - Reply adds a comment; the comment area is a light grey (or deep navy) panel with readable cards.

Small groups (Home → Small groups):
- Each group card shows a status badge with words.
- Opening one shows the detail with back.
- "Ask to join" / "Leave group" / "Request pending · Cancel" open the same confirms as before.
- As a leader or admin, the Join requests card shows Approve/Decline buttons side by side.

Prayer wall:
- Back; the "+" button (primary) opens the request form; the James 5:16 quote is serif with a gold rule.
- Underline tabs (Wall / My requests) are 44 tall; the active tab has a primary underline.
- "I prayed · N" switches to an outline "You prayed · N"; "Share on wall" / "Stop sharing" works; status badges have words.

Prayer requests:
- Tiles; the form with labels; category chips (Personal…Other); two switches (thumb visible both on and off in both themes).
- Submit spins and then clears the form; the list below shows category badges.

Gallery:
- Album cards with covers (or placeholder); an album opens with back.
- "Download all" / "Open folder"; the 3-column photo grid.
- Tapping a photo opens the black viewer: counter, Close, previous/next (wrap around), "Save to Photos" shows the permission or "Saved" alert.

- [ ] **Step 10: Commit**

```bash
git add mobile/src/app/community.tsx mobile/src/app/small-groups.tsx mobile/src/app/prayer-wall.tsx mobile/src/app/prayers.tsx mobile/src/app/gallery
git commit -m "feat(mobile): community, small groups, prayer wall, prayer requests and gallery on tokens

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Remaining public screens (devotional, ministries, news post, about, contact, FAQ, privacy, terms)

**Files:**
- Rewrite: `mobile/src/app/daily-devotional.tsx`
- Rewrite: `mobile/src/app/ministries.tsx`, `mobile/src/app/ministries/[id].tsx`
- Rewrite: `mobile/src/app/news/[id].tsx`
- Rewrite: `mobile/src/app/about.tsx`, `contact.tsx`, `faq.tsx`, `privacy.tsx`, `terms.tsx`

**Interfaces:**
- Consumes: kit (`Screen`, `ScreenHeader`, `SectionHeader`, `ListGroup`, `ListRow`, `Scripture`, `LoadingList`, `ErrorState`, `FormTextField`, `FormMessage`); `useTodayDevotional`, `useDevotionalArchive`, `useMinistries`, `useMinistrySermons`, `useNewsPost`, `useSubmitContactMessage`.
- Produces: nothing new.

Behaviour kept exactly:
- **Devotional:** back clears a selected archive item first, otherwise goes back; archive rows select an item.
- **Contact:** same form and success/error wording; resets after sending.
- **Unchanged:** every push target.

- [ ] **Step 1: Daily devotional**

Replace `mobile/src/app/daily-devotional.tsx` with:

```tsx
import { router } from 'expo-router';
import React from 'react';

import { ErrorState, ListGroup, ListRow, LoadingList, Screen, ScreenHeader, Scripture, SectionHeader } from '@/components/kit';
import { AppText } from '@/components/ui/app-text';
import { AppCard } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { useDevotionalArchive, useTodayDevotional, type Devotional } from '@/hooks/use-api';

// publish_date is YYYY-MM-DD; format in UTC so it never shifts a day.
const formatDay = (ymd: string) =>
  new Date(`${ymd}T00:00:00Z`).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' });

export default function DailyDevotionalScreen() {
  const todayQuery = useTodayDevotional();
  const archiveQuery = useDevotionalArchive();
  const [selected, setSelected] = React.useState<Devotional | null>(null);
  const devotional = selected ?? todayQuery.data ?? null;
  const archive = (archiveQuery.data ?? []).filter((item) => item.id !== devotional?.id);
  const subtitle = devotional
    ? `${formatDay(devotional.publish_date)}${devotional.is_today === false && !selected ? ' · latest' : ''}`
    : undefined;

  return (
    <Screen>
      <ScreenHeader
        onBack={() => (selected ? setSelected(null) : router.back())}
        eyebrow="Daily devotional"
        title={devotional?.title || 'Daily devotional'}
        subtitle={subtitle}
      />

      {todayQuery.isLoading ? (
        <LoadingList count={2} height={140} />
      ) : todayQuery.isError ? (
        <ErrorState title="Could not load the devotional" onRetry={() => todayQuery.refetch()} />
      ) : !devotional ? (
        <EmptyState icon="book-outline" title="No devotional yet" message="No devotional has been published yet." />
      ) : (
        <>
          <Scripture text={devotional.scripture_text} reference={devotional.scripture_reference} />
          <AppCard>
            <AppText>{devotional.body}</AppText>
          </AppCard>
          {devotional.prayer ? (
            <AppCard>
              <AppText variant="caption" tone="gold">
                PRAYER
              </AppText>
              <AppText serif>{devotional.prayer}</AppText>
            </AppCard>
          ) : null}
        </>
      )}

      {archive.length > 0 ? (
        <>
          <SectionHeader title="Earlier devotionals" />
          <ListGroup>
            {archive.map((item) => (
              <ListRow key={item.id} icon="book-outline" label={item.title} description={formatDay(item.publish_date)} onPress={() => setSelected(item)} />
            ))}
          </ListGroup>
        </>
      ) : null}
    </Screen>
  );
}
```

- [ ] **Step 2: Ministries and ministry sermons**

Replace `mobile/src/app/ministries.tsx` with:

```tsx
import { router } from 'expo-router';
import React from 'react';

import { ListGroup, ListRow, LoadingList, Screen, ScreenHeader } from '@/components/kit';
import { EmptyState } from '@/components/ui/empty-state';
import { useMinistries } from '@/hooks/use-api';

export default function MinistriesScreen() {
  const ministriesQuery = useMinistries();
  const ministries = ministriesQuery.data || [];

  return (
    <Screen>
      <ScreenHeader back title="Ministries" subtitle="Serve, grow and connect. Open a ministry to see its sermons." />

      {ministriesQuery.isLoading ? (
        <LoadingList />
      ) : ministries.length > 0 ? (
        <ListGroup>
          {ministries.map((ministry: any) => (
            <ListRow
              key={String(ministry?.id)}
              icon="sparkles-outline"
              label={ministry?.name || 'Ministry'}
              description={ministry?.description || 'No ministry description provided yet.'}
              accessibilityLabel={`View sermons from ${ministry?.name || 'this ministry'}`}
              onPress={() => router.push(`/ministries/${ministry?.id}` as never)}
            />
          ))}
        </ListGroup>
      ) : (
        <EmptyState icon="sparkles-outline" title="No ministries available right now" />
      )}
    </Screen>
  );
}
```

Replace `mobile/src/app/ministries/[id].tsx` with:

```tsx
import { useLocalSearchParams, router } from 'expo-router';
import React from 'react';

import { ListGroup, ListRow, LoadingList, Screen, ScreenHeader } from '@/components/kit';
import { EmptyState } from '@/components/ui/empty-state';
import { useMinistrySermons } from '@/hooks/use-api';

export default function MinistryDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const ministryId = params.id;
  const sermonsQuery = useMinistrySermons(ministryId);
  const sermons = sermonsQuery.data || [];

  return (
    <Screen>
      <ScreenHeader back eyebrow="Ministry" title="Sermons from this ministry" />

      {sermonsQuery.isLoading ? (
        <LoadingList />
      ) : sermons.length > 0 ? (
        <ListGroup>
          {sermons.map((sermon: any) => (
            <ListRow
              key={String(sermon?.id)}
              icon="play-outline"
              label={sermon?.title || 'Untitled sermon'}
              description={[sermon?.speaker, sermon?.description].filter(Boolean).join(' · ') || 'No description provided.'}
              onPress={() => router.push(`/sermons/${sermon?.id}` as never)}
            />
          ))}
        </ListGroup>
      ) : (
        <EmptyState icon="play-circle-outline" title="No sermons found for this ministry" />
      )}
    </Screen>
  );
}
```

- [ ] **Step 3: News post**

Replace `mobile/src/app/news/[id].tsx` with:

```tsx
import { useLocalSearchParams } from 'expo-router';
import React from 'react';

import { LoadingList, Screen, ScreenHeader } from '@/components/kit';
import { AppText } from '@/components/ui/app-text';
import { AppBadge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { useNewsPost } from '@/hooks/use-api';

const formatPublished = (value?: string) => {
  if (!value) return 'Published';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
};

export default function NewsDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const newsId = params.id;
  const newsQuery = useNewsPost(newsId);
  const post = newsQuery.data;

  return (
    <Screen>
      <ScreenHeader back eyebrow="News" title={post?.title || 'News'} />

      {newsQuery.isLoading ? (
        <LoadingList count={2} height={120} />
      ) : post ? (
        <>
          <AppBadge>{formatPublished(post?.published_at || post?.publishedAt)}</AppBadge>
          {post?.excerpt || post?.summary ? (
            <AppText variant="bodyStrong" tone="muted">
              {post?.excerpt || post?.summary}
            </AppText>
          ) : null}
          <AppText>{post?.content || post?.excerpt || post?.summary || 'No content available.'}</AppText>
        </>
      ) : (
        <EmptyState icon="newspaper-outline" title="Announcement not found" />
      )}
    </Screen>
  );
}
```

- [ ] **Step 4: About (with the spec's About links), FAQ, Privacy, Terms**

Replace `mobile/src/app/about.tsx` with:

```tsx
import { router } from 'expo-router';
import React from 'react';

import { ListGroup, ListRow, Screen, ScreenHeader, SectionHeader } from '@/components/kit';
import { AppText } from '@/components/ui/app-text';
import { AppCard } from '@/components/ui/card';

export default function AboutScreen() {
  return (
    <Screen>
      <ScreenHeader
        back
        eyebrow="About"
        title="About ANT PRESS"
        subtitle="Announcements, sermons, events, giving, prayer and member engagement in one place."
      />

      <AppCard>
        <AppText variant="bodyStrong">What the platform does</AppText>
        <AppText variant="small" tone="muted">
          ANT PRESS helps your team publish updates, manage events, share sermons, receive donations,
          track prayer requests, and keep members informed from web and mobile.
        </AppText>
      </AppCard>

      <AppCard>
        <AppText variant="bodyStrong">What you can do here</AppText>
        <AppText variant="small" tone="muted">
          Read announcements, explore ministries, watch sermons, search content, give, and stay connected.
        </AppText>
      </AppCard>

      <SectionHeader title="More" />
      <ListGroup>
        <ListRow icon="sparkles-outline" label="Ministries" onPress={() => router.push('/ministries' as never)} />
        <ListRow icon="mail-outline" label="Contact us" onPress={() => router.push('/contact' as never)} />
        <ListRow icon="help-circle-outline" label="FAQ" onPress={() => router.push('/faq' as never)} />
        <ListRow icon="shield-checkmark-outline" label="Privacy" onPress={() => router.push('/privacy' as never)} />
        <ListRow icon="document-text-outline" label="Terms" onPress={() => router.push('/terms' as never)} />
      </ListGroup>
    </Screen>
  );
}
```

Replace `mobile/src/app/faq.tsx` with:

```tsx
import React from 'react';

import { Screen, ScreenHeader } from '@/components/kit';
import { AppText } from '@/components/ui/app-text';
import { AppCard } from '@/components/ui/card';

const faqs = [
  {
    question: 'How do I make a donation?',
    answer: 'Open the donation flow from the dashboard, account area, or public donate screen and follow the payment steps.',
  },
  {
    question: 'Do I need an account to register for events?',
    answer: 'Yes. Event registration is tied to your ANT PRESS account so your activity and notifications can stay connected.',
  },
  {
    question: 'Where do sermons come from?',
    answer: 'Sermons are published from the same ANT PRESS admin system used on the website and appear here automatically.',
  },
];

export default function FaqScreen() {
  return (
    <Screen>
      <ScreenHeader back eyebrow="FAQ" title="Common questions" />

      {faqs.map((item) => (
        <AppCard key={item.question}>
          <AppText variant="bodyStrong" accessibilityRole="header">
            {item.question}
          </AppText>
          <AppText variant="small" tone="muted">
            {item.answer}
          </AppText>
        </AppCard>
      ))}
    </Screen>
  );
}
```

Replace `mobile/src/app/privacy.tsx` with:

```tsx
import React from 'react';

import { Screen, ScreenHeader } from '@/components/kit';
import { AppText } from '@/components/ui/app-text';
import { AppCard } from '@/components/ui/card';

export default function PrivacyScreen() {
  return (
    <Screen>
      <ScreenHeader back eyebrow="Privacy" title="Privacy overview" />

      <AppCard>
        <AppText variant="bodyStrong">Your data</AppText>
        <AppText variant="small" tone="muted">
          ANT PRESS stores the account, giving, prayer, and notification data needed to provide the platform experience across web and mobile.
        </AppText>
      </AppCard>

      <AppCard>
        <AppText variant="bodyStrong">How it is used</AppText>
        <AppText variant="small" tone="muted">
          We use your information to authenticate you, support participation in events, power giving and communication flows, and help admins manage the platform responsibly.
        </AppText>
      </AppCard>
    </Screen>
  );
}
```

Replace `mobile/src/app/terms.tsx` with:

```tsx
import React from 'react';

import { Screen, ScreenHeader } from '@/components/kit';
import { AppText } from '@/components/ui/app-text';
import { AppCard } from '@/components/ui/card';

export default function TermsScreen() {
  return (
    <Screen>
      <ScreenHeader back eyebrow="Terms" title="Terms and agreement" />

      <AppCard>
        <AppText variant="bodyStrong">Platform use</AppText>
        <AppText variant="small" tone="muted">
          By using ANT PRESS, members and admins agree to use the platform responsibly for church communications, events, giving, and engagement.
        </AppText>
      </AppCard>

      <AppCard>
        <AppText variant="bodyStrong">Account responsibility</AppText>
        <AppText variant="small" tone="muted">
          Keep your account details accurate, protect your credentials, and use admin access only when it is appropriate to your role.
        </AppText>
      </AppCard>
    </Screen>
  );
}
```

- [ ] **Step 5: Contact**

Replace `mobile/src/app/contact.tsx` with:

```tsx
import React from 'react';
import { useForm } from 'react-hook-form';

import { FormMessage, FormTextField, Screen, ScreenHeader } from '@/components/kit';
import { AppText } from '@/components/ui/app-text';
import { AppButton } from '@/components/ui/button';
import { AppCard } from '@/components/ui/card';
import { getApiErrorMessage, useSubmitContactMessage } from '@/hooks/use-api';

type ContactFormValues = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

export default function ContactScreen() {
  const submitMutation = useSubmitContactMessage();
  const { control, handleSubmit, reset } = useForm<ContactFormValues>({
    defaultValues: {
      name: '',
      email: '',
      subject: '',
      message: '',
    },
  });

  const onSubmit = async (values: ContactFormValues) => {
    try {
      await submitMutation.mutateAsync(values);
      reset();
    } catch {
      // Inline error handles message.
    }
  };

  const message = submitMutation.isSuccess
    ? 'Message sent successfully.'
    : submitMutation.isError
      ? getApiErrorMessage(submitMutation.error, 'Failed to send message.')
      : '';

  return (
    <Screen>
      <ScreenHeader back eyebrow="Contact" title="Reach the ANT PRESS team" />

      <AppCard>
        <AppText variant="bodyStrong">Send a message</AppText>
        <FormTextField control={control} name="name" label="Name" placeholder="Your name" />
        <FormTextField
          control={control}
          name="email"
          label="Email"
          placeholder="Your email address"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <FormTextField control={control} name="subject" label="Subject" placeholder="Message subject" />
        <FormTextField control={control} name="message" label="Message" placeholder="Write your message" multiline />
        <AppButton label="Send message" onPress={handleSubmit(onSubmit)} />
        {message ? <FormMessage tone={submitMutation.isSuccess ? 'success' : 'danger'}>{message}</FormMessage> : null}
      </AppCard>
    </Screen>
  );
}
```

(The email keyboard and no auto-capitalise only change the on-screen keyboard; the submitted value is unchanged.)

- [ ] **Step 6: Scans**

```bash
cd mobile
F='src/app/daily-devotional.tsx src/app/ministries.tsx src/app/ministries/[id].tsx src/app/news/[id].tsx src/app/about.tsx src/app/contact.tsx src/app/faq.tsx src/app/privacy.tsx src/app/terms.tsx'
for f in $F; do grep -nE "#[0-9A-Fa-f]{3,8}\b|rgba?\(" "$f"; grep -nE "brand-ui|themed-text|themed-view|hooks/use-theme'|constants/theme'" "$f"; done
```
Expected: no output.

- [ ] **Step 7: Lint and type-check**

Run: `cd mobile && npm run -s lint && npx tsc --noEmit && echo mobile-ok`
Expected: `mobile-ok`.

- [ ] **Step 8: By-eye check (user, light and dark)**

Daily devotional:
- The title is in the header, the date is underneath, the scripture is serif with a gold rule, the reflection is in a card, and the prayer card (when present) has a gold "PRAYER" label.
- Tapping an earlier devotional shows it; back returns to today first, then leaves the screen.

Ministries:
- List rows with descriptions; a row opens that ministry's sermons; a sermon row opens the sermon.

News post:
- Back, a date badge, the summary in muted bold, then the full text.

About:
- Two cards and the More list (Ministries, Contact, FAQ, Privacy, Terms); each opens.

FAQ, Privacy, Terms:
- Readable cards with back buttons.

Contact:
- Labelled fields. Sending shows the green "Message sent successfully." panel and clears the form; a failure shows the red panel.

- [ ] **Step 9: Commit**

```bash
git add mobile/src/app/daily-devotional.tsx mobile/src/app/ministries.tsx mobile/src/app/ministries mobile/src/app/news mobile/src/app/about.tsx mobile/src/app/contact.tsx mobile/src/app/faq.tsx mobile/src/app/privacy.tsx mobile/src/app/terms.tsx
git commit -m "feat(mobile): devotional, ministries, news post and information screens on tokens

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Admin shell and every mobile admin screen

All admin screens sit inside `AdminShell`, so they move together in this one task (Ruling 3). Commit only at the end (Step 24), so no commit has a token shell around a legacy screen, or the other way round. Structure stays the same (spec §3.3, "Mobile admin screens: restyled in 8d … with structure unchanged"). The only regrouping is that the dashboard's quick actions are listed under the 8c group names.

**Files:**
- Rewrite: `mobile/src/components/admin-shell.tsx`
- Rewrite: `mobile/src/app/admin.tsx`, `admin-analytics.tsx`, `admin-announcements.tsx`, `admin-attendance.tsx`, `admin-audit.tsx`, `admin-devotionals.tsx`, `admin-donations.tsx`, `admin-events.tsx`, `admin-events/[id].tsx`, `admin-gallery.tsx`, `admin-gallery/[id].tsx`, `admin-live.tsx`, `admin-news.tsx`, `admin-news/[id].tsx`, `admin-series.tsx`, `admin-sermons.tsx`, `admin-sermons/[id].tsx`, `admin-settings.tsx`, `admin-users.tsx`

**Interfaces:**
- Consumes: the whole kit; `AppButton` (`size="sm"` for buttons inside rows); every admin hook already imported by these screens.
- Produces: `AdminShell({ children, activeTab })`, the same props as today. `activeTab` keeps the type `'/admin' | '/admin-users' | '/admin-sermons' | '/admin-events' | '/admin-donations' | '/admin-settings' | '/admin-news' | '/admin-audit'`.

**Rules for every admin screen in this task:**
- Copy each screen's hooks, state, handlers, `Alert.alert` calls, `!busy && …` guards and `router` calls exactly as shown. Only JSX and styles change.
- "Access required" views:
  - screens that returned `null` still return `null`
  - screens that rendered `BrandScreen` + `BrandHero` now render `Screen` + `ScreenHeader back eyebrow="Admin" title="Admin access required" subtitle="<the old description>"`
- Destructive actions (delete, mark failed, end live) use `variant="danger"`. Neutral ones (edit, cancel, undo) use `variant="secondary"`. The primary action of a form uses the default `primary`.

- [ ] **Step 1: Action inventory (Review Focus 4)**

Before editing, list every admin action so Step 23 can prove none was lost:
```bash
cd mobile && grep -nE "mutate\(|mutateAsync\(|Alert\.alert\(|router\.(push|replace|back)\(|pickImage|pickPhotos|uploadPhotos|confirmDelete|onDelete|onPublish|startEdit|resetForm|addGuest|checkInMember|undo\(|onStart|onEnd|onSend|onCreate|onSave|clearSession" src/app/admin*.tsx "src/app/admin-events/[id].tsx" "src/app/admin-gallery/[id].tsx" "src/app/admin-news/[id].tsx" "src/app/admin-sermons/[id].tsx" src/components/admin-shell.tsx | sed -E 's/^([^:]+):[0-9]+:/\1: /' | sed -E 's/[[:space:]]+/ /g' | sort > ../p8d-admin-actions-before.txt
wc -l ../p8d-admin-actions-before.txt
```
The file is written next to `mobile/`, in the repo root. It is a working note: do not commit it, and delete it in Step 23.

- [ ] **Step 2: Admin shell**

Replace `mobile/src/components/admin-shell.tsx` with:

```tsx
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { MAX_CONTENT_WIDTH, Space } from '@/constants/tokens';
import { useAppTheme } from '@/hooks/use-app-theme';

const navItems = [
  { icon: 'grid-outline', label: 'Dashboard', href: '/admin' },
  { icon: 'people-outline', label: 'Members', href: '/admin-users' },
  { icon: 'play-circle-outline', label: 'Sermons', href: '/admin-sermons' },
  { icon: 'calendar-outline', label: 'Events', href: '/admin-events' },
  { icon: 'cash-outline', label: 'Finance', href: '/admin-donations' },
  { icon: 'settings-outline', label: 'Settings', href: '/admin-settings' },
] as const;

type AdminTabHref =
  | (typeof navItems)[number]['href']
  | '/admin-news'
  | '/admin-audit';

// Frame for the mobile admin screens: scrolling content above a docked six-item admin bar.
export function AdminShell({
  children,
  activeTab,
}: {
  children: React.ReactNode;
  activeTab: AdminTabHref;
}) {
  const { colors } = useAppTheme();

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <View style={styles.content}>{children}</View>
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={[styles.nav, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <View accessibilityRole="tablist" style={styles.navRow}>
          {navItems.map((item) => {
            const active = item.href === activeTab;
            const color = active ? colors.primary : colors.muted;

            return (
              <Pressable
                key={item.href}
                onPress={() => router.push(item.href as never)}
                accessibilityRole="tab"
                accessibilityLabel={item.label}
                accessibilityState={{ selected: active }}
                style={styles.navItem}>
                <Ionicons name={item.icon} size={20} color={color} />
                <AppText
                  variant="caption"
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.8}
                  style={{ color }}>
                  {item.label}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </SafeAreaView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  content: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    padding: Space.md,
    paddingBottom: Space.xl,
    gap: Space.md,
  },
  nav: { borderTopWidth: StyleSheet.hairlineWidth },
  navRow: { flexDirection: 'row', paddingHorizontal: Space.xs },
  navItem: { flex: 1, minHeight: 56, alignItems: 'center', justifyContent: 'center', gap: 2, paddingHorizontal: 2 },
});
```

The bar is docked instead of floating; the six items, their order and targets are unchanged.

- [ ] **Step 3: Dashboard**

Replace `mobile/src/app/admin.tsx` with:

```tsx
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AdminShell } from '@/components/admin-shell';
import {
  Avatar,
  type IconName,
  ListGroup,
  ListRow,
  Screen,
  ScreenHeader,
  SectionHeader,
  SignInPrompt,
  StatGrid,
  StatTile,
} from '@/components/kit';
import { AppText } from '@/components/ui/app-text';
import { AppBadge } from '@/components/ui/badge';
import { AppButton } from '@/components/ui/button';
import { AppCard } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Space } from '@/constants/tokens';
import {
  useAdminDashboardOverview,
  useAdminDonations,
  useAdminPrayerRequests,
  useAdminRecentActivities,
} from '@/hooks/use-api';
import { formatCedis } from '@/lib/currency';
import { useAuthStore } from '@/store/auth';

// The same twelve shortcuts as before, grouped like the web admin sidebar (spec §3.3).
const ACTION_GROUPS: { title: string; items: { icon: IconName; label: string; href: string }[] }[] = [
  {
    title: 'Content',
    items: [
      { icon: 'cloud-upload-outline', label: 'Upload sermon', href: '/admin-sermons' },
      { icon: 'albums-outline', label: 'Series', href: '/admin-series' },
      { icon: 'book-outline', label: 'Devotionals', href: '/admin-devotionals' },
      { icon: 'images-outline', label: 'Gallery', href: '/admin-gallery' },
      { icon: 'megaphone-outline', label: 'Announcement', href: '/admin-announcements' },
      { icon: 'radio-outline', label: 'Livestream', href: '/admin-live' },
    ],
  },
  {
    title: 'Church life',
    items: [
      { icon: 'add-circle-outline', label: 'New event', href: '/admin-events' },
      { icon: 'checkmark-done-outline', label: 'Attendance', href: '/admin-attendance' },
    ],
  },
  {
    title: 'People and giving',
    items: [
      { icon: 'person-add-outline', label: 'Add member', href: '/admin-users' },
      { icon: 'cash-outline', label: 'View giving', href: '/admin-donations' },
    ],
  },
  {
    title: 'Overview and settings',
    items: [
      { icon: 'bar-chart-outline', label: 'Analytics', href: '/admin-analytics' },
      { icon: 'settings-outline', label: 'Settings', href: '/admin-settings' },
    ],
  },
];

export default function AdminScreen() {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'admin';

  const overviewQuery = useAdminDashboardOverview(isAdmin);
  const activitiesQuery = useAdminRecentActivities(isAdmin);
  const donationsQuery = useAdminDonations(isAdmin);
  const prayersQuery = useAdminPrayerRequests(isAdmin);

  if (!user) {
    return (
      <Screen>
        <ScreenHeader eyebrow="Admin panel" title="Dashboard" />
        <SignInPrompt
          icon="shield-outline"
          title="Sign in required"
          message="Sign in with your ANT PRESS admin account to manage the platform from mobile."
          label="Go to sign in"
          onSignIn={() => router.replace('/login')}
        />
      </Screen>
    );
  }

  if (!isAdmin) {
    return (
      <Screen>
        <ScreenHeader eyebrow="Admin panel" title="Dashboard" />
        <EmptyState
          icon="lock-closed-outline"
          title="Restricted access"
          message="This mobile console is available only to admin accounts."
          action={<AppButton label="Back to account" onPress={() => router.replace('/account')} />}
        />
      </Screen>
    );
  }

  const overview = overviewQuery.data;
  const activities = activitiesQuery.data || [];
  const donations = donationsQuery.data || [];
  const prayers = prayersQuery.data || [];
  const displayName = [user.first_name, user.last_name].filter(Boolean).join(' ');
  const initials = (displayName || user.email || 'A')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const totalUsers = toFiniteNumber(overview?.users?.total);
  const totalRevenue = toFiniteNumber(overview?.donations?.total_amount);
  const totalSermons = toFiniteNumber(overview?.content?.sermons);
  const totalEvents = toFiniteNumber(overview?.events?.total);
  const pendingPrayerRequests = toFiniteNumber(overview?.prayers?.pending_count);

  const pendingItems = [
    { label: 'Pending donations', count: donations.filter((item: any) => ['pending', 'processing'].includes(String(item?.status || '').toLowerCase())).length, status: 'warning' as const },
    { label: 'Unread prayer requests', count: pendingPrayerRequests || prayers.filter((item: any) => String(item?.status || '').toLowerCase() === 'pending').length, status: 'alert' as const },
    { label: 'Recent audit activity', count: activities.length, status: 'info' as const },
    { label: 'Published events', count: totalEvents, status: 'info' as const },
  ];

  return (
    <AdminShell activeTab="/admin">
      <ScreenHeader eyebrow="Admin panel" title="Dashboard" />

      <AppCard style={styles.account}>
        <Avatar initials={initials} tone="gold" size={44} />
        <View style={styles.flex}>
          <AppText variant="bodyStrong" numberOfLines={1}>
            {displayName || user.email || 'Admin account'}
          </AppText>
          <AppText variant="small" tone="muted">
            {`${String(user.role || 'admin').replace(/^\w/, (m) => m.toUpperCase())} • ANT PRESS`}
          </AppText>
        </View>
        <AppButton label="Sign out" variant="ghost" size="sm" onPress={() => useAuthStore.getState().clearSession()} />
      </AppCard>

      <SectionHeader title="Overview" />
      <StatGrid>
        <StatTile label="Total members" value={formatMetric(totalUsers)} icon="people-outline" />
        <StatTile label="Monthly giving" value={formatCurrency(totalRevenue)} icon="cash-outline" />
        <StatTile label="Sermons" value={formatMetric(totalSermons)} icon="book-outline" />
        <StatTile label="Events" value={formatMetric(totalEvents)} icon="calendar-outline" />
      </StatGrid>

      <SectionHeader title="Needs attention" />
      <ListGroup>
        {pendingItems.map((item) => (
          <ListRow
            key={item.label}
            label={item.label}
            trailing={
              <AppBadge tone={item.status === 'alert' ? 'danger' : item.status === 'warning' ? 'warning' : 'neutral'}>
                {String(item.count)}
              </AppBadge>
            }
          />
        ))}
      </ListGroup>

      {ACTION_GROUPS.map((group) => (
        <React.Fragment key={group.title}>
          <SectionHeader title={group.title} />
          <ListGroup>
            {group.items.map((item) => (
              <ListRow key={item.label} icon={item.icon} label={item.label} onPress={() => router.push(item.href as never)} />
            ))}
          </ListGroup>
        </React.Fragment>
      ))}

      <SectionHeader title="Recent activity" actionLabel="View all" onAction={() => router.push('/admin-audit' as never)} />
      {activities.length === 0 ? (
        <EmptyState icon="pulse-outline" title="No recent activity yet" />
      ) : (
        <ListGroup>
          {activities.slice(0, 5).map((item: any, index: number) => (
            <ListRow
              key={`${item?.id ?? index}`}
              icon="pulse-outline"
              label={item?.description || item?.message || item?.action || 'Platform activity'}
              description={formatWhen(item?.created_at || item?.createdAt || item?.timestamp)}
            />
          ))}
        </ListGroup>
      )}
    </AdminShell>
  );
}

const formatWhen = (value: unknown) => {
  if (!value) return 'Now';
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
};

const formatMetric = (value: unknown) => {
  const number = toFiniteNumber(value);
  if (number !== null) return number.toLocaleString();
  if (typeof value === 'string' && value.trim()) return value;
  return '0';
};

const formatCurrency = (value: unknown) => {
  return formatCedis(toFiniteNumber(value));
};

const toFiniteNumber = (value: unknown) => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return 0;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

const styles = StyleSheet.create({
  account: { flexDirection: 'row', alignItems: 'center', gap: Space.sm + 4 },
  flex: { flex: 1, gap: 2 },
});
```

Removed (Ruling 9): the fake "15" bell, the non-tappable bell, the fixed "A"/"PA" avatars (now real initials), and the fake trend figures. "Sermon Views" was really the sermon count, so it is now labelled "Sermons". Sign out keeps its exact behaviour (`clearSession()` only, no navigation).

- [ ] **Step 4: Analytics**

Replace `mobile/src/app/admin-analytics.tsx` with:

```tsx
import React from 'react';

import { AdminShell } from '@/components/admin-shell';
import { ListGroup, ListRow, ScreenHeader, SectionHeader, StatGrid, StatTile } from '@/components/kit';
import {
  useAdminDashboardContentStats,
  useAdminDashboardEngagementStats,
  useAdminDashboardOverview,
} from '@/hooks/use-api';
import { formatCedis } from '@/lib/currency';
import { useAuthStore } from '@/store/auth';

export default function AdminAnalyticsScreen() {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'admin';
  const overviewQuery = useAdminDashboardOverview(isAdmin);
  const contentQuery = useAdminDashboardContentStats(isAdmin);
  const engagementQuery = useAdminDashboardEngagementStats(isAdmin);

  if (!user || !isAdmin) {
    return null;
  }

  const overview = overviewQuery.data;
  const content = contentQuery.data;
  const engagement = engagementQuery.data;
  const activeMembers = toFiniteNumber(overview?.users?.members || overview?.users?.total);
  const sermonCount = toFiniteNumber(overview?.content?.sermons);
  const registrationsLast30Days = toFiniteNumber(engagement?.registrations_last_30_days);
  const totalGiving = toFiniteNumber(overview?.donations?.total_amount);
  const topEventsCount = Array.isArray(content?.top_events_by_registrations)
    ? content.top_events_by_registrations.length
    : 0;
  const donationMixCount = Array.isArray(engagement?.donations_by_type_last_30_days)
    ? engagement.donations_by_type_last_30_days.length
    : 0;
  const adminActions = toFiniteNumber(engagement?.admin_actions_last_30_days);
  const unreadPrayerLoad = toFiniteNumber(overview?.prayers?.pending_count);

  return (
    <AdminShell activeTab="/admin">
      <ScreenHeader back eyebrow="Admin" title="Analytics" />

      <StatGrid>
        <StatTile label="Active members" value={String(activeMembers)} icon="people-outline" />
        <StatTile label="Sermon library" value={String(sermonCount)} icon="play-circle-outline" />
        <StatTile label="Event RSVPs" value={String(registrationsLast30Days)} icon="calendar-outline" />
        <StatTile label="Total giving" value={formatCedis(totalGiving)} icon="cash-outline" />
      </StatGrid>

      <SectionHeader title="Content performance" />
      <ListGroup>
        <ListRow label="Top events by registrations" value={String(topEventsCount)} />
        <ListRow label="Donation mix entries" value={String(donationMixCount)} />
      </ListGroup>

      <SectionHeader title="Engagement" />
      <ListGroup>
        <ListRow label="Admin actions" value={String(adminActions)} />
        <ListRow label="Registrations (30d)" value={String(registrationsLast30Days)} />
        <ListRow label="Unread prayer load" value={String(unreadPrayerLoad)} />
      </ListGroup>
    </AdminShell>
  );
}

const toFiniteNumber = (value: unknown) => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === 'string') {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};
```

- [ ] **Step 5: Announcements**

Replace `mobile/src/app/admin-announcements.tsx` with:

```tsx
import React from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { AdminShell } from '@/components/admin-shell';
import { ChipGroup, ScreenHeader, SectionHeader } from '@/components/kit';
import { AppText } from '@/components/ui/app-text';
import { AppBadge } from '@/components/ui/badge';
import { AppButton } from '@/components/ui/button';
import { AppCard } from '@/components/ui/card';
import { TextField } from '@/components/ui/text-field';
import { Space } from '@/constants/tokens';
import {
  getApiErrorMessage,
  useCheckInEvents,
  useGroups,
  useSendAnnouncement,
  useSentAnnouncements,
  type AnnouncementInput,
} from '@/hooks/use-api';
import { useAuthStore } from '@/store/auth';

type Audience = 'everyone' | 'group' | 'event';

const AUDIENCES: { value: Audience; label: string }[] = [
  { value: 'everyone', label: 'Everyone' },
  { value: 'group', label: 'A group' },
  { value: 'event', label: 'An event' },
];

export default function AdminAnnouncementsScreen() {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'admin';
  const groupsQuery = useGroups();
  const eventsQuery = useCheckInEvents(isAdmin);
  const sentQuery = useSentAnnouncements(isAdmin);
  const sendMutation = useSendAnnouncement();
  const [audience, setAudience] = React.useState<Audience>('everyone');
  const [targetId, setTargetId] = React.useState<number | undefined>();
  const [title, setTitle] = React.useState('');
  const [message, setMessage] = React.useState('');

  if (!user || !isAdmin) return null;

  const targets =
    audience === 'group'
      ? (groupsQuery.data ?? []).map((g) => ({ id: g.id, label: g.name }))
      : audience === 'event'
        ? (eventsQuery.data ?? []).map((e) => ({ id: e.id, label: e.name }))
        : [];

  const onSend = () => {
    if (!title.trim() || !message.trim()) {
      Alert.alert('Missing details', 'Add a title and a message.');
      return;
    }
    if (audience !== 'everyone' && !targetId) {
      Alert.alert('Choose who to send to', audience === 'group' ? 'Pick a group.' : 'Pick an event.');
      return;
    }
    const base = { title: title.trim(), message: message.trim() };
    const input: AnnouncementInput =
      audience === 'group'
        ? { ...base, audience, groupId: targetId as number }
        : audience === 'event'
          ? { ...base, audience, eventId: targetId as number }
          : { ...base, audience: 'everyone' };
    sendMutation.mutate(input, {
      onSuccess: (data) => {
        Alert.alert('Sent', `Sent to ${data?.recipient_count ?? 0} people.`);
        setTitle('');
        setMessage('');
      },
      onError: (error) => Alert.alert('Could not send', getApiErrorMessage(error, 'Please try again.')),
    });
  };

  const sent = Array.isArray(sentQuery.data) ? sentQuery.data : [];

  return (
    <AdminShell activeTab="/admin-news">
      <ScreenHeader back eyebrow="Admin" title="Send announcement" />

      <AppCard>
        <AppText variant="small" style={styles.bold}>
          Send to
        </AppText>
        <ChipGroup
          options={AUDIENCES}
          value={audience}
          onChange={(value) => {
            setAudience(value);
            setTargetId(undefined);
          }}
        />
        {targets.length > 0 ? (
          <ChipGroup
            options={targets.map((t) => ({ value: t.id as number | undefined, label: t.label }))}
            value={targetId}
            onChange={(value) => setTargetId(value)}
          />
        ) : audience !== 'everyone' ? (
          <AppText variant="small" tone="muted">
            {audience === 'group' ? 'No groups yet.' : 'No events in the last or next two weeks.'}
          </AppText>
        ) : null}
        <TextField label="Title" value={title} onChangeText={setTitle} placeholder="Title" maxLength={255} />
        <TextField label="Message" value={message} onChangeText={setMessage} placeholder="Message" maxLength={2000} multiline />
        <AppButton label="Send announcement" onPress={() => !sendMutation.isPending && onSend()} />
      </AppCard>

      {sent.length > 0 ? <SectionHeader title="Sent" /> : null}
      {sent.map((item) => (
        <AppCard key={item.id}>
          <View style={styles.row}>
            <AppText variant="bodyStrong" style={styles.flex} numberOfLines={1}>
              {item.title}
            </AppText>
            <AppBadge>{`${item.recipient_count} people`}</AppBadge>
          </View>
          <AppText variant="small" numberOfLines={2}>
            {item.message}
          </AppText>
          <AppText variant="caption" tone="muted">
            {new Date(item.created_at).toLocaleString()} · {item.push_count} phones
          </AppText>
        </AppCard>
      ))}
    </AdminShell>
  );
}

const styles = StyleSheet.create({
  bold: { fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Space.sm },
  flex: { flex: 1 },
});
```

- [ ] **Step 6: Attendance**

Replace `mobile/src/app/admin-attendance.tsx` with:

```tsx
import React from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';

import { AdminShell } from '@/components/admin-shell';
import { ErrorState, FormMessage, ListGroup, ListRow, LoadingList, ScreenHeader } from '@/components/kit';
import { AppText } from '@/components/ui/app-text';
import { AppBadge } from '@/components/ui/badge';
import { AppButton } from '@/components/ui/button';
import { AppCard } from '@/components/ui/card';
import { TextField } from '@/components/ui/text-field';
import { MIN_TOUCH, Space } from '@/constants/tokens';
import {
  getApiErrorMessage,
  useAttendanceSummary,
  useCheckInEvents,
  useCheckIn,
  useEventAttendance,
  useMemberSearch,
  useUndoCheckIn,
} from '@/hooks/use-api';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useAuthStore } from '@/store/auth';

const fullName = (person: { first_name: string; last_name: string }) =>
  `${person.first_name || ''} ${person.last_name || ''}`.trim() || 'Member';

export default function AdminAttendanceScreen() {
  const { colors } = useAppTheme();
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'admin';
  const [selectedEventId, setSelectedEventId] = React.useState<number | undefined>();
  const [searchInput, setSearchInput] = React.useState('');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [guestName, setGuestName] = React.useState('');

  const eventsQuery = useCheckInEvents(isAdmin);
  const summaryQuery = useAttendanceSummary(isAdmin && !selectedEventId);
  const sheetQuery = useEventAttendance(isAdmin ? selectedEventId : undefined);
  const searchQuery = useMemberSearch(searchTerm, isAdmin && Boolean(selectedEventId));
  const checkInMutation = useCheckIn(selectedEventId);
  const undoMutation = useUndoCheckIn();

  React.useEffect(() => {
    const timer = setTimeout(() => setSearchTerm(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  if (!user || !isAdmin) return null;

  const busy = checkInMutation.isPending || undoMutation.isPending;
  const showError = (title: string) => (error: unknown) => Alert.alert(title, getApiErrorMessage(error, 'Please try again.'));
  const checkInMember = (userId: number) => checkInMutation.mutate({ userId }, { onError: showError('Could not check in') });
  const undo = (recordId: number) => undoMutation.mutate(recordId, { onError: showError('Could not undo') });
  const addGuest = () => {
    const name = guestName.trim();
    if (!name) return;
    checkInMutation.mutate({ guestName: name }, { onSuccess: () => setGuestName(''), onError: showError('Could not add guest') });
  };

  const openEvent = (eventId: number) => {
    setSelectedEventId(eventId);
    setSearchInput('');
    setGuestName('');
  };

  const personRow = (key: string, name: string, action: React.ReactNode) => (
    <View key={key} style={[styles.row, { borderTopColor: colors.border }]}>
      <AppText variant="small" style={styles.flex} numberOfLines={1}>
        {name}
      </AppText>
      {action}
    </View>
  );

  if (!selectedEventId) {
    const events = Array.isArray(eventsQuery.data) ? eventsQuery.data : [];
    const summary = Array.isArray(summaryQuery.data) ? summaryQuery.data : [];

    return (
      <AdminShell activeTab="/admin-events">
        <ScreenHeader back eyebrow="Admin" title="Attendance" subtitle="Choose an event to check people in" />

        {eventsQuery.isLoading ? <LoadingList count={2} height={56} /> : null}
        {!eventsQuery.isLoading && events.length === 0 ? (
          <AppText variant="small" tone="muted">
            No events in the last or next two weeks.
          </AppText>
        ) : null}
        {events.length > 0 ? (
          <ListGroup>
            {events.map((event) => (
              <ListRow
                key={String(event.id)}
                icon="calendar-outline"
                label={event?.name || 'Event'}
                description={event?.event_date ? new Date(event.event_date).toLocaleString() : 'Date TBD'}
                onPress={() => openEvent(Number(event.id))}
              />
            ))}
          </ListGroup>
        ) : null}

        {summary.length > 0 ? (
          <AppCard>
            <AppText variant="bodyStrong">Recent headcounts</AppText>
            {summary.map((row) =>
              personRow(String(row.event_id), row.name, <AppBadge>{`${row.total} (${row.guests} guests)`}</AppBadge>)
            )}
          </AppCard>
        ) : null}
      </AdminShell>
    );
  }

  const sheet = sheetQuery.data;
  const checkedInIds = new Set([
    ...(sheet?.registered ?? []).filter((p) => p.checked_in).map((p) => p.user_id),
    ...(sheet?.walk_in_members ?? []).map((p) => p.user_id),
  ]);
  const cancelled = sheet?.event.status === 'cancelled';
  const searchResults = Array.isArray(searchQuery.data) ? searchQuery.data : [];

  return (
    <AdminShell activeTab="/admin-events">
      <ScreenHeader onBack={() => setSelectedEventId(undefined)} eyebrow="Check-in" title={sheet?.event.name || 'Check-in'} />

      {sheetQuery.isLoading ? (
        <LoadingList count={3} height={72} />
      ) : sheetQuery.isError || !sheet ? (
        <ErrorState title="Could not load this event" onRetry={() => sheetQuery.refetch()} />
      ) : (
        <>
          <View style={styles.badges}>
            <AppBadge tone="success">{`${sheet.totals.total} present`}</AppBadge>
            <AppBadge>{`${sheet.totals.checked_in_members} members`}</AppBadge>
            <AppBadge>{`${sheet.totals.guests} guests`}</AppBadge>
            <AppBadge>{`${sheet.totals.registered} registered`}</AppBadge>
          </View>
          {cancelled ? <FormMessage tone="danger">This event was cancelled; check-in is closed.</FormMessage> : null}

          <AppCard>
            <AppText variant="bodyStrong">{`Registered (${sheet.registered.length})`}</AppText>
            {sheet.registered.length === 0 ? (
              <AppText variant="small" tone="muted">
                Nobody registered for this event.
              </AppText>
            ) : (
              sheet.registered.map((person) =>
                personRow(
                  String(person.user_id),
                  fullName(person),
                  person.checked_in && person.record_id ? (
                    <AppButton label="Undo" size="sm" variant="secondary" onPress={() => !busy && undo(person.record_id as number)} />
                  ) : (
                    <AppButton label="Check in" size="sm" onPress={() => !busy && !cancelled && checkInMember(person.user_id)} />
                  )
                )
              )
            )}
          </AppCard>

          {!cancelled ? (
            <AppCard>
              <AppText variant="bodyStrong">Add someone</AppText>
              <TextField
                label="Find a member"
                value={searchInput}
                onChangeText={setSearchInput}
                placeholder="Name or email"
                autoCapitalize="none"
              />
              {searchTerm.trim().length >= 2 ? (
                searchQuery.isFetching ? (
                  <ActivityIndicator color={colors.primary} />
                ) : searchResults.length === 0 ? (
                  <AppText variant="small" tone="muted">
                    No members match.
                  </AppText>
                ) : (
                  searchResults.map((member) => {
                    const already = checkedInIds.has(member.id);
                    return personRow(
                      String(member.id),
                      fullName(member),
                      <AppButton
                        label={already ? 'Checked in' : 'Check in'}
                        size="sm"
                        variant={already ? 'secondary' : 'primary'}
                        onPress={() => !already && !busy && checkInMember(member.id)}
                      />
                    );
                  })
                )
              ) : null}

              <TextField
                label="Walk-in guest"
                value={guestName}
                onChangeText={setGuestName}
                placeholder="Guest's name"
                maxLength={255}
              />
              <AppButton label="Add guest" variant="secondary" onPress={() => !busy && addGuest()} />
            </AppCard>
          ) : null}

          <AppCard>
            <AppText variant="bodyStrong">{`Walk-ins (${sheet.walk_in_members.length + sheet.guests.length})`}</AppText>
            {sheet.walk_in_members.map((person) =>
              personRow(
                `m-${person.record_id}`,
                `${fullName(person)} · member`,
                <AppButton label="Undo" size="sm" variant="secondary" onPress={() => !busy && undo(person.record_id)} />
              )
            )}
            {sheet.guests.map((guest) =>
              personRow(
                `g-${guest.record_id}`,
                `${guest.guest_name} · guest`,
                <AppButton label="Undo" size="sm" variant="secondary" onPress={() => !busy && undo(guest.record_id)} />
              )
            )}
          </AppCard>
        </>
      )}
    </AdminShell>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.sm,
    minHeight: MIN_TOUCH + 8,
    paddingTop: Space.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  flex: { flex: 1 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.sm },
});
```

This file no longer imports `router`: the list view's back button is `ScreenHeader back`, which calls `router.back()` itself, exactly as the old header did.

- [ ] **Step 7: Audit log**

Replace `mobile/src/app/admin-audit.tsx` with:

```tsx
import React from 'react';

import { AdminShell } from '@/components/admin-shell';
import { ListGroup, ListRow, LoadingList, Screen, ScreenHeader } from '@/components/kit';
import { AppBadge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { useAuditLogs } from '@/hooks/use-api';
import { useAuthStore } from '@/store/auth';

export default function AdminAuditScreen() {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'admin';
  const logsQuery = useAuditLogs(isAdmin);
  const logs = logsQuery.data || [];

  if (!user || !isAdmin) {
    return (
      <Screen>
        <ScreenHeader
          back
          eyebrow="Audit log"
          title="Admin access required"
          subtitle="Sign in with an admin account to review system activity from mobile."
        />
      </Screen>
    );
  }

  return (
    <AdminShell activeTab="/admin-audit">
      <ScreenHeader
        back
        eyebrow="Admin"
        title="Activity log"
        subtitle="Recent admin activity across settings, content, donations and users."
      />

      {logsQuery.isLoading ? (
        <LoadingList count={4} height={64} />
      ) : logs.length > 0 ? (
        <ListGroup>
          {logs.map((log: any) => (
            <ListRow
              key={String(log?.id)}
              label={log?.summary || 'Audit entry'}
              description={[log?.actor_name || log?.actor_email || 'System', log?.created_at || log?.createdAt || ''].filter(Boolean).join(' · ')}
              trailing={<AppBadge>{String(log?.entity_type || log?.entityType || 'audit')}</AppBadge>}
            />
          ))}
        </ListGroup>
      ) : (
        <EmptyState icon="pulse-outline" title="No audit activity recorded yet" />
      )}
    </AdminShell>
  );
}
```

- [ ] **Step 8: Devotionals**

Replace `mobile/src/app/admin-devotionals.tsx` with:

```tsx
import React from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { AdminShell } from '@/components/admin-shell';
import { ScreenHeader, statusTone } from '@/components/kit';
import { AppText } from '@/components/ui/app-text';
import { AppBadge } from '@/components/ui/badge';
import { AppButton } from '@/components/ui/button';
import { AppCard } from '@/components/ui/card';
import { TextField } from '@/components/ui/text-field';
import { Space } from '@/constants/tokens';
import {
  getApiErrorMessage,
  useAdminDevotionals,
  useDeleteDevotional,
  usePublishDevotional,
  useSaveDevotional,
  type Devotional,
  type DevotionalInput,
} from '@/hooks/use-api';
import { useAuthStore } from '@/store/auth';

type FormState = { title: string; scriptureReference: string; scriptureText: string; body: string; prayer: string; publishDate: string };
const EMPTY: FormState = { title: '', scriptureReference: '', scriptureText: '', body: '', prayer: '', publishDate: '' };
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export default function AdminDevotionalsScreen() {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'admin';
  const listQuery = useAdminDevotionals(isAdmin);
  const save = useSaveDevotional();
  const remove = useDeleteDevotional();
  const publish = usePublishDevotional();
  const [editingId, setEditingId] = React.useState<number | undefined>();
  const [form, setForm] = React.useState<FormState>(EMPTY);

  if (!user || !isAdmin) return null;

  const busy = save.isPending || remove.isPending || publish.isPending;
  const showError = (title: string) => (error: unknown) => Alert.alert(title, getApiErrorMessage(error, 'Please try again.'));
  const setField = (field: keyof FormState) => (value: string) => setForm((current) => ({ ...current, [field]: value }));
  const resetForm = () => {
    setEditingId(undefined);
    setForm(EMPTY);
  };

  const onSave = () => {
    if (!form.title.trim() || !form.scriptureReference.trim() || !form.scriptureText.trim() || !form.body.trim()) {
      Alert.alert('Missing details', 'Title, scripture reference, scripture text and reflection are required.');
      return;
    }
    if (!DATE_PATTERN.test(form.publishDate)) {
      Alert.alert('Check the date', 'Use the format YYYY-MM-DD, for example 2026-10-06.');
      return;
    }
    const input: DevotionalInput = {
      title: form.title.trim(),
      scriptureReference: form.scriptureReference.trim(),
      scriptureText: form.scriptureText.trim(),
      body: form.body.trim(),
      prayer: form.prayer.trim() || null,
      publishDate: form.publishDate,
    };
    save.mutate({ id: editingId, input }, { onSuccess: resetForm, onError: showError('Could not save') });
  };

  const startEdit = (item: Devotional) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      scriptureReference: item.scripture_reference,
      scriptureText: item.scripture_text,
      body: item.body,
      prayer: item.prayer || '',
      publishDate: item.publish_date,
    });
  };

  const onPublish = (item: Devotional) =>
    publish.mutate(item.id, {
      onSuccess: (data) => Alert.alert(data?.notified ? 'Published and everyone was notified' : 'Published'),
      onError: showError('Could not publish'),
    });

  const onDelete = (item: Devotional) =>
    Alert.alert(`Delete "${item.title}"?`, 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => remove.mutate(item.id, { onSuccess: () => editingId === item.id && resetForm(), onError: showError('Could not delete') }),
      },
    ]);

  const field = (key: keyof FormState, label: string, placeholder: string, multiline = false) => (
    <TextField label={label} value={form[key]} onChangeText={setField(key)} placeholder={placeholder} multiline={multiline} />
  );

  const items = Array.isArray(listQuery.data) ? listQuery.data : [];

  return (
    <AdminShell activeTab="/admin-news">
      <ScreenHeader back eyebrow="Admin" title="Devotionals" />

      <AppCard>
        <AppText variant="section">{editingId ? 'Edit devotional' : 'New devotional'}</AppText>
        {field('publishDate', 'Date', 'YYYY-MM-DD')}
        {field('title', 'Title', 'Title')}
        {field('scriptureReference', 'Scripture reference', 'e.g. Psalm 23:1-3')}
        {field('scriptureText', 'Scripture text', 'Scripture text', true)}
        {field('body', 'Reflection', 'Reflection', true)}
        {field('prayer', 'Closing prayer (optional)', 'Closing prayer', true)}
        <AppButton label={editingId ? 'Save changes' : 'Save draft'} onPress={() => !busy && onSave()} />
        {editingId ? <AppButton label="Cancel" variant="secondary" onPress={resetForm} /> : null}
      </AppCard>

      {items.map((item) => (
        <AppCard key={item.id}>
          <View style={styles.row}>
            <AppText variant="bodyStrong" style={styles.flex} numberOfLines={1}>
              {item.title}
            </AppText>
            <AppBadge tone={statusTone(item.status)}>{item.status}</AppBadge>
          </View>
          <AppText variant="small" tone="muted">
            {item.publish_date}
            {item.notified_at ? ' · everyone notified' : ''}
          </AppText>
          <View style={styles.actions}>
            <AppButton label="Edit" size="sm" variant="secondary" onPress={() => startEdit(item)} />
            {item.status === 'draft' || !item.notified_at ? (
              <AppButton
                label={item.status === 'draft' ? 'Publish' : 'Publish & notify'}
                size="sm"
                onPress={() => !busy && onPublish(item)}
              />
            ) : null}
            <AppButton label="Delete" size="sm" variant="danger" onPress={() => !busy && onDelete(item)} />
          </View>
        </AppCard>
      ))}
    </AdminShell>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Space.sm },
  flex: { flex: 1 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.sm },
});
```

- [ ] **Step 9: Donations (finance)**

Replace `mobile/src/app/admin-donations.tsx` with:

```tsx
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AdminShell } from '@/components/admin-shell';
import { LoadingList, Screen, ScreenHeader, SignInPrompt, StatGrid, StatTile, statusTone } from '@/components/kit';
import { AppText } from '@/components/ui/app-text';
import { AppBadge } from '@/components/ui/badge';
import { AppButton } from '@/components/ui/button';
import { AppCard } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Corner, Space } from '@/constants/tokens';
import { useAdminDonations, useUpdateDonationStatus } from '@/hooks/use-api';
import { useAppTheme } from '@/hooks/use-app-theme';
import { formatCedis } from '@/lib/currency';
import { useAuthStore } from '@/store/auth';

export default function AdminDonationsScreen() {
  const { colors } = useAppTheme();
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'admin';
  const donationsQuery = useAdminDonations(isAdmin);
  const updateDonationMutation = useUpdateDonationStatus();

  if (!user) {
    return (
      <Screen>
        <ScreenHeader back eyebrow="Admin giving" title="Finance and giving" />
        <SignInPrompt
          icon="shield-outline"
          title="Admin access requires sign in"
          message="Sign in with your ANT PRESS admin account to review donation records."
          label="Go to sign in"
          onSignIn={() => router.replace('/login')}
        />
      </Screen>
    );
  }

  if (!isAdmin) {
    return (
      <Screen>
        <ScreenHeader back eyebrow="Admin giving" title="Finance and giving" />
        <EmptyState
          icon="lock-closed-outline"
          title="Admin access is restricted"
          message="This mobile donation review area is available only to admin accounts."
          action={<AppButton label="Back to account" onPress={() => router.replace('/account')} />}
        />
      </Screen>
    );
  }

  const donations = Array.isArray(donationsQuery.data) ? donationsQuery.data : [];

  const totalAmount = donations.reduce((sum: number, donation: any) => sum + Number(donation?.amount || 0), 0);
  const pendingCount = donations.filter((donation: any) =>
    ['pending', 'processing'].includes(String(donation?.status || '').toLowerCase()),
  ).length;

  return (
    <AdminShell activeTab="/admin-donations">
      <ScreenHeader back eyebrow="Admin" title="Finance and giving" />

      <AppCard>
        <AppText variant="caption" tone="gold" style={styles.eyebrow}>
          Total received
        </AppText>
        <AppText variant="title">{formatCedis(totalAmount)}</AppText>
      </AppCard>
      <StatGrid>
        <StatTile label="Records" value={donations.length} icon="receipt-outline" />
        <StatTile label="Pending" value={pendingCount} icon="time-outline" />
      </StatGrid>

      {donationsQuery.isLoading ? (
        <LoadingList />
      ) : donations.length === 0 ? (
        <EmptyState
          icon="cash-outline"
          title="No donations available"
          message="Donation records will show here when members give through ANT PRESS."
        />
      ) : (
        donations.map((donation: any) => {
          const status = String(donation?.status || 'pending');
          const isPending = ['pending', 'processing'].includes(status.toLowerCase());

          return (
            <AppCard key={String(donation?.id)}>
              <View style={styles.row}>
                <View style={[styles.money, { backgroundColor: colors.surface }]}>
                  <Ionicons name="cash-outline" size={18} color={colors.success} />
                </View>
                <AppText variant="bodyStrong" style={styles.flex} numberOfLines={1}>
                  {donation?.user?.email || donation?.email || `Donation #${donation?.id}`}
                </AppText>
                <AppBadge tone={statusTone(status)}>{status}</AppBadge>
              </View>
              <AppText variant="small">Amount: {formatCedis(donation?.amount)}</AppText>
              <AppText variant="small" tone="muted">
                Type: {donation?.type || donation?.donation_type || 'general'} | Method: {donation?.payment_method || 'unknown'}
              </AppText>
              <AppText variant="small" tone="muted">
                {donation?.created_at || donation?.createdAt || 'Recently created'}
              </AppText>

              {isPending ? (
                <View style={styles.actions}>
                  <View style={styles.flex}>
                    <AppButton
                      label="Mark completed"
                      size="sm"
                      onPress={() => updateDonationMutation.mutate({ id: Number(donation?.id), status: 'completed' })}
                    />
                  </View>
                  <View style={styles.flex}>
                    <AppButton
                      label="Mark failed"
                      size="sm"
                      variant="danger"
                      onPress={() => updateDonationMutation.mutate({ id: Number(donation?.id), status: 'failed' })}
                    />
                  </View>
                </View>
              ) : null}
            </AppCard>
          );
        })
      )}
    </AdminShell>
  );
}

const styles = StyleSheet.create({
  eyebrow: { textTransform: 'uppercase', letterSpacing: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: Space.sm },
  money: { width: 36, height: 36, borderRadius: Corner.pill, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1 },
  actions: { flexDirection: 'row', gap: Space.sm, marginTop: Space.xs },
});
```

The string `Donation #${…}` contains `#` followed by `$`, so the colour scan does not match it. The decorative download icon is removed (Ruling 9).

- [ ] **Step 10: Events (admin)**

Replace `mobile/src/app/admin-events.tsx` with:

```tsx
import React from 'react';
import { useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { AdminShell } from '@/components/admin-shell';
import { FormMessage, FormTextField, LoadingList, Screen, ScreenHeader, SectionHeader, statusTone } from '@/components/kit';
import { AppText } from '@/components/ui/app-text';
import { AppBadge } from '@/components/ui/badge';
import { AppButton } from '@/components/ui/button';
import { AppCard } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Space } from '@/constants/tokens';
import {
  getApiErrorMessage,
  useAdminEvents,
  useCreateAdminEvent,
  useDeleteAdminEvent,
} from '@/hooks/use-api';
import { useAuthStore } from '@/store/auth';

type EventFormValues = {
  name: string;
  description: string;
  eventDate: string;
  location: string;
  maxRegistrations: string;
};

export default function AdminEventsScreen() {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'admin';
  const eventsQuery = useAdminEvents(isAdmin);
  const createMutation = useCreateAdminEvent();
  const deleteMutation = useDeleteAdminEvent();

  const { control, handleSubmit, reset } = useForm<EventFormValues>({
    defaultValues: {
      name: '',
      description: '',
      eventDate: '',
      location: '',
      maxRegistrations: '',
    },
  });

  const onSubmit = async (values: EventFormValues) => {
    try {
      await createMutation.mutateAsync({
        name: values.name,
        description: values.description,
        eventDate: values.eventDate,
        location: values.location,
        maxRegistrations: values.maxRegistrations ? Number(values.maxRegistrations) : null,
      });
      reset();
    } catch {
      // Inline error state handles this.
    }
  };

  if (!user || !isAdmin) {
    return (
      <Screen>
        <ScreenHeader
          back
          eyebrow="Admin events"
          title="Admin access required"
          subtitle="Sign in with an admin account to create and manage events from mobile."
        />
      </Screen>
    );
  }

  const events = eventsQuery.data || [];
  const createErrorMessage = createMutation.isError
    ? getApiErrorMessage(createMutation.error, 'Failed to create event.')
    : '';

  return (
    <AdminShell activeTab="/admin-events">
      <ScreenHeader back eyebrow="Admin" title="Events" subtitle="Create events quickly and tidy up old ones." />

      <AppCard>
        <AppText variant="section">Create an event</AppText>
        <FormTextField control={control} name="name" label="Name" placeholder="Event name" />
        <FormTextField control={control} name="description" label="Description" placeholder="Event description" multiline />
        <FormTextField
          control={control}
          name="eventDate"
          label="Event date"
          placeholder="2026-04-12T09:00:00.000Z"
          hint="ISO format, for example 2026-04-12T09:00:00.000Z"
          autoCapitalize="none"
        />
        <FormTextField control={control} name="location" label="Location" placeholder="Event location" />
        <FormTextField control={control} name="maxRegistrations" label="Max registrations" placeholder="Optional capacity" keyboardType="number-pad" />
        <AppButton label="Create event" onPress={handleSubmit(onSubmit)} />
        {createMutation.isError ? <FormMessage tone="danger">{createErrorMessage}</FormMessage> : null}
      </AppCard>

      <SectionHeader title="Recent events" />
      {eventsQuery.isLoading ? (
        <LoadingList count={3} height={120} />
      ) : events.length > 0 ? (
        events.slice(0, 8).map((event: any) => (
          <AppCard key={String(event?.id)}>
            <View style={styles.row}>
              <AppText variant="bodyStrong" style={styles.flex}>
                {event?.name || 'Event'}
              </AppText>
              <AppBadge tone={statusTone(event?.status || 'active')}>{String(event?.status || 'active')}</AppBadge>
            </View>
            <AppText variant="small" tone="muted">
              {event?.event_date || event?.eventDate || 'No date available'}
            </AppText>
            <AppText variant="small" tone="muted">
              {event?.location || 'No location provided'}
            </AppText>
            <View style={styles.actions}>
              <View style={styles.flex}>
                <AppButton label="Edit event" size="sm" variant="secondary" onPress={() => router.push(`/admin-events/${event?.id}` as never)} />
              </View>
              <View style={styles.flex}>
                <AppButton label="Delete event" size="sm" variant="danger" onPress={() => deleteMutation.mutate(Number(event?.id))} />
              </View>
            </View>
          </AppCard>
        ))
      ) : (
        <EmptyState icon="calendar-outline" title="No events available" />
      )}
    </AdminShell>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Space.sm },
  flex: { flex: 1 },
  actions: { flexDirection: 'row', gap: Space.sm },
});
```

`keyboardType="number-pad"` on capacity and `autoCapitalize="none"` on the date only change the keyboard; values and submission are unchanged. Delete still has no confirm, exactly as today.

- [ ] **Step 11: Edit event**

Replace `mobile/src/app/admin-events/[id].tsx` with:

```tsx
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, router } from 'expo-router';
import React from 'react';
import { useForm } from 'react-hook-form';
import { Alert } from 'react-native';

import { FormMessage, FormTextField, LoadingList, MediaFrame, Screen, ScreenHeader } from '@/components/kit';
import { AppText } from '@/components/ui/app-text';
import { AppButton } from '@/components/ui/button';
import { AppCard } from '@/components/ui/card';
import { Corner } from '@/constants/tokens';
import { getApiErrorMessage, useAdminEvents, useRemoveEventImage, useUpdateAdminEvent, useUploadEventImage } from '@/hooks/use-api';
import { resolveImageUrl } from '@/lib/media';
import { useAuthStore } from '@/store/auth';

type EventFormValues = {
  name: string;
  description: string;
  eventDate: string;
  location: string;
  maxRegistrations: string;
};

export default function AdminEventEditScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'admin';
  const eventsQuery = useAdminEvents(isAdmin);
  const updateMutation = useUpdateAdminEvent();
  const { control, handleSubmit, reset } = useForm<EventFormValues>({
    defaultValues: { name: '', description: '', eventDate: '', location: '', maxRegistrations: '' },
  });

  const event = React.useMemo(
    () => (eventsQuery.data || []).find((item: any) => String(item?.id) === String(params.id)),
    [eventsQuery.data, params.id]
  );
  const uploadImage = useUploadEventImage(event?.id);
  const removeImage = useRemoveEventImage(event?.id);
  const imageUri = resolveImageUrl(event?.image_url);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8, allowsEditing: true, aspect: [16, 9] });
    const asset = result.canceled ? undefined : result.assets?.[0];
    if (!asset) return;
    if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
      Alert.alert('Image too large', 'Choose an image under 5 MB.');
      return;
    }
    uploadImage.mutate(asset, {
      onError: (error) => Alert.alert('Could not upload', getApiErrorMessage(error, 'Please try again.')),
    });
  };

  React.useEffect(() => {
    if (event) {
      reset({
        name: event.name || '',
        description: event.description || '',
        eventDate: event.event_date || event.eventDate || '',
        location: event.location || '',
        maxRegistrations: event.max_registrations ? String(event.max_registrations) : '',
      });
    }
  }, [event, reset]);

  const onSubmit = async (values: EventFormValues) => {
    try {
      await updateMutation.mutateAsync({
        id: Number(params.id),
        payload: {
          name: values.name,
          description: values.description,
          eventDate: values.eventDate,
          location: values.location,
          maxRegistrations: values.maxRegistrations ? Number(values.maxRegistrations) : null,
        },
      });
      router.back();
    } catch {
      // inline error handles this
    }
  };

  if (!user || !isAdmin) {
    return (
      <Screen>
        <ScreenHeader back eyebrow="Edit event" title="Admin access required" subtitle="Sign in with an admin account to edit events." />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader back eyebrow="Edit event" title={event?.name || 'Edit event'} />
      {!event ? (
        <LoadingList count={3} height={72} />
      ) : (
        <>
          <AppCard>
            <AppText variant="bodyStrong">Cover image</AppText>
            {imageUri ? <MediaFrame uri={imageUri} height={180} radius={Corner.control} accessibilityLabel="Event cover image" /> : null}
            <AppButton
              label={uploadImage.isPending ? 'Uploading...' : imageUri ? 'Change image' : 'Add image'}
              variant="secondary"
              onPress={() => !uploadImage.isPending && pickImage()}
            />
            {imageUri ? (
              <AppButton
                label="Remove image"
                variant="danger"
                onPress={() =>
                  !removeImage.isPending &&
                  removeImage.mutate(undefined, {
                    onError: (error) => Alert.alert('Could not remove', getApiErrorMessage(error, 'Please try again.')),
                  })
                }
              />
            ) : null}
          </AppCard>

          <AppCard>
            <AppText variant="bodyStrong">Details</AppText>
            <FormTextField control={control} name="name" label="Name" placeholder="Event name" />
            <FormTextField control={control} name="description" label="Description" placeholder="Event description" multiline />
            <FormTextField
              control={control}
              name="eventDate"
              label="Event date"
              placeholder="2026-04-12T09:00:00.000Z"
              hint="ISO format, for example 2026-04-12T09:00:00.000Z"
              autoCapitalize="none"
            />
            <FormTextField control={control} name="location" label="Location" placeholder="Event location" />
            <FormTextField control={control} name="maxRegistrations" label="Max registrations" placeholder="Optional capacity" keyboardType="number-pad" />
            <AppButton label="Save changes" onPress={handleSubmit(onSubmit)} />
            {updateMutation.isError ? (
              <FormMessage tone="danger">{getApiErrorMessage(updateMutation.error, 'Failed to update event.')}</FormMessage>
            ) : null}
          </AppCard>
        </>
      )}
    </Screen>
  );
}
```

- [ ] **Step 12: Gallery (admin list)**

Replace `mobile/src/app/admin-gallery.tsx` with:

```tsx
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { AdminShell } from '@/components/admin-shell';
import { ScreenHeader } from '@/components/kit';
import { AppText } from '@/components/ui/app-text';
import { AppBadge } from '@/components/ui/badge';
import { AppButton } from '@/components/ui/button';
import { AppCard } from '@/components/ui/card';
import { TextField } from '@/components/ui/text-field';
import { Corner, Space } from '@/constants/tokens';
import { getApiErrorMessage, useAdminAlbums, useSaveAlbum } from '@/hooks/use-api';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useAuthStore } from '@/store/auth';

export default function AdminGalleryScreen() {
  const { colors } = useAppTheme();
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'admin';
  const albumsQuery = useAdminAlbums(isAdmin);
  const save = useSaveAlbum();
  const [title, setTitle] = React.useState('');

  if (!user || !isAdmin) return null;

  // New albums start as drafts; the details, photos and publishing are on the album screen.
  const onCreate = () => {
    if (!title.trim()) {
      Alert.alert('Missing title', 'Give the album a title first.');
      return;
    }
    if (save.isPending) return;
    save.mutate(
      { input: { title: title.trim(), description: null, eventId: null, externalUrl: null, isPublished: false } },
      {
        onSuccess: ({ album }) => {
          setTitle('');
          if (album?.id) router.push(`/admin-gallery/${album.id}` as never);
        },
        onError: (error) => Alert.alert('Could not create the album', getApiErrorMessage(error, 'Please try again.')),
      }
    );
  };

  const albums = albumsQuery.data ?? [];

  return (
    <AdminShell activeTab="/admin">
      <ScreenHeader back eyebrow="Admin" title="Gallery" />

      <AppCard>
        <AppText variant="bodyStrong">New album</AppText>
        <TextField label="Album title" value={title} onChangeText={setTitle} placeholder="Album title" />
        <AppButton label={save.isPending ? 'Creating...' : 'Create draft album'} onPress={onCreate} />
      </AppCard>

      {albums.map((album) => (
        <AppCard
          key={album.id}
          onPress={() => router.push(`/admin-gallery/${album.id}` as never)}
          accessibilityLabel={`Open album ${album.title}`}
          style={styles.row}>
          {album.cover_url ? (
            <Image source={{ uri: album.cover_url }} style={styles.thumb} contentFit="cover" />
          ) : (
            <View style={[styles.thumb, { backgroundColor: colors.surface }]} />
          )}
          <View style={styles.flex}>
            <AppText variant="bodyStrong" numberOfLines={1}>
              {album.title}
            </AppText>
            <AppText variant="small" tone="muted">
              {album.photo_count} photo{album.photo_count === 1 ? '' : 's'}
              {album.notified_at ? ' · everyone notified' : ''}
            </AppText>
          </View>
          <AppBadge tone={album.is_published ? 'success' : 'warning'}>{album.is_published ? 'published' : 'draft'}</AppBadge>
        </AppCard>
      ))}
    </AdminShell>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Space.sm + 4 },
  thumb: { width: 56, height: 56, borderRadius: Corner.control },
  flex: { flex: 1, gap: 2 },
});
```

- [ ] **Step 13: Album (admin)**

Replace `mobile/src/app/admin-gallery/[id].tsx` with the file below. Everything from `const [form, setForm]` down to `const events: …` is the same logic as today, unchanged.

```tsx
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { AdminShell } from '@/components/admin-shell';
import { ChipGroup, IconButton, LoadingList, ScreenHeader, SwitchRow } from '@/components/kit';
import { AppText } from '@/components/ui/app-text';
import { AppButton } from '@/components/ui/button';
import { AppCard } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { TextField } from '@/components/ui/text-field';
import { Corner, Space } from '@/constants/tokens';
import {
  getApiErrorMessage,
  useAdminAlbum,
  useAdminEvents,
  useAlbumUploadSignature,
  useDeleteAlbum,
  useDeleteAlbumPhoto,
  useRecordAlbumPhotos,
  useSaveAlbum,
  useSetAlbumCover,
  type AlbumPhoto,
} from '@/hooks/use-api';
import { MAX_ALBUM_PHOTO_BYTES, chunk, mapWithConcurrency, uploadPhotoToCloudinary, type PickedPhoto } from '@/lib/album-upload';
import { useAuthStore } from '@/store/auth';

type FormState = { title: string; description: string; externalUrl: string; eventId: number | null; isPublished: boolean };

export default function AdminAlbumScreen() {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'admin';
  const params = useLocalSearchParams<{ id: string }>();
  const id = Number(params.id) || undefined;
  const albumQuery = useAdminAlbum(id, isAdmin);
  const eventsQuery = useAdminEvents(isAdmin);
  const save = useSaveAlbum();
  const removeAlbum = useDeleteAlbum();
  const getSignature = useAlbumUploadSignature(id);
  const recordPhotos = useRecordAlbumPhotos(id);
  const removePhoto = useDeleteAlbumPhoto(id);
  const setCover = useSetAlbumCover(id);
  const [form, setForm] = React.useState<FormState | null>(null);
  const [progress, setProgress] = React.useState<{ done: number; total: number } | null>(null);
  const [retryPhotos, setRetryPhotos] = React.useState<PickedPhoto[]>([]);
  // Uploaded to Cloudinary but not yet recorded: retried by id, never uploaded twice.
  const [retryIds, setRetryIds] = React.useState<string[]>([]);
  const album = albumQuery.data;

  React.useEffect(() => {
    if (!album) return;
    setForm({
      title: album.title,
      description: album.description || '',
      externalUrl: album.external_url || '',
      eventId: album.event_id,
      isPublished: album.is_published,
    });
    // Only when a different album loads, so typing is not overwritten by refetches.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [album?.id]);

  if (!user || !isAdmin) return null;

  const showError = (title: string) => (error: unknown) => Alert.alert(title, getApiErrorMessage(error, 'Please try again.'));

  const onSave = () => {
    if (!form || !id || save.isPending) return;
    if (!form.title.trim()) {
      Alert.alert('Missing title', 'The album needs a title.');
      return;
    }
    save.mutate(
      {
        id,
        input: {
          title: form.title.trim(),
          description: form.description.trim() || null,
          eventId: form.eventId,
          externalUrl: form.externalUrl.trim() || null,
          isPublished: form.isPublished,
        },
      },
      { onSuccess: ({ message }) => Alert.alert(message || 'Album saved'), onError: showError('Could not save') }
    );
  };

  // Records uploaded ids, 100 per request. Refused ids are final (wrong type or too big); ids whose
  // request failed are returned so a retry can record them without uploading the photos again.
  const recordIds = async (publicIds: string[]) => {
    let added = 0;
    let refused = 0;
    const unrecorded: string[] = [];
    for (const ids of chunk(publicIds, 100)) {
      try {
        const result = await recordPhotos.mutateAsync(ids);
        added += result.added;
        refused += result.rejected.length;
      } catch (error: any) {
        const rejected = error?.response?.status === 400 ? error.response.data?.data?.rejected : undefined;
        if (Array.isArray(rejected)) refused += rejected.length;
        else unrecorded.push(...ids);
      }
    }
    return { added, refused, unrecorded };
  };

  // Uploads straight to Cloudinary, 3 at a time, then records the uploaded ids (plus any left from a failed record).
  const uploadPhotos = async (picked: PickedPhoto[], unrecordedIds: string[] = []) => {
    if ((picked.length === 0 && unrecordedIds.length === 0) || progress) return;
    const tooBig = picked.filter((photo) => (photo.fileSize ?? 0) > MAX_ALBUM_PHOTO_BYTES);
    const ready = picked.filter((photo) => (photo.fileSize ?? 0) <= MAX_ALBUM_PHOTO_BYTES);
    if (tooBig.length > 0) Alert.alert('Some photos skipped', `${tooBig.length} photo(s) are over 10 MB.`);
    if (ready.length === 0 && unrecordedIds.length === 0) return;

    setRetryPhotos([]);
    setRetryIds([]);
    setProgress({ done: 0, total: ready.length });
    try {
      const uploadedIds = [...unrecordedIds];
      const failedUploads: PickedPhoto[] = [];
      if (ready.length > 0) {
        const signature = await getSignature.mutateAsync();
        const results = await mapWithConcurrency(ready, 3, async (photo) => {
          try {
            return await uploadPhotoToCloudinary(photo, signature);
          } finally {
            setProgress((current) => (current ? { ...current, done: current.done + 1 } : current));
          }
        });
        results.forEach((result, index) => {
          if (result.status === 'fulfilled') uploadedIds.push(result.value);
          else failedUploads.push(ready[index]);
        });
      }

      const { added, refused, unrecorded } = await recordIds(uploadedIds);
      setRetryPhotos(failedUploads);
      setRetryIds(unrecorded);

      const total = ready.length + unrecordedIds.length;
      const retryable = failedUploads.length + unrecorded.length;
      const details = [
        refused > 0 ? `${refused} not accepted (wrong type or over 10 MB).` : '',
        retryable > 0 ? `Tap "Retry failed" to try ${retryable} again.` : '',
      ]
        .filter(Boolean)
        .join(' ');
      Alert.alert(`${added} of ${total} added`, details);
    } catch (error) {
      showError('Could not start the upload')(error);
    } finally {
      setProgress(null);
    }
  };

  const pickPhotos = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 100,
      quality: 0.9,
    });
    if (result.canceled) return;
    uploadPhotos(result.assets ?? []);
  };

  const confirmDeletePhoto = (photo: AlbumPhoto) =>
    Alert.alert('Delete this photo?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removePhoto.mutate(photo.id, { onError: showError('Could not delete') }) },
    ]);

  const confirmDeleteAlbum = () =>
    Alert.alert(`Delete "${album?.title}"?`, 'All of its photos are deleted too. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          id && removeAlbum.mutate(id, { onSuccess: () => router.replace('/admin-gallery' as never), onError: showError('Could not delete') }),
      },
    ]);

  const events: { id: number; name: string }[] = Array.isArray(eventsQuery.data) ? eventsQuery.data : [];
  const field = (key: 'title' | 'description' | 'externalUrl', label: string, placeholder: string, multiline = false) => (
    <TextField
      label={label}
      value={form ? form[key] : ''}
      onChangeText={(value) => setForm((current) => (current ? { ...current, [key]: value } : current))}
      placeholder={placeholder}
      multiline={multiline}
      autoCapitalize={key === 'externalUrl' ? 'none' : 'sentences'}
    />
  );

  return (
    <AdminShell activeTab="/admin">
      <ScreenHeader back eyebrow="Album" title={album?.title || 'Loading...'} />

      {!album || !form ? (
        albumQuery.isLoading ? (
          <LoadingList count={2} height={160} />
        ) : (
          <EmptyState icon="images-outline" title="Album not found" />
        )
      ) : (
        <>
          <AppCard>
            <AppText variant="section">Details</AppText>
            {field('title', 'Title', 'Title')}
            {field('description', 'Description (optional)', 'Description', true)}
            {field('externalUrl', 'Outside folder link (optional)', 'https://…')}
            <AppText variant="small" style={styles.bold}>
              Event
            </AppText>
            <ChipGroup
              scroll
              options={[{ value: 0, label: 'No event' }, ...events.map((item) => ({ value: item.id, label: item.name }))]}
              value={form.eventId ?? 0}
              onChange={(value) => setForm((current) => (current ? { ...current, eventId: value || null } : current))}
            />
            <SwitchRow
              label="Published"
              value={form.isPublished}
              onValueChange={(value) => setForm((current) => (current ? { ...current, isPublished: value } : current))}
            />
            <AppButton label={save.isPending ? 'Saving...' : 'Save'} onPress={onSave} />
          </AppCard>

          <AppCard>
            <AppText variant="section">{`Photos (${album.photo_count})`}</AppText>
            <AppText variant="small" tone="muted">
              {progress ? `Uploading ${progress.done} of ${progress.total}...` : 'Up to 10 MB each. Choose several at once.'}
            </AppText>
            <AppButton label={progress ? 'Uploading...' : 'Add photos'} onPress={() => !progress && pickPhotos()} />
            {retryPhotos.length + retryIds.length > 0 && !progress ? (
              <AppButton
                label={`Retry ${retryPhotos.length + retryIds.length} failed`}
                variant="secondary"
                onPress={() => uploadPhotos(retryPhotos, retryIds)}
              />
            ) : null}
            <View style={styles.grid}>
              {album.photos.map((photo, index) => {
                const isCover = album.cover_photo_id ? album.cover_photo_id === photo.id : album.photos[0]?.id === photo.id;
                return (
                  <View key={photo.id} style={styles.cell}>
                    <Image source={{ uri: photo.thumb_url }} style={styles.thumb} contentFit="cover" />
                    <View style={styles.cellActions}>
                      <IconButton
                        icon={isCover ? 'star' : 'star-outline'}
                        variant="ghost"
                        accessibilityLabel={isCover ? `Photo ${index + 1} is the cover` : `Make photo ${index + 1} the cover`}
                        onPress={() => !isCover && setCover.mutate(photo.id, { onError: showError('Could not set the cover') })}
                      />
                      <IconButton
                        icon="trash-outline"
                        variant="ghost"
                        accessibilityLabel={`Delete photo ${index + 1}`}
                        onPress={() => confirmDeletePhoto(photo)}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          </AppCard>

          <AppButton label="Delete album" variant="danger" onPress={confirmDeleteAlbum} />
        </>
      )}
    </AdminShell>
  );
}

const styles = StyleSheet.create({
  bold: { fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Space.sm },
  cell: { width: '31%', gap: 2 },
  thumb: { width: '100%', aspectRatio: 1, borderRadius: Corner.control },
  cellActions: { flexDirection: 'row', justifyContent: 'space-around' },
});
```

The cover star and trash become 44×44 `IconButton`s with labels (they were 18px icons with `hitSlop`). The star stays muted grey; an active cover shows the filled star.

- [ ] **Step 14: Livestream**

Replace `mobile/src/app/admin-live.tsx` with:

```tsx
import React from 'react';
import { Alert } from 'react-native';

import { AdminShell } from '@/components/admin-shell';
import { ScreenHeader } from '@/components/kit';
import { AppText } from '@/components/ui/app-text';
import { AppBadge } from '@/components/ui/badge';
import { AppButton } from '@/components/ui/button';
import { AppCard } from '@/components/ui/card';
import { TextField } from '@/components/ui/text-field';
import { getApiErrorMessage, getLiveErrorMessage, useEndLive, useLiveStream, useStartLive } from '@/hooks/use-api';
import { useAuthStore } from '@/store/auth';

export default function AdminLiveScreen() {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'admin';
  const liveQuery = useLiveStream();
  const startMutation = useStartLive();
  const endMutation = useEndLive();
  const [title, setTitle] = React.useState('');
  const [youtubeUrl, setYoutubeUrl] = React.useState('');
  const [facebookUrl, setFacebookUrl] = React.useState('');
  const filledFromLive = React.useRef(false);
  const live = liveQuery.data;

  // While live, start from the current title and links so they can be corrected.
  React.useEffect(() => {
    if (filledFromLive.current || !live?.is_live) return;
    filledFromLive.current = true;
    setTitle(live.title ?? '');
    setYoutubeUrl(live.youtube_url ?? '');
    setFacebookUrl(live.facebook_url ?? '');
  }, [live]);

  if (!user || !isAdmin) return null;

  const isLive = Boolean(live?.is_live);

  const onStart = () => {
    if (startMutation.isPending) return;
    if (!title.trim()) {
      Alert.alert('Missing title', 'Add a title for the livestream.');
      return;
    }
    if (!youtubeUrl.trim() && !facebookUrl.trim()) {
      Alert.alert('Missing link', 'Add a YouTube or Facebook link.');
      return;
    }
    startMutation.mutate(
      { title: title.trim(), youtubeUrl: youtubeUrl.trim() || undefined, facebookUrl: facebookUrl.trim() || undefined },
      {
        onSuccess: (result) => Alert.alert(result?.data?.notified ? "You're live" : 'Updated', result?.message || 'Livestream updated'),
        onError: (error) => Alert.alert('Could not go live', getLiveErrorMessage(error, 'Please try again.')),
      }
    );
  };

  const onEnd = () => {
    if (endMutation.isPending) return;
    Alert.alert('End the livestream?', 'The live card will disappear for everyone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End',
        style: 'destructive',
        onPress: () =>
          endMutation.mutate(undefined, {
            onSuccess: (result) => Alert.alert('Ended', result?.message || 'Livestream ended'),
            onError: (error) => Alert.alert('Could not end', getApiErrorMessage(error, 'Please try again.')),
          }),
      },
    ]);
  };

  return (
    <AdminShell activeTab="/admin">
      <ScreenHeader back eyebrow="Admin" title="Livestream" />

      <AppCard>
        <AppText variant="small" tone="muted">
          Status
        </AppText>
        {isLive ? (
          <>
            <AppBadge tone="live">Live now</AppBadge>
            <AppText variant="bodyStrong">{live?.title ?? ''}</AppText>
            {live?.started_at ? (
              <AppText variant="small" tone="muted">
                {`Since ${new Date(live.started_at).toLocaleString()}`}
              </AppText>
            ) : null}
          </>
        ) : (
          <AppText variant="bodyStrong">{liveQuery.isLoading ? 'Loading...' : 'Not live.'}</AppText>
        )}
      </AppCard>

      <AppCard>
        <TextField label="Title" value={title} onChangeText={setTitle} placeholder="e.g. Sunday Worship Service" maxLength={255} />
        <TextField
          label="YouTube link"
          value={youtubeUrl}
          onChangeText={setYoutubeUrl}
          placeholder="https://youtube.com/live/…"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          maxLength={500}
        />
        <TextField
          label="Facebook link"
          value={facebookUrl}
          onChangeText={setFacebookUrl}
          placeholder="https://facebook.com/…"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          maxLength={500}
        />
        <AppText variant="small" tone="muted">
          Everyone is notified once when you go live. Updating the links while live does not notify again.
        </AppText>
        <AppButton label={isLive ? 'Update links' : 'Go live'} onPress={onStart} />
        {isLive ? <AppButton label="End livestream" variant="danger" onPress={onEnd} /> : null}
      </AppCard>
    </AdminShell>
  );
}
```

- [ ] **Step 15: News (admin)**

Replace `mobile/src/app/admin-news.tsx` with:

```tsx
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { AdminShell } from '@/components/admin-shell';
import { FormMessage, FormTextField, LoadingList, Screen, ScreenHeader, SectionHeader, SwitchRow, statusTone } from '@/components/kit';
import { AppText } from '@/components/ui/app-text';
import { AppBadge } from '@/components/ui/badge';
import { AppButton } from '@/components/ui/button';
import { AppCard } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Space } from '@/constants/tokens';
import { useAdminNews, useCreateNewsPost, useDeleteNewsPost, getApiErrorMessage } from '@/hooks/use-api';
import { useAuthStore } from '@/store/auth';

type NewsFormValues = {
  title: string;
  excerpt: string;
  content: string;
  status: 'draft' | 'published';
  featured: boolean;
  notifySubscribers: boolean;
};

export default function AdminNewsScreen() {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'admin';
  const newsQuery = useAdminNews(isAdmin);
  const createMutation = useCreateNewsPost();
  const deleteMutation = useDeleteNewsPost();

  const { control, handleSubmit, reset } = useForm<NewsFormValues>({
    defaultValues: {
      title: '',
      excerpt: '',
      content: '',
      status: 'draft',
      featured: false,
      notifySubscribers: false,
    },
  });

  const onSubmit = async (values: NewsFormValues) => {
    try {
      await createMutation.mutateAsync(values);
      reset();
    } catch {
      // Inline error state handles this.
    }
  };

  if (!user || !isAdmin) {
    return (
      <Screen>
        <ScreenHeader
          back
          eyebrow="Admin news"
          title="Admin access required"
          subtitle="Sign in with an admin account to create and manage news posts from mobile."
        />
      </Screen>
    );
  }

  const posts = newsQuery.data || [];
  const createErrorMessage = createMutation.isError
    ? getApiErrorMessage(createMutation.error, 'Failed to create news post.')
    : '';

  return (
    <AdminShell activeTab="/admin-news">
      <ScreenHeader back eyebrow="Admin" title="News" subtitle="Create posts and remove outdated announcements." />

      <AppCard>
        <AppText variant="section">Create a news post</AppText>
        <FormTextField control={control} name="title" label="Title" placeholder="News title" />
        <FormTextField control={control} name="excerpt" label="Excerpt" placeholder="Short summary" multiline />
        <FormTextField control={control} name="content" label="Content" placeholder="Write the announcement" multiline />
        <Controller
          control={control}
          name="status"
          render={({ field: { onChange, value } }) => (
            <SwitchRow
              label="Publish immediately"
              value={value === 'published'}
              onValueChange={(enabled) => onChange(enabled ? 'published' : 'draft')}
            />
          )}
        />
        <Controller
          control={control}
          name="featured"
          render={({ field: { onChange, value } }) => <SwitchRow label="Feature this post" value={value} onValueChange={onChange} />}
        />
        <Controller
          control={control}
          name="notifySubscribers"
          render={({ field: { onChange, value } }) => <SwitchRow label="Notify subscribers" value={value} onValueChange={onChange} />}
        />
        <AppButton label="Create news post" onPress={handleSubmit(onSubmit)} />
        {createMutation.isError ? <FormMessage tone="danger">{createErrorMessage}</FormMessage> : null}
      </AppCard>

      <SectionHeader title="Recent news posts" />
      {newsQuery.isLoading ? (
        <LoadingList count={3} height={120} />
      ) : posts.length > 0 ? (
        posts.slice(0, 8).map((post: any) => (
          <AppCard key={String(post?.id)}>
            <View style={styles.row}>
              <AppText variant="bodyStrong" style={styles.flex}>
                {post?.title || 'News post'}
              </AppText>
              <AppBadge tone={statusTone(post?.status || 'draft')}>{String(post?.status || 'draft')}</AppBadge>
            </View>
            <AppText variant="small" tone="muted" numberOfLines={3}>
              {post?.excerpt || post?.content || 'No summary available.'}
            </AppText>
            <View style={styles.actions}>
              <View style={styles.flex}>
                <AppButton label="Edit post" size="sm" variant="secondary" onPress={() => router.push(`/admin-news/${post?.id}` as never)} />
              </View>
              <View style={styles.flex}>
                <AppButton label="Delete post" size="sm" variant="danger" onPress={() => deleteMutation.mutate(Number(post?.id))} />
              </View>
            </View>
          </AppCard>
        ))
      ) : (
        <EmptyState icon="newspaper-outline" title="No news posts yet" />
      )}
    </AdminShell>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Space.sm },
  flex: { flex: 1 },
  actions: { flexDirection: 'row', gap: Space.sm },
});
```

The excerpt in the list is limited to 3 lines (`numberOfLines`); the full text is still on the edit screen.

- [ ] **Step 16: Edit news post**

Replace `mobile/src/app/admin-news/[id].tsx` with:

```tsx
import { useLocalSearchParams, router } from 'expo-router';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';

import { FormMessage, FormTextField, LoadingList, Screen, ScreenHeader, SwitchRow } from '@/components/kit';
import { AppButton } from '@/components/ui/button';
import { AppCard } from '@/components/ui/card';
import { getApiErrorMessage, useAdminNews, useUpdateNewsPost } from '@/hooks/use-api';
import { useAuthStore } from '@/store/auth';

type NewsFormValues = {
  title: string;
  excerpt: string;
  content: string;
  status: 'draft' | 'published';
  featured: boolean;
  notifySubscribers: boolean;
};

export default function AdminNewsEditScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'admin';
  const newsQuery = useAdminNews(isAdmin);
  const updateMutation = useUpdateNewsPost();
  const { control, handleSubmit, reset } = useForm<NewsFormValues>({
    defaultValues: {
      title: '',
      excerpt: '',
      content: '',
      status: 'draft',
      featured: false,
      notifySubscribers: false,
    },
  });

  const post = React.useMemo(
    () => (newsQuery.data || []).find((item: any) => String(item?.id) === String(params.id)),
    [newsQuery.data, params.id]
  );

  React.useEffect(() => {
    if (post) {
      reset({
        title: post.title || '',
        excerpt: post.excerpt || '',
        content: post.content || '',
        status: post.status === 'published' ? 'published' : 'draft',
        featured: Boolean(post.featured),
        notifySubscribers: false,
      });
    }
  }, [post, reset]);

  const onSubmit = async (values: NewsFormValues) => {
    try {
      await updateMutation.mutateAsync({ id: Number(params.id), payload: values });
      router.back();
    } catch {
      // inline error handles this
    }
  };

  if (!user || !isAdmin) {
    return (
      <Screen>
        <ScreenHeader back eyebrow="Edit news" title="Admin access required" subtitle="Sign in with an admin account to edit news posts." />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader back eyebrow="Edit news" title={post?.title || 'Edit news post'} />
      {!post ? (
        <LoadingList count={3} height={72} />
      ) : (
        <AppCard>
          <FormTextField control={control} name="title" label="Title" placeholder="News title" />
          <FormTextField control={control} name="excerpt" label="Excerpt" placeholder="Short summary" multiline />
          <FormTextField control={control} name="content" label="Content" placeholder="Write the announcement" multiline />
          <Controller
            control={control}
            name="status"
            render={({ field: { onChange, value } }) => (
              <SwitchRow
                label="Publish immediately"
                value={value === 'published'}
                onValueChange={(enabled) => onChange(enabled ? 'published' : 'draft')}
              />
            )}
          />
          <Controller
            control={control}
            name="featured"
            render={({ field: { onChange, value } }) => (
              <SwitchRow label="Feature this post" value={Boolean(value)} onValueChange={onChange} />
            )}
          />
          <Controller
            control={control}
            name="notifySubscribers"
            render={({ field: { onChange, value } }) => (
              <SwitchRow label="Notify subscribers" value={Boolean(value)} onValueChange={onChange} />
            )}
          />
          <AppButton label="Save changes" onPress={handleSubmit(onSubmit)} />
          {updateMutation.isError ? (
            <FormMessage tone="danger">{getApiErrorMessage(updateMutation.error, 'Failed to update news post.')}</FormMessage>
          ) : null}
        </AppCard>
      )}
    </Screen>
  );
}
```

- [ ] **Step 17: Series**

Replace `mobile/src/app/admin-series.tsx` with:

```tsx
import React from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { AdminShell } from '@/components/admin-shell';
import { ErrorState, ScreenHeader } from '@/components/kit';
import { AppText } from '@/components/ui/app-text';
import { AppBadge } from '@/components/ui/badge';
import { AppButton } from '@/components/ui/button';
import { AppCard } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { TextField } from '@/components/ui/text-field';
import { Space } from '@/constants/tokens';
import {
  getApiErrorMessage,
  useDeleteSermonSeries,
  useSaveSermonSeries,
  useSermonSeriesList,
  type SeriesInput,
  type SermonSeriesSummary,
} from '@/hooks/use-api';
import { useAuthStore } from '@/store/auth';

const EMPTY: SeriesInput = { title: '', description: '', startDate: '', endDate: '' };
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// Date-only values arrive as midnight UTC; show them in UTC so they don't shift a day.
const formatDateOnly = (value: string | null) =>
  value ? new Date(value).toLocaleDateString(undefined, { timeZone: 'UTC' }) : '';

export default function AdminSeriesScreen() {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'admin';
  const seriesQuery = useSermonSeriesList(isAdmin);
  const saveMutation = useSaveSermonSeries();
  const deleteMutation = useDeleteSermonSeries();
  const [editingId, setEditingId] = React.useState<number | undefined>();
  const [form, setForm] = React.useState<SeriesInput>(EMPTY);

  if (!user || !isAdmin) return null;

  const seriesList = Array.isArray(seriesQuery.data) ? seriesQuery.data : [];

  const setField = (field: keyof SeriesInput) => (value: string) =>
    setForm((current) => ({ ...current, [field]: value }));

  const resetForm = () => {
    setEditingId(undefined);
    setForm(EMPTY);
  };

  const startEdit = (series: SermonSeriesSummary) => {
    setEditingId(series.id);
    setForm({
      title: series.title,
      description: series.description || '',
      startDate: series.start_date ? series.start_date.slice(0, 10) : '',
      endDate: series.end_date ? series.end_date.slice(0, 10) : '',
    });
  };

  const onSave = () => {
    if (!form.title.trim()) {
      Alert.alert('Title required', 'Give the series a title.');
      return;
    }
    const badDate = [form.startDate, form.endDate].find((value) => value && !DATE_PATTERN.test(value));
    if (badDate) {
      Alert.alert('Check the dates', 'Use the format YYYY-MM-DD, for example 2026-09-01.');
      return;
    }
    saveMutation.mutate(
      { id: editingId, input: form },
      {
        onSuccess: resetForm,
        onError: (error) => Alert.alert('Could not save', getApiErrorMessage(error, 'Please try again.')),
      }
    );
  };

  const confirmDelete = (series: SermonSeriesSummary) =>
    Alert.alert(
      `Delete "${series.title}"?`,
      `Its ${series.sermon_count} sermon(s) will stay in the library without a series.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () =>
            deleteMutation.mutate(series.id, {
              onSuccess: () => {
                if (editingId === series.id) resetForm();
              },
              onError: (error) => Alert.alert('Could not delete', getApiErrorMessage(error, 'Please try again.')),
            }),
        },
      ]
    );

  return (
    <AdminShell activeTab="/admin-sermons">
      <ScreenHeader back eyebrow="Admin" title="Series" />

      <AppCard>
        <AppText variant="section">{editingId ? 'Edit series' : 'New series'}</AppText>
        <TextField label="Series title" value={form.title} onChangeText={setField('title')} placeholder="Series title" />
        <TextField label="Description (optional)" value={form.description} onChangeText={setField('description')} placeholder="Description" multiline />
        <TextField label="Start date (optional)" value={form.startDate} onChangeText={setField('startDate')} placeholder="YYYY-MM-DD" />
        <TextField label="End date (optional)" value={form.endDate} onChangeText={setField('endDate')} placeholder="YYYY-MM-DD" />
        <AppButton label={editingId ? 'Save changes' : 'Create series'} onPress={onSave} />
        {editingId ? <AppButton label="Cancel" variant="secondary" onPress={resetForm} /> : null}
      </AppCard>

      {seriesQuery.isError ? (
        <ErrorState title="Could not load series" onRetry={() => seriesQuery.refetch()} />
      ) : seriesList.length === 0 && !seriesQuery.isLoading ? (
        <EmptyState icon="albums-outline" title="No series yet" message="Create one above, then choose it on a sermon." />
      ) : (
        seriesList.map((series) => (
          <AppCard key={series.id}>
            <View style={styles.row}>
              <AppText variant="bodyStrong" style={styles.flex}>
                {series.title}
              </AppText>
              <AppBadge>{`${series.sermon_count} sermons`}</AppBadge>
            </View>
            {series.start_date ? (
              <AppText variant="small" tone="muted">
                {formatDateOnly(series.start_date)}
                {series.end_date ? ` – ${formatDateOnly(series.end_date)}` : ''}
              </AppText>
            ) : null}
            <View style={styles.actions}>
              <View style={styles.flex}>
                <AppButton label="Edit" size="sm" variant="secondary" onPress={() => startEdit(series)} />
              </View>
              <View style={styles.flex}>
                <AppButton label="Delete" size="sm" variant="danger" onPress={() => confirmDelete(series)} />
              </View>
            </View>
          </AppCard>
        ))
      )}
    </AdminShell>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Space.sm },
  flex: { flex: 1 },
  actions: { flexDirection: 'row', gap: Space.sm },
});
```

`SeriesInput.description`, `startDate` and `endDate` are strings in the current type (the old `input()` helper passed `form[field]` straight to `value`). If `tsc` says one is `string | null | undefined`, use `value={form.description ?? ''}` (and the same for the dates).

- [ ] **Step 18: Sermons (admin)**

Replace `mobile/src/app/admin-sermons.tsx` with:

```tsx
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { AdminShell } from '@/components/admin-shell';
import { ChoiceField, FormMessage, FormTextField, LoadingList, Screen, ScreenHeader, SectionHeader } from '@/components/kit';
import { AppText } from '@/components/ui/app-text';
import { AppBadge } from '@/components/ui/badge';
import { AppButton } from '@/components/ui/button';
import { AppCard } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Space } from '@/constants/tokens';
import {
  getApiErrorMessage,
  useAdminSermons,
  useCreateAdminSermon,
  useDeleteAdminSermon,
  useMinistries,
} from '@/hooks/use-api';
import { useAuthStore } from '@/store/auth';

type SermonFormValues = {
  title: string;
  speaker: string;
  description: string;
  videoUrl: string;
  sermonDate: string;
  ministryId: string;
};

export default function AdminSermonsScreen() {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'admin';
  const sermonsQuery = useAdminSermons(isAdmin);
  const ministriesQuery = useMinistries(isAdmin);
  const createMutation = useCreateAdminSermon();
  const deleteMutation = useDeleteAdminSermon();
  const { control, handleSubmit, reset } = useForm<SermonFormValues>({
    defaultValues: {
      title: '',
      speaker: '',
      description: '',
      videoUrl: '',
      sermonDate: '',
      ministryId: '',
    },
  });

  const onSubmit = async (values: SermonFormValues) => {
    try {
      await createMutation.mutateAsync({
        title: values.title,
        speaker: values.speaker,
        description: values.description,
        videoUrl: values.videoUrl || undefined,
        sermonDate: values.sermonDate || undefined,
        ministryId: Number(values.ministryId),
      });
      reset();
    } catch {
      // Inline error state handles this.
    }
  };

  if (!user || !isAdmin) {
    return (
      <Screen>
        <ScreenHeader
          back
          eyebrow="Admin sermons"
          title="Admin access required"
          subtitle="Sign in with an admin account to manage sermons from mobile."
        />
      </Screen>
    );
  }

  const sermons = sermonsQuery.data || [];
  const ministries = ministriesQuery.data || [];
  const ministryOptions = ministries.map((item: any) => ({ value: String(item.id), label: String(item.name) }));
  const createError = createMutation.isError
    ? getApiErrorMessage(createMutation.error, 'Failed to create sermon.')
    : '';

  return (
    <AdminShell activeTab="/admin-sermons">
      <ScreenHeader back eyebrow="Admin" title="Sermons" />

      <AppCard>
        <AppText variant="section">Create a sermon</AppText>
        <FormTextField control={control} name="title" label="Title" placeholder="Sermon title" />
        <FormTextField control={control} name="speaker" label="Speaker" placeholder="Speaker name" />
        <FormTextField control={control} name="description" label="Description" placeholder="Sermon summary" multiline />
        <FormTextField control={control} name="videoUrl" label="Video URL" placeholder="Optional video link" autoCapitalize="none" />
        <FormTextField
          control={control}
          name="sermonDate"
          label="Sermon date"
          placeholder="2026-04-20T09:00:00.000Z"
          hint="ISO format, for example 2026-04-20T09:00:00.000Z"
          autoCapitalize="none"
        />
        {ministryOptions.length > 0 ? (
          <Controller
            control={control}
            name="ministryId"
            render={({ field: { value, onChange } }) => (
              <ChoiceField label="Ministry" options={ministryOptions} value={value} onChange={onChange} />
            )}
          />
        ) : (
          <FormTextField control={control} name="ministryId" label="Ministry ID" placeholder="Numeric ministry ID" keyboardType="number-pad" />
        )}
        <AppButton label="Create sermon" onPress={handleSubmit(onSubmit)} />
        {createError ? <FormMessage tone="danger">{createError}</FormMessage> : null}
      </AppCard>

      <SectionHeader title="Recent sermons" />
      {sermonsQuery.isLoading ? (
        <LoadingList count={3} height={120} />
      ) : sermons.length > 0 ? (
        sermons.slice(0, 8).map((sermon: any) => (
          <AppCard key={String(sermon?.id)}>
            <AppBadge>{String(sermon?.speaker || 'Sermon')}</AppBadge>
            <AppText variant="bodyStrong">{sermon?.title || 'Untitled sermon'}</AppText>
            <AppText variant="small" tone="muted" numberOfLines={3}>
              {sermon?.description || 'No description available.'}
            </AppText>
            <View style={styles.actions}>
              <View style={styles.flex}>
                <AppButton label="Edit sermon" size="sm" variant="secondary" onPress={() => router.push(`/admin-sermons/${sermon?.id}` as never)} />
              </View>
              <View style={styles.flex}>
                <AppButton label="Delete sermon" size="sm" variant="danger" onPress={() => deleteMutation.mutate(Number(sermon?.id))} />
              </View>
            </View>
          </AppCard>
        ))
      ) : (
        <EmptyState icon="play-circle-outline" title="No sermons available" />
      )}
    </AdminShell>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  actions: { flexDirection: 'row', gap: Space.sm },
});
```

Ruling 10: the ministry chips write the same `String(id)` into `ministryId` that the old free-text field expected, which replaces the "Available ministries: 1=…" helper line. With no ministries loaded, the numeric field remains.

- [ ] **Step 19: Edit sermon**

Replace `mobile/src/app/admin-sermons/[id].tsx` with:

```tsx
import { useLocalSearchParams, router } from 'expo-router';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';

import { ChoiceField, FormMessage, FormTextField, LoadingList, Screen, ScreenHeader } from '@/components/kit';
import { AppButton } from '@/components/ui/button';
import { AppCard } from '@/components/ui/card';
import {
  getApiErrorMessage,
  useAdminSermons,
  useMinistries,
  useSermonSeriesList,
  useUpdateAdminSermon,
} from '@/hooks/use-api';
import { useAuthStore } from '@/store/auth';

type SermonFormValues = {
  title: string;
  speaker: string;
  description: string;
  videoUrl: string;
  sermonDate: string;
  ministryId: string;
  seriesId: string;
};

export default function AdminSermonEditScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'admin';
  const sermonsQuery = useAdminSermons(isAdmin);
  const ministriesQuery = useMinistries(isAdmin);
  const seriesQuery = useSermonSeriesList(isAdmin);
  const updateMutation = useUpdateAdminSermon();
  const { control, handleSubmit, reset, watch, setValue } = useForm<SermonFormValues>({
    defaultValues: { title: '', speaker: '', description: '', videoUrl: '', sermonDate: '', ministryId: '', seriesId: '' },
  });
  const selectedSeriesId = watch('seriesId');

  const sermon = React.useMemo(
    () => (sermonsQuery.data || []).find((item: any) => String(item?.id) === String(params.id)),
    [sermonsQuery.data, params.id]
  );

  React.useEffect(() => {
    if (sermon) {
      reset({
        title: sermon.title || '',
        speaker: sermon.speaker || '',
        description: sermon.description || '',
        videoUrl: sermon.video_url || sermon.videoUrl || '',
        sermonDate: sermon.sermon_date || sermon.sermonDate || '',
        ministryId: sermon.ministry_id ? String(sermon.ministry_id) : sermon.ministryId ? String(sermon.ministryId) : '',
        seriesId: sermon.series_id ? String(sermon.series_id) : '',
      });
    }
  }, [sermon, reset]);

  const onSubmit = async (values: SermonFormValues) => {
    try {
      await updateMutation.mutateAsync({
        id: Number(params.id),
        payload: {
          title: values.title,
          speaker: values.speaker,
          description: values.description,
          videoUrl: values.videoUrl || undefined,
          sermonDate: values.sermonDate || undefined,
          ministryId: Number(values.ministryId),
          seriesId: values.seriesId ? Number(values.seriesId) : null,
        },
      });
      router.back();
    } catch {
      // inline error handles this
    }
  };

  if (!user || !isAdmin) {
    return (
      <Screen>
        <ScreenHeader back eyebrow="Edit sermon" title="Admin access required" subtitle="Sign in with an admin account to edit sermons." />
      </Screen>
    );
  }

  const ministryOptions = (ministriesQuery.data || []).map((item: any) => ({ value: String(item.id), label: String(item.name) }));
  const seriesOptions = [
    { value: '', label: 'No series' },
    ...(seriesQuery.data || []).map((s) => ({ value: String(s.id), label: s.title })),
  ];

  return (
    <Screen>
      <ScreenHeader back eyebrow="Edit sermon" title={sermon?.title || 'Edit sermon'} />
      {!sermon ? (
        <LoadingList count={3} height={72} />
      ) : (
        <AppCard>
          <FormTextField control={control} name="title" label="Title" placeholder="Sermon title" />
          <FormTextField control={control} name="speaker" label="Speaker" placeholder="Speaker" />
          <FormTextField control={control} name="description" label="Description" placeholder="Sermon description" multiline />
          <FormTextField control={control} name="videoUrl" label="Video URL" placeholder="Optional video link" autoCapitalize="none" />
          <FormTextField
            control={control}
            name="sermonDate"
            label="Sermon date"
            placeholder="2026-04-20T09:00:00.000Z"
            hint="ISO format, for example 2026-04-20T09:00:00.000Z"
            autoCapitalize="none"
          />
          {ministryOptions.length > 0 ? (
            <Controller
              control={control}
              name="ministryId"
              render={({ field: { value, onChange } }) => (
                <ChoiceField label="Ministry" options={ministryOptions} value={value} onChange={onChange} />
              )}
            />
          ) : (
            <FormTextField control={control} name="ministryId" label="Ministry ID" placeholder="Numeric ministry ID" keyboardType="number-pad" />
          )}
          <ChoiceField
            label="Series"
            options={seriesOptions}
            value={selectedSeriesId}
            onChange={(value) => setValue('seriesId', value)}
          />
          <AppButton label="Save changes" onPress={handleSubmit(onSubmit)} />
          {updateMutation.isError ? (
            <FormMessage tone="danger">{getApiErrorMessage(updateMutation.error, 'Failed to update sermon.')}</FormMessage>
          ) : null}
        </AppCard>
      )}
    </Screen>
  );
}
```

- [ ] **Step 20: Settings**

Replace `mobile/src/app/admin-settings.tsx` with:

```tsx
import React from 'react';
import { useForm } from 'react-hook-form';

import { AdminShell } from '@/components/admin-shell';
import { FormMessage, FormTextField, LoadingList, Screen, ScreenHeader } from '@/components/kit';
import { AppText } from '@/components/ui/app-text';
import { AppButton } from '@/components/ui/button';
import { AppCard } from '@/components/ui/card';
import { getApiErrorMessage, useAdminSettings, useUpdateAdminSettings } from '@/hooks/use-api';
import { useAuthStore } from '@/store/auth';

type SettingsFormValues = {
  siteTitle: string;
  contactEmail: string;
  paymentPublicKey: string;
  donationSuccessMessage: string;
};

export default function AdminSettingsScreen() {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'admin';
  const settingsQuery = useAdminSettings(isAdmin);
  const updateMutation = useUpdateAdminSettings();
  const { control, handleSubmit, reset } = useForm<SettingsFormValues>({
    defaultValues: {
      siteTitle: '',
      contactEmail: '',
      paymentPublicKey: '',
      donationSuccessMessage: '',
    },
  });

  React.useEffect(() => {
    if (settingsQuery.data) {
      reset({
        siteTitle: settingsQuery.data.siteTitle || '',
        contactEmail: settingsQuery.data.contactEmail || '',
        paymentPublicKey: settingsQuery.data.paymentPublicKey || '',
        donationSuccessMessage: settingsQuery.data.donationSuccessMessage || '',
      });
    }
  }, [reset, settingsQuery.data]);

  const onSubmit = async (values: SettingsFormValues) => {
    try {
      await updateMutation.mutateAsync(values);
    } catch {
      // Inline error handles this.
    }
  };

  if (!user || !isAdmin) {
    return (
      <Screen>
        <ScreenHeader
          back
          eyebrow="Admin settings"
          title="Admin access required"
          subtitle="Sign in with an admin account to manage platform settings from mobile."
        />
      </Screen>
    );
  }

  const statusMessage = updateMutation.isSuccess
    ? 'Settings saved successfully.'
    : updateMutation.isError
      ? getApiErrorMessage(updateMutation.error, 'Failed to save settings.')
      : '';

  return (
    <AdminShell activeTab="/admin-settings">
      <ScreenHeader back eyebrow="Admin" title="Settings" />

      <AppCard>
        <AppText variant="section">Site configuration</AppText>
        <AppText variant="small" tone="muted">
          Edit the title, contact email, payment key, and donation success message.
        </AppText>
        {settingsQuery.isLoading ? (
          <LoadingList count={4} height={44} />
        ) : (
          <>
            <FormTextField control={control} name="siteTitle" label="Site title" placeholder="ANT PRESS" />
            <FormTextField
              control={control}
              name="contactEmail"
              label="Contact email"
              placeholder="team@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <FormTextField
              control={control}
              name="paymentPublicKey"
              label="Payment public key"
              placeholder="Public payment key"
              autoCapitalize="none"
            />
            <FormTextField
              control={control}
              name="donationSuccessMessage"
              label="Donation success message"
              placeholder="Thank you for your donation."
              multiline
            />
            <AppButton label="Save settings" onPress={handleSubmit(onSubmit)} />
            {statusMessage ? (
              <FormMessage tone={updateMutation.isSuccess ? 'success' : 'danger'}>{statusMessage}</FormMessage>
            ) : null}
          </>
        )}
      </AppCard>
    </AdminShell>
  );
}
```

Removed (Ruling 9): the no-op settings icon and the "Config: Live / Mode: Admin" metrics. The placeholders are examples, not secrets.

- [ ] **Step 21: Members**

Replace `mobile/src/app/admin-users.tsx` with:

```tsx
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AdminShell } from '@/components/admin-shell';
import { Avatar, LoadingList, Screen, ScreenHeader, SectionHeader, StatGrid, StatTile } from '@/components/kit';
import { AppText } from '@/components/ui/app-text';
import { AppBadge } from '@/components/ui/badge';
import { AppButton } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Corner, Space } from '@/constants/tokens';
import { useAdminUsers, useUpdateUserRole } from '@/hooks/use-api';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useAuthStore } from '@/store/auth';

export default function AdminUsersScreen() {
  const { colors } = useAppTheme();
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'admin';
  const usersQuery = useAdminUsers(isAdmin);
  const updateRoleMutation = useUpdateUserRole();

  if (!user || !isAdmin) {
    return (
      <Screen>
        <ScreenHeader
          back
          eyebrow="Admin users"
          title="Admin access required"
          subtitle="Sign in with an admin account to manage user roles from mobile."
        />
      </Screen>
    );
  }

  const users = usersQuery.data || [];

  const total = users.length;
  const admins = users.filter((item: any) => String(item?.role || '').toLowerCase() === 'admin').length;
  const members = users.filter((item: any) => String(item?.role || '').toLowerCase() === 'member').length;

  return (
    <AdminShell activeTab="/admin-users">
      <ScreenHeader back eyebrow="Admin" title="Members" />

      <StatGrid minTileWidth={96}>
        <StatTile label="Total" value={String(total)} icon="people-outline" />
        <StatTile label="Admins" value={String(admins)} icon="shield-outline" />
        <StatTile label="Members" value={String(members)} icon="person-outline" />
      </StatGrid>

      <SectionHeader title="Recent users" />
      {usersQuery.isLoading ? (
        <LoadingList count={4} height={96} />
      ) : users.length > 0 ? (
        <View style={[styles.list, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {users.slice(0, 12).map((item: any, index: number) => {
            const name = [item?.first_name || item?.firstName, item?.last_name || item?.lastName]
              .filter(Boolean)
              .join(' ');
            const currentRole = String(item?.role || 'member');
            const nextRole = currentRole === 'admin' ? 'member' : 'admin';
            const initials = (name || item?.email || 'U')
              .split(' ')
              .map((part: string) => part[0])
              .join('')
              .slice(0, 2)
              .toUpperCase();

            return (
              <View
                key={String(item?.id)}
                style={[styles.userRow, index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}>
                <View style={styles.userMain}>
                  <Avatar initials={initials} size={40} tone={currentRole === 'admin' ? 'gold' : 'primary'} />
                  <View style={styles.flex}>
                    <AppText variant="bodyStrong" numberOfLines={1}>
                      {name || item?.email || 'User account'}
                    </AppText>
                    <AppText variant="small" tone="muted" numberOfLines={1}>
                      {item?.email || 'No email available'}
                    </AppText>
                  </View>
                  <AppBadge tone={currentRole === 'admin' ? 'gold' : 'neutral'}>{currentRole}</AppBadge>
                </View>
                <AppButton
                  label={`Make ${nextRole}`}
                  size="sm"
                  variant="secondary"
                  onPress={() => updateRoleMutation.mutate({ id: Number(item?.id), role: nextRole })}
                />
              </View>
            );
          })}
        </View>
      ) : (
        <EmptyState icon="people-outline" title="No users available" />
      )}
    </AdminShell>
  );
}

const styles = StyleSheet.create({
  list: { borderWidth: 1, borderRadius: Corner.card, overflow: 'hidden' },
  userRow: { padding: Space.md, gap: Space.sm },
  userMain: { flexDirection: 'row', alignItems: 'center', gap: Space.sm + 4 },
  flex: { flex: 1, gap: 2 },
});
```

Removed (Ruling 9): the no-op "add member" icon. The role is shown both by the badge text and the avatar tone.

- [ ] **Step 22: Scans, lint and type-check**

```bash
cd mobile
F='src/components/admin-shell.tsx src/app/admin.tsx src/app/admin-analytics.tsx src/app/admin-announcements.tsx src/app/admin-attendance.tsx src/app/admin-audit.tsx src/app/admin-devotionals.tsx src/app/admin-donations.tsx src/app/admin-events.tsx src/app/admin-events/[id].tsx src/app/admin-gallery.tsx src/app/admin-gallery/[id].tsx src/app/admin-live.tsx src/app/admin-news.tsx src/app/admin-news/[id].tsx src/app/admin-series.tsx src/app/admin-sermons.tsx src/app/admin-sermons/[id].tsx src/app/admin-settings.tsx src/app/admin-users.tsx'
for f in $F; do grep -nE "#[0-9A-Fa-f]{3,8}\b|rgba?\(" "$f"; grep -nE "brand-ui|themed-text|themed-view|hooks/use-theme'|constants/theme'" "$f"; done
```
Expected: no output.

Run: `cd mobile && npm run -s lint && npx tsc --noEmit && echo mobile-ok`
Expected: `mobile-ok`.

- [ ] **Step 23: Action inventory re-check (Review Focus 4)**

Re-run the Step 1 command, writing `../p8d-admin-actions-after.txt`, then compare:
```bash
cd mobile && grep -nE "mutate\(|mutateAsync\(|Alert\.alert\(|router\.(push|replace|back)\(|pickImage|pickPhotos|uploadPhotos|confirmDelete|onDelete|onPublish|startEdit|resetForm|addGuest|checkInMember|undo\(|onStart|onEnd|onSend|onCreate|onSave|clearSession" src/app/admin*.tsx "src/app/admin-events/[id].tsx" "src/app/admin-gallery/[id].tsx" "src/app/admin-news/[id].tsx" "src/app/admin-sermons/[id].tsx" src/components/admin-shell.tsx | sed -E 's/^([^:]+):[0-9]+:/\1: /' | sed -E 's/[[:space:]]+/ /g' | sort > ../p8d-admin-actions-after.txt
diff ../p8d-admin-actions-before.txt ../p8d-admin-actions-after.txt
```
Read every `<` line (present before, missing after). Each one must be one of:
- a line whose call still exists but moved or was rewrapped (find it among the `>` lines, same call and arguments), or
- one of the expected rewrites: `router.back()` inside a removed custom back button (now done by `ScreenHeader back`), or `router.replace('/login')`/`'/account'` now passed as `onSignIn`/`onPress` with the same target.

Any other missing `mutate(`, `Alert.alert(` or `router.push(` is a lost action: restore it before committing. When done, delete both note files:
```bash
rm ../p8d-admin-actions-before.txt ../p8d-admin-actions-after.txt
```

- [ ] **Step 24: By-eye check (user, light and dark), then commit**

Sign in as an admin. In both phone themes:

Shell:
- The bottom admin bar is docked, card-coloured, with six items (Dashboard, Members, Sermons, Events, Finance, Settings). Each label is fully readable (it may shrink slightly); the active item is primary-coloured; each is about 56 tall.

Dashboard:
- Real initials, Sign out (ghost), four stat tiles, Needs attention rows with number badges.
- Twelve shortcuts under Content / Church life / People and giving / Overview and settings; each opens.
- Recent activity with "View all" opening the Activity log.

Members:
- Three tiles; each user row has an avatar, name, email, a role badge with words, and "Make admin/member" (changes the role).

Sermons:
- The form with ministry chips; Create; recent sermon cards with Edit (opens edit) and Delete (red).

Edit sermon:
- Fields filled; ministry and series chips; Save returns.

Series:
- Create/edit/cancel; Delete asks to confirm.

Events (admin):
- Create; Edit opens the edit screen; Delete (red).

Edit event:
- Cover image add/change/remove; Save returns.

Attendance:
- The event list opens check-in (back returns to the list).
- Registered rows' "Check in" / "Undo"; member search; add guest; walk-ins with Undo; the cancelled-event message.

Finance:
- The total card, tiles, donation cards with status badges, "Mark completed" and "Mark failed" (red) on pending ones.

Settings:
- Fields fill; Save shows the green or red panel.

Devotionals:
- The form; Edit, Publish / Publish & notify, Delete (confirm).

News (admin):
- Create with three switches; Edit / Delete; the edit screen with switches; Save returns.

Gallery (admin):
- Create a draft opens the album.
- Album: details, event chips, Published switch, Save; Add photos with progress; Retry failed; star/trash buttons (44×44, confirm on delete); Delete album (confirm, returns to the list).

Livestream:
- Status (red "Live now" badge with words when live); Go live / Update links; End livestream (red, confirm).

Announcements:
- Audience chips, target chips, Title/Message, Send; the sent list.

Analytics and Activity log:
- Readable tiles and rows.

Then commit:
```bash
git add mobile/src/components/admin-shell.tsx mobile/src/app/admin.tsx mobile/src/app/admin-analytics.tsx mobile/src/app/admin-announcements.tsx mobile/src/app/admin-attendance.tsx mobile/src/app/admin-audit.tsx mobile/src/app/admin-devotionals.tsx mobile/src/app/admin-donations.tsx mobile/src/app/admin-events.tsx mobile/src/app/admin-events mobile/src/app/admin-gallery.tsx mobile/src/app/admin-gallery mobile/src/app/admin-live.tsx mobile/src/app/admin-news.tsx mobile/src/app/admin-news mobile/src/app/admin-series.tsx mobile/src/app/admin-sermons.tsx mobile/src/app/admin-sermons mobile/src/app/admin-settings.tsx mobile/src/app/admin-users.tsx
git status --short
git commit -m "feat(mobile): admin shell and every admin screen on tokens

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
`git status --short` before committing must show no `p8d-admin-actions-*.txt` files.

---

### Task 10: Retire the legacy theme, whole-app checks and docs

**Files:**
- Delete: `mobile/src/components/brand-ui.tsx`, `themed-text.tsx`, `themed-view.tsx`, `hint-row.tsx`, `web-badge.tsx`, `ui/collapsible.tsx`
- Delete: `mobile/src/hooks/use-theme.ts`, `mobile/src/hooks/use-color-scheme.ts`, `mobile/src/hooks/use-color-scheme.web.ts`
- Delete: `mobile/src/constants/theme.ts` (this removes `Colors`, `Fonts`, `Spacing`, `Radius`, `BottomTabInset`, `MaxContentWidth`), `mobile/src/global.css`
- Modify: `mobile/src/constants/tokens.ts` (comment line 2 only)
- Append: `docs/qa-checklist.md`, `docs/features.md`

**Interfaces:**
- Consumes: Tasks 1–9 complete; nothing in `src` imports a legacy module.
- Produces: the end state of Ruling 5. `useAppTheme()` and `Palette` are the only colour source; `useTheme()` and `Colors` no longer exist.

- [ ] **Step 1: Prove nothing still uses the legacy modules**

```bash
cd mobile && grep -rnE "brand-ui|themed-text|themed-view|hint-row|web-badge|ui/collapsible|hooks/use-theme'|hooks/use-color-scheme|constants/theme'|global\.css" src
```
Expected: no output. If a file shows up, it was missed in Tasks 1–9: migrate it in the owning task's style before going on. (`expo-badge*.png` assets used by `web-badge.tsx` stay in `assets/`; they are harmless.)

- [ ] **Step 2: Delete the legacy files**

```bash
git rm mobile/src/components/brand-ui.tsx mobile/src/components/themed-text.tsx mobile/src/components/themed-view.tsx mobile/src/components/hint-row.tsx mobile/src/components/web-badge.tsx mobile/src/components/ui/collapsible.tsx mobile/src/hooks/use-theme.ts mobile/src/hooks/use-color-scheme.ts mobile/src/hooks/use-color-scheme.web.ts mobile/src/constants/theme.ts mobile/src/global.css
```

Then, in `mobile/src/constants/tokens.ts`, replace the comment on line 2:
```ts
// New UI uses these through useAppTheme(); legacy screens still use Colors/useTheme until phase 8d.
```
with:
```ts
// Every screen reads these through useAppTheme() (phase 8d retired the old Colors/useTheme palette).
```
No value in `tokens.ts` changes.

- [ ] **Step 3: Route check against the starting commit (Review Focus 2)**

List every route-like string literal before (at `fc3fd49`) and now, and show those that disappeared:
```bash
git grep -hoE "[\"'\`]/[A-Za-z0-9_/\[\]-]*" fc3fd49 -- mobile/src | cut -c2- | sort -u > ../p8d-routes-before.txt
grep -rhoE "[\"'\`]/[A-Za-z0-9_/\[\]-]*" mobile/src | cut -c2- | sort -u > ../p8d-routes-after.txt
comm -23 ../p8d-routes-before.txt ../p8d-routes-after.txt
```
Expected: only `/give`, which was in the deleted, unused `app-tabs*.tsx` files; the Give tab file `(tabs)/give.tsx` still exists. Nothing else may be listed. Every other target (`/sermons`, `/account`, `/events/`, `/donate`, `/news`, `/gallery`, `/small-groups`, `/prayer-wall`, `/daily-devotional`, `/admin-…`, `/login`, `/register`, …) must still appear somewhere. Also confirm that the route files are all still there:
```bash
ls "mobile/src/app/(tabs)"
```
Expected: `_layout.tsx  account.tsx  events.tsx  give.tsx  index.tsx  news.tsx  sermons.tsx`. Then:
```bash
rm ../p8d-routes-before.txt ../p8d-routes-after.txt
```

- [ ] **Step 4: Whole-scope colour scan (spec §5, §6)**

```bash
grep -rnE "#[0-9A-Fa-f]{3,8}\b|rgba?\(" mobile/src | grep -v "^mobile/src/constants/tokens.ts:"
```
Expected: no output. (`app.json`'s splash and adaptive-icon colours are native build config outside `src` and outside this scan; they are left as they are.)

- [ ] **Step 5: Lint and type-check**

```bash
rm -rf mobile/.expo/cache/eslint
cd mobile && npm run -s lint && npx tsc --noEmit && echo mobile-ok
```
Expected: `mobile-ok`.

- [ ] **Step 6: Docs (appends only)**

Append to the end of `docs/qa-checklist.md`:

```markdown

## Mobile App Redesign (Phase 8d)

Check each item on a phone or simulator twice: with the phone in Light mode and again in Dark mode.

- [ ] The bottom tabs read Home · Watch · Events · Give · Me, and every tab, the bar and the status bar match the phone's theme
- [ ] Home shows the greeting, the live card (only while live), today's devotional, eight tiles (Live, Devotional, Small groups, Prayer wall, Gallery, News, Community, Ministries) and up to three upcoming events; every tile opens its screen
- [ ] Watch shows the live card while live, series chips that filter, the latest sermon and recent messages; Search opens from the icon
- [ ] Me shows the profile, my groups, my registrations, activity, settings and help, Admin (admins only) and Sign out with a confirm dialog
- [ ] Links into the app still land on the same screens: a push for an event, album, devotional, prayer or news item; `/donate?reference=…` after Paystack
- [ ] No screen has white text on a white card or navy text on a navy background; every status badge has a word, not just a colour
- [ ] Every button, chip, tab and icon button is easy to tap (at least 44 points), including the photo viewer arrows and the album star/trash icons
- [ ] Admin: every create, edit, delete, publish, check-in, undo, role, status, upload, cover, go-live and end action still works and asks for confirmation where it did before
- [ ] Loading shows grey placeholders, empty lists show a friendly message, and turning on airplane mode shows "Could not load" with "Try again"
```

Append to the end of `docs/features.md`:

```markdown

## Mobile App Design (Phase 8d)

- The app uses the Clean & classic design (white and navy, with royal blue and a touch of gold) and follows the phone's Light or Dark setting.
- Five tabs: **Home** (the hub), **Watch** (live, sermons and series), **Events**, **Give** and **Me** (profile, groups, registrations, giving, notifications, settings, admin).
- Home matches the website hub: a greeting, the live card while live, today's devotional, tiles for Live, Devotional, Small groups, Prayer wall, Gallery, News, Community and Ministries, then upcoming events.
- Every screen, including the mobile admin console, shares one set of building blocks (`mobile/src/components/kit` on top of `mobile/src/components/ui`), so headers, lists, forms, empty states and dialogs look and behave the same everywhere.
```

- [ ] **Step 7: Full by-eye pass (user, light and dark)**

Walk the whole app once in each theme:
- the five tabs
- Home → each tile
- Watch → a sermon → Search
- Events → an event → photos
- Give → history
- Me → profile, dashboard, notifications, prayer requests, help pages, sign out and in
- as an admin, the console and two content screens

Confirm there is no leftover dark-orange/purple screen, no unreadable text and no lost button. Note anything odd in the ledger as `Ruling: <screen> — <what> — <why it stands or fix>`.

- [ ] **Step 8: Commit**

```bash
git add -A mobile/src docs/qa-checklist.md docs/features.md
git status --short
git commit -m "chore(mobile): retire the legacy dark theme (Colors, useTheme, brand-ui, themed views); docs for the redesigned app

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
`git status --short` must not list any `p8d-*.txt` note files or anything outside `mobile/src` and the two docs.

---

## Self-Review (done while writing this plan)

- **Spec coverage:**
  - §3.2 tabs and Home → Tasks 1 and 2.
  - Watch = sermons + live card + series → Task 3.
  - Me contents → Task 6.
  - "screens outside the tabs open from Home tiles or Me" → Home tiles (Task 2), Me (Task 6).
  - §4 "8d every screen restyled in light and dark, mobile admin restyled" → Tasks 2–9 cover all 52 route files:
    - the tab roots, plus `give.tsx` and `sermons.tsx`, which re-export screens restyled in Tasks 5 and 3
    - `_layout.tsx` files in Tasks 1 and 6
  - §5 lint, tsc and light/dark checks → every task.
  - §5 no hard-coded colours → per-task scans and Task 10 Step 4.
  - §6 parallel-stage risk: no file in `components/ui` or outside `mobile/` and the two docs is touched; new shared pieces live in `components/kit`.
- **Placeholder scan:** every screen step contains its full replacement file. The only conditional notes are named fallbacks for a specific possible `tsc`/lint message.
- **Type consistency:**
  - The kit names used in Tasks 2–9 match Task 1's exports. Checked: `Screen`, `ScreenHeader(back|onBack|eyebrow|subtitle|right)`, `SectionHeader(actionLabel, onAction)`, `ListRow(trailing|value|description|tone)`, `ChipGroup(scroll)`, `UnderlineTabs`, `StatGrid(minTileWidth)`, `ConfirmDialog`, `FormTextField(hint)`, `ChoiceField`, `SwitchRow`, `CheckboxRow`, `FormMessage`, `LoadingList`, `ErrorState`, `SignInPrompt(icon,label)`, `Avatar(tone)`, `MediaFrame(uri,radius,accessibilityLabel)`, `Scripture(lines)`, `statusTone`, `Fixed`, `MAX_CONTENT_WIDTH`.
  - `AppButton` `size="sm"`, `loading` and `icon`, `AppBadge` string children, and `AppCard` `style`/`onPress`/`accessibilityLabel` exist in 8a.
- **Review Focus:** each item names its owning check (scans and ordering; the Task 1/10 route checks; the per-task light/dark checklists; the Task 9 action inventory; kit `MIN_TOUCH` plus the checklists).
