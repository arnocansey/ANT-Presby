# Phase 8a: UI Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the shared design system and the new navigation, so that later stages (8b public site, 8c admin, 8d mobile) are mostly composition. That means:
- Clean & classic colour tokens (light and dark) on web and app
- the Inter and Source Serif fonts
- web theme switching that follows the device
- restyled and new UI components
- the new website header and footer
- the hub Home page
- the app's token-based primitives

**Architecture:**
- **Web colour tokens:** CSS variables (`R G B` triplets) in `frontend/src/styles/tokens.css`, mapped in `tailwind.config.js` to semantic colours (`bg-background`, `bg-surface`, `text-foreground`, `text-muted`, `bg-primary`, `text-link`, `gold`, `success`/`warning`/`danger`). `.dark` swaps the values.
- **Theme switching:** `next-themes` (already installed) puts the `dark` class on `<html>`, following the system by default.
- **Components:** shared components live in `frontend/src/components/ui`; the old variant names keep working.
- **Mobile:** the app gets the same palette in `mobile/src/constants/tokens.ts`, a new `useAppTheme()` that follows the device, and token-based primitives in `mobile/src/components/ui/`. Existing screens keep using the old `useTheme()` until 8d migrates them, so nothing becomes unreadable in between.

**Tech Stack:**
- Web: Next.js 16 (App Router), Tailwind 3.4, `class-variance-authority`, Radix (`@radix-ui/react-slot`, `react-label`, `react-dropdown-menu`), `next-themes` 0.2, `lucide-react` 0.294, `next/font/google`
- Mobile: Expo SDK 55, React Native

**Spec:** `docs/superpowers/specs/2026-10-08-ui-ux-redesign-design.md` (§2 design system, §3.1 website navigation, §3.2 app tokens, §4 stage 8a, §5 quality bar).

## Global Constraints

- **No behaviour changes:** no API, data or route changes. Every existing URL keeps working. The backend is not touched.
- **Colours come from tokens:** new or rewritten markup uses token classes only (`bg-background`, `bg-surface`, `bg-card`, `border-border`, `border-input`, `text-foreground`, `text-muted`, `bg-primary`, `text-primary-foreground`, `text-link`, `bg-gold`, `bg-gold-soft`, `text-gold-ink`, `text-success`, `text-warning`, `text-danger`, `bg-danger-solid`, `ring-ring`). No `sky-`, `cyan-`, `amber-`, `slate-`, `gray-` or hex colours in files this phase writes or rewrites.
- **Token values, as `R G B`:**

  | Token | Light | Dark |
  |---|---|---|
  | `background` | `255 255 255` | `11 21 48` |
  | `surface` | `246 248 252` | `18 32 74` |
  | `card` | `255 255 255` | `18 32 74` |
  | `border` | `230 234 242` | `31 47 92` |
  | `input` | `203 211 228` | `42 59 110` |
  | `foreground` | `19 34 74` | `238 242 251` |
  | `muted` | `86 96 122` | `169 180 208` |
  | `primary` | `30 58 138` | `111 143 232` |
  | `primary-hover` | `23 46 110` | `140 166 238` |
  | `primary-foreground` | `255 255 255` | `11 21 48` |
  | `link` | `30 58 138` | `157 180 242` |
  | `gold` | `201 162 39` | `227 195 90` |
  | `gold-soft` | `251 246 229` | `58 50 20` |
  | `gold-ink` | `122 98 22` | `227 195 90` |
  | `success` | `21 128 61` | `74 222 128` |
  | `warning` | `180 83 9` | `251 191 36` |
  | `danger` (text) | `185 28 28` | `248 113 113` |
  | `danger-solid` (button) | `185 28 28` | `239 68 68` |
  | `danger-solid-foreground` | `255 255 255` | `11 21 48` |
  | `ring` | `30 58 138` | `157 180 242` |

  - **Ruling 1:** the spec's dark `danger` #EF4444 is 4.19:1 on dark surfaces, which is below AA. Text uses #F87171 (5.70:1) instead. #EF4444 stays for dark danger buttons, where dark text on it reaches 4.79:1.
- **Fonts:** Inter for the UI, and Source Serif 4 for scripture and quotes, both through `next/font/google` as CSS variables `--font-inter` and `--font-serif`.
- **Accessibility:**
  - Every text/background token pair is AA (4.5:1), enforced by `frontend/scripts/check-contrast.mjs`.
  - A visible focus ring (`ring-2 ring-ring ring-offset-2 ring-offset-background`) on all controls.
  - Touch targets of at least 44px (`h-11`).
  - Motion is disabled under `prefers-reduced-motion`; that rule already exists, so keep it.
- **Navigation (spec §3.1):**
  - Header links Home `/`, Watch `/sermons`, Events `/events`, About `/about`, plus a Give button (`/donate`).
  - Hub tiles: Live `/live`, Devotional `/devotionals`, Small groups `/groups`, Prayer wall `/prayer/wall`, Gallery `/gallery`, News `/news`, Community `/community`, Ministries `/ministries`, and My dashboard `/dashboard` when signed in.
- **Mobile, Ruling 2:** `useTheme()` and the `Colors` export stay exactly as they are in 8a. New code uses `useAppTheme()`. Reason: existing screens hard-code white text and translucent white backgrounds, so switching them to a light palette now would make them unreadable until 8d.
- **Dependencies:** none new, on web or mobile.
- **Commits:** every commit message ends with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- **Secrets:** never write secrets into any file. This phase has none.

## Review Focus

1. **Dark mode on pages 8a doesn't restyle.** Existing pages still use `dark:` slate classes. With `next-themes` set to system, a dark-mode device now actually sees them, so the user should check representative old pages (events, donate, admin dashboard) for unreadable text. *(Task 2 lists the pages to check.)*
2. **Hydration and theme flash.** Toggling the theme or reloading must not flash the wrong theme or log hydration warnings. That needs `suppressHydrationWarning` on `<html>` and `attribute="class"`. *(Task 2)*
3. **Backwards-compatible button variants.** Existing `variant="default" | "destructive" | "outline" | "secondary" | "ghost" | "link"` and `size="default" | "sm" | "lg" | "icon"` still render correctly across all 59 pages. *(Task 3: type-check plus the build.)*
4. **Header on a 375px phone.** The menu button, Give, the theme toggle and account access are all reachable. The slide-over traps nothing, closes on route change and on Escape, and lists every hub destination. *(Task 4)*
5. **Hub Home with no data or an API error.** No events, no sermons, no devotional, or a failed request shows friendly empty states, never a blank or broken page. *(Task 5)*

---

## File Map

| File | Change | Responsibility |
|---|---|---|
| `frontend/src/styles/tokens.css` | Create | Light and dark CSS variables |
| `frontend/scripts/check-contrast.mjs` | Create | Fails if any token pair is below WCAG AA |
| `frontend/package.json` | Modify | `check:contrast` script |
| `frontend/tailwind.config.js` | Modify | Semantic colour and font mapping |
| `frontend/src/styles/globals.css` | Modify | Import tokens; base, focus and selection; utility classes on tokens |
| `frontend/src/app/layout.tsx` | Modify | Fonts, `suppressHydrationWarning`, theme colour |
| `frontend/src/components/app/Providers.tsx` | Modify | `ThemeProvider`; toaster styled to tokens |
| `frontend/src/components/ui/theme-toggle.tsx` | Create | System / Light / Dark menu |
| `frontend/src/components/ui/button.tsx`, `card.tsx`, `input.tsx`, `textarea.tsx`, `label.tsx`, `table.tsx`, `dropdown-menu.tsx`, `confirm-dialog.tsx` | Modify | Restyle to tokens; keep the existing API |
| `frontend/src/components/ui/badge.tsx`, `page-header.tsx`, `section.tsx`, `tile.tsx`, `empty-state.tsx`, `skeleton.tsx`, `select.tsx`, `tabs.tsx`, `scripture.tsx` | Create | New shared components |
| `frontend/src/components/layout/Header.tsx`, `Footer.tsx`, `LiveBanner.tsx` | Rewrite / Modify | New navigation |
| `frontend/src/lib/navigation.ts` | Create | One source for header, footer and hub links |
| `frontend/src/app/page.tsx`, `frontend/src/components/devotionals/TodayDevotionalCard.tsx` | Rewrite | Hub Home |
| `mobile/src/constants/tokens.ts` | Create | App palette (light/dark), type scale, radii |
| `mobile/src/hooks/use-app-theme.ts` | Create | Device-following palette |
| `mobile/src/components/ui/button.tsx`, `card.tsx`, `badge.tsx`, `tile.tsx`, `empty-state.tsx`, `skeleton.tsx`, `text-field.tsx`, `app-text.tsx` | Create | App primitives |
| `mobile/app.json` | Modify | `userInterfaceStyle: "automatic"` |
| `docs/design-system.md` | Create | Tokens and components reference for 8b–8d |

---

### Task 1: Design tokens, contrast check, Tailwind mapping, global styles and fonts

**Files:**
- Create: `frontend/src/styles/tokens.css`, `frontend/scripts/check-contrast.mjs`
- Modify: `frontend/package.json`, `frontend/tailwind.config.js`, `frontend/src/styles/globals.css`, `frontend/src/app/layout.tsx`

**Interfaces:**
- Produces:
  - Tailwind colours `background`, `surface`, `card`, `border`, `input`, `foreground`, `muted`, `primary` (`DEFAULT`, `hover`, `foreground`), `link`, `gold` (`DEFAULT`, `soft`, `ink`), `success`, `warning`, `danger` (`DEFAULT`, `solid`, `solid-foreground`), `ring`
  - Font families `font-sans` (Inter) and `font-serif` (Source Serif 4)
  - The `npm run check:contrast` command
  - Existing utility classes `.container-max`, `.text-ui-muted`, `.text-ui-subtle`, `.gradient-primary`, `.gradient-text` and `.glass-effect` keep their names, now built on tokens

- [ ] **Step 1: Branch and baseline**

You are on branch `feature/ui-foundation` (made from `main`, holding the spec commit `599c4f5`). Leave the user's uncommitted `backend/pnpm-workspace.yaml`, `frontend/next-env.d.ts` and `frontend/package-lock.json` alone, and never commit them. Commit this plan, then record the baseline:

```bash
git add docs/superpowers/plans/2026-10-08-phase-8a-ui-foundation.md && git commit -m "docs: phase 8a UI foundation plan

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
cd frontend && npm run -s type-check && npm run -s lint && echo web-baseline-ok
cd ../mobile && npm run -s lint && npx tsc --noEmit && echo mobile-baseline-ok
```

Expected: `web-baseline-ok` and `mobile-baseline-ok`. If mobile lint reports `expo-notifications` as unresolved, run `npm ci --no-audit --no-fund` in `mobile/` (the lockfile is unchanged), delete `mobile/.expo/cache/eslint`, and re-run.

- [ ] **Step 2: Write the failing contrast check**

Create `frontend/scripts/check-contrast.mjs`:

```js
// Fails (exit 1) if any text/background pair in src/styles/tokens.css is below WCAG AA (4.5:1).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const file = fileURLToPath(new URL('../src/styles/tokens.css', import.meta.url));
let css;
try {
  css = readFileSync(file, 'utf8');
} catch {
  console.error(`Missing ${file}`);
  process.exit(1);
}

const block = (selector) => {
  const start = css.indexOf(`${selector} {`);
  if (start < 0) throw new Error(`No "${selector}" block in tokens.css`);
  const body = css.slice(start, css.indexOf('}', start));
  return Object.fromEntries(
    [...body.matchAll(/--([a-z-]+):\s*(\d+)\s+(\d+)\s+(\d+);/g)].map((m) => [m[1], [m[2], m[3], m[4]].map(Number)])
  );
};

const luminance = (rgb) => {
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

// [text, background] pairs that carry readable text.
const PAIRS = [
  ['foreground', 'background'],
  ['foreground', 'surface'],
  ['foreground', 'card'],
  ['muted', 'background'],
  ['muted', 'surface'],
  ['muted', 'card'],
  ['primary-foreground', 'primary'],
  ['link', 'background'],
  ['link', 'surface'],
  ['gold-ink', 'gold-soft'],
  ['success', 'background'],
  ['success', 'surface'],
  ['warning', 'background'],
  ['warning', 'surface'],
  ['danger', 'background'],
  ['danger', 'surface'],
  ['danger-solid-foreground', 'danger-solid'],
];

let failures = 0;
for (const [theme, selector] of [['light', ':root'], ['dark', '.dark']]) {
  const tokens = block(selector);
  for (const [text, bg] of PAIRS) {
    if (!tokens[text] || !tokens[bg]) {
      console.error(`${theme}: missing --${!tokens[text] ? text : bg}`);
      failures += 1;
      continue;
    }
    const value = ratio(tokens[text], tokens[bg]);
    if (value < 4.5) {
      console.error(`${theme}: ${text} on ${bg} is ${value.toFixed(2)}:1 (needs 4.5)`);
      failures += 1;
    }
  }
}

if (failures > 0) {
  console.error(`${failures} contrast problem(s)`);
  process.exit(1);
}
console.log(`All ${PAIRS.length * 2} token pairs meet WCAG AA.`);
```

In `frontend/package.json` `scripts`, add this entry directly after the `"type-check"` entry:

```json
    "check:contrast": "node scripts/check-contrast.mjs",
```

Run: `cd frontend && npm run -s check:contrast`
Expected: FAIL, `Missing …/src/styles/tokens.css`, exit 1.

- [ ] **Step 3: Create the tokens**

Create `frontend/src/styles/tokens.css`:

```css
/* Clean & classic design tokens (R G B triplets, used as rgb(var(--x) / <alpha>)).
   Light is the default; .dark (set by next-themes) swaps the values. See docs/design-system.md. */
:root {
  --background: 255 255 255;
  --surface: 246 248 252;
  --card: 255 255 255;
  --border: 230 234 242;
  --input: 203 211 228;
  --foreground: 19 34 74;
  --muted: 86 96 122;
  --primary: 30 58 138;
  --primary-hover: 23 46 110;
  --primary-foreground: 255 255 255;
  --link: 30 58 138;
  --gold: 201 162 39;
  --gold-soft: 251 246 229;
  --gold-ink: 122 98 22;
  --success: 21 128 61;
  --warning: 180 83 9;
  --danger: 185 28 28;
  --danger-solid: 185 28 28;
  --danger-solid-foreground: 255 255 255;
  --ring: 30 58 138;
  color-scheme: light;
}

.dark {
  --background: 11 21 48;
  --surface: 18 32 74;
  --card: 18 32 74;
  --border: 31 47 92;
  --input: 42 59 110;
  --foreground: 238 242 251;
  --muted: 169 180 208;
  --primary: 111 143 232;
  --primary-hover: 140 166 238;
  --primary-foreground: 11 21 48;
  --link: 157 180 242;
  --gold: 227 195 90;
  --gold-soft: 58 50 20;
  --gold-ink: 227 195 90;
  --success: 74 222 128;
  --warning: 251 191 36;
  --danger: 248 113 113;
  --danger-solid: 239 68 68;
  --danger-solid-foreground: 11 21 48;
  --ring: 157 180 242;
  color-scheme: dark;
}
```

Run: `cd frontend && npm run -s check:contrast`
Expected: `All 34 token pairs meet WCAG AA.`

- [ ] **Step 4: Map the tokens in Tailwind**

Replace the whole of `frontend/tailwind.config.js` with:

```js
/** @type {import('tailwindcss').Config} */
// Colours are design tokens from src/styles/tokens.css, so every class works in light and dark.
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

module.exports = {
  darkMode: ['class'],
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: token('background'),
        surface: token('surface'),
        card: token('card'),
        border: token('border'),
        input: token('input'),
        foreground: token('foreground'),
        muted: token('muted'),
        primary: {
          DEFAULT: token('primary'),
          hover: token('primary-hover'),
          foreground: token('primary-foreground'),
        },
        link: token('link'),
        gold: {
          DEFAULT: token('gold'),
          soft: token('gold-soft'),
          ink: token('gold-ink'),
        },
        success: token('success'),
        warning: token('warning'),
        danger: {
          DEFAULT: token('danger'),
          solid: token('danger-solid'),
          'solid-foreground': token('danger-solid-foreground'),
        },
        ring: token('ring'),
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
      },
      borderRadius: {
        card: '12px',
        panel: '16px',
      },
      boxShadow: {
        card: '0 1px 2px rgb(19 34 74 / 0.06), 0 1px 3px rgb(19 34 74 / 0.04)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
```

- [ ] **Step 5: Global styles on tokens**

Replace the whole of `frontend/src/styles/globals.css` with:

```css
@import './tokens.css';

@tailwind base;
@tailwind components;
@tailwind utilities;

* {
  @apply border-border;
}

html,
body {
  @apply bg-background text-foreground;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  overflow-x: hidden;
}

body {
  @apply font-sans text-base leading-relaxed;
}

img,
svg,
video,
canvas,
iframe {
  max-width: 100%;
}

input,
textarea,
select,
button {
  max-width: 100%;
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
  }
}

::selection {
  @apply bg-primary/15 text-foreground;
}

:focus-visible {
  @apply outline-none ring-2 ring-ring ring-offset-2 ring-offset-background;
}

/* Scrollbar */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  @apply bg-surface;
}

::-webkit-scrollbar-thumb {
  @apply rounded-full bg-input hover:bg-muted;
}

/* Utilities kept for existing pages; now built on tokens. */
.container-max {
  @apply mx-auto max-w-7xl px-4 sm:px-6 lg:px-8;
}

.section-spacing {
  @apply py-12 sm:py-16 lg:py-20;
}

.gradient-primary {
  @apply bg-primary text-primary-foreground;
}

.gradient-text {
  @apply text-primary;
}

.glass-effect {
  @apply rounded-lg bg-background/80 backdrop-blur-md;
}

.btn-animate {
  @apply transition-colors duration-150;
}

.text-ui-muted {
  @apply text-foreground/85;
}

.text-ui-subtle {
  @apply text-muted;
}
```

- [ ] **Step 6: Fonts and the root layout**

In `frontend/src/app/layout.tsx`:

a. Add this directly after the `import { ReactNode } from 'react';` line:

```tsx
import { Inter, Source_Serif_4 } from 'next/font/google';
```

b. Add this directly after the last import line (`import '@/styles/globals.css';`):

```tsx

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const serif = Source_Serif_4({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
  style: ['normal', 'italic'],
});
```

c. Replace the `viewport` export with:

```tsx
export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#1E3A8A' },
    { media: '(prefers-color-scheme: dark)', color: '#0B1530' },
  ],
};
```

d. Replace `<html lang="en">` with:

```tsx
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${serif.variable}`}>
```

e. In the skip link, replace the class string `bg-sky-700 px-4 py-2 text-sm font-semibold text-white` with `bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground`.

- [ ] **Step 7: Check contrast, type-check, lint and build**

Run: `cd frontend && npm run -s check:contrast && npm run -s type-check && npm run -s lint && npm run -s build`
Expected:
- the contrast line passes
- no type or lint errors
- the build succeeds

`next/font/google` downloads the fonts at build time. If the build fails only because the network is unavailable, record a ruling and run the build again once the network is back. Never remove the fonts.

- [ ] **Step 8: Commit**

```bash
git add frontend/src/styles/tokens.css frontend/scripts/check-contrast.mjs frontend/package.json frontend/tailwind.config.js frontend/src/styles/globals.css frontend/src/app/layout.tsx
git commit -m "feat(web): Clean & classic design tokens, fonts and contrast check

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

Check with `git diff --cached frontend/package.json` that only the `scripts` block changed. The user's uncommitted edit is in `frontend/package-lock.json`, which is not staged here.

---

### Task 2: Theme switching (follows the device) and the theme toggle

**Files:**
- Modify: `frontend/src/components/app/Providers.tsx`
- Create: `frontend/src/components/ui/theme-toggle.tsx`

**Interfaces:**
- Consumes: the `dark` token block (Task 1).
- Produces:
  - `<ThemeToggle />` (default export): an icon button that opens a System / Light / Dark menu
  - `next-themes` keeps the choice in localStorage under `theme`, and the default is `system`

- [ ] **Step 1: Wrap the app in the theme provider**

Replace the whole of `frontend/src/components/app/Providers.tsx` with:

```tsx
'use client';

import { ReactNode, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'react-hot-toast';
import AuthBootstrap from '@/components/auth/AuthBootstrap';

export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5,
          },
        },
      }),
  );

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        <AuthBootstrap />
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'rgb(var(--card))',
              color: 'rgb(var(--foreground))',
              border: '1px solid rgb(var(--border))',
              borderRadius: '12px',
              fontSize: '14px',
            },
          }}
        />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
```

- [ ] **Step 2: Create the theme toggle**

Create `frontend/src/components/ui/theme-toggle.tsx`:

```tsx
'use client';

import * as React from 'react';
import { Check, Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const OPTIONS = [
  { value: 'system', label: 'System', icon: Monitor },
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
] as const;

// Lets members choose light, dark or "follow my device" (the default).
export default function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // The saved theme is only known in the browser; render a neutral icon until then.
  React.useEffect(() => setMounted(true), []);

  const Icon = !mounted ? Monitor : resolvedTheme === 'dark' ? Moon : Sun;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Change colour theme">
          <Icon className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {OPTIONS.map((option) => (
          <DropdownMenuItem key={option.value} onClick={() => setTheme(option.value)} className="gap-2">
            <option.icon className="h-4 w-4" />
            <span className="flex-1">{option.label}</span>
            {mounted && theme === option.value ? <Check className="h-4 w-4 text-primary" /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

The header uses the toggle (Task 4). Until then it isn't rendered anywhere, which is fine.

- [ ] **Step 3: Type-check, lint and build**

Run: `cd frontend && npm run -s type-check && npm run -s lint && npm run -s build`
Expected: all succeed.

Then run `npm run dev`, open http://localhost:3000, and check by eye:
- Set the operating system to dark mode and reload. The page background is navy (`#0B1530`) with light text, there is no white flash before it turns dark, and the browser console shows no hydration warning.
- Representative older pages (`/events`, `/donate`, `/admin/dashboard` as an admin) stay readable in dark mode. They still use their old `dark:` slate classes until 8b and 8c.

Record any page that is unreadable in dark mode in the ledger as `Ruling: <page> unreadable in dark until 8b/8c — <why it stands>`. These go to the final message as known gaps.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/app/Providers.tsx frontend/src/components/ui/theme-toggle.tsx
git commit -m "feat(web): light and dark themes that follow the device, with a theme toggle

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Shared web components

**Files:**
- Rewrite: `frontend/src/components/ui/button.tsx`, `card.tsx`, `input.tsx`, `textarea.tsx`, `label.tsx`, `confirm-dialog.tsx`, `table.tsx`
- Modify: `frontend/src/components/ui/dropdown-menu.tsx` (class strings only)
- Create: `frontend/src/components/ui/badge.tsx`, `page-header.tsx`, `section.tsx`, `tile.tsx`, `empty-state.tsx`, `skeleton.tsx`, `select.tsx`, `tabs.tsx`, `scripture.tsx`

**Interfaces:**
- Consumes: the token classes from Task 1.
- Produces:
  - Every existing export, with the same names and props: `Button` and `buttonVariants`; `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent` and `CardFooter`; `Input`; `Textarea`; `Label`; `ConfirmDialog` (default); `SimpleTable` (default) and `Column<T>`; and the dropdown-menu parts.
  - `Button`:
    - `variant` accepts `'default' | 'primary' | 'secondary' | 'outline' | 'ghost' | 'link' | 'destructive' | 'danger'`; `default` = `primary`, `destructive` = `danger`, and `outline` = `secondary`.
    - `size` accepts `'default' | 'md' | 'sm' | 'lg' | 'icon'`.
    - A new `loading?: boolean` prop.
  - `SimpleTable`: new optional `emptyMessage?: string`.
  - New components:
    - `Badge` with `{ tone?: 'neutral' | 'gold' | 'success' | 'warning' | 'danger' | 'live' }`
    - `PageHeader` with `{ title, description?, eyebrow?, actions?, breadcrumb? }`
    - `Section` with `{ title, href?, linkLabel?, children }`
    - `Tile` with `{ href, icon, label, description?, badge? }`
    - `EmptyState` with `{ icon?, title, message?, action? }`
    - `Skeleton` with `{ className? }`, plus `SkeletonCard`
    - `Select`, a styled native `<select>` that forwards its ref
    - `Tabs` with `{ tabs: { value, label }[], value, onChange }`
    - `Scripture` with `{ children, reference? }`

- [ ] **Step 1: Button**

Replace the whole of `frontend/src/components/ui/button.tsx` with:

```tsx
'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const primary = 'bg-primary text-primary-foreground shadow-sm hover:bg-primary-hover';
const secondary = 'border border-input bg-background text-foreground hover:bg-surface';
const danger = 'bg-danger-solid text-danger-solid-foreground shadow-sm hover:bg-danger-solid/90';
const md = 'h-11 px-5';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: primary,
        primary,
        secondary,
        outline: secondary,
        ghost: 'text-foreground hover:bg-surface',
        link: 'h-auto px-0 text-link underline-offset-4 hover:underline',
        destructive: danger,
        danger,
      },
      size: {
        default: md,
        md,
        sm: 'h-10 px-3 text-sm',
        lg: 'h-12 px-8 text-base',
        icon: 'h-11 w-11',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, disabled, children, ...props }, ref) => {
    if (asChild) {
      return (
        <Slot className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props}>
          {children}
        </Slot>
      );
    }
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
```

- [ ] **Step 2: Card, Input, Textarea, Label and ConfirmDialog**

Replace the whole of `frontend/src/components/ui/card.tsx` with:

```tsx
'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('rounded-card border border-border bg-card text-foreground shadow-card dark:shadow-none', className)}
      {...props}
    />
  )
);
Card.displayName = 'Card';

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col gap-1.5 p-6', className)} {...props} />
  )
);
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h2 ref={ref} className={cn('text-xl font-semibold leading-tight tracking-tight', className)} {...props} />
  )
);
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => <p ref={ref} className={cn('text-sm text-muted', className)} {...props} />
);
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
);
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center border-t border-border p-6', className)} {...props} />
  )
);
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
```

Replace the whole of `frontend/src/components/ui/input.tsx` with:

```tsx
'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const fieldClass =
  'flex w-full rounded-lg border border-input bg-background px-3 py-2 text-base text-foreground placeholder:text-muted transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-danger sm:text-sm';

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => (
  <input type={type} className={cn(fieldClass, 'h-11', className)} ref={ref} {...props} />
));
Input.displayName = 'Input';

export { Input };
```

Replace the whole of `frontend/src/components/ui/textarea.tsx` with:

```tsx
'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { fieldClass } from '@/components/ui/input';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => (
  <textarea className={cn(fieldClass, 'min-h-[120px]', className)} ref={ref} {...props} />
));
Textarea.displayName = 'Textarea';

export { Textarea };
```

In `frontend/src/components/ui/label.tsx`, replace the `cva(...)` string with:

```tsx
  'text-sm font-semibold leading-none text-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
```

Replace the whole of `frontend/src/components/ui/confirm-dialog.tsx` with:

```tsx
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';

type Props = {
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel?: () => void;
};

export default function ConfirmDialog({
  title = 'Confirm',
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}: Props) {
  React.useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm animate-fade-in"
      role="presentation"
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="w-full max-w-lg rounded-panel border border-border bg-card p-6 text-foreground shadow-xl animate-slide-up"
      >
        <h3 id="confirm-dialog-title" className="text-lg font-semibold">
          {title}
        </h3>
        {description && <p className="mt-2 text-sm text-muted">{description}</p>}
        <div className="mt-6 flex justify-end gap-2">
          <Button onClick={onCancel} variant="secondary">
            {cancelLabel}
          </Button>
          <Button onClick={onConfirm} variant="danger" autoFocus>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Dropdown menu and table on tokens**

In `frontend/src/components/ui/dropdown-menu.tsx`, make these exact text replacements. Use the Edit tool with `replace_all`, or a node `split/join` script. **Never** use `String.replace` with a replacement string that contains `$`.

| Find | Replace with |
|---|---|
| `focus:bg-slate-100 data-[state=open]:bg-slate-100 dark:focus:bg-slate-800 dark:data-[state=open]:bg-slate-800` | `focus:bg-surface data-[state=open]:bg-surface` |
| `border border-slate-200 bg-white p-1 text-slate-950` | `border border-border bg-card p-1 text-foreground` |
| ` dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50` | *(empty)* |
| `focus:bg-slate-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 dark:focus:bg-slate-800` | `focus:bg-surface data-[disabled]:pointer-events-none data-[disabled]:opacity-50` |
| `bg-slate-100 dark:bg-slate-800` | `bg-border` |
| `rounded-md border` | `rounded-lg border` |

Then run `grep -n "slate" frontend/src/components/ui/dropdown-menu.tsx`.
Expected: no output.

Replace the whole of `frontend/src/components/ui/table.tsx` with:

```tsx
'use client';

import React from 'react';
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import EmptyState from '@/components/ui/empty-state';

export type Column<T> = {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
};

type SimpleTableProps<T> = {
  columns: Column<T>[];
  data: T[];
  mobileTitleKey?: string;
  emptyMessage?: string;
};

export default function SimpleTable<T extends Record<string, any>>({
  columns,
  data,
  mobileTitleKey,
  emptyMessage,
}: SimpleTableProps<T>) {
  const columnDefs = React.useMemo<ColumnDef<T>[]>(
    () =>
      columns.map((column) => ({
        id: column.key,
        accessorFn: (row) => row[column.key],
        header: () => column.header,
        cell: ({ row }) => (
          <div className={column.className}>
            {column.render ? column.render(row.original) : row.original[column.key]}
          </div>
        ),
      })),
    [columns]
  );

  const table = useReactTable({
    data,
    columns: columnDefs,
    getCoreRowModel: getCoreRowModel(),
  });

  if (data.length === 0 && emptyMessage) {
    return <EmptyState title={emptyMessage} />;
  }

  const inferredTitleKey = mobileTitleKey || columns[0]?.key;
  const titleColumn = columns.find((column) => column.key === inferredTitleKey);

  return (
    <div className="space-y-3">
      <div className="hidden overflow-x-auto rounded-card border border-border bg-card lg:block">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead className="sticky top-0 bg-surface">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-border">
                {headerGroup.headers.map((header) => (
                  <th key={header.id} scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-b border-border transition-colors last:border-b-0 hover:bg-surface/60">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3 align-top text-foreground">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 lg:hidden">
        {data.map((row, index) => (
          <div key={index} className="rounded-card border border-border bg-card p-4">
            {titleColumn && (
              <div className="mb-3 border-b border-border pb-3 text-sm font-semibold text-foreground">
                {titleColumn.render ? titleColumn.render(row) : row[titleColumn.key]}
              </div>
            )}
            <div className="space-y-3">
              {columns
                .filter((column) => column.key !== inferredTitleKey)
                .map((column) => (
                  <div key={column.key} className="flex flex-col gap-1">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted">{column.header}</span>
                    <div className="text-sm text-foreground">{column.render ? column.render(row) : row[column.key]}</div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: New shared components**

Create `frontend/src/components/ui/badge.tsx`:

```tsx
import * as React from 'react';
import { cn } from '@/lib/utils';

const TONES = {
  neutral: 'bg-surface text-muted border border-border',
  gold: 'bg-gold-soft text-gold-ink',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-danger/10 text-danger',
  live: 'bg-danger-solid text-danger-solid-foreground',
} as const;

export type BadgeTone = keyof typeof TONES;

export function Badge({
  tone = 'neutral',
  className,
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold', TONES[tone], className)}>
      {tone === 'live' ? (
        <span className="relative flex h-2 w-2" aria-hidden="true">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
        </span>
      ) : null}
      {children}
    </span>
  );
}

export default Badge;
```

Create `frontend/src/components/ui/page-header.tsx`:

```tsx
import * as React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type Crumb = { label: string; href?: string };

export default function PageHeader({
  title,
  description,
  eyebrow,
  actions,
  breadcrumb,
  className,
}: {
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: React.ReactNode;
  breadcrumb?: Crumb[];
  className?: string;
}) {
  return (
    <header className={cn('flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="min-w-0 space-y-2">
        {breadcrumb && breadcrumb.length > 0 && (
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-sm text-muted">
            {breadcrumb.map((crumb, index) => (
              <React.Fragment key={`${crumb.label}-${index}`}>
                {index > 0 && <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />}
                {crumb.href ? (
                  <Link href={crumb.href} className="hover:text-foreground">
                    {crumb.label}
                  </Link>
                ) : (
                  <span aria-current="page">{crumb.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}
        {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold-ink">{eyebrow}</p>}
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{title}</h1>
        {description && <p className="max-w-2xl text-base text-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </header>
  );
}
```

Create `frontend/src/components/ui/section.tsx`:

```tsx
import * as React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Section({
  title,
  href,
  linkLabel = 'See all',
  className,
  children,
}: {
  title: string;
  href?: string;
  linkLabel?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn('space-y-5', className)}>
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{title}</h2>
        {href && (
          <Link href={href} className="inline-flex items-center gap-1 text-sm font-semibold text-link hover:underline">
            {linkLabel}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}
```

Create `frontend/src/components/ui/tile.tsx`:

```tsx
import * as React from 'react';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';

export default function Tile({
  href,
  icon: Icon,
  label,
  description,
  badge,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  description?: string;
  badge?: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group flex h-full flex-col gap-3 rounded-card border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-surface focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        {badge}
      </div>
      <div>
        <p className="font-semibold text-foreground">{label}</p>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
    </Link>
  );
}
```

Create `frontend/src/components/ui/empty-state.tsx`:

```tsx
import * as React from 'react';
import { Inbox, type LucideIcon } from 'lucide-react';

export default function EmptyState({
  icon: Icon = Inbox,
  title,
  message,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  message?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-input bg-surface/50 px-6 py-10 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface text-muted">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </span>
      <p className="font-semibold text-foreground">{title}</p>
      {message && <p className="max-w-sm text-sm text-muted">{message}</p>}
      {action}
    </div>
  );
}
```

Create `frontend/src/components/ui/skeleton.tsx`:

```tsx
import { cn } from '@/lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-lg bg-surface', className)} aria-hidden="true" />;
}

export function SkeletonCard() {
  return (
    <div className="space-y-3 rounded-card border border-border bg-card p-5" aria-hidden="true">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}

export default Skeleton;
```

Create `frontend/src/components/ui/select.tsx`:

```tsx
'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { fieldClass } from '@/components/ui/input';

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({ className, children, ...props }, ref) => (
  <select ref={ref} className={cn(fieldClass, 'h-11 pr-8', className)} {...props}>
    {children}
  </select>
));
Select.displayName = 'Select';

export { Select };
export default Select;
```

Create `frontend/src/components/ui/tabs.tsx`:

```tsx
'use client';

import { cn } from '@/lib/utils';

export default function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div role="tablist" className={cn('flex gap-1 overflow-x-auto border-b border-border', className)}>
      {tabs.map((tab) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.value)}
            className={cn(
              '-mb-px h-11 whitespace-nowrap border-b-2 px-4 text-sm font-semibold transition-colors',
              active ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-foreground'
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
```

Create `frontend/src/components/ui/scripture.tsx`:

```tsx
import * as React from 'react';
import { cn } from '@/lib/utils';

// Scripture and quotes: serif, with a gold rule.
export default function Scripture({
  children,
  reference,
  className,
}: {
  children: React.ReactNode;
  reference?: string;
  className?: string;
}) {
  return (
    <blockquote className={cn('border-l-[3px] border-gold pl-4', className)}>
      <p className="font-serif text-lg italic leading-relaxed text-foreground">{children}</p>
      {reference && <cite className="mt-2 block text-sm font-semibold not-italic text-muted">{reference}</cite>}
    </blockquote>
  );
}
```

- [ ] **Step 5: Type-check, lint, build and colour scan**

Run:

```bash
cd frontend && npm run -s type-check && npm run -s lint && npm run -s build
grep -nE "(sky|cyan|amber|slate|gray)-[0-9]|#[0-9A-Fa-f]{3,6}\b" src/components/ui/*.tsx ; echo "scan-exit=$?"
```

Expected:
- type-check, lint and build succeed, which proves every existing `variant` and `size` still type-checks across all pages
- the scan prints nothing, then `scan-exit=1`

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/ui
git commit -m "feat(web): restyle shared UI components on tokens and add badge, page header, section, tile, empty state, skeleton, select, tabs and scripture

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Navigation: link list, header, phone menu, footer and live banner

**Files:**
- Create: `frontend/src/lib/navigation.ts`
- Rewrite: `frontend/src/components/layout/Header.tsx`, `frontend/src/components/layout/Footer.tsx`
- Modify: `frontend/src/components/layout/LiveBanner.tsx`

**Interfaces:**
- Consumes: `ThemeToggle` (Task 2), and `Button` and the dropdown menu (Task 3). Also the existing `NotificationBell`, `useLogout`, `useAuthStore`, `resolveAssetUrl`, `getUserFirstName`, `getUserFullName`, `APP_NAME`, `APP_TAGLINE` and the `APP_CONTACT_*` values.
- Produces:
  - `PRIMARY_NAV`, `GIVE_LINK`, `HUB_LINKS`, `MEMBER_HUB_LINK` and `FOOTER_GROUPS`, all built from `NavLink { href; label; icon; description? }`
  - `isActivePath(pathname, href)`
  - The Home page (Task 5) uses `HUB_LINKS` and `MEMBER_HUB_LINK`.

- [ ] **Step 1: One list of links**

Create `frontend/src/lib/navigation.ts`:

```ts
import type { LucideIcon } from 'lucide-react';
import {
  BookOpenText,
  CalendarDays,
  Church,
  Gift,
  HeartHandshake,
  Home,
  ImageIcon,
  Info,
  LayoutDashboard,
  Newspaper,
  PlayCircle,
  Radio,
  Users,
  UsersRound,
} from 'lucide-react';

export type NavLink = { href: string; label: string; icon: LucideIcon; description?: string };

// Header links (spec §3.1): a few top links; everything else lives on the Home hub.
export const PRIMARY_NAV: NavLink[] = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/sermons', label: 'Watch', icon: PlayCircle },
  { href: '/events', label: 'Events', icon: CalendarDays },
  { href: '/about', label: 'About', icon: Info },
];

export const GIVE_LINK: NavLink = { href: '/donate', label: 'Give', icon: Gift };

export const HUB_LINKS: NavLink[] = [
  { href: '/live', label: 'Live', icon: Radio, description: 'Join the service online' },
  { href: '/devotionals', label: 'Devotional', icon: BookOpenText, description: "Today's reading and reflection" },
  { href: '/groups', label: 'Small groups', icon: UsersRound, description: 'Find a group near you' },
  { href: '/prayer/wall', label: 'Prayer wall', icon: HeartHandshake, description: 'Pray with the church' },
  { href: '/gallery', label: 'Gallery', icon: ImageIcon, description: 'Photos from church life' },
  { href: '/news', label: 'News', icon: Newspaper, description: 'Announcements and updates' },
  { href: '/community', label: 'Community', icon: Users, description: 'Share and encourage' },
  { href: '/ministries', label: 'Ministries', icon: Church, description: 'Serve and belong' },
];

export const MEMBER_HUB_LINK: NavLink = {
  href: '/dashboard',
  label: 'My dashboard',
  icon: LayoutDashboard,
  description: 'Registrations, giving and groups',
};

export const FOOTER_GROUPS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: 'Watch & read',
    links: [
      { href: '/sermons', label: 'Sermons' },
      { href: '/live', label: 'Live' },
      { href: '/devotionals', label: 'Devotionals' },
      { href: '/news', label: 'News' },
    ],
  },
  {
    title: 'Get involved',
    links: [
      { href: '/events', label: 'Events' },
      { href: '/groups', label: 'Small groups' },
      { href: '/prayer/wall', label: 'Prayer wall' },
      { href: '/community', label: 'Community' },
      { href: '/ministries', label: 'Ministries' },
      { href: '/gallery', label: 'Gallery' },
    ],
  },
  {
    title: 'About',
    links: [
      { href: '/about', label: 'Our church' },
      { href: '/contact', label: 'Contact' },
      { href: '/faq', label: 'FAQ' },
      { href: '/privacy', label: 'Privacy' },
      { href: '/terms', label: 'Terms' },
    ],
  },
];

export const isActivePath = (pathname: string | null, href: string) => {
  const path = pathname || '/';
  return href === '/' ? path === '/' : path === href || path.startsWith(`${href}/`);
};
```

- [ ] **Step 2: The header**

Replace the whole of `frontend/src/components/layout/Header.tsx` with:

```tsx
'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Church, LayoutDashboard, LogIn, LogOut, Menu, Search, Settings, Shield, User, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import ThemeToggle from '@/components/ui/theme-toggle';
import { useLogout } from '@/hooks/useApi';
import { APP_NAME } from '@/lib/app-config';
import { GIVE_LINK, HUB_LINKS, PRIMARY_NAV, isActivePath } from '@/lib/navigation';
import { useAuthStore } from '@/lib/store';
import { cn, getUserFirstName, getUserFullName, resolveAssetUrl } from '@/lib/utils';
import NotificationBell from './NotificationBell';

function Wordmark() {
  return (
    <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label={`${APP_NAME} home`}>
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Church className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="text-lg font-bold tracking-tight text-foreground">{APP_NAME}</span>
    </Link>
  );
}

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const logoutMutation = useLogout();
  const [menuOpen, setMenuOpen] = React.useState(false);

  React.useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // The phone menu: close on Escape and stop the page scrolling behind it.
  React.useEffect(() => {
    if (!menuOpen) return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    logout();
    setMenuOpen(false);
    router.push('/');
  };

  const firstName = getUserFirstName(user);
  const fullName = getUserFullName(user) || 'Account';
  const avatarUrl = resolveAssetUrl((user as any)?.profileImageUrl || (user as any)?.profile_image_url || null);
  const isAdmin = user?.role === 'admin';

  const navLinkClass = (href: string) =>
    cn(
      'relative inline-flex h-11 items-center px-3 text-sm font-semibold transition-colors',
      isActivePath(pathname, href) ? 'text-primary' : 'text-muted hover:text-foreground'
    );

  const menuLinkClass = (href: string) =>
    cn(
      'flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold transition-colors',
      isActivePath(pathname, href) ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-surface'
    );

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-md">
      <nav aria-label="Main navigation" className="container-max flex h-16 items-center gap-4">
        <Wordmark />

        <div className="hidden items-center md:flex">
          {PRIMARY_NAV.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={navLinkClass(link.href)}
              aria-current={isActivePath(pathname, link.href) ? 'page' : undefined}
            >
              {link.label}
              {isActivePath(pathname, link.href) && (
                <span className="absolute inset-x-3 -bottom-[11px] h-0.5 rounded-full bg-primary" aria-hidden="true" />
              )}
            </Link>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-1">
          <Button asChild variant="ghost" size="icon" aria-label="Search">
            <Link href="/search">
              <Search className="h-5 w-5" />
            </Link>
          </Button>
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>
          {isAuthenticated && user ? <NotificationBell /> : null}

          <Button asChild size="sm" className="ml-1">
            <Link href={GIVE_LINK.href}>
              <GIVE_LINK.icon className="h-4 w-4" aria-hidden="true" />
              {GIVE_LINK.label}
            </Link>
          </Button>

          {isAuthenticated && user ? (
            <div className="hidden md:block">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full" aria-label="Open account menu">
                    {avatarUrl ? (
                      <Image src={avatarUrl} alt="" width={36} height={36} unoptimized className="h-9 w-9 rounded-full object-cover" />
                    ) : (
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                        {(firstName || 'U').charAt(0).toUpperCase()}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="truncate">{fullName}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="gap-2">
                      <LayoutDashboard className="h-4 w-4" /> My dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="gap-2">
                      <Settings className="h-4 w-4" /> Profile
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="gap-2">
                        <Shield className="h-4 w-4" /> Admin
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="gap-2 text-danger">
                    <LogOut className="h-4 w-4" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex">
              <Link href="/login">
                <LogIn className="h-4 w-4" aria-hidden="true" />
                Sign in
              </Link>
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav-panel"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </div>
      </nav>

      {menuOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-foreground/40 animate-fade-in"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          />
          <div
            id="mobile-nav-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="absolute inset-y-0 right-0 flex w-[min(20rem,88vw)] flex-col overflow-y-auto border-l border-border bg-background p-4 shadow-xl animate-slide-up"
          >
            <div className="mb-4 flex items-center justify-between">
              <Wordmark />
              <Button variant="ghost" size="icon" onClick={() => setMenuOpen(false)} aria-label="Close menu">
                <X className="h-6 w-6" />
              </Button>
            </div>

            <div className="grid gap-1">
              {PRIMARY_NAV.map((link) => (
                <Link key={link.href} href={link.href} className={menuLinkClass(link.href)}>
                  <link.icon className="h-5 w-5" aria-hidden="true" />
                  {link.label}
                </Link>
              ))}
            </div>

            <p className="mb-1 mt-5 px-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted">Explore</p>
            <div className="grid gap-1">
              {HUB_LINKS.map((link) => (
                <Link key={link.href} href={link.href} className={menuLinkClass(link.href)}>
                  <link.icon className="h-5 w-5" aria-hidden="true" />
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="mt-5 grid gap-1 border-t border-border pt-4">
              {isAuthenticated && user ? (
                <>
                  <Link href="/dashboard" className={menuLinkClass('/dashboard')}>
                    <LayoutDashboard className="h-5 w-5" aria-hidden="true" /> My dashboard
                  </Link>
                  <Link href="/profile" className={menuLinkClass('/profile')}>
                    <User className="h-5 w-5" aria-hidden="true" /> Profile
                  </Link>
                  {isAdmin && (
                    <Link href="/admin" className={menuLinkClass('/admin')}>
                      <Shield className="h-5 w-5" aria-hidden="true" /> Admin
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold text-danger hover:bg-surface"
                  >
                    <LogOut className="h-5 w-5" aria-hidden="true" /> Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className={menuLinkClass('/login')}>
                    <LogIn className="h-5 w-5" aria-hidden="true" /> Sign in
                  </Link>
                  <Link href="/register" className={menuLinkClass('/register')}>
                    <User className="h-5 w-5" aria-hidden="true" /> Create account
                  </Link>
                </>
              )}
              <div className="flex min-h-11 items-center justify-between px-3 text-sm font-semibold text-foreground">
                Theme
                <ThemeToggle />
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
```

- [ ] **Step 3: The footer**

Replace the whole of `frontend/src/components/layout/Footer.tsx` with:

```tsx
import React from 'react';
import Link from 'next/link';
import { Church, Mail, MapPin, Phone } from 'lucide-react';
import {
  APP_CONTACT_EMAIL,
  APP_CONTACT_LOCATION,
  APP_CONTACT_PHONE,
  APP_NAME,
  APP_TAGLINE,
} from '@/lib/app-config';
import { FOOTER_GROUPS } from '@/lib/navigation';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-border bg-surface">
      <div className="container-max grid gap-10 py-12 md:grid-cols-[1.3fr_repeat(3,1fr)]">
        <div className="space-y-4">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Church className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="text-lg font-bold tracking-tight text-foreground">{APP_NAME}</span>
          </Link>
          <p className="max-w-xs text-sm text-muted">{APP_TAGLINE}</p>
          <ul className="space-y-2 text-sm text-muted">
            {APP_CONTACT_LOCATION && (
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
                <span>{APP_CONTACT_LOCATION}</span>
              </li>
            )}
            {APP_CONTACT_PHONE && (
              <li className="flex items-start gap-2">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
                <span>{APP_CONTACT_PHONE}</span>
              </li>
            )}
            {APP_CONTACT_EMAIL && (
              <li className="flex items-start gap-2">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
                <a href={`mailto:${APP_CONTACT_EMAIL}`} className="hover:text-foreground">
                  {APP_CONTACT_EMAIL}
                </a>
              </li>
            )}
          </ul>
        </div>

        {FOOTER_GROUPS.map((group) => (
          <div key={group.title}>
            <h2 className="mb-3 text-sm font-semibold text-foreground">{group.title}</h2>
            <ul className="space-y-2">
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-muted transition-colors hover:text-foreground">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border">
        <div className="container-max flex flex-col gap-2 py-5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {currentYear} {APP_NAME}. All rights reserved.
          </p>
          <Link href="/donate" className="font-semibold text-link hover:underline">
            Support the ministry
          </Link>
        </div>
      </div>
    </footer>
  );
}
```

Before replacing, check how the current `Footer.tsx` uses `APP_CONTACT_LOCATION`. If the old file shows no location, still keep it here; the constant exists in `app-config`. If the import fails type-check because `APP_CONTACT_LOCATION` isn't exported, drop that `<li>` and record a ruling.

- [ ] **Step 4: Live banner on tokens**

In `frontend/src/components/layout/LiveBanner.tsx`, replace `bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700` with `bg-danger-solid px-4 py-2 text-sm font-semibold text-danger-solid-foreground transition-colors hover:bg-danger-solid/90`, and replace both `bg-white` (in the two pulse spans) with `bg-current`.

- [ ] **Step 5: Type-check, lint, build, colour scan and a phone-width check**

Run:

```bash
cd frontend && npm run -s type-check && npm run -s lint && npm run -s build
grep -nE "(sky|cyan|amber|slate|gray|red)-[0-9]|#[0-9A-Fa-f]{3,6}\b" src/components/layout/Header.tsx src/components/layout/Footer.tsx src/components/layout/LiveBanner.tsx src/lib/navigation.ts ; echo "scan-exit=$?"
```

Expected: all succeed, and the scan prints `scan-exit=1`.

Then `npm run dev` and check by eye:
1. **At 1280px:** the four links (the active one is blue and underlined), search, theme, Give, and Sign in or the account menu all fit on one line.
2. **At 375px:**
   - The header shows the wordmark, search, Give and the menu button.
   - The menu slides in with every Home link, the 8 Explore links, account links and the theme picker.
   - It closes on Escape, on a backdrop tap and after following a link.
   - The page behind doesn't scroll while it's open.
3. **Light and dark:** both are readable.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/lib/navigation.ts frontend/src/components/layout/Header.tsx frontend/src/components/layout/Footer.tsx frontend/src/components/layout/LiveBanner.tsx
git commit -m "feat(web): new header, phone menu and footer with hub navigation

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: The hub Home page

**Files:**
- Rewrite: `frontend/src/app/page.tsx`, `frontend/src/components/devotionals/TodayDevotionalCard.tsx`

**Interfaces:**
- Consumes:
  - Hooks: `useRecentSermons()`, `useUpcomingEvents()`, `useLatestNews(3)`, `useTodayDevotional()` and `useLiveStream(60_000)` (the live data is `{ is_live, title }`), plus `useAuthStore()`
  - Components: `Badge`, `Section`, `Tile`, `EmptyState`, `SkeletonCard`, `Scripture` and `Button` (Task 3)
  - Links: `HUB_LINKS` and `MEMBER_HUB_LINK` (Task 4)
  - Helpers: `formatDate` and `formatDateOnly`
- Produces: the Home page as spec §3.1 describes, top to bottom:
  1. hero
  2. today's devotional
  3. the tile grid
  4. upcoming events
  5. latest sermons
  6. news
  7. a "join" band for signed-out visitors

- [ ] **Step 1: Today's devotional card**

Replace the whole of `frontend/src/components/devotionals/TodayDevotionalCard.tsx` with:

```tsx
'use client';

import Link from 'next/link';
import { ArrowRight, BookOpenText } from 'lucide-react';
import Scripture from '@/components/ui/scripture';
import { useTodayDevotional } from '@/hooks/useApi';
import { formatDateOnly } from '@/lib/utils';

export default function TodayDevotionalCard() {
  const { data: devotional, isLoading, isError } = useTodayDevotional();

  if (isLoading || isError || !devotional) {
    return null;
  }

  return (
    <Link
      href={`/devotionals/${devotional.id}`}
      className="group block rounded-panel border border-border bg-gold-soft/60 p-6 transition-colors hover:border-gold sm:p-8"
    >
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-gold-ink">
        <BookOpenText className="h-4 w-4" aria-hidden="true" />
        {devotional.is_today ? "Today's devotional" : `Devotional · ${formatDateOnly(devotional.publish_date)}`}
      </p>
      <h2 className="mt-3 text-xl font-semibold text-foreground sm:text-2xl">{devotional.title}</h2>
      <Scripture reference={devotional.scripture_reference} className="mt-4">
        <span className="line-clamp-3">{devotional.scripture_text}</span>
      </Scripture>
      <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-link group-hover:underline">
        Read today&apos;s reflection <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </span>
    </Link>
  );
}
```

- [ ] **Step 2: The Home page**

Replace the whole of `frontend/src/app/page.tsx` with:

```tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { CalendarDays, MapPin, Newspaper, PlayCircle } from 'lucide-react';
import TodayDevotionalCard from '@/components/devotionals/TodayDevotionalCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import EmptyState from '@/components/ui/empty-state';
import Section from '@/components/ui/section';
import { SkeletonCard } from '@/components/ui/skeleton';
import Tile from '@/components/ui/tile';
import { useLatestNews, useLiveStream, useRecentSermons, useUpcomingEvents } from '@/hooks/useApi';
import { HUB_LINKS, MEMBER_HUB_LINK } from '@/lib/navigation';
import { useAuthStore } from '@/lib/store';
import { formatDate } from '@/lib/utils';

const eventDateOf = (event: any) => new Date(event?.event_date || event?.eventDate);

export default function HomePage() {
  const { isAuthenticated } = useAuthStore();
  const sermons = useRecentSermons();
  const events = useUpcomingEvents();
  const news = useLatestNews(3);
  const live = useLiveStream(60_000);
  const isLive = Boolean(live.data?.is_live);
  const nextEvent = events.data?.[0];
  const hubLinks = isAuthenticated ? [...HUB_LINKS, MEMBER_HUB_LINK] : HUB_LINKS;

  return (
    <div className="space-y-14 pb-6 sm:space-y-16">
      {/* 1. Hero */}
      <section className="border-b border-border bg-surface">
        <div className="container-max grid items-center gap-8 py-12 md:grid-cols-[1.2fr_1fr] md:py-16">
          <div className="space-y-5">
            {isLive ? <Badge tone="live">Live now</Badge> : <Badge tone="gold">Welcome</Badge>}
            <h1 className="text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              A church for every generation.
            </h1>
            <p className="max-w-xl text-lg text-muted">
              Worship with us, grow in faith through God&apos;s word, and find your place in our church family.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href={isLive ? '/live' : '/sermons'}>
                  <PlayCircle className="h-5 w-5" aria-hidden="true" />
                  {isLive ? 'Watch live' : 'Watch sermons'}
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/contact">Plan a visit</Link>
              </Button>
            </div>
          </div>

          <div className="rounded-panel border border-border bg-card p-6 shadow-card dark:shadow-none">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold-ink">
              {isLive ? 'Happening now' : 'Next gathering'}
            </p>
            {isLive ? (
              <>
                <p className="mt-2 text-xl font-semibold text-foreground">{live.data?.title || 'Live service'}</p>
                <Link href="/live" className="mt-4 inline-flex text-sm font-semibold text-link hover:underline">
                  Join the livestream →
                </Link>
              </>
            ) : nextEvent ? (
              <>
                <p className="mt-2 text-xl font-semibold text-foreground">{nextEvent.name}</p>
                <p className="mt-3 flex items-center gap-2 text-sm text-muted">
                  <CalendarDays className="h-4 w-4" aria-hidden="true" />
                  {formatDate(nextEvent.event_date || nextEvent.eventDate)}
                </p>
                {nextEvent.location && (
                  <p className="mt-1 flex items-center gap-2 text-sm text-muted">
                    <MapPin className="h-4 w-4" aria-hidden="true" />
                    {nextEvent.location}
                  </p>
                )}
                <Link href={`/events/${nextEvent.id}`} className="mt-4 inline-flex text-sm font-semibold text-link hover:underline">
                  Event details →
                </Link>
              </>
            ) : (
              <>
                <p className="mt-2 text-xl font-semibold text-foreground">Sunday worship</p>
                <p className="mt-3 text-sm text-muted">Everyone is welcome. See upcoming events for times and places.</p>
                <Link href="/events" className="mt-4 inline-flex text-sm font-semibold text-link hover:underline">
                  See events →
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* 2. Today's devotional */}
      <div className="container-max">
        <TodayDevotionalCard />
      </div>

      {/* 3. Hub tiles */}
      <div className="container-max">
        <Section title="Explore">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {hubLinks.map((link) => (
              <Tile
                key={link.href}
                href={link.href}
                icon={link.icon}
                label={link.label}
                description={link.description}
                badge={link.href === '/live' && isLive ? <Badge tone="live">Live</Badge> : undefined}
              />
            ))}
          </div>
        </Section>
      </div>

      {/* 4. Upcoming events */}
      <div className="container-max">
        <Section title="Upcoming events" href="/events">
          {events.isLoading ? (
            <div className="grid gap-4 md:grid-cols-3">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : events.isError ? (
            <EmptyState icon={CalendarDays} title="Events couldn't load right now" message="Please try again in a moment." />
          ) : !events.data || events.data.length === 0 ? (
            <EmptyState icon={CalendarDays} title="No upcoming events yet" message="New gatherings will appear here." />
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {events.data.slice(0, 3).map((event: any) => {
                const date = eventDateOf(event);
                return (
                  <Link
                    key={event.id}
                    href={`/events/${event.id}`}
                    className="flex gap-4 rounded-card border border-border bg-card p-4 transition-colors hover:border-primary/40"
                  >
                    <span className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <span className="text-[11px] font-semibold uppercase">
                        {date.toLocaleDateString('en-GB', { month: 'short' })}
                      </span>
                      <span className="text-xl font-bold leading-none">{date.getDate()}</span>
                    </span>
                    <span className="min-w-0">
                      <span className="block font-semibold text-foreground">{event.name}</span>
                      <span className="mt-1 block truncate text-sm text-muted">{event.location || 'Location to be announced'}</span>
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </Section>
      </div>

      {/* 5. Latest sermons */}
      <div className="container-max">
        <Section title="Latest sermons" href="/sermons">
          {sermons.isLoading ? (
            <div className="grid gap-4 md:grid-cols-3">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : sermons.isError ? (
            <EmptyState icon={PlayCircle} title="Sermons couldn't load right now" message="Please try again in a moment." />
          ) : !sermons.data || sermons.data.length === 0 ? (
            <EmptyState icon={PlayCircle} title="No sermons yet" message="Recorded sermons will appear here." />
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {sermons.data.slice(0, 3).map((sermon: any) => (
                <Link
                  key={sermon.id}
                  href={`/sermons/${sermon.id}`}
                  className="group flex flex-col overflow-hidden rounded-card border border-border bg-card transition-colors hover:border-primary/40"
                >
                  <span className="flex h-36 items-center justify-center bg-surface">
                    <PlayCircle className="h-12 w-12 text-primary transition-transform group-hover:scale-105" aria-hidden="true" />
                  </span>
                  <span className="space-y-1 p-4">
                    <span className="line-clamp-2 block font-semibold text-foreground">{sermon.title}</span>
                    <span className="block text-sm text-muted">{sermon.speaker || 'ANT PRESS'}</span>
                  </span>
                </Link>
              ))}
            </div>
          )}
        </Section>
      </div>

      {/* 6. News */}
      <div className="container-max">
        <Section title="News & announcements" href="/news">
          {news.isLoading ? (
            <div className="grid gap-4 md:grid-cols-3">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : news.isError ? (
            <EmptyState icon={Newspaper} title="News couldn't load right now" message="Please try again in a moment." />
          ) : !news.data || news.data.length === 0 ? (
            <EmptyState icon={Newspaper} title="No announcements yet" />
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {news.data.map((post: any) => (
                <Link
                  key={post.id}
                  href={`/news/${post.id}`}
                  className="flex h-full flex-col rounded-card border border-border bg-card p-5 transition-colors hover:border-primary/40"
                >
                  <span className="line-clamp-2 font-semibold text-foreground">{post.title}</span>
                  <span className="mt-2 line-clamp-3 text-sm text-muted">{post.summary || post.excerpt || ''}</span>
                  <span className="mt-auto pt-4 text-xs text-muted">
                    {post.published_at ? formatDate(post.published_at) : 'Recently published'}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </Section>
      </div>

      {/* 7. Join (signed-out visitors only) */}
      {!isAuthenticated && (
        <div className="container-max">
          <div className="rounded-panel bg-primary px-6 py-10 text-center text-primary-foreground sm:px-12">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Become part of the family</h2>
            <p className="mx-auto mt-3 max-w-xl text-primary-foreground/85">
              Create an account to join groups, register for events, track your giving and get updates.
            </p>
            <Button asChild size="lg" variant="secondary" className="mt-6 border-transparent">
              <Link href="/register">Create an account</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Type-check, lint, build, colour scan and a visual check**

Run:

```bash
cd frontend && npm run -s type-check && npm run -s lint && npm run -s build
grep -nE "(sky|cyan|amber|slate|gray|indigo|purple|rose|pink|teal|green)-[0-9]|#[0-9A-Fa-f]{3,6}\b" src/app/page.tsx src/components/devotionals/TodayDevotionalCard.tsx ; echo "scan-exit=$?"
```

Expected: all succeed, and `scan-exit=1`.

If type-check complains that `useLiveStream`'s data has no `is_live` or `title`, use the field names in that hook's return type. Check its definition in `useApi.ts` and record a ruling.

Then `npm run dev` and check `/`:
1. **Widths and themes:** check 375px and 1280px, in light and dark.
2. **Signed out and in:** signed out shows 8 tiles plus the join band; signed in shows 9 tiles and no band.
3. **No data:** with the backend stopped, every section shows its "couldn't load" state and the page never breaks.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/app/page.tsx frontend/src/components/devotionals/TodayDevotionalCard.tsx
git commit -m "feat(web): hub Home page with tiles, devotional, events, sermons and news

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Mobile tokens, device-following theme and primitives

**Files:**
- Create: `mobile/src/constants/tokens.ts`, `mobile/src/hooks/use-app-theme.ts`
- Create: `mobile/src/components/ui/app-text.tsx`, `button.tsx`, `card.tsx`, `badge.tsx`, `tile.tsx`, `empty-state.tsx`, `skeleton.tsx`, `text-field.tsx`
- Modify: `mobile/app.json`

**Interfaces:**
- Produces, used by 8d:
  - `Palette.light`, `Palette.dark` and `AppPalette`, with the same values as the web tokens, as hex: `background`, `surface`, `card`, `border`, `input`, `text`, `muted`, `primary`, `primaryHover`, `onPrimary`, `link`, `gold`, `goldSoft`, `goldInk`, `success`, `warning`, `danger`, `dangerSolid`, `onDangerSolid`
  - `TypeScale`, `Space`, `Corner` and `MIN_TOUCH`
  - `useAppTheme() → { scheme: 'light' | 'dark'; colors: AppPalette }`
  - `<AppText variant? tone? serif?>`
  - `<AppButton label onPress variant? size? loading? disabled? icon?>`
  - `<AppCard onPress? style?>`
  - `<AppBadge tone?>`
  - `<AppTile icon label description? onPress badge?>`
  - `<EmptyState icon? title message? action?>`
  - `<Skeleton height width? radius?>`
  - `<TextField label error? hint? ...TextInputProps>`
- **Ruling 2 (from Global Constraints):** `Colors`, `useTheme()` and every existing screen are left unchanged. 8d moves screens to `useAppTheme()`.

- [ ] **Step 1: Tokens**

Create `mobile/src/constants/tokens.ts`:

```ts
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
```

- [ ] **Step 2: The device-following theme hook**

Create `mobile/src/hooks/use-app-theme.ts`:

```ts
import { useColorScheme } from 'react-native';

import { Palette, type AppPalette } from '@/constants/tokens';

// Light or dark, following the phone's setting (app.json userInterfaceStyle: "automatic").
export function useAppTheme(): { scheme: 'light' | 'dark'; colors: AppPalette } {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  return { scheme, colors: Palette[scheme] };
}
```

In `mobile/app.json`, change `"userInterfaceStyle": "light"` to `"userInterfaceStyle": "automatic"`. Existing screens still look the same because `useTheme()` is unchanged. The setting only takes effect in a new native build.

- [ ] **Step 3: Text, button and card**

Create `mobile/src/components/ui/app-text.tsx`:

```tsx
import React from 'react';
import { Platform, Text, type TextProps } from 'react-native';

import { TypeScale } from '@/constants/tokens';
import { useAppTheme } from '@/hooks/use-app-theme';

type Variant = keyof typeof TypeScale;
type Tone = 'default' | 'muted' | 'primary' | 'link' | 'gold' | 'danger' | 'onPrimary';

export function AppText({
  variant = 'body',
  tone = 'default',
  serif = false,
  style,
  ...props
}: TextProps & { variant?: Variant; tone?: Tone; serif?: boolean }) {
  const { colors } = useAppTheme();
  const color = {
    default: colors.text,
    muted: colors.muted,
    primary: colors.primary,
    link: colors.link,
    gold: colors.goldInk,
    danger: colors.danger,
    onPrimary: colors.onPrimary,
  }[tone];
  const fontFamily = serif ? Platform.select({ ios: 'Georgia', default: 'serif' }) : undefined;
  return <Text style={[TypeScale[variant], { color, fontFamily }, style]} {...props} />;
}

export default AppText;
```

Create `mobile/src/components/ui/button.tsx`:

```tsx
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Corner, MIN_TOUCH, Space } from '@/constants/tokens';
import { useAppTheme } from '@/hooks/use-app-theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

export function AppButton({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  accessibilityLabel,
}: {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: 'md' | 'sm';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  accessibilityLabel?: string;
}) {
  const { colors } = useAppTheme();
  const palette = {
    primary: { bg: colors.primary, fg: colors.onPrimary, border: colors.primary },
    secondary: { bg: colors.background, fg: colors.text, border: colors.input },
    ghost: { bg: 'transparent', fg: colors.text, border: 'transparent' },
    danger: { bg: colors.dangerSolid, fg: colors.onDangerSolid, border: colors.dangerSolid },
  }[variant];
  const inactive = disabled || loading;

  return (
    <Pressable
      onPress={inactive ? undefined : onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        size === 'sm' ? styles.sm : styles.md,
        { backgroundColor: palette.bg, borderColor: palette.border, opacity: inactive ? 0.5 : pressed ? 0.85 : 1 },
      ]}>
      <View style={styles.row}>
        {loading ? <ActivityIndicator size="small" color={palette.fg} /> : icon}
        <AppText variant="bodyStrong" style={{ color: palette.fg }}>
          {label}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: Corner.control, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  md: { minHeight: MIN_TOUCH, paddingHorizontal: Space.lg },
  sm: { minHeight: MIN_TOUCH, paddingHorizontal: Space.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: Space.sm },
});

export default AppButton;
```

Create `mobile/src/components/ui/card.tsx`:

```tsx
import React from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Corner, Space } from '@/constants/tokens';
import { useAppTheme } from '@/hooks/use-app-theme';

export function AppCard({
  children,
  onPress,
  style,
  accessibilityLabel,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}) {
  const { colors } = useAppTheme();
  const base = [styles.card, { backgroundColor: colors.card, borderColor: colors.border }, style];
  if (!onPress) return <View style={base}>{children}</View>;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [...base, pressed && { backgroundColor: colors.surface }]}>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: Corner.card, padding: Space.md, gap: Space.sm },
});

export default AppCard;
```

- [ ] **Step 4: Badge, tile, empty state, skeleton and text field**

Create `mobile/src/components/ui/badge.tsx`:

```tsx
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Corner, Space } from '@/constants/tokens';
import { useAppTheme } from '@/hooks/use-app-theme';

type Tone = 'neutral' | 'gold' | 'success' | 'warning' | 'danger' | 'live';

export function AppBadge({ tone = 'neutral', children }: { tone?: Tone; children: string }) {
  const { colors } = useAppTheme();
  const look = {
    neutral: { bg: colors.surface, fg: colors.muted },
    gold: { bg: colors.goldSoft, fg: colors.goldInk },
    success: { bg: colors.surface, fg: colors.success },
    warning: { bg: colors.surface, fg: colors.warning },
    danger: { bg: colors.surface, fg: colors.danger },
    live: { bg: colors.dangerSolid, fg: colors.onDangerSolid },
  }[tone];
  return (
    <View style={[styles.badge, { backgroundColor: look.bg }]}>
      {tone === 'live' ? <View style={[styles.dot, { backgroundColor: look.fg }]} /> : null}
      <AppText variant="caption" style={{ color: look.fg }}>
        {children}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Space.xs,
    alignSelf: 'flex-start',
    borderRadius: Corner.pill,
    paddingHorizontal: Space.sm + 2,
    paddingVertical: 2,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
});

export default AppBadge;
```

Create `mobile/src/components/ui/tile.tsx`:

```tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Corner, Space } from '@/constants/tokens';
import { useAppTheme } from '@/hooks/use-app-theme';

export function AppTile({
  icon,
  label,
  description,
  onPress,
  badge,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  description?: string;
  onPress: () => void;
  badge?: React.ReactNode;
}) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.tile,
        { backgroundColor: pressed ? colors.surface : colors.card, borderColor: colors.border },
      ]}>
      <View style={styles.top}>
        <View style={[styles.icon, { backgroundColor: colors.surface }]}>
          <Ionicons name={icon} size={20} color={colors.primary} />
        </View>
        {badge}
      </View>
      <AppText variant="bodyStrong">{label}</AppText>
      {description ? (
        <AppText variant="small" tone="muted" numberOfLines={2}>
          {description}
        </AppText>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: { flex: 1, minHeight: 112, borderWidth: 1, borderRadius: Corner.card, padding: Space.md, gap: Space.sm },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  icon: { width: 44, height: 44, borderRadius: Corner.control, alignItems: 'center', justifyContent: 'center' },
});

export default AppTile;
```

Create `mobile/src/components/ui/empty-state.tsx`:

```tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Corner, Space } from '@/constants/tokens';
import { useAppTheme } from '@/hooks/use-app-theme';

export function EmptyState({
  icon = 'file-tray-outline',
  title,
  message,
  action,
}: {
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  message?: string;
  action?: React.ReactNode;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.box, { borderColor: colors.input, backgroundColor: colors.surface }]}>
      <Ionicons name={icon} size={28} color={colors.muted} />
      <AppText variant="bodyStrong" style={styles.center}>
        {title}
      </AppText>
      {message ? (
        <AppText variant="small" tone="muted" style={styles.center}>
          {message}
        </AppText>
      ) : null}
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', gap: Space.sm, borderWidth: 1, borderStyle: 'dashed', borderRadius: Corner.card, padding: Space.lg },
  center: { textAlign: 'center' },
});

export default EmptyState;
```

Create `mobile/src/components/ui/skeleton.tsx`:

```tsx
import React from 'react';
import { AccessibilityInfo, Animated, type DimensionValue } from 'react-native';

import { Corner } from '@/constants/tokens';
import { useAppTheme } from '@/hooks/use-app-theme';

export function Skeleton({ height, width = '100%', radius = Corner.control }: { height: number; width?: DimensionValue; radius?: number }) {
  const { colors } = useAppTheme();
  const opacity = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    let loop: Animated.CompositeAnimation | undefined;
    AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (reduced) return;
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0.5, duration: 700, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        ])
      );
      loop.start();
    });
    return () => loop?.stop();
  }, [opacity]);

  return <Animated.View accessible={false} style={{ height, width, borderRadius: radius, backgroundColor: colors.surface, opacity }} />;
}

export default Skeleton;
```

Create `mobile/src/components/ui/text-field.tsx`:

```tsx
import React from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Corner, MIN_TOUCH, Space } from '@/constants/tokens';
import { useAppTheme } from '@/hooks/use-app-theme';

export function TextField({ label, error, hint, style, ...props }: TextInputProps & { label: string; error?: string; hint?: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.field}>
      <AppText variant="small" style={styles.label}>
        {label}
      </AppText>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.muted}
        style={[
          styles.input,
          { color: colors.text, backgroundColor: colors.background, borderColor: error ? colors.danger : colors.input },
          props.multiline && styles.multiline,
          style,
        ]}
        {...props}
      />
      {error ? (
        <AppText variant="small" tone="danger">
          {error}
        </AppText>
      ) : hint ? (
        <AppText variant="small" tone="muted">
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: Space.xs },
  label: { fontWeight: '600' },
  input: { minHeight: MIN_TOUCH, borderWidth: 1, borderRadius: Corner.control, paddingHorizontal: Space.md, fontSize: 16 },
  multiline: { minHeight: 110, paddingTop: Space.sm + 4, textAlignVertical: 'top' },
});

export default TextField;
```

- [ ] **Step 5: Lint and type-check**

Run: `cd mobile && npm run -s lint && npx tsc --noEmit && echo mobile-ok`
Expected: `mobile-ok`. If `DimensionValue` isn't exported by the installed React Native types, type `width` as `number | \`${number}%\`` and record a ruling.

- [ ] **Step 6: Commit**

```bash
git add mobile/src/constants/tokens.ts mobile/src/hooks/use-app-theme.ts mobile/src/components/ui mobile/app.json
git commit -m "feat(mobile): Clean & classic tokens, device-following theme hook and UI primitives

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Design-system reference, token parity check and final checks

**Files:**
- Create: `frontend/scripts/check-token-parity.mjs`, `docs/design-system.md`
- Modify: `frontend/package.json` (script)

**Interfaces:**
- Consumes: `frontend/src/styles/tokens.css` (Task 1) and `mobile/src/constants/tokens.ts` (Task 6).
- Produces: `npm run check:tokens`, which fails if web and app colours differ, and the reference doc 8b–8d build from.

- [ ] **Step 1: Write the parity check, and see it catch a mismatch**

Create `frontend/scripts/check-token-parity.mjs`:

```js
// Fails (exit 1) if the app palette (mobile/src/constants/tokens.ts) differs from the web tokens.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const read = (relative) => readFileSync(fileURLToPath(new URL(relative, import.meta.url)), 'utf8');
const css = read('../src/styles/tokens.css');
const ts = read('../../mobile/src/constants/tokens.ts');

const cssBlock = (selector) => {
  const start = css.indexOf(`${selector} {`);
  const body = css.slice(start, css.indexOf('}', start));
  return Object.fromEntries(
    [...body.matchAll(/--([a-z-]+):\s*(\d+)\s+(\d+)\s+(\d+);/g)].map((m) => [
      m[1],
      `#${[m[2], m[3], m[4]].map((n) => Number(n).toString(16).padStart(2, '0')).join('')}`.toUpperCase(),
    ])
  );
};
const tsBlock = (scheme) => {
  const start = ts.indexOf(`${scheme}: {`);
  const body = ts.slice(start, ts.indexOf('}', start));
  return Object.fromEntries([...body.matchAll(/(\w+):\s*'(#[0-9A-Fa-f]{6})'/g)].map((m) => [m[1], m[2].toUpperCase()]));
};

// app key -> web token
const MAP = {
  background: 'background',
  surface: 'surface',
  card: 'card',
  border: 'border',
  input: 'input',
  text: 'foreground',
  muted: 'muted',
  primary: 'primary',
  primaryHover: 'primary-hover',
  onPrimary: 'primary-foreground',
  link: 'link',
  gold: 'gold',
  goldSoft: 'gold-soft',
  goldInk: 'gold-ink',
  success: 'success',
  warning: 'warning',
  danger: 'danger',
  dangerSolid: 'danger-solid',
  onDangerSolid: 'danger-solid-foreground',
};

let problems = 0;
for (const [scheme, selector] of [['light', ':root'], ['dark', '.dark']]) {
  const web = cssBlock(selector);
  const app = tsBlock(scheme);
  for (const [appKey, webKey] of Object.entries(MAP)) {
    if (web[webKey] !== app[appKey]) {
      console.error(`${scheme}: app ${appKey}=${app[appKey]} but web --${webKey}=${web[webKey]}`);
      problems += 1;
    }
  }
}
if (problems > 0) {
  console.error(`${problems} token mismatch(es)`);
  process.exit(1);
}
console.log(`Web and app palettes match (${Object.keys(MAP).length * 2} values).`);
```

In `frontend/package.json` `scripts`, add this directly after `"check:contrast"`:

```json
    "check:tokens": "node scripts/check-token-parity.mjs",
```

Run: `cd frontend && npm run -s check:tokens`
Expected: `Web and app palettes match (38 values).`

To prove the check works, temporarily change the app's light `muted` to `'#56607B'` in `mobile/src/constants/tokens.ts`, then run it again.
Expected: FAIL, `light: app muted=#56607B but web --muted=#56607A`.
Revert the change, run it once more, and expect the pass line again.

- [ ] **Step 2: Design-system reference**

Create `docs/design-system.md`:

````markdown
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
````

- [ ] **Step 3: Final checks**

Run:

```bash
cd frontend && npm run -s check:contrast && npm run -s check:tokens && npm run -s type-check && npm run -s lint && npm run -s build && cd ..
cd mobile && npm run -s lint && npx tsc --noEmit && cd ..
grep -nE "(sky|cyan|amber|slate|gray|indigo|purple|rose|pink|teal|green|red)-[0-9]|#[0-9A-Fa-f]{3,6}\b" \
  frontend/src/components/ui/*.tsx frontend/src/components/layout/Header.tsx frontend/src/components/layout/Footer.tsx \
  frontend/src/components/layout/LiveBanner.tsx frontend/src/lib/navigation.ts frontend/src/app/page.tsx \
  frontend/src/components/devotionals/TodayDevotionalCard.tsx mobile/src/components/ui/*.tsx ; echo "scan-exit=$?"
cd backend && npx jest --runInBand --coverage=false 2>&1 | grep "^Tests:" && cd ..
```

Expected:
- every check passes
- the colour scan prints nothing, then `scan-exit=1`
- the backend is untouched: 445/445 pass

`mobile/src/components/ui/collapsible.tsx` already existed before this phase. If the scan flags it, leave it for 8d and record a ruling.

- [ ] **Step 4: Commit**

```bash
git add frontend/scripts/check-token-parity.mjs frontend/package.json docs/design-system.md
git commit -m "docs: design-system reference and web/app token parity check

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
