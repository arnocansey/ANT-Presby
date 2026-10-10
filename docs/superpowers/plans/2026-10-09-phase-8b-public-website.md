# Phase 8b: Public Website Restyle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle every public and member page of the website with the 8a design system, so that every page:
- uses the 8a components (PageHeader, Section, Card, Button, Badge, EmptyState, Skeleton, Tile, Scripture, Select, Tabs) and token classes only
- has loading, empty and error states on every list
- works at 375px and 1280px, in light and dark

Nothing about data, behaviour or routes changes.

**Architecture:**
- **Composition, not new styling.** Pages are rebuilt from the 8a components in `frontend/src/components/ui`. The few pieces only public pages need live in a new folder, `frontend/src/components/site/` (Task 1), and are candidates to promote into `components/ui` after 8b–8d merge.
- **Logic is copied verbatim.** Every file keeps its hook calls, form registrations, handlers and hrefs. Each task proves this with a parity check against the 8a tip `fc3fd49`.
- **One page shell:** `<div className="container-max space-y-8 py-10 sm:py-12">` with a `PageHeader` first. Detail pages start with a `BackLink`.

**Tech Stack:** Next.js 16 (App Router, all pages here are `'use client'`), Tailwind 3.4 with the 8a tokens, `lucide-react` 0.294, `react-hook-form` + `zod`, TanStack Query (through `hooks/useApi.ts`, untouched).

**Spec:** `docs/superpowers/specs/2026-10-08-ui-ux-redesign-design.md` (§1 intent and out of scope, §2 design system, §3.1 website navigation, §4 stage 8b, §5 quality bar, §6 risks). Reference: `docs/design-system.md`, and the finished hub Home `frontend/src/app/page.tsx` for the target look.

## Global Constraints

- **Branch:** `feature/ui-public`, made from `fc3fd49` (the tip of `feature/ui-foundation`, Phase 8a). Never push, merge, or touch other branches or the main checkout.
- **File ownership (merge safety with 8c and 8d running in parallel).** Edit only:
  - `frontend/src/app/**`, except `app/admin/**`, `app/page.tsx`, `app/layout.tsx`, `app/icon.tsx` and `app/apple-icon.tsx`
  - `frontend/src/components/{auth,devotionals,gallery}/**`
  - `frontend/src/components/layout/NotificationBell.tsx`
  - the new folder `frontend/src/components/site/**`
  - appends to `docs/qa-checklist.md` and `docs/features.md`

  Do NOT edit `components/ui/**`, `components/layout/{Header,Footer,LiveBanner,AdminLayout,AdminSidebar}.tsx`, `lib/navigation.ts`, `tailwind.config.js`, `styles/**`, `hooks/useApi.ts`, `package.json`, `mobile/` or `backend/`.
- **No behaviour, data or route changes:**
  - Every hook call stays, with the same arguments, including React hooks. **No new hook calls of any kind.** You may destructure more fields (for example `isError`) from a hook result that is already there.
  - Every `register('…')` form field, zod schema, `onSubmit` body, mutation call and handler is copied verbatim.
  - Every `href` that existed still exists. Links to existing routes may be added.
  - Copy may be tidied, but labels the user acts on ("Register for Event", "Ask to join", "I prayed", "Give …") keep their wording.
- **Colours come from tokens only.** No raw palette classes (`sky-`, `cyan-`, `amber-`, `slate-`, `gray-`, `indigo-`, `purple-`, `rose-`, `pink-`, `teal-`, `green-`, `red-`, `orange-`, `emerald-`, `blue-`, nor `fuchsia-`, `violet-`, `yellow-`), no hex, no `rgb(…)`, no arbitrary gradients and no `dark:` variants in owned files. Tokens already switch for dark mode.
  - **The only exception:** `bg-black`, `bg-black/60`, `bg-black/80`, `bg-black/95`, `text-white`, `text-white/80`, `bg-white/10`, `bg-white/20` and `ring-white` are allowed on photo and video surfaces only: the video frames in `app/sermons/[id]/page.tsx` and `app/live/page.tsx`, the photo download overlay in `app/gallery/[id]/page.tsx`, and the lightbox `components/gallery/PhotoViewer.tsx`. Media is shown on black in both themes.
  - **Not scanned:** `app/layout.tsx`, `app/icon.tsx` and `app/apple-icon.tsx`. Their hex values are browser theme colours and generated-icon colours that must be literal.
- **Class mapping (old → new).** Every task applies this table, plus the structural changes it lists:

  | Old classes | New |
  |---|---|
  | `text-slate-950 dark:text-white`, `text-slate-900 dark:text-slate-50`, `text-slate-950` | `text-foreground` |
  | `text-slate-700 dark:text-slate-300`, `text-slate-600`, `text-ui-muted` | `text-foreground/85` |
  | `text-slate-500`, `text-slate-400`, `text-ui-subtle` | `text-muted` |
  | `bg-white dark:bg-slate-950` on a card | the `Card` component, or `bg-card` |
  | `bg-slate-50 dark:bg-slate-900`, `bg-slate-100 dark:bg-slate-800` | `bg-surface` |
  | `border-slate-200 dark:border-slate-800`, `border-slate-300 dark:border-slate-700`, `border-slate-100` | `border-border` |
  | `divide-slate-200 dark:divide-slate-800` | `divide-border` |
  | Overrides on `Input`/`Textarea`/`select` (`h-12 rounded-xl border-slate-200 bg-slate-50 …`) | remove them; use `Input`, `Textarea`, `Select` as they are (h-11, `border-input`, rounded-lg) |
  | `text-sky-700 dark:text-cyan-300` (links), `hover:text-sky-800` | `text-link hover:underline` |
  | `hover:border-sky-300 dark:hover:border-cyan-500/40` | `hover:border-primary/40` |
  | `bg-sky-700 text-white` / `dark:bg-cyan-400 dark:text-slate-950` (selected, primary) | `bg-primary text-primary-foreground` |
  | `bg-amber-500 text-slate-950 hover:bg-amber-400` on a `Button` | delete it; the default `Button` is primary |
  | `rounded-full` on a `Button`, `h-12 rounded-xl` on a `Button` | delete it; use `size="lg"` where the old button was 48px tall |
  | `text-amber-600 dark:text-amber-300` eyebrow text | `PageHeader eyebrow=…`, or `text-gold-ink` |
  | amber, sky or slate pill spans | `<Badge tone="gold" \| "neutral" \| …>` |
  | `text-emerald-700 dark:text-emerald-300` messages | `<StatusMessage tone="success">` |
  | `text-red-600`, `text-red-700 dark:text-red-300` messages | `<StatusMessage tone="danger">` (form-level), `text-sm text-danger` (field-level) |
  | `bg-red-600 text-white` live pill, `bg-rose-600 text-white` counter | `<Badge tone="live">`, `bg-danger-solid text-danger-solid-foreground` |
  | `bg-sky-100 text-sky-700 dark:bg-cyan-950/50 dark:text-cyan-300` icon chips | `bg-primary/10 text-primary` |
  | `bg-gradient-to-br from-… to-…` decorative bands | `<MediaPlaceholder icon={…}>`, or delete the band |
  | `rounded-[1.2rem]` … `rounded-[1.8rem]`, `rounded-2xl` on cards | `rounded-card`; large panels `rounded-panel` |
  | `shadow-sm`, `shadow-xl`, `shadow-2xl`, `hover:shadow-lg`, `hover:-translate-y-0.5` | delete (Card carries `shadow-soft`; hover is `hover:border-primary/40`) |
  | `font-black`, `font-extrabold` | `font-bold` (titles go through `PageHeader`) |

- **Component imports (8a export style, exact):**
  - Default exports: `PageHeader` from `@/components/ui/page-header`, `Section` from `@/components/ui/section`, `EmptyState` from `@/components/ui/empty-state`, `Tile` from `@/components/ui/tile`, `Tabs` from `@/components/ui/tabs`, `Scripture` from `@/components/ui/scripture`, `ConfirmDialog` from `@/components/ui/confirm-dialog`
  - Named exports: `{ Badge }`, `{ Button }`, `{ Card, CardContent, CardHeader, CardTitle }`, `{ Input }`, `{ Label }`, `{ Textarea }`, `{ Select }`, `{ Skeleton, SkeletonCard }`
  - The new site components (Task 1) are all default exports from `@/components/site/<Name>`.
- **States, on every list or fetched block:**
  - loading → `SkeletonGrid` or `Skeleton` rows (never bare "Loading..." text)
  - error → `<EmptyState icon={…} title="<Thing> couldn't load right now" message="Please try again in a moment." />`
  - empty → `<EmptyState icon={…} title="…" message="…" />`, with an action where there is an obvious next step
- **Accessibility:**
  - every input has a `Label` (visible, or `className="sr-only"` for a search box)
  - touch targets are at least 44px (`h-11`, `min-h-11` or `h-11 w-11`)
  - toggles carry `aria-pressed`
  - icon-only buttons have `aria-label`
  - decorative icons have `aria-hidden="true"`
  - images keep their `alt`
  - status is never colour alone; badges carry text
- **Phone width:** no element may overflow 375px. Rows with several buttons use `flex flex-wrap`. Long titles get `min-w-0` plus `break-words` or `truncate`.
- **Installs:** only Task 1 Step 1 installs (`npm ci` in `frontend/`, in the background). Task 9 installs the backend with `pnpm install --frozen-lockfile`. If pnpm rewrites `backend/pnpm-workspace.yaml`, revert it with `git checkout -- backend/pnpm-workspace.yaml`.
- **Platform:** Windows with Git Bash and no Python. Use the Write tool for full-file replacements; files may have CRLF endings, and Write replaces them cleanly. Never script replacements with `String.replace` using `$` in the replacement.
- **Commits:** one per task. Every message ends with a blank line, then `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- **Secrets:** none in this phase; never write any into a file.

### Standard checks (every task runs these on its own files)

Run them from the repository root. `FILES` is the task's file list, given in the task.

```bash
# 1. Build checks
(cd frontend && npm run -s type-check && npm run -s lint && npm run -s build) && echo CHECKS-OK

# 2. Colour scan: must print nothing
grep -nE "(sky|cyan|amber|slate|gray|indigo|purple|rose|pink|teal|green|red|orange|emerald|blue)-[0-9]|#[0-9A-Fa-f]{3,6}\b" $FILES

# 3. Extended scan: must print nothing
grep -nE "dark:|(fuchsia|violet|yellow|lime|zinc|stone|neutral)-[0-9]|\[linear-gradient|rgb\(|text-ui-(muted|subtle)|rounded-\[[0-9.]+rem\]|font-black" $FILES

# 4. Parity with 8a: hook calls, form fields and hrefs. Must print nothing except "NEW FILE" lines.
parity() {
  for f in "$@"; do
    old=$(git show fc3fd49:"$f" 2>/dev/null)
    if [ -z "$old" ]; then echo "NEW FILE (skipped): $f"; continue; fi
    pat="\buse[A-Z][A-Za-z]*\(|register\('[A-Za-z]+'"
    diff <(printf '%s\n' "$old" | grep -oE "$pat" | sort) <(grep -oE "$pat" "$f" | sort) > /dev/null \
      || echo "HOOK/FIELD DIFF: $f"
    hp="href(=\{?|: )[\"'\`][^\"'\`]+"
    comm -23 <(printf '%s\n' "$old" | grep -oE "$hp" | sed -E "s/^href(=\{?|: )//" | sort -u) \
             <(grep -oE "$hp" "$f" | sed -E "s/^href(=\{?|: )//" | sort -u) | sed "s|^|LOST HREF in $f: |"
  done
}
parity $FILES
```

If check 4 prints `HOOK/FIELD DIFF`, run `diff <(git show fc3fd49:<file> | grep -oE "$pat" | sort) <(grep -oE "$pat" <file> | sort)` to see what changed, and restore the missing or extra call.

**By eye:** `cd frontend && npm run dev`, then open the task's pages in Chrome DevTools device mode at **375px** and at **1280px**. Use the header theme toggle to check **Light** and **Dark**. Check each page twice:
- with the backend running (`cd backend && npm run dev`), for the data and empty states
- with the backend stopped, for the error states

On each page, the DevTools console snippet below must print `[]`, or only elements inside a horizontal scroller (the series row, the tabs):

```js
[...document.querySelectorAll('main *')].filter((e) => e.getBoundingClientRect().right > innerWidth + 1).map((e) => e.className)
```

## Review Focus

1. **A form silently loses a field or its validation.** Donate, contact, login, register, profile, the new prayer request and the group message form all get new markup around the same `register()` calls. The user expects every field to submit exactly as before, and every validation message to still appear under its field. *(Parity check 4 in Tasks 2, 4, 6, 7 and 8, plus a by-eye submit with an empty form in each.)*
2. **Dark-mode leftovers.** Any surviving `slate-`/`amber-` class or `dark:` variant shows light-on-light or dark-on-dark text on a dark-mode device. The user expects every page to be readable in Dark. *(Scans 2 and 3 in every task, and the whole-scope scan in Task 9.)*
3. **A page loses or never gains its error state.** Several pages render nothing, or a misleading "0" or a blank form, when the API fails: album, live, devotionals, registrations, profile, dashboard metrics, search, series and "My requests". With the backend stopped, the user expects a friendly "couldn't load" message on every page. *(The "backend stopped" by-eye pass in every task.)*
4. **375px overflow.** Rows of buttons (event cards, the album toolbar, the prayer-wall filter, the dashboard header), long titles, and the GH₵ amount field are the likely culprits. The user expects no sideways scrolling and no clipped buttons on a phone. *(The console snippet in every task; the donate amount field in Task 2.)*
5. **Behaviour drift hidden by a restyle.** Examples: a toggle that loses `aria-pressed`, a disabled "Registered" button that becomes clickable, a delete icon that loses its `aria-label`, a `Button loading` that changes when a button is disabled, a link that disappears from a restyled page. The user expects every action to do exactly what it did before. *(Parity check 4 hrefs and hooks; each task's by-eye list names its toggles and disabled states.)*

---

## File Map

| File | Change | Task |
|---|---|---|
| `frontend/src/components/site/BackLink.tsx`, `SearchField.tsx`, `MediaPlaceholder.tsx`, `SkeletonGrid.tsx`, `StatusMessage.tsx`, `DateBadge.tsx`, `LegalDocument.tsx` | Create | 1 |
| `frontend/src/app/sermons/page.tsx` (Watch hub), `sermons/[id]/page.tsx`, `sermons/series/[id]/page.tsx`, `live/page.tsx` | Rewrite | 1 |
| `frontend/src/app/events/page.tsx`, `events/[id]/page.tsx`, `donate/page.tsx` | Rewrite | 2 |
| `frontend/src/app/devotionals/page.tsx`, `devotionals/[id]/page.tsx`, `components/devotionals/DevotionalBody.tsx`, `app/news/page.tsx`, `news/[id]/page.tsx`, `app/gallery/page.tsx`, `gallery/[id]/page.tsx`, `components/gallery/PhotoViewer.tsx` | Rewrite / Modify | 3 |
| `frontend/src/app/groups/page.tsx`, `groups/[id]/page.tsx`, `prayer/new/page.tsx`, `prayer/wall/page.tsx` | Rewrite | 4 |
| `frontend/src/app/community/page.tsx` | Rewrite | 5 |
| `frontend/src/app/ministries/page.tsx`, `ministries/[id]/page.tsx`, `about/page.tsx`, `contact/page.tsx`, `faq/page.tsx`, `privacy/page.tsx`, `terms/page.tsx` | Rewrite | 6 |
| `frontend/src/components/auth/LoginForm.tsx`, `RegisterForm.tsx`, `RouteGuard.tsx`, `app/verify-email/page.tsx` | Rewrite / Modify | 7 |
| `frontend/src/app/dashboard/page.tsx`, `dashboard/registrations/page.tsx`, `profile/page.tsx`, `search/page.tsx`, `components/layout/NotificationBell.tsx` | Rewrite / Modify | 8 |
| `docs/qa-checklist.md`, `docs/features.md` | Append | 9 |

Unchanged on purpose:
- `app/login/page.tsx` and `app/register/page.tsx` only render the forms restyled in Task 7.
- `app/dashboard/layout.tsx` only wraps `RouteGuard`.
- `components/auth/AuthBootstrap.tsx` has no markup.
- `components/devotionals/TodayDevotionalCard.tsx` was finished in 8a.

---

### Task 1: Install, shared site pieces, and the Watch area (sermons hub, sermon, series, live)

**Files:**
- Create: `frontend/src/components/site/BackLink.tsx`, `SearchField.tsx`, `MediaPlaceholder.tsx`, `SkeletonGrid.tsx`, `StatusMessage.tsx`, `DateBadge.tsx`, `LegalDocument.tsx`
- Rewrite: `frontend/src/app/sermons/page.tsx`, `frontend/src/app/sermons/[id]/page.tsx`, `frontend/src/app/sermons/series/[id]/page.tsx`, `frontend/src/app/live/page.tsx`

**Interfaces:**
- Consumes: the 8a components (see Global Constraints → Component imports).
- Produces (all default exports, used by Tasks 2–8):
  - `BackLink({ href: string; label: string })`
  - `SearchField(props: InputHTMLAttributes<HTMLInputElement> & { label: string })`, where `label` becomes the input's `aria-label`
  - `MediaPlaceholder({ icon: LucideIcon; className?: string })`
  - `SkeletonGrid({ count?: number; className?: string })`, which defaults to 3 cards in `grid gap-4 md:grid-cols-3`. Pass a `className` to change the columns; tailwind-merge resolves the conflicts.
  - `StatusMessage({ tone?: 'success' | 'danger' | 'info'; children: ReactNode; className?: string })`
  - `DateBadge({ date: Date })`
  - `LegalDocument({ title: string; description?: string; sections: { heading: string; body: string }[] })`
  - All seven are **candidates to promote to `components/ui`** after 8b–8d merge.

- [ ] **Step 1: Branch check and background install**

You are on branch `feature/ui-public` at `fc3fd49`, plus one commit holding this plan. Confirm it:

```bash
git branch --show-current && git log --oneline -2
```

Expected: `feature/ui-public`, then the plan commit, then `fc3fd49 fix(web): visible card shadows…`.

Start the install **with `run_in_background: true`**, then carry on with Steps 2–6 while it runs:

```bash
cd frontend && npm ci --no-audit --no-fund
```

- [ ] **Step 2: Create the shared site components**

`frontend/src/components/site/BackLink.tsx`:

```tsx
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

// "Back to …" link at the top of detail pages.
export default function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-semibold text-link hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      {label}
    </Link>
  );
}
```

`frontend/src/components/site/SearchField.tsx`:

```tsx
'use client';

import * as React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type SearchFieldProps = React.InputHTMLAttributes<HTMLInputElement> & { label: string };

// Text input with a leading search icon. `label` is the accessible name.
export default function SearchField({ label, className, ...props }: SearchFieldProps) {
  return (
    <div className={cn('relative', className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
      <Input aria-label={label} className="pl-10" {...props} />
    </div>
  );
}
```

`frontend/src/components/site/MediaPlaceholder.tsx`:

```tsx
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

// Stands in for a missing image: a calm surface with an icon (replaces the old gradient bands).
export default function MediaPlaceholder({ icon: Icon, className }: { icon: LucideIcon; className?: string }) {
  return (
    <div className={cn('flex items-center justify-center bg-surface text-primary', className)} aria-hidden="true">
      <Icon className="h-10 w-10 opacity-80" />
    </div>
  );
}
```

`frontend/src/components/site/SkeletonGrid.tsx`:

```tsx
import { SkeletonCard } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// Loading placeholder for card grids.
export default function SkeletonGrid({ count = 3, className }: { count?: number; className?: string }) {
  return (
    <div role="status" className={cn('grid gap-4 md:grid-cols-3', className)}>
      <span className="sr-only">Loading…</span>
      {Array.from({ length: count }, (_, index) => (
        <SkeletonCard key={index} />
      ))}
    </div>
  );
}
```

`frontend/src/components/site/StatusMessage.tsx`:

```tsx
import * as React from 'react';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

const TONES = {
  success: { className: 'border-success/30 bg-success/10 text-success', Icon: CheckCircle2 },
  danger: { className: 'border-danger/30 bg-danger/10 text-danger', Icon: AlertCircle },
  info: { className: 'border-border bg-surface text-muted', Icon: Info },
} as const;

// Form-level result message (saved, failed, verifying…). Icon plus text, never colour alone.
export default function StatusMessage({
  tone = 'info',
  children,
  className,
}: {
  tone?: keyof typeof TONES;
  children: React.ReactNode;
  className?: string;
}) {
  const { className: toneClass, Icon } = TONES[tone];
  return (
    <p
      role={tone === 'danger' ? 'alert' : 'status'}
      className={cn('flex items-start gap-2 rounded-lg border px-3 py-2 text-sm font-medium', toneClass, className)}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span className="min-w-0 break-words">{children}</span>
    </p>
  );
}
```

`frontend/src/components/site/DateBadge.tsx`:

```tsx
// Month/day block used on event lists (matches the hub Home event cards).
export default function DateBadge({ date }: { date: Date }) {
  const valid = !Number.isNaN(date.getTime());
  return (
    <span
      className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-lg bg-primary text-primary-foreground"
      aria-hidden="true"
    >
      <span className="text-[11px] font-semibold uppercase">
        {valid ? date.toLocaleDateString('en-GB', { month: 'short' }) : 'TBA'}
      </span>
      <span className="text-xl font-bold leading-none">{valid ? date.getDate() : ''}</span>
    </span>
  );
}
```

`frontend/src/components/site/LegalDocument.tsx`:

```tsx
import { Card, CardContent } from '@/components/ui/card';
import PageHeader from '@/components/ui/page-header';

export type LegalSection = { heading: string; body: string };

// Shared layout for Privacy and Terms: numbered sections in one readable column.
export default function LegalDocument({
  title,
  description,
  sections,
}: {
  title: string;
  description?: string;
  sections: LegalSection[];
}) {
  return (
    <div className="container-max py-10 sm:py-12">
      <div className="mx-auto max-w-3xl space-y-8">
        <PageHeader title={title} description={description} breadcrumb={[{ label: 'About', href: '/about' }, { label: title }]} />
        <Card>
          <CardContent className="space-y-6 p-6 sm:p-8">
            {sections.map((section, index) => (
              <section key={section.heading} className="space-y-2">
                <h2 className="text-lg font-semibold text-foreground">
                  {index + 1}. {section.heading}
                </h2>
                <p className="leading-relaxed text-foreground/85">{section.body}</p>
              </section>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Rewrite the sermons page as the Watch hub**

Spec §3.1 asks for the live link, the latest sermon, the series, and all sermons. The live link is a static "Live stream" button, because no new hook is allowed; the global `LiveBanner` already shows the red banner when a service is live. The latest sermon is `sermons[0]` from the existing query.

Replace `frontend/src/app/sermons/page.tsx` with:

```tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { Layers, PlayCircle, Radio } from 'lucide-react';
import MediaPlaceholder from '@/components/site/MediaPlaceholder';
import SearchField from '@/components/site/SearchField';
import SkeletonGrid from '@/components/site/SkeletonGrid';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import EmptyState from '@/components/ui/empty-state';
import { Label } from '@/components/ui/label';
import PageHeader from '@/components/ui/page-header';
import Section from '@/components/ui/section';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useSermons, useSermonSeriesList } from '@/hooks/useApi';
import { formatDateOnly } from '@/lib/utils';

export default function SermonsPage() {
  const { data, isLoading, error } = useSermons(1, 24);
  const [search, setSearch] = React.useState('');
  const sermons = (data?.data ?? []) as any[];
  const { data: seriesList, isLoading: seriesLoading, isError: seriesError } = useSermonSeriesList();

  const speakers = React.useMemo(() => {
    const values = Array.from(
      new Set(sermons.map((sermon) => sermon?.speaker).filter(Boolean))
    ) as string[];
    return ['All Speakers', ...values];
  }, [sermons]);

  const [selectedSpeaker, setSelectedSpeaker] = React.useState('All Speakers');

  const filtered = sermons.filter((sermon) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      String(sermon?.title || '').toLowerCase().includes(q) ||
      String(sermon?.speaker || '').toLowerCase().includes(q) ||
      String(sermon?.description || '').toLowerCase().includes(q);
    const matchesSpeaker =
      selectedSpeaker === 'All Speakers' || sermon?.speaker === selectedSpeaker;
    return matchesSearch && matchesSpeaker;
  });

  const latest = sermons[0];

  return (
    <div className="container-max space-y-12 py-10 sm:py-12">
      <PageHeader
        eyebrow="Watch"
        title="Sermons and services"
        description="Watch the latest message, follow a series, or search every sermon."
        actions={
          <Button asChild variant="secondary">
            <Link href="/live">
              <Radio className="h-4 w-4" aria-hidden="true" />
              Live stream
            </Link>
          </Button>
        }
      />

      {/* Latest sermon */}
      {isLoading ? (
        <Skeleton className="h-56 w-full rounded-panel" />
      ) : !error && latest ? (
        <Link
          href={`/sermons/${latest.id}`}
          className="group grid overflow-hidden rounded-panel border border-border bg-card transition-colors hover:border-primary/40 md:grid-cols-[1.1fr_1fr]"
        >
          <MediaPlaceholder icon={PlayCircle} className="h-48 md:h-full md:min-h-[14rem]" />
          <span className="flex min-w-0 flex-col justify-center gap-3 p-6 sm:p-8">
            <Badge tone="gold" className="self-start">
              Latest sermon
            </Badge>
            <span className="break-words text-2xl font-bold tracking-tight text-foreground">{latest.title}</span>
            <span className="text-sm text-muted">
              {latest.speaker || 'ANT PRESS'}
              {latest.sermon_date ? ` · ${formatDateOnly(latest.sermon_date)}` : ''}
            </span>
            {latest.description && <span className="line-clamp-3 text-foreground/85">{latest.description}</span>}
            <span className="text-sm font-semibold text-link group-hover:underline">Watch now →</span>
          </span>
        </Link>
      ) : null}

      <Section title="Series">
        {seriesLoading ? (
          <div className="flex gap-4 overflow-hidden" role="status">
            <span className="sr-only">Loading…</span>
            {[0, 1, 2].map((key) => (
              <Skeleton key={key} className="h-28 w-56 shrink-0 rounded-card" />
            ))}
          </div>
        ) : seriesError ? (
          <EmptyState icon={Layers} title="Series couldn't load right now" message="Please try again in a moment." />
        ) : !seriesList || seriesList.length === 0 ? (
          <EmptyState icon={Layers} title="No series yet" message="Sermon series will appear here." />
        ) : (
          <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
            {seriesList.map((series) => (
              <Link
                key={series.id}
                href={`/sermons/series/${series.id}`}
                className="w-56 shrink-0 snap-start rounded-card border border-border bg-card p-4 transition-colors hover:border-primary/40"
              >
                <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Layers className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="line-clamp-2 block font-semibold text-foreground">{series.title}</span>
                <span className="mt-1 block text-xs text-muted">
                  {series.sermon_count} {series.sermon_count === 1 ? 'sermon' : 'sermons'}
                  {series.start_date ? ` · from ${formatDateOnly(series.start_date)}` : ''}
                </span>
              </Link>
            ))}
          </div>
        )}
      </Section>

      <Section title="All sermons">
        <div className="flex flex-col gap-3 sm:flex-row">
          <SearchField
            label="Search sermons"
            className="flex-1"
            placeholder="Search sermons, speakers and descriptions"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="sm:w-56">
            <Label htmlFor="sermon-speaker" className="sr-only">
              Speaker
            </Label>
            <Select id="sermon-speaker" value={selectedSpeaker} onChange={(e) => setSelectedSpeaker(e.target.value)}>
              {speakers.map((speaker) => (
                <option key={speaker} value={speaker}>
                  {speaker}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {isLoading ? (
          <SkeletonGrid count={4} className="sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4" />
        ) : error ? (
          <EmptyState icon={PlayCircle} title="Sermons couldn't load right now" message="Please try again in a moment." />
        ) : sermons.length === 0 ? (
          <EmptyState icon={PlayCircle} title="No sermons yet" message="Recorded sermons will appear here." />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={PlayCircle}
            title="No sermons match your search"
            message="Try a different word or speaker."
            action={
              <Button
                variant="secondary"
                onClick={() => {
                  setSearch('');
                  setSelectedSpeaker('All Speakers');
                }}
              >
                Clear search
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {filtered.map((sermon) => (
              <Link
                key={sermon.id}
                href={`/sermons/${sermon.id}`}
                className="group flex flex-col overflow-hidden rounded-card border border-border bg-card transition-colors hover:border-primary/40"
              >
                <MediaPlaceholder icon={PlayCircle} className="h-36" />
                <span className="flex flex-1 flex-col gap-1 p-4">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-gold-ink">
                    {sermon.series_title || 'Sermon'}
                  </span>
                  <span className="line-clamp-2 font-semibold text-foreground group-hover:underline">{sermon.title}</span>
                  <span className="text-sm text-muted">{sermon.speaker || 'ANT PRESS'}</span>
                </span>
              </Link>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}
```

- [ ] **Step 4: Rewrite the sermon detail page**

Replace `frontend/src/app/sermons/[id]/page.tsx` with:

```tsx
'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Mic, PlayCircle } from 'lucide-react';
import BackLink from '@/components/site/BackLink';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import EmptyState from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useSermon } from '@/hooks/useApi';

export default function SermonDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ? Number(params.id) : 0;
  const { data, isLoading, error } = useSermon(id);

  return (
    <div className="container-max space-y-6 py-10 sm:py-12">
      <BackLink href="/sermons" label="Back to sermons" />

      {isLoading && (
        <div className="space-y-4" role="status">
          <span className="sr-only">Loading…</span>
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="aspect-video w-full rounded-panel" />
        </div>
      )}
      {!isLoading && error && (
        <EmptyState icon={PlayCircle} title="This sermon couldn't load right now" message="Please try again in a moment." />
      )}
      {!isLoading && !error && !data && (
        <EmptyState
          icon={PlayCircle}
          title="Sermon not found"
          message="It may have been moved or removed."
          action={
            <Button asChild variant="secondary">
              <Link href="/sermons">Browse sermons</Link>
            </Button>
          }
        />
      )}

      {data && (
        <article className="space-y-8">
          <header className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold-ink">Sermon</p>
            <h1 className="break-words text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{data.title}</h1>
            {data.speaker && (
              <p className="inline-flex items-center gap-2 text-sm text-muted">
                <Mic className="h-4 w-4" aria-hidden="true" />
                {data.speaker}
              </p>
            )}
          </header>

          {/* Video surface: black in both themes (allowed exception). */}
          <div className="overflow-hidden rounded-panel border border-border bg-black">
            <div className="aspect-video">
              {data.video_url ? (
                <iframe title={data.title} src={data.video_url} className="h-full w-full" allowFullScreen />
              ) : (
                <div className="flex h-full items-center justify-center p-6 text-center text-white/80">
                  <div>
                    <PlayCircle className="mx-auto mb-3 h-12 w-12 opacity-60" aria-hidden="true" />
                    <p>No video available for this sermon yet.</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <p className="leading-relaxed text-foreground/85">
              {data.description || 'This sermon is available in the ANT PRESS library and can be revisited here whenever you need it.'}
            </p>

            <Card>
              <CardContent className="space-y-4 p-6">
                <h2 className="text-lg font-semibold text-foreground">Keep exploring</h2>
                <p className="text-sm text-muted">Browse the wider sermon library or continue into connected ministry content.</p>
                <div className="flex flex-col gap-3">
                  <Button asChild>
                    <Link href="/sermons">More sermons</Link>
                  </Button>
                  <Button asChild variant="secondary">
                    <Link href="/ministries">Explore ministries</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </article>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Rewrite the series page**

Replace `frontend/src/app/sermons/series/[id]/page.tsx` with:

```tsx
'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Layers, PlayCircle } from 'lucide-react';
import BackLink from '@/components/site/BackLink';
import { Button } from '@/components/ui/button';
import EmptyState from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useSermonSeries } from '@/hooks/useApi';
import { formatDateOnly, resolveAssetUrl } from '@/lib/utils';

export default function SermonSeriesPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params?.id);
  const validId = Number.isInteger(id) && id > 0 ? id : undefined;
  const { data: series, isLoading, error } = useSermonSeries(validId);

  const dateRange = series
    ? [formatDateOnly(series.start_date), formatDateOnly(series.end_date)].filter(Boolean).join(' – ')
    : '';

  return (
    <div className="container-max space-y-8 py-10 sm:py-12">
      <BackLink href="/sermons" label="All sermons" />

      {!validId || error ? (
        <EmptyState
          icon={Layers}
          title="This series could not be found"
          message="It may have been removed, or it couldn't load right now."
          action={
            <Button asChild variant="secondary">
              <Link href="/sermons">Browse sermons</Link>
            </Button>
          }
        />
      ) : isLoading || !series ? (
        <div className="space-y-4" role="status">
          <span className="sr-only">Loading…</span>
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : (
        <>
          <header className="flex flex-col gap-6 border-b border-border pb-6 sm:flex-row sm:items-center">
            {series.cover_image_url && (
              <Image
                src={resolveAssetUrl(series.cover_image_url)}
                alt={series.title}
                width={240}
                height={135}
                unoptimized
                className="h-auto w-full max-w-[240px] rounded-card object-cover"
              />
            )}
            <div className="min-w-0 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold-ink">Sermon series</p>
              <h1 className="break-words text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{series.title}</h1>
              {dateRange && <p className="text-sm text-muted">{dateRange}</p>}
              {series.description && (
                <p className="max-w-2xl whitespace-pre-line text-foreground/85">{series.description}</p>
              )}
            </div>
          </header>

          {series.sermons.length === 0 ? (
            <EmptyState icon={PlayCircle} title="No sermons in this series yet" message="New messages will appear here." />
          ) : (
            <ol className="space-y-3">
              {series.sermons.map((sermon, index) => (
                <li key={sermon.id}>
                  <Link
                    href={`/sermons/${sermon.id}`}
                    className="flex items-center gap-4 rounded-card border border-border bg-card p-4 transition-colors hover:border-primary/40"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-foreground">{sermon.title}</span>
                      <span className="block text-sm text-muted">
                        {sermon.speaker} · {formatDateOnly(sermon.sermon_date)}
                      </span>
                    </span>
                    <PlayCircle className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 6: Rewrite the live page**

Replace `frontend/src/app/live/page.tsx` with:

```tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { Radio } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import EmptyState from '@/components/ui/empty-state';
import PageHeader from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { useLiveStream } from '@/hooks/useApi';
import { formatDateTime } from '@/lib/utils';

export default function LivePage() {
  const { data: live, isLoading, isError } = useLiveStream(60_000);

  return (
    <div className="container-max space-y-8 py-10 sm:py-12">
      <PageHeader eyebrow="Watch" title="Livestream" description="Join our services live on YouTube or Facebook." />

      {isLoading ? (
        <Skeleton className="aspect-video w-full rounded-panel" />
      ) : isError && !live ? (
        <EmptyState icon={Radio} title="The livestream couldn't load right now" message="Please try again in a moment." />
      ) : !live?.is_live ? (
        <EmptyState
          icon={Radio}
          title="We're not live right now"
          message="When a service is streaming, it will appear here."
          action={
            <Button asChild variant="secondary">
              <Link href="/sermons">Watch past sermons</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <Badge tone="live">Live</Badge>
            <h2 className="min-w-0 break-words text-xl font-semibold text-foreground">{live.title || 'Livestream'}</h2>
          </div>
          {live.started_at && <p className="text-sm text-muted">Started {formatDateTime(live.started_at)}</p>}

          {live.youtube_embed_url && (
            <div className="aspect-video w-full overflow-hidden rounded-panel bg-black">
              <iframe
                src={live.youtube_embed_url}
                title={live.title || 'Livestream'}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            {live.youtube_url && (
              <Button asChild>
                <a href={live.youtube_url} target="_blank" rel="noopener noreferrer">
                  Watch on YouTube
                </a>
              </Button>
            )}
            {live.facebook_url && (
              <Button asChild variant="secondary">
                <a href={live.facebook_url} target="_blank" rel="noopener noreferrer">
                  Watch on Facebook
                </a>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 7: Run the standard checks**

Wait for the Step 1 install to finish (`added … packages`). Then run the Standard checks, with:

```bash
FILES="frontend/src/components/site/BackLink.tsx frontend/src/components/site/SearchField.tsx frontend/src/components/site/MediaPlaceholder.tsx frontend/src/components/site/SkeletonGrid.tsx frontend/src/components/site/StatusMessage.tsx frontend/src/components/site/DateBadge.tsx frontend/src/components/site/LegalDocument.tsx frontend/src/app/sermons/page.tsx frontend/src/app/sermons/[id]/page.tsx frontend/src/app/sermons/series/[id]/page.tsx frontend/src/app/live/page.tsx"
```

Expected:
- `CHECKS-OK`
- scans 2 and 3 print nothing
- parity prints only the seven `NEW FILE (skipped)` lines

The `bg-black` and `text-white/80` in `sermons/[id]` and `bg-black` in `live` are the allowed video-surface exception; they do not match scan 2.

- [ ] **Step 8: Check by eye (375px and 1280px, Light and Dark)**

- `/sermons`:
  - the header has the "Live stream" button
  - the latest-sermon panel stacks on a phone
  - the series row scrolls sideways inside its own strip, and the page itself does not scroll sideways
  - search and the speaker select sit side by side at 1280 and stacked at 375
  - typing "zzzz" shows "No sermons match your search", and "Clear search" resets both the search box and the speaker select
- `/sermons/<id>`: back link; the black video frame; the "Keep exploring" card is below the description on a phone. A sermon with no video shows the message on black.
- `/sermons/series/<id>`: numbered list; long titles truncate. `/sermons/series/999999` shows "could not be found".
- `/live` when not live: the empty state with "Watch past sermons". When an admin is live (or mock it), the red "Live" badge with its pulsing dot shows, plus the player and the buttons.
- With the backend stopped, `/sermons` shows both "couldn't load" states (series and sermons), `/sermons/1` shows its error, and `/live` shows "The livestream couldn't load right now".

- [ ] **Step 9: Commit**

```bash
git add frontend/src/components/site frontend/src/app/sermons frontend/src/app/live
git commit -m "feat(web): shared site pieces and the Watch hub, sermon, series and live pages on the design system

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Events, event detail and Give (with the GH₵ prefix fix)

**Files:**
- Rewrite: `frontend/src/app/events/page.tsx`, `frontend/src/app/events/[id]/page.tsx`, `frontend/src/app/donate/page.tsx`

**Interfaces:**
- Consumes (Task 1): `BackLink`, `DateBadge`, `MediaPlaceholder`, `SearchField`, `SkeletonGrid`, `StatusMessage`.
- Produces: nothing new.

- [ ] **Step 1: Rewrite the events list**

Structural changes:
- the filter pills become the 8a `Tabs`
- the coloured date squares become `DateBadge`
- each event is a `Card`
- the amber Register/Registered buttons become a primary `Button`, plus a disabled secondary `Button` with an icon
- there are separate states for "no events at all" and "no events match"

Replace `frontend/src/app/events/page.tsx` with:

```tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { CalendarCheck, CalendarDays, MapPin, Users } from 'lucide-react';
import DateBadge from '@/components/site/DateBadge';
import SearchField from '@/components/site/SearchField';
import SkeletonGrid from '@/components/site/SkeletonGrid';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import EmptyState from '@/components/ui/empty-state';
import PageHeader from '@/components/ui/page-header';
import Tabs from '@/components/ui/tabs';
import { useEvents, useUserEventRegistrations } from '@/hooks/useApi';
import { useAuthStore } from '@/lib/store';
import { resolveAssetUrl } from '@/lib/utils';

type EventFilter = 'all' | 'upcoming' | 'past';

const FILTERS: { value: EventFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'past', label: 'Past' },
];

export default function EventsPage() {
  const { isAuthenticated } = useAuthStore();
  const { data, isLoading, error } = useEvents(1, 24);
  const registrationsQuery = useUserEventRegistrations(isAuthenticated);
  const [search, setSearch] = React.useState('');
  const [filter, setFilter] = React.useState<'all' | 'upcoming' | 'past'>('all');
  const events = (data?.data ?? []) as any[];
  const registeredIds = new Set((registrationsQuery.data || []).map((item: any) => item.id));

  const filtered = events.filter((event) => {
    const q = search.trim().toLowerCase();
    const eventDate = new Date(event?.event_date || event?.eventDate);
    const now = new Date();
    const matchesSearch =
      !q ||
      String(event?.name || '').toLowerCase().includes(q) ||
      String(event?.location || '').toLowerCase().includes(q) ||
      String(event?.description || '').toLowerCase().includes(q);
    const matchesFilter =
      filter === 'all' ||
      (filter === 'upcoming' && eventDate >= now) ||
      (filter === 'past' && eventDate < now);
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="container-max space-y-8 py-10 sm:py-12">
      <PageHeader
        title="Events"
        description="Stay connected with worship services, conferences and community gatherings."
      />

      <div className="space-y-4">
        <SearchField label="Search events" placeholder="Search events" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Tabs tabs={FILTERS} value={filter} onChange={setFilter} />
      </div>

      {isLoading ? (
        <SkeletonGrid count={3} className="md:grid-cols-1" />
      ) : error ? (
        <EmptyState icon={CalendarDays} title="Events couldn't load right now" message="Please try again in a moment." />
      ) : events.length === 0 ? (
        <EmptyState icon={CalendarDays} title="No events yet" message="New gatherings will appear here." />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No events match your search"
          message="Try another word, or switch to All."
          action={
            <Button
              variant="secondary"
              onClick={() => {
                setSearch('');
                setFilter('all');
              }}
            >
              Clear filters
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map((event) => {
            const eventDate = new Date(event?.event_date || event?.eventDate);
            const registeredCount = Number(event?.registered_count || 0);
            const maxRegistrations = Number(event?.max_registrations || event?.maxRegistrations || 0);

            return (
              <Card
                key={event.id}
                className="flex flex-col gap-4 p-5 transition-colors hover:border-primary/40 sm:flex-row sm:items-start"
              >
                <div className="flex shrink-0 items-start gap-3">
                  <DateBadge date={eventDate} />
                  {event.image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={resolveAssetUrl(event.image_url)}
                      alt=""
                      className="h-14 w-20 shrink-0 rounded-lg object-cover sm:w-24"
                    />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <h2 className="min-w-0 break-words text-lg font-semibold text-foreground">{event.name}</h2>
                    <Badge tone="neutral" className="capitalize">
                      {event.status || 'active'}
                    </Badge>
                  </div>
                  <p className="mb-3 line-clamp-2 text-sm text-foreground/85">
                    {event.description || 'View details to learn more about this gathering.'}
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                      {eventDate.toLocaleString()}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                      {event.location || 'Location to be announced'}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" aria-hidden="true" />
                      {maxRegistrations > 0
                        ? `${registeredCount}/${maxRegistrations} registered`
                        : `${registeredCount} registered`}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 sm:shrink-0">
                  <Button asChild variant="secondary">
                    <Link href={`/events/${event.id}`}>Details</Link>
                  </Button>
                  {isAuthenticated && registeredIds.has(event.id) ? (
                    <Button disabled variant="secondary">
                      <CalendarCheck className="h-4 w-4" aria-hidden="true" />
                      Registered
                    </Button>
                  ) : (
                    <Button asChild>
                      <Link href={isAuthenticated ? `/events/${event.id}` : '/login'}>
                        {isAuthenticated ? 'Register' : 'Sign In'}
                      </Link>
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Rewrite the event detail page**

Replace `frontend/src/app/events/[id]/page.tsx` with:

```tsx
'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { CalendarDays, ImageIcon, MapPin, Users } from 'lucide-react';
import BackLink from '@/components/site/BackLink';
import MediaPlaceholder from '@/components/site/MediaPlaceholder';
import StatusMessage from '@/components/site/StatusMessage';
import { Button } from '@/components/ui/button';
import EmptyState from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useEvent, useRegisterEvent, useUserEventRegistrations } from '@/hooks/useApi';
import { useAuthStore } from '@/lib/store';
import { resolveAssetUrl } from '@/lib/utils';

export default function EventDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ? Number(params.id) : 0;
  const { isAuthenticated } = useAuthStore();
  const { data, isLoading, error } = useEvent(id);
  const registrationsQuery = useUserEventRegistrations(isAuthenticated);
  const register = useRegisterEvent();
  const registeredIds = new Set((registrationsQuery.data || []).map((item: any) => item.id));
  const isRegistered = data?.id ? registeredIds.has(data.id) : false;

  const handleRegister = () => {
    if (!id || isRegistered) return;
    register.mutate(id);
  };

  const registeredCount = Number(data?.registered_count || 0);
  const maxRegistrations = Number(data?.max_registrations || 0);

  return (
    <div className="container-max space-y-6 py-10 sm:py-12">
      <BackLink href="/events" label="Back to events" />

      {isLoading && (
        <div className="space-y-4" role="status">
          <span className="sr-only">Loading…</span>
          <Skeleton className="h-56 w-full rounded-panel" />
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      )}
      {!isLoading && error && (
        <EmptyState icon={CalendarDays} title="This event couldn't load right now" message="Please try again in a moment." />
      )}
      {!isLoading && !error && !data && (
        <EmptyState
          icon={CalendarDays}
          title="Event not found"
          message="It may have been moved or removed."
          action={
            <Button asChild variant="secondary">
              <Link href="/events">See all events</Link>
            </Button>
          }
        />
      )}

      {data && (
        <article className="overflow-hidden rounded-panel border border-border bg-card">
          {data.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={resolveAssetUrl(data.image_url)} alt={data.name} className="h-56 w-full object-cover sm:h-72" />
          ) : (
            <MediaPlaceholder icon={CalendarDays} className="h-40 sm:h-56" />
          )}
          <div className="grid gap-8 p-6 sm:p-10 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="min-w-0 space-y-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold-ink">Event</p>
              <h1 className="break-words text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{data.name}</h1>
              <p className="leading-relaxed text-foreground/85">
                {data.description || 'Open this event to review the full details and complete your registration.'}
              </p>

              <ul className="grid gap-3 text-sm text-muted">
                <li className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  {data.location || 'Location to be announced'}
                </li>
                <li className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  {new Date(data.event_date || data.eventDate).toLocaleString()}
                </li>
                <li className="flex items-center gap-2">
                  <Users className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  {maxRegistrations > 0
                    ? `${registeredCount}/${maxRegistrations} registered`
                    : `${registeredCount} registered`}
                </li>
              </ul>
              {data.album_id ? (
                <Link
                  href={`/gallery/${data.album_id}`}
                  className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-link hover:underline"
                >
                  <ImageIcon className="h-4 w-4" aria-hidden="true" />
                  View photos from this event
                </Link>
              ) : null}
            </div>

            <div className="h-fit rounded-card border border-border bg-surface p-5">
              <h2 className="text-lg font-semibold text-foreground">Registration</h2>
              <p className="mt-2 text-sm text-muted">Reserve your place for this event.</p>
              <Button
                onClick={handleRegister}
                disabled={!data || isRegistered}
                loading={register.isPending}
                size="lg"
                className="mt-5 w-full"
              >
                {isRegistered ? 'Already Registered' : register.isPending ? 'Registering...' : 'Register for Event'}
              </Button>

              <div className="mt-3 space-y-2" aria-live="polite">
                {register.isSuccess && <StatusMessage tone="success">Registration completed successfully.</StatusMessage>}
                {isRegistered && !register.isSuccess && (
                  <StatusMessage tone="success">You are already registered for this event.</StatusMessage>
                )}
                {register.isError && (
                  <StatusMessage tone="danger">
                    {(register.error as any)?.response?.data?.message || 'Could not complete registration. Please try again.'}
                  </StatusMessage>
                )}
              </div>
            </div>
          </div>
        </article>
      )}
    </div>
  );
}
```

The `Button loading` prop adds `register.isPending` to `disabled` internally (`disabled || loading`). So the effective disabled condition is unchanged: `register.isPending || !data || isRegistered`.

- [ ] **Step 3: Rewrite Give, and fix the GH₵ prefix**

**The bug:** the absolutely-positioned `GH₵` (`left-4 text-lg font-bold`) is wider than the input's `pl-14`, so it covers the start of the placeholder and of the typed digits.

**The fix:** `GH₵` moves into its own addon box. The box sits in a flex row with the input, and the row carries the border and focus ring, so the prefix can never overlap the text.

Other structural changes:
- the fund buttons get `aria-pressed` and a primary selected state
- the quick amounts become 44px toggles with `aria-pressed`
- the raw `<select>`s become `Select` with `Label`s
- the amber gradient panel becomes a `bg-primary` panel
- the verify messages become `StatusMessage`s

Replace `frontend/src/app/donate/page.tsx` with:

```tsx
'use client';

import React, { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { CheckCircle2, Gift, Heart, Shield, TrendingUp } from 'lucide-react';
import SkeletonGrid from '@/components/site/SkeletonGrid';
import StatusMessage from '@/components/site/StatusMessage';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PageHeader from '@/components/ui/page-header';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useInitializeDonationPayment } from '@/hooks/useApi';
import apiClient from '@/lib/api';
import { cn, formatCurrency } from '@/lib/utils';

type DonationForm = {
  amount: string;
  type: 'tithe' | 'offering' | 'ministry' | 'general';
  method: 'card' | 'bank_transfer' | 'momo' | 'cash';
  notes?: string;
};

const funds = [
  { id: 'tithe', label: 'Tithe', description: 'Support consistent church operations', icon: Heart },
  { id: 'offering', label: 'Offering', description: 'Give beyond regular tithe support', icon: Gift },
  { id: 'ministry', label: 'Ministry', description: 'Direct support for ministry growth', icon: TrendingUp },
  { id: 'general', label: 'General', description: 'Flexible support across current needs', icon: Shield },
];

const quickAmounts = ['25', '50', '100', '250', '500'];

function DonateContent() {
  const { register, handleSubmit, setValue, watch } = useForm<DonationForm>({
    defaultValues: {
      amount: '',
      type: 'tithe',
      method: 'card',
      notes: '',
    },
  });
  const initializePayment = useInitializeDonationPayment();
  const searchParams = useSearchParams();
  const reference = searchParams.get('reference');
  const [verifyState, setVerifyState] = useState<'idle' | 'verifying' | 'success' | 'failed'>('idle');
  const verifiedRef = useRef<string | null>(null);
  const amount = watch('amount');
  const selectedType = watch('type');

  useEffect(() => {
    if (!reference || verifiedRef.current === reference) return;

    verifiedRef.current = reference;
    setVerifyState('verifying');

    apiClient
      .get(`/donations/verify/${reference}`)
      .then(() => {
        setVerifyState('success');
        toast.success('Donation payment verified');
      })
      .catch(() => {
        setVerifyState('failed');
        toast.error('Could not verify this payment reference');
      });
  }, [reference]);

  const onSubmit = async (data: DonationForm) => {
    try {
      const result = await initializePayment.mutateAsync({
        amount: Number(data.amount),
        donationType: data.type,
        paymentMethod: data.method,
        notes: data.notes,
      });

      const paymentUrl = result?.payment?.authorization_url;
      if (paymentUrl && typeof window !== 'undefined') {
        window.location.href = paymentUrl;
        return;
      }

      toast.success('Donation initialized');
    } catch {
      // handled by hook
    }
  };

  return (
    <div className="container-max space-y-8 py-10 sm:py-12">
      <PageHeader
        eyebrow="Give"
        title="Give online"
        description="Support the mission with secure giving tied to your ANT PRESS account."
      />

      {reference && (
        <Card>
          <CardContent className="space-y-3 p-5">
            <p className="break-all text-sm text-muted">
              Reference: <span className="font-mono text-foreground">{reference}</span>
            </p>
            <div aria-live="polite">
              {verifyState === 'verifying' && <StatusMessage tone="info">Verifying payment...</StatusMessage>}
              {verifyState === 'success' && <StatusMessage tone="success">Payment verified successfully.</StatusMessage>}
              {verifyState === 'failed' && (
                <StatusMessage tone="danger">Verification failed. Please contact support with this reference.</StatusMessage>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardContent className="p-5 sm:p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
              <fieldset>
                <legend className="mb-3 font-semibold text-foreground">Choose a fund</legend>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {funds.map((fund) => {
                    const selected = selectedType === fund.id;
                    return (
                      <button
                        key={fund.id}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => setValue('type', fund.id as DonationForm['type'])}
                        className={cn(
                          'flex min-h-11 items-start gap-3 rounded-card border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                          selected ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border bg-card hover:border-primary/40'
                        )}
                      >
                        <fund.icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                        <span>
                          <span className="block font-semibold text-foreground">{fund.label}</span>
                          <span className="mt-1 block text-xs text-muted">{fund.description}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <fieldset>
                <legend className="mb-3 font-semibold text-foreground">Amount</legend>
                <div className="mb-4 flex flex-wrap gap-2">
                  {quickAmounts.map((quickAmount) => {
                    const selected = amount === quickAmount;
                    return (
                      <button
                        key={quickAmount}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => setValue('amount', quickAmount)}
                        className={cn(
                          'h-11 rounded-lg px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                          selected
                            ? 'bg-primary text-primary-foreground'
                            : 'border border-input bg-background text-foreground hover:bg-surface'
                        )}
                      >
                        {formatCurrency(quickAmount, 0)}
                      </button>
                    );
                  })}
                </div>
                <Label htmlFor="donation-amount" className="mb-2 block">
                  Other amount (GH₵)
                </Label>
                {/* GH₵ sits in its own box beside the input, so it can never overlap the placeholder or the digits. */}
                <div className="flex h-12 overflow-hidden rounded-lg border border-input bg-background transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/30">
                  <span
                    className="flex shrink-0 items-center border-r border-input bg-surface px-3 text-base font-semibold text-muted"
                    aria-hidden="true"
                  >
                    GH₵
                  </span>
                  <Input
                    id="donation-amount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Other amount"
                    className="h-full min-w-0 flex-1 rounded-none border-0 bg-transparent text-lg font-semibold focus:ring-0"
                    {...register('amount')}
                  />
                </div>
              </fieldset>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="donation-method">Payment method</Label>
                  <Select id="donation-method" {...register('method')}>
                    <option value="card">Card</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="momo">Mobile Money</option>
                    <option value="cash">Cash</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="donation-type">Donation type</Label>
                  <Select id="donation-type" {...register('type')}>
                    <option value="tithe">Tithe</option>
                    <option value="offering">Offering</option>
                    <option value="ministry">Ministry</option>
                    <option value="general">General</option>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="donation-notes">Notes</Label>
                <Textarea id="donation-notes" rows={4} {...register('notes')} />
              </div>

              <Button type="submit" size="lg" loading={initializePayment.isPending}>
                {initializePayment.isPending ? 'Processing...' : `Give ${amount ? formatCurrency(amount) : 'Now'}`}
              </Button>

              <p className="flex items-center justify-center gap-2 text-center text-xs text-muted">
                <Shield className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                Secured by the configured payment flow and your account session
              </p>
            </form>
          </CardContent>
        </Card>

        <aside className="flex flex-col gap-5 lg:col-span-2">
          <div className="rounded-panel bg-primary p-6 text-primary-foreground">
            <h2 className="text-lg font-semibold">Why giving matters</h2>
            <p className="mt-2 text-sm text-primary-foreground/85">
              Your contribution supports ministry activity, publishing, announcements and church operations.
            </p>
            <ul className="mt-4 space-y-3">
              {funds.map((fund) => (
                <li key={fund.id} className="rounded-lg bg-primary-foreground/10 px-4 py-3">
                  <p className="font-semibold">{fund.label}</p>
                  <p className="mt-1 text-xs text-primary-foreground/85">{fund.description}</p>
                </li>
              ))}
            </ul>
          </div>

          <Card>
            <CardContent className="p-5">
              <h2 className="text-lg font-semibold text-foreground">Giving notes</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted">
                <li>Donations are attached to your account for later review.</li>
                <li>Online checkout may redirect and then return here for verification.</li>
                <li>
                  If you are not logged in, please{' '}
                  <Link href="/login" className="font-semibold text-link hover:underline">
                    sign in first
                  </Link>
                  .
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-success" aria-hidden="true" />
                <h2 className="font-semibold text-foreground">Real data, real receipts</h2>
              </div>
              <p className="mt-2 text-sm text-muted">
                Gifts go through the church&apos;s live donation flow and are recorded against your account.
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

export default function DonatePage() {
  return (
    <Suspense
      fallback={
        <div className="container-max py-12">
          <SkeletonGrid count={2} className="md:grid-cols-2" />
        </div>
      }
    >
      <DonateContent />
    </Suspense>
  );
}
```

- [ ] **Step 4: Run the standard checks**

```bash
FILES="frontend/src/app/events/page.tsx frontend/src/app/events/[id]/page.tsx frontend/src/app/donate/page.tsx"
```

Expected:
- `CHECKS-OK`
- scans 2 and 3 print nothing
- parity prints nothing. Donate still has exactly `register('amount')`, `register('method')`, `register('type')` and `register('notes')`.

- [ ] **Step 5: Check by eye (375px and 1280px, Light and Dark)**

- `/events`:
  - the tabs underline the active filter
  - at 375px each card stacks (date badge, then text, then the buttons wrapping onto one row) with no sideways scroll
  - signed out, the buttons read "Details" and "Sign In"
  - signed in and registered, the "Registered" button is disabled and does nothing on click
  - "zzzz" shows the "No events match" state, and "Clear filters" resets both the search and the tab
- `/events/<id>`:
  - an image, or the calm placeholder
  - the registration panel is below the details on a phone and beside them at 1280
  - Register shows a spinner while pending, then the green success message
  - an already-registered user sees a disabled "Already Registered"
  - an album-linked event shows "View photos"
- `/donate`, the GH₵ fix:
  - at 375px, the `GH₵` box and the "Other amount" placeholder are both fully visible, with no overlap
  - type `1000000`: the digits start after the box
  - focusing the field rings the whole row
- `/donate`, the controls:
  - clicking a fund highlights it, and the "Donation type" select changes to match (the shared `setValue`)
  - quick amounts toggle (check `aria-pressed` in the Elements panel) and fill the amount field
  - the button reads "Give GH₵ 100.00"
  - `/donate?reference=TEST` shows the reference card, then the red verification message
- Dark mode: the "Why giving matters" panel is light blue with dark text, and still readable.
- With the backend stopped, `/events` and `/events/1` show their "couldn't load" states. Submitting Give shows the hook's error toast, as before.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/app/events frontend/src/app/donate
git commit -m "feat(web): events, event detail and Give on the design system; GH₵ prefix no longer overlaps the amount

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Devotionals, News and Gallery (reading pages)

**Files:**
- Rewrite: `frontend/src/components/devotionals/DevotionalBody.tsx`, `frontend/src/app/devotionals/page.tsx`, `frontend/src/app/devotionals/[id]/page.tsx`, `frontend/src/app/news/page.tsx`, `frontend/src/app/news/[id]/page.tsx`, `frontend/src/app/gallery/page.tsx`, `frontend/src/app/gallery/[id]/page.tsx`
- Modify: `frontend/src/components/gallery/PhotoViewer.tsx` (focus rings and 44px targets only)

**Interfaces:**
- Consumes (Task 1): `BackLink`, `MediaPlaceholder`, `SearchField`, `SkeletonGrid`.
- Produces: `DevotionalBody({ devotional: Devotional; headingLevel?: 'h1' | 'h2' })`. The prop defaults to `'h2'`, so other callers are unaffected.

- [ ] **Step 1: Rewrite `DevotionalBody` around `Scripture`**

The amber blockquote becomes the 8a `Scripture` (serif, with the gold rule). The prayer becomes a surface panel. The new `headingLevel` prop lets the detail page own the `h1`.

Replace `frontend/src/components/devotionals/DevotionalBody.tsx` with:

```tsx
import Scripture from '@/components/ui/scripture';
import type { Devotional } from '@/hooks/useApi';
import { formatDateOnly } from '@/lib/utils';

export default function DevotionalBody({
  devotional,
  headingLevel = 'h2',
}: {
  devotional: Devotional;
  headingLevel?: 'h1' | 'h2';
}) {
  const Heading = headingLevel;
  return (
    <article className="max-w-3xl space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold-ink">
          {devotional.is_today === false ? `Devotional · ${formatDateOnly(devotional.publish_date)}` : formatDateOnly(devotional.publish_date)}
        </p>
        <Heading className="break-words text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{devotional.title}</Heading>
      </header>
      <Scripture reference={devotional.scripture_reference}>
        <span className="whitespace-pre-line">{devotional.scripture_text}</span>
      </Scripture>
      <div className="whitespace-pre-line text-base leading-relaxed text-foreground">{devotional.body}</div>
      {devotional.prayer && (
        <div className="rounded-card border border-border bg-surface p-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted">Prayer</p>
          <p className="whitespace-pre-line font-serif text-lg italic text-foreground">{devotional.prayer}</p>
        </div>
      )}
    </article>
  );
}
```

- [ ] **Step 2: Rewrite the devotionals page**

Replace `frontend/src/app/devotionals/page.tsx` with:

```tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { BookOpenText } from 'lucide-react';
import DevotionalBody from '@/components/devotionals/DevotionalBody';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import EmptyState from '@/components/ui/empty-state';
import PageHeader from '@/components/ui/page-header';
import Section from '@/components/ui/section';
import { Skeleton } from '@/components/ui/skeleton';
import { useDevotionalArchive, useTodayDevotional } from '@/hooks/useApi';
import { formatDateOnly } from '@/lib/utils';

export default function DevotionalsPage() {
  const [page, setPage] = React.useState(1);
  const { data: today, isLoading: todayLoading, isError: todayError } = useTodayDevotional();
  const { data: archive, isLoading: archiveLoading, isError: archiveError } = useDevotionalArchive(page);

  return (
    <div className="container-max space-y-12 py-10 sm:py-12">
      <PageHeader
        eyebrow="Devotional"
        title="Daily devotional"
        description="Scripture, a short reflection and a prayer for each day."
      />

      {todayLoading ? (
        <div className="max-w-3xl space-y-4" role="status">
          <span className="sr-only">Loading…</span>
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-9 w-2/3" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : todayError ? (
        <EmptyState icon={BookOpenText} title="Today's devotional couldn't load right now" message="Please try again in a moment." />
      ) : today ? (
        <DevotionalBody devotional={today} />
      ) : (
        <EmptyState icon={BookOpenText} title="No devotional has been published yet" message="Check back soon for today's reading." />
      )}

      <Section title="Earlier devotionals">
        {archiveLoading ? (
          <div className="space-y-2" role="status">
            <span className="sr-only">Loading…</span>
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : archiveError ? (
          <EmptyState icon={BookOpenText} title="Earlier devotionals couldn't load right now" message="Please try again in a moment." />
        ) : (archive?.data ?? []).length === 0 ? (
          <EmptyState icon={BookOpenText} title="Nothing here yet" message="Past devotionals will be listed here." />
        ) : (
          <Card>
            <ul className="divide-y divide-border">
              {(archive?.data ?? []).map((item) => (
                <li key={item.id}>
                  <Link
                    href={`/devotionals/${item.id}`}
                    className="flex min-h-11 items-center justify-between gap-3 px-5 py-3 transition-colors hover:bg-surface"
                  >
                    <span className="min-w-0 truncate font-medium text-foreground">{item.title}</span>
                    <span className="shrink-0 text-sm text-muted">{formatDateOnly(item.publish_date)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        )}
        {(page > 1 || archive?.hasMore) && (
          <div className="flex gap-3">
            <Button variant="secondary" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
              Newer
            </Button>
            <Button variant="secondary" disabled={!archive?.hasMore} onClick={() => setPage((p) => p + 1)}>
              Older
            </Button>
          </div>
        )}
      </Section>
    </div>
  );
}
```

- [ ] **Step 3: Rewrite the devotional detail page**

Replace `frontend/src/app/devotionals/[id]/page.tsx` with:

```tsx
'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { BookOpenText } from 'lucide-react';
import DevotionalBody from '@/components/devotionals/DevotionalBody';
import BackLink from '@/components/site/BackLink';
import { Button } from '@/components/ui/button';
import EmptyState from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useDevotional } from '@/hooks/useApi';

export default function DevotionalDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params?.id);
  const devotionalId = Number.isInteger(id) && id > 0 ? id : undefined;
  const { data, isLoading, error } = useDevotional(devotionalId);

  return (
    <div className="container-max space-y-6 py-10 sm:py-12">
      <BackLink href="/devotionals" label="All devotionals" />
      {!devotionalId || error ? (
        <EmptyState
          icon={BookOpenText}
          title="This devotional could not be found"
          message="It may have been removed, or it couldn't load right now."
          action={
            <Button asChild variant="secondary">
              <Link href="/devotionals">Today&apos;s devotional</Link>
            </Button>
          }
        />
      ) : isLoading || !data ? (
        <div className="max-w-3xl space-y-4" role="status">
          <span className="sr-only">Loading…</span>
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-9 w-2/3" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : (
        <DevotionalBody devotional={data} headingLevel="h1" />
      )}
    </div>
  );
}
```

- [ ] **Step 4: Rewrite the news list**

The gradient bands go. Cards become text cards, matching the hub Home news cards.

Replace `frontend/src/app/news/page.tsx` with:

```tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { Newspaper } from 'lucide-react';
import SearchField from '@/components/site/SearchField';
import SkeletonGrid from '@/components/site/SkeletonGrid';
import { Button } from '@/components/ui/button';
import EmptyState from '@/components/ui/empty-state';
import PageHeader from '@/components/ui/page-header';
import { useNews } from '@/hooks/useApi';
import { formatDate } from '@/lib/utils';

export default function NewsPage() {
  const [search, setSearch] = React.useState('');
  const { data, isLoading, error } = useNews(1, 18, search || undefined);
  const posts = data?.data || [];

  return (
    <div className="container-max space-y-8 py-10 sm:py-12">
      <PageHeader
        eyebrow="News & announcements"
        title="Stay in step with the latest updates"
        description="Announcements, stories and updates from the church."
      />

      <SearchField
        label="Search news"
        placeholder="Search news and announcements"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {isLoading ? (
        <SkeletonGrid count={6} className="md:grid-cols-2 lg:grid-cols-3" />
      ) : error ? (
        <EmptyState icon={Newspaper} title="News couldn't load right now" message="Please try again in a moment." />
      ) : posts.length === 0 ? (
        search ? (
          <EmptyState
            icon={Newspaper}
            title="No announcements match your search"
            message="Try a different word."
            action={
              <Button variant="secondary" onClick={() => setSearch('')}>
                Clear search
              </Button>
            }
          />
        ) : (
          <EmptyState icon={Newspaper} title="No announcements yet" message="News and updates will appear here." />
        )
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post: any) => (
            <Link
              key={post.id}
              href={`/news/${post.id}`}
              className="group flex h-full flex-col rounded-card border border-border bg-card p-5 transition-colors hover:border-primary/40"
            >
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-gold-ink">Update</span>
              <span className="mt-2 line-clamp-2 text-lg font-semibold text-foreground group-hover:underline">{post.title}</span>
              <span className="mt-2 line-clamp-3 text-sm text-foreground/85">
                {post.summary || post.excerpt || post.content || 'Open this post to read the full update.'}
              </span>
              <span className="mt-auto pt-4 text-xs text-muted">
                {post.published_at ? formatDate(post.published_at) : 'Published update'}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Rewrite the news detail page**

The page becomes a single reading column. The image shows only when there is one; the gradient band goes.

Replace `frontend/src/app/news/[id]/page.tsx` with:

```tsx
'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Newspaper } from 'lucide-react';
import { useParams } from 'next/navigation';
import BackLink from '@/components/site/BackLink';
import { Button } from '@/components/ui/button';
import EmptyState from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useNewsPost } from '@/hooks/useApi';
import { formatDate, resolveAssetUrl } from '@/lib/utils';

export default function NewsDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ? Number(params.id) : 0;
  const { data, isLoading, error } = useNewsPost(id);

  return (
    <div className="container-max py-10 sm:py-12">
      <div className="mx-auto max-w-3xl space-y-6">
        <BackLink href="/news" label="Back to news" />

        {isLoading && (
          <div className="space-y-4" role="status">
            <span className="sr-only">Loading…</span>
            <Skeleton className="h-9 w-3/4" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-56 w-full rounded-panel" />
          </div>
        )}
        {!isLoading && error && (
          <EmptyState icon={Newspaper} title="This post couldn't load right now" message="Please try again in a moment." />
        )}
        {!isLoading && !error && !data && (
          <EmptyState
            icon={Newspaper}
            title="News post not found"
            message="It may have been moved or removed."
            action={
              <Button asChild variant="secondary">
                <Link href="/news">All news</Link>
              </Button>
            }
          />
        )}

        {data && (
          <article className="space-y-6">
            <header className="space-y-3 border-b border-border pb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold-ink">News</p>
              <h1 className="break-words text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{data.title}</h1>
              <p className="text-sm text-muted">{data.published_at ? formatDate(data.published_at) : 'Published update'}</p>
            </header>
            {data.image_url && (
              <Image
                src={resolveAssetUrl(data.image_url)}
                alt={data.title}
                width={1440}
                height={720}
                unoptimized
                className="max-h-[420px] w-full rounded-panel object-cover"
              />
            )}
            {(data.summary || data.excerpt) && (
              <p className="text-lg leading-relaxed text-foreground/85">{data.summary || data.excerpt}</p>
            )}
            {data.content && <div className="whitespace-pre-wrap leading-relaxed text-foreground">{data.content}</div>}
          </article>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Rewrite the gallery list**

Replace `frontend/src/app/gallery/page.tsx` with:

```tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { ImageIcon } from 'lucide-react';
import MediaPlaceholder from '@/components/site/MediaPlaceholder';
import SkeletonGrid from '@/components/site/SkeletonGrid';
import { Button } from '@/components/ui/button';
import EmptyState from '@/components/ui/empty-state';
import PageHeader from '@/components/ui/page-header';
import { useAlbums } from '@/hooks/useApi';

export default function GalleryPage() {
  const [page, setPage] = React.useState(1);
  const { data, isLoading, isError } = useAlbums(page);
  const albums = data?.data ?? [];

  return (
    <div className="container-max space-y-8 py-10 sm:py-12">
      <PageHeader
        title="Photo gallery"
        description="Photos from our services and events. View them here or download them to keep."
      />

      {isLoading ? (
        <SkeletonGrid count={6} className="sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3" />
      ) : isError ? (
        <EmptyState icon={ImageIcon} title="The gallery couldn't load right now" message="Please try again in a moment." />
      ) : albums.length === 0 ? (
        <EmptyState icon={ImageIcon} title="No albums yet" message="Photos from services and events will appear here." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {albums.map((album) => (
            <Link
              key={album.id}
              href={`/gallery/${album.id}`}
              className="group overflow-hidden rounded-card border border-border bg-card transition-colors hover:border-primary/40"
            >
              {album.cover_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={album.cover_url} alt="" loading="lazy" className="aspect-square w-full object-cover" />
              ) : (
                <MediaPlaceholder icon={ImageIcon} className="aspect-square w-full" />
              )}
              <div className="space-y-1 p-4">
                <p className="truncate font-semibold text-foreground group-hover:underline">{album.title}</p>
                <p className="text-xs text-muted">
                  {album.photo_count} photo{album.photo_count === 1 ? '' : 's'}
                  {album.event_name ? ` · ${album.event_name}` : ''} · {new Date(album.created_at).toLocaleDateString()}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {(page > 1 || data?.hasMore) && (
        <div className="flex gap-3">
          <Button variant="secondary" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            Newer
          </Button>
          <Button variant="secondary" disabled={!data?.hasMore} onClick={() => setPage((p) => p + 1)}>
            Older
          </Button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 7: Rewrite the album page**

The page gains a real error state. A 404 (for example a draft album) still says **"Album not found"**, as the existing QA checklist expects; any other failure says it couldn't load.

Replace `frontend/src/app/gallery/[id]/page.tsx` with:

```tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { Download, ExternalLink, ImageIcon, Share2 } from 'lucide-react';
import PhotoViewer from '@/components/gallery/PhotoViewer';
import BackLink from '@/components/site/BackLink';
import SkeletonGrid from '@/components/site/SkeletonGrid';
import { Button } from '@/components/ui/button';
import EmptyState from '@/components/ui/empty-state';
import { useAlbum, useAlbumDownload } from '@/hooks/useApi';

export default function AlbumPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params?.id) || undefined;
  const { data: album, isLoading, error } = useAlbum(id);
  const download = useAlbumDownload();
  const [viewing, setViewing] = React.useState<number | null>(null);
  const closeViewer = React.useCallback(() => setViewing(null), []);
  const notFound = !error || (error as any)?.response?.status === 404;

  const downloadAll = () => {
    if (!id) return;
    download.mutate(id, {
      onSuccess: (url) => {
        if (url) window.location.href = url;
      },
    });
  };

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied');
    } catch {
      toast.error('Could not copy the link');
    }
  };

  return (
    <div className="container-max space-y-8 py-10 sm:py-12">
      <BackLink href="/gallery" label="Back to the gallery" />

      {isLoading ? (
        <SkeletonGrid count={8} className="grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4" />
      ) : !album ? (
        notFound ? (
          <EmptyState
            icon={ImageIcon}
            title="Album not found"
            message="It may be unpublished or removed."
            action={
              <Button asChild variant="secondary">
                <Link href="/gallery">All albums</Link>
              </Button>
            }
          />
        ) : (
          <EmptyState icon={ImageIcon} title="This album couldn't load right now" message="Please try again in a moment." />
        )
      ) : (
        <>
          <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0 space-y-2">
              <h1 className="break-words text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{album.title}</h1>
              {album.description && <p className="max-w-2xl text-foreground/85">{album.description}</p>}
              <p className="text-sm text-muted">
                {album.photo_count} photo{album.photo_count === 1 ? '' : 's'}
                {album.event_id && album.event_name ? (
                  <>
                    {' · '}
                    <Link href={`/events/${album.event_id}`} className="text-link hover:underline">
                      {album.event_name}
                    </Link>
                  </>
                ) : null}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={downloadAll} disabled={album.photos.length === 0} loading={download.isPending}>
                {!download.isPending && <Download className="h-4 w-4" aria-hidden="true" />}
                {download.isPending ? 'Preparing...' : 'Download all'}
              </Button>
              {album.external_url && (
                <Button asChild variant="secondary">
                  <a href={album.external_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" aria-hidden="true" />
                    Open folder
                  </a>
                </Button>
              )}
              <Button variant="secondary" onClick={share}>
                <Share2 className="h-4 w-4" aria-hidden="true" />
                Share
              </Button>
            </div>
          </header>

          {album.photos.length === 0 ? (
            <EmptyState icon={ImageIcon} title="No photos yet" message="Photos will appear here once they are uploaded." />
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {album.photos.map((photo, index) => (
                <div key={photo.id} className="group relative overflow-hidden rounded-lg bg-surface">
                  <button
                    type="button"
                    onClick={() => setViewing(index)}
                    className="block w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                    aria-label={`Open photo ${index + 1}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo.thumb_url} alt="" loading="lazy" className="aspect-square w-full object-cover" />
                  </button>
                  {/* Photo overlay: black/white allowed on photo surfaces. */}
                  <a
                    href={photo.download_url}
                    aria-label={`Download photo ${index + 1}`}
                    className="absolute bottom-2 right-2 flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-white opacity-90 hover:bg-black/80 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:opacity-0 sm:group-hover:opacity-100"
                  >
                    <Download className="h-4 w-4" aria-hidden="true" />
                  </a>
                </div>
              ))}
            </div>
          )}

          {viewing !== null && (
            <PhotoViewer photos={album.photos} index={viewing} title={album.title} onIndexChange={setViewing} onClose={closeViewer} />
          )}
        </>
      )}
    </div>
  );
}
```

`useAlbum(id)` is unchanged. Only the destructured fields change, from `{ data: album, isLoading }` to `{ data: album, isLoading, error }`.

- [ ] **Step 8: Give the lightbox 44px targets and visible focus**

`frontend/src/components/gallery/PhotoViewer.tsx` stays black on purpose (the lightbox exception). Make exactly these three edits with the Edit tool:

1. The download link:
   - old: `className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm font-medium hover:bg-white/20"`
   - new: `className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm font-medium hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"`
2. The close button:
   - old: `className="rounded-lg bg-white/10 p-2 hover:bg-white/20"`
   - new: `className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"`
3. Both arrow buttons (use `replace_all`), changing only the shared tail:
   - old: `rounded-full bg-white/10 p-3 hover:bg-white/20`
   - new: `rounded-full bg-white/10 p-3 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white`

Also add `aria-hidden="true"` to the four icons: `<Download className="h-4 w-4" />`, `<X className="h-5 w-5" />`, `<ChevronLeft className="h-6 w-6" />` and `<ChevronRight className="h-6 w-6" />`. For example, `<X className="h-5 w-5" />` becomes `<X className="h-5 w-5" aria-hidden="true" />`.

- [ ] **Step 9: Run the standard checks**

```bash
FILES="frontend/src/components/devotionals/DevotionalBody.tsx frontend/src/app/devotionals/page.tsx frontend/src/app/devotionals/[id]/page.tsx frontend/src/app/news/page.tsx frontend/src/app/news/[id]/page.tsx frontend/src/app/gallery/page.tsx frontend/src/app/gallery/[id]/page.tsx frontend/src/components/gallery/PhotoViewer.tsx"
```

Expected: `CHECKS-OK`; scans 2 and 3 print nothing; parity prints nothing.

- [ ] **Step 10: Check by eye (375px and 1280px, Light and Dark)**

- `/devotionals`:
  - the scripture is serif italic with a gold left rule
  - the prayer panel is serif on the surface colour
  - the archive is one bordered list, with long titles truncated
  - Newer/Older page through
- `/devotionals/<id>`: the title is the page's `h1` (check in Elements). `/devotionals/abc` shows "could not be found".
- `/news`: the cards line up in 1, 2 or 3 columns. Searching "zzzz" shows the match-empty state with "Clear search".
- `/news/<id>`: one readable column. With no image there is no grey band.
- `/gallery`: square covers; an album without a cover shows the image-icon placeholder.
- `/gallery/<id>`:
  - at 375px the three toolbar buttons wrap with no sideways scroll
  - Tab reaches each photo, with a visible ring, and its download button, which appears on focus at 1280
  - Download all shows a spinner while preparing
  - the lightbox Close and arrows show a white focus ring, and Escape and the arrow keys still work
- A draft or unknown album (`/gallery/999999`) says "Album not found".
- With the backend stopped:
  - `/devotionals` shows both "couldn't load" states
  - `/news` and `/gallery` show theirs
  - `/gallery/1` shows "This album couldn't load right now"

- [ ] **Step 11: Commit**

```bash
git add frontend/src/components/devotionals frontend/src/components/gallery frontend/src/app/devotionals frontend/src/app/news frontend/src/app/gallery
git commit -m "feat(web): devotionals, news and gallery on the design system with loading, empty and error states

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Small groups and Prayer (groups, group detail, new request, prayer wall)

**Files:**
- Rewrite: `frontend/src/app/groups/page.tsx`, `frontend/src/app/groups/[id]/page.tsx`, `frontend/src/app/prayer/new/page.tsx`, `frontend/src/app/prayer/wall/page.tsx`

**Interfaces:**
- Consumes (Task 1): `BackLink`, `SkeletonGrid`, `StatusMessage`. From `@/lib/groups`: `isGroupFull` and `meetingLine` (unchanged).
- Produces: nothing new.

- [ ] **Step 1: Rewrite the groups list**

Status text becomes `Badge`s ("Request pending" warning, "Group is full" neutral). The member count becomes a neutral `Badge` with screen-reader text.

Replace `frontend/src/app/groups/page.tsx` with:

```tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { Users, UsersRound } from 'lucide-react';
import SkeletonGrid from '@/components/site/SkeletonGrid';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import EmptyState from '@/components/ui/empty-state';
import PageHeader from '@/components/ui/page-header';
import { useGroups, useJoinGroup, type GroupSummary } from '@/hooks/useApi';
import { isGroupFull, meetingLine } from '@/lib/groups';
import { useAuthStore } from '@/lib/store';

function GroupCard({ group, signedIn }: { group: GroupSummary; signedIn: boolean }) {
  const join = useJoinGroup();
  const leaders = group.leaders.map((leader) => `${leader.first_name} ${leader.last_name}`.trim()).join(', ');

  const action = () => {
    if (!signedIn) {
      return (
        <Button asChild variant="secondary" size="sm">
          <Link href={`/login?next=${encodeURIComponent('/groups')}`}>Sign in to join</Link>
        </Button>
      );
    }
    if (group.my_status === 'active') {
      return (
        <Button asChild size="sm" variant="secondary">
          <Link href={`/groups/${group.id}`}>Open group</Link>
        </Button>
      );
    }
    if (group.my_status === 'pending') {
      return <Badge tone="warning">Request pending</Badge>;
    }
    if (isGroupFull(group)) {
      return <Badge tone="neutral">Group is full</Badge>;
    }
    return (
      <Button size="sm" loading={join.isPending} onClick={() => join.mutate(group.id)}>
        Ask to join
      </Button>
    );
  };

  return (
    <Card className="flex h-full flex-col">
      <CardContent className="flex flex-1 flex-col gap-3 p-6">
        <div className="flex items-start justify-between gap-3">
          <Link href={`/groups/${group.id}`} className="min-w-0 hover:underline">
            <h2 className="truncate text-lg font-semibold text-foreground">{group.name}</h2>
            {group.ministry_name && <p className="text-xs text-muted">{group.ministry_name}</p>}
          </Link>
          <Badge tone="neutral" className="shrink-0">
            <Users className="h-3.5 w-3.5" aria-hidden="true" />
            {group.member_count}
            {group.capacity !== null ? ` / ${group.capacity}` : ''}
            <span className="sr-only"> members</span>
          </Badge>
        </div>
        {group.description && <p className="line-clamp-3 text-sm text-foreground/85">{group.description}</p>}
        {meetingLine(group) && <p className="text-sm text-muted">{meetingLine(group)}</p>}
        {leaders && <p className="text-xs text-muted">Led by {leaders}</p>}
        <div className="mt-auto pt-1">{action()}</div>
      </CardContent>
    </Card>
  );
}

export default function GroupsPage() {
  const { data, isLoading, error } = useGroups();
  const { isAuthenticated } = useAuthStore();
  const groups = data ?? [];

  return (
    <div className="container-max space-y-8 py-10 sm:py-12">
      <PageHeader title="Small groups" description="Find a group to grow, pray and do life with during the week." />

      {isLoading ? (
        <SkeletonGrid count={4} className="md:grid-cols-2" />
      ) : error ? (
        <EmptyState icon={UsersRound} title="Groups couldn't load right now" message="Please try again in a moment." />
      ) : groups.length === 0 ? (
        <EmptyState icon={UsersRound} title="No groups are open yet" message="New groups will appear here." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {groups.map((group) => (
            <GroupCard key={group.id} group={group} signedIn={Boolean(isAuthenticated)} />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Rewrite the group detail page**

The early-return branches gain a `BackLink` and `EmptyState`s. The header gets a bottom border. The join requests get loading and error states, which means destructuring `isLoading` and `isError` from the existing `useGroupRequests` call. The message form gets visible `Label`s. Leaders get a gold `Badge`.

Replace `frontend/src/app/groups/[id]/page.tsx` with:

```tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { UsersRound } from 'lucide-react';
import BackLink from '@/components/site/BackLink';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ConfirmDialog from '@/components/ui/confirm-dialog';
import EmptyState from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useDecideGroupRequest, useGroup, useGroupRequests, useJoinGroup, useLeaveGroup, useSendAnnouncement } from '@/hooks/useApi';
import { isGroupFull, meetingLine } from '@/lib/groups';
import { useAuthStore } from '@/lib/store';
import { formatDateTime } from '@/lib/utils';

const personName = (person: { first_name: string; last_name: string }) =>
  `${person.first_name || ''} ${person.last_name || ''}`.trim() || 'Member';

export default function GroupDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params?.id);
  const groupId = Number.isInteger(id) && id > 0 ? id : undefined;
  const { user, isAuthenticated } = useAuthStore();

  const { data: group, isLoading, error } = useGroup(groupId);
  const join = useJoinGroup();
  const leave = useLeaveGroup();
  const [confirmLeave, setConfirmLeave] = React.useState(false);

  const isAdmin = user?.role === 'admin';
  const isLeader = group?.my_role === 'leader' && group?.my_status === 'active';
  const canManage = Boolean(isAdmin || isLeader);
  const { data: requests, isLoading: requestsLoading, isError: requestsError } = useGroupRequests(groupId, canManage);
  const decide = useDecideGroupRequest(groupId);
  const sendMessage = useSendAnnouncement();
  const [messageTitle, setMessageTitle] = React.useState('');
  const [messageBody, setMessageBody] = React.useState('');

  if (!groupId || (error as any)?.response?.status === 404) {
    return (
      <div className="container-max space-y-6 py-10 sm:py-12">
        <BackLink href="/groups" label="All groups" />
        <EmptyState
          icon={UsersRound}
          title="This group could not be found"
          message="It may have been closed or removed."
          action={
            <Button asChild variant="secondary">
              <Link href="/groups">Browse groups</Link>
            </Button>
          }
        />
      </div>
    );
  }

  if (isLoading || !group) {
    return (
      <div className="container-max space-y-6 py-10 sm:py-12">
        <BackLink href="/groups" label="All groups" />
        {error ? (
          <EmptyState icon={UsersRound} title="This group couldn't load right now" message="Please try again in a moment." />
        ) : (
          <div className="space-y-4" role="status">
            <span className="sr-only">Loading…</span>
            <Skeleton className="h-9 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-24 w-full" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="container-max space-y-8 py-10 sm:py-12">
      <BackLink href="/groups" label="All groups" />

      <header className="space-y-3 border-b border-border pb-6">
        <h1 className="break-words text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{group.name}</h1>
        {group.ministry_name && <p className="text-sm text-muted">{group.ministry_name}</p>}
        {!group.is_active && <Badge tone="danger">This group is inactive.</Badge>}
        {meetingLine(group) && <p className="text-sm text-foreground">{meetingLine(group)}</p>}
        <p className="text-sm text-muted">
          {group.member_count} {group.member_count === 1 ? 'member' : 'members'}
          {group.capacity !== null ? ` of ${group.capacity}` : ''}
          {group.leaders.length > 0 ? ` · Led by ${group.leaders.map(personName).join(', ')}` : ''}
        </p>
        {group.description && <p className="max-w-2xl whitespace-pre-line pt-1 text-foreground/85">{group.description}</p>}

        <div className="pt-2">
          {!isAuthenticated ? (
            <Button asChild variant="secondary">
              <Link href={`/login?next=${encodeURIComponent(`/groups/${group.id}`)}`}>Sign in to join</Link>
            </Button>
          ) : group.my_status === 'active' ? (
            <Button variant="secondary" disabled={leave.isPending} onClick={() => setConfirmLeave(true)}>
              Leave group
            </Button>
          ) : group.my_status === 'pending' ? (
            <div className="flex flex-wrap items-center gap-3">
              <Badge tone="warning">Request pending</Badge>
              <Button size="sm" variant="secondary" disabled={leave.isPending} onClick={() => leave.mutate(group.id)}>
                Cancel request
              </Button>
            </div>
          ) : isGroupFull(group) ? (
            <Badge tone="neutral">This group is full.</Badge>
          ) : group.is_active ? (
            <Button loading={join.isPending} onClick={() => join.mutate(group.id)}>
              Ask to join
            </Button>
          ) : null}
        </div>
      </header>

      {canManage && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Join requests ({requests?.length ?? 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {requestsLoading ? (
              <div className="space-y-2" role="status">
                <span className="sr-only">Loading…</span>
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : requestsError ? (
              <p className="text-sm text-danger">Join requests couldn&apos;t load right now.</p>
            ) : !requests || requests.length === 0 ? (
              <p className="text-sm text-muted">No pending requests.</p>
            ) : (
              <ul className="divide-y divide-border">
                {requests.map((request) => (
                  <li key={request.user_id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-foreground">{personName(request)}</span>
                      <span className="block truncate text-xs text-muted">
                        {request.email} · asked {formatDateTime(request.requested_at)}
                      </span>
                    </span>
                    <span className="flex gap-2">
                      <Button
                        size="sm"
                        disabled={decide.isPending}
                        onClick={() => decide.mutate({ userId: request.user_id, decision: 'approve' })}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={decide.isPending}
                        onClick={() => decide.mutate({ userId: request.user_id, decision: 'decline' })}
                      >
                        Decline
                      </Button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      {canManage && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Message the group</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                sendMessage.mutate(
                  { audience: 'group', groupId: group.id, title: messageTitle.trim(), message: messageBody.trim() },
                  {
                    onSuccess: () => {
                      setMessageTitle('');
                      setMessageBody('');
                    },
                  }
                );
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="group-message-title">Title</Label>
                <Input
                  id="group-message-title"
                  value={messageTitle}
                  onChange={(event) => setMessageTitle(event.target.value)}
                  placeholder="Title"
                  maxLength={255}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="group-message-body">Message</Label>
                <Textarea
                  id="group-message-body"
                  value={messageBody}
                  onChange={(event) => setMessageBody(event.target.value)}
                  placeholder="Message"
                  rows={3}
                  maxLength={2000}
                  required
                />
              </div>
              <Button
                type="submit"
                loading={sendMessage.isPending}
                disabled={!messageTitle.trim() || !messageBody.trim()}
              >
                Send to members
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {group.members && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Members ({group.members.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {group.members.length === 0 ? (
              <p className="text-sm text-muted">No members yet.</p>
            ) : (
              <ul className="divide-y divide-border">
                {group.members.map((member) => (
                  <li key={member.user_id} className="flex items-center justify-between gap-3 py-3">
                    <span className="min-w-0 truncate text-foreground">{personName(member)}</span>
                    {member.role === 'leader' && <Badge tone="gold">Leader</Badge>}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      {confirmLeave && (
        <ConfirmDialog
          title={`Leave ${group.name}?`}
          description="You can ask to join again later."
          confirmLabel="Leave group"
          onCancel={() => setConfirmLeave(false)}
          onConfirm={() => {
            setConfirmLeave(false);
            leave.mutate(group.id);
          }}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 3: Rewrite the new prayer request page**

Changes:
- `PageHeader`, with a link to the wall
- the raw `<select>` becomes `Select`
- the checkboxes become 20px boxes with `accent-primary`
- the error becomes a `StatusMessage`

`register('title')`, `register('description')`, `register('category')`, `register('isAnonymous')` and `register('shareOnWall')` stay as they are.

Replace `frontend/src/app/prayer/new/page.tsx` with:

```tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import StatusMessage from '@/components/site/StatusMessage';
import { useSubmitPrayer } from '@/hooks/useApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PageHeader from '@/components/ui/page-header';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

type PrayerForm = {
  title: string;
  description: string;
  category: 'personal' | 'family' | 'health' | 'work' | 'financial' | 'other';
  isAnonymous: boolean;
  shareOnWall: boolean;
};

const checkboxClass =
  'mt-0.5 h-5 w-5 shrink-0 rounded border-input accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

export default function NewPrayerPage() {
  const { register, handleSubmit, reset } = useForm<PrayerForm>({
    defaultValues: {
      category: 'personal',
      isAnonymous: false,
      shareOnWall: false,
    },
  });
  const submit = useSubmitPrayer();

  const onSubmit = (data: PrayerForm) => {
    submit.mutate(data, {
      onSuccess: () => {
        toast.success('Prayer submitted');
        reset({ title: '', description: '', category: 'personal', isAnonymous: false, shareOnWall: false });
      },
    });
  };

  return (
    <div className="container-max py-10 sm:py-12">
      <div className="mx-auto max-w-2xl space-y-8">
        <PageHeader
          eyebrow="Prayer"
          title="Submit a prayer request"
          description="Share what is on your heart. The church will pray with you."
          actions={
            <Button asChild variant="secondary">
              <Link href="/prayer/wall">Prayer wall</Link>
            </Button>
          }
        />

        <Card>
          <CardContent className="p-6 sm:p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="prayer-title">Title</Label>
                <Input id="prayer-title" {...register('title')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="prayer-description">Description</Label>
                <Textarea id="prayer-description" rows={6} {...register('description')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="prayer-category">Category</Label>
                <Select id="prayer-category" {...register('category')}>
                  <option value="personal">Personal</option>
                  <option value="family">Family</option>
                  <option value="health">Health</option>
                  <option value="work">Work</option>
                  <option value="financial">Financial</option>
                  <option value="other">Other</option>
                </Select>
              </div>

              <div className="flex items-start gap-3">
                <input id="prayer-anonymous" type="checkbox" {...register('isAnonymous')} className={checkboxClass} />
                <Label htmlFor="prayer-anonymous" className="font-normal leading-snug">
                  Submit anonymously
                </Label>
              </div>

              <div className="space-y-1">
                <div className="flex items-start gap-3">
                  <input id="prayer-share-on-wall" type="checkbox" {...register('shareOnWall')} className={checkboxClass} />
                  <Label htmlFor="prayer-share-on-wall" className="font-normal leading-snug">
                    Share on the prayer wall
                  </Label>
                </div>
                <p className="pl-8 text-xs text-muted">
                  After approval, other signed-in members can see this request and pray for you.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button type="submit" loading={submit.isPending}>
                  {submit.isPending ? 'Submitting...' : 'Submit'}
                </Button>
                {submit.isError && <StatusMessage tone="danger">Could not submit prayer request.</StatusMessage>}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Rewrite the prayer wall**

Changes:
- `PageHeader`, with the category `Select` and "Share a request" as its actions
- James 5:16 as a `Scripture`
- prayer cards with `Badge`s
- "My requests" becomes a `Section` with loading, error and empty states. It used to render nothing until there were requests; it now always shows, with a call to action when empty. This uses `isLoading`/`isError` from the existing `usePrayerRequests` call.

Replace `frontend/src/app/prayer/wall/page.tsx` with:

```tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { Heart, HeartHandshake } from 'lucide-react';
import RouteGuard from '@/components/auth/RouteGuard';
import SkeletonGrid from '@/components/site/SkeletonGrid';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import EmptyState from '@/components/ui/empty-state';
import { Label } from '@/components/ui/label';
import PageHeader from '@/components/ui/page-header';
import Scripture from '@/components/ui/scripture';
import Section from '@/components/ui/section';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  usePrayerRequests,
  usePrayerWall,
  usePrayForRequest,
  useSetPrayerSharing,
  type WallPrayer,
} from '@/hooks/useApi';
import { cn, formatDateTime } from '@/lib/utils';

const CATEGORIES = ['all', 'personal', 'family', 'health', 'work', 'financial', 'other'] as const;
type CategoryFilter = (typeof CATEGORIES)[number];

function PrayerCard({ prayer }: { prayer: WallPrayer }) {
  const pray = usePrayForRequest();
  const prayed = prayer.prayed_by_me;

  return (
    <Card className="flex h-full flex-col">
      <CardContent className="flex flex-1 flex-col gap-3 p-6">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold text-foreground">{prayer.requester_name}</p>
            <p className="text-xs text-muted">{formatDateTime(prayer.created_at)}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {prayer.status === 'answered' && <Badge tone="success">Answered</Badge>}
            <Badge tone="neutral" className="capitalize">
              {prayer.category}
            </Badge>
          </div>
        </div>

        <h2 className="break-words text-lg font-semibold text-foreground">{prayer.title}</h2>
        <p className="whitespace-pre-line text-sm text-foreground/85">{prayer.description}</p>

        <div className="mt-auto pt-1">
          <Button
            type="button"
            variant={prayed ? 'secondary' : 'primary'}
            disabled={prayed || pray.isPending}
            onClick={() => pray.mutate(prayer.id)}
            aria-pressed={prayed}
          >
            <Heart className={cn('h-4 w-4', prayed && 'fill-current')} aria-hidden="true" />
            {prayed ? 'You prayed' : 'I prayed'} · {prayer.prayer_count}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

type OwnPrayer = {
  id: number;
  title: string;
  description: string;
  category: string;
  status: string;
  share_on_wall?: boolean;
  prayer_count?: number;
};

// The member's own requests, with a switch to put each on or take it off the wall.
function MyRequests() {
  const { data, isLoading, isError } = usePrayerRequests();
  const setSharing = useSetPrayerSharing();
  const requests = (Array.isArray(data) ? data : []) as OwnPrayer[];

  return (
    <Section title="My requests" href="/prayer/new" linkLabel="New request">
      {isLoading ? (
        <div className="space-y-3" role="status">
          <span className="sr-only">Loading…</span>
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : isError ? (
        <EmptyState icon={HeartHandshake} title="Your requests couldn't load right now" message="Please try again in a moment." />
      ) : requests.length === 0 ? (
        <EmptyState
          icon={HeartHandshake}
          title="You haven't shared a request yet"
          message="Requests you submit appear here, and you choose whether each one goes on the wall."
          action={
            <Button asChild variant="secondary">
              <Link href="/prayer/new">Share a request</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {requests.map((prayer) => (
            <Card key={prayer.id}>
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-foreground">{prayer.title}</p>
                  <p className="text-xs capitalize text-muted">
                    {prayer.status}
                    {' · '}
                    {prayer.share_on_wall
                      ? prayer.status === 'pending'
                        ? 'will appear on the wall after approval'
                        : `on the wall · ${prayer.prayer_count ?? 0} prayed`
                      : 'private'}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="self-start sm:self-auto"
                  disabled={setSharing.isPending}
                  onClick={() =>
                    setSharing.mutate({
                      id: prayer.id,
                      title: prayer.title,
                      description: prayer.description,
                      category: prayer.category,
                      shareOnWall: !prayer.share_on_wall,
                    })
                  }
                >
                  {prayer.share_on_wall ? 'Stop sharing' : 'Share on wall'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </Section>
  );
}

function PrayerWallContent() {
  const [category, setCategory] = React.useState<CategoryFilter>('all');
  const [page, setPage] = React.useState(1);
  const { data, isLoading, error } = usePrayerWall({
    page,
    category: category === 'all' ? undefined : category,
  });

  const prayers = data?.data ?? [];
  const hasMore = Boolean(data?.meta?.has_more);

  return (
    <div className="container-max space-y-8 py-10 sm:py-12">
      <PageHeader
        eyebrow="Prayer"
        title="Prayer wall"
        description="Pray for the requests members have chosen to share."
        actions={
          <>
            <div className="w-full sm:w-48">
              <Label htmlFor="wall-category" className="sr-only">
                Category
              </Label>
              <Select
                id="wall-category"
                value={category}
                onChange={(event) => {
                  setCategory(event.target.value as CategoryFilter);
                  setPage(1);
                }}
                className="capitalize"
              >
                {CATEGORIES.map((value) => (
                  <option key={value} value={value}>
                    {value === 'all' ? 'All categories' : value}
                  </option>
                ))}
              </Select>
            </div>
            <Button asChild>
              <Link href="/prayer/new">Share a request</Link>
            </Button>
          </>
        }
      />

      <Scripture reference="James 5:16">Pray for each other so that you may be healed.</Scripture>

      {isLoading ? (
        <SkeletonGrid count={4} className="md:grid-cols-2" />
      ) : error ? (
        <EmptyState icon={HeartHandshake} title="The prayer wall couldn't load right now" message="Please try again in a moment." />
      ) : prayers.length === 0 ? (
        <EmptyState
          icon={HeartHandshake}
          title="No prayer requests here yet"
          message="Requests appear once their owner chooses to share them and they are approved."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {prayers.map((prayer) => (
            <PrayerCard key={prayer.id} prayer={prayer} />
          ))}
        </div>
      )}

      {(page > 1 || hasMore) && (
        <div className="flex justify-center gap-3">
          <Button variant="secondary" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <Button variant="secondary" disabled={!hasMore} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      )}

      <MyRequests />
    </div>
  );
}

export default function PrayerWallPage() {
  return (
    <RouteGuard>
      <PrayerWallContent />
    </RouteGuard>
  );
}
```

- [ ] **Step 5: Run the standard checks**

```bash
FILES="frontend/src/app/groups/page.tsx frontend/src/app/groups/[id]/page.tsx frontend/src/app/prayer/new/page.tsx frontend/src/app/prayer/wall/page.tsx"
```

Expected:
- `CHECKS-OK`
- scans 2 and 3 print nothing
- parity prints nothing: the five prayer `register()` fields are the same, and every `use…(` call is the same

- [ ] **Step 6: Check by eye (375px and 1280px, Light and Dark)**

- `/groups`:
  - the cards are an even height, with the action pinned to the bottom
  - signed out, "Sign in to join"
  - signed in, "Ask to join" (spinner while pending), then a yellow "Request pending" badge
  - a full group shows the neutral "Group is full" badge
- `/groups/<id>`:
  - an inactive group shows the red badge with its text
  - "Leave group" opens the confirm dialog, and Cancel leaves you in the group
  - as a leader or admin:
    - the join requests list (or "No pending requests")
    - Approve and Decline disable while pending
    - the message form has visible labels, and Send disables until both fields have text
  - leaders show a gold "Leader" badge
  - `/groups/abc` shows "could not be found"
- `/prayer/new`:
  - the labels sit above the fields
  - each checkbox toggles from its label text, and Tab shows a ring
  - submit shows a spinner, then the toast, and the form resets
  - with the backend stopped, the red message appears
- `/prayer/wall` (signed in):
  - at 375px the category select is full width with the button below it
  - the scripture has the gold rule
  - "I prayed" turns into a disabled "You prayed" with a filled heart (`aria-pressed="true"`)
  - "My requests" shows the empty state with its button for a new member, or the list with Share/Stop sharing
- With the backend stopped:
  - `/groups` shows "couldn't load"
  - `/groups/1` shows "This group couldn't load right now"
  - `/prayer/wall` shows both the wall and "My requests" "couldn't load" states

- [ ] **Step 7: Commit**

```bash
git add frontend/src/app/groups frontend/src/app/prayer
git commit -m "feat(web): small groups and prayer pages on the design system

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Community feed

**Files:**
- Rewrite: `frontend/src/app/community/page.tsx`

**Interfaces:**
- Consumes (Task 1): `SkeletonGrid`.
- Produces: nothing new.

This page has the most hard-coded styling on the site: hex and `rgb()` gradients, a light-only page background, the non-existent `h-13` class, rose/sky/amber/fuchsia pills, and nothing for dark mode.

Structural changes:
- the orange gradient hero becomes a `PageHeader`
- the composer moves to the top of the main column as a `Card`
- the three tone tiles become neutral stat tiles
- the feed gets proper loading, error and empty states
- the like toggle gets `aria-pressed` and a 44px height
- the delete icons become 44px ghost icon buttons
- the comment boxes get screen-reader labels
- the teal/blue "Community pulse" card becomes a surface card
- the decorative "Community Story" eyebrow and the "Active conversation" pill are dropped

Every mutation, handler, state and permission check is copied verbatim.

- [ ] **Step 1: Rewrite the community page**

Replace `frontend/src/app/community/page.tsx` with:

```tsx
'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Heart, MessageSquare, Send, Sparkles, Trash2, Users } from 'lucide-react';
import SkeletonGrid from '@/components/site/SkeletonGrid';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import EmptyState from '@/components/ui/empty-state';
import { Label } from '@/components/ui/label';
import PageHeader from '@/components/ui/page-header';
import { Textarea } from '@/components/ui/textarea';
import {
  useCommunityFeed,
  useCreateCommunityComment,
  useCreateCommunityPost,
  useDeleteCommunityComment,
  useDeleteCommunityPost,
  useToggleCommunityLike,
} from '@/hooks/useApi';
import { APP_NAME } from '@/lib/app-config';
import { useAuthStore } from '@/lib/store';
import {
  cn,
  formatDateTime,
  getInitials,
  getUserFullName,
  resolveAssetUrl,
  truncate,
} from '@/lib/utils';

const Avatar = ({ user }: { user: any }) => {
  const fullName = getUserFullName(user) || 'Member';
  const image = resolveAssetUrl(user?.profile_image_url || user?.profileImageUrl || null);

  if (image) {
    return (
      <Image
        src={image}
        alt={fullName}
        width={48}
        height={48}
        unoptimized
        className="h-12 w-12 shrink-0 rounded-full object-cover"
      />
    );
  }

  return (
    <div
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary"
      aria-hidden="true"
    >
      {getInitials(
        user?.first_name || user?.firstName || 'A',
        user?.last_name || user?.lastName || 'P'
      )}
    </div>
  );
};

const pathLinkClass =
  'flex min-h-11 items-center justify-between gap-3 rounded-lg border border-border bg-surface px-4 py-3 text-sm font-medium text-foreground transition-colors hover:border-primary/40';

export default function CommunityPage() {
  const { user, isAuthenticated } = useAuthStore();
  const { data, isLoading, error } = useCommunityFeed();
  const createPost = useCreateCommunityPost();
  const createComment = useCreateCommunityComment();
  const toggleLike = useToggleCommunityLike();
  const deletePost = useDeleteCommunityPost();
  const deleteComment = useDeleteCommunityComment();

  const [content, setContent] = React.useState('');
  const [commentDrafts, setCommentDrafts] = React.useState<Record<number, string>>({});

  const posts = (data?.data || []) as any[];

  const handleShare = async () => {
    const trimmed = content.trim();
    if (!trimmed) return;
    await createPost.mutateAsync({ content: trimmed });
    setContent('');
  };

  const handleComment = async (postId: number) => {
    const draft = String(commentDrafts[postId] || '').trim();
    if (!draft) return;
    await createComment.mutateAsync({ postId, content: draft });
    setCommentDrafts((state) => ({ ...state, [postId]: '' }));
  };

  return (
    <div className="container-max space-y-10 py-10 sm:py-12">
      <PageHeader
        eyebrow="Community"
        title="Community feed"
        description={`Share encouragement, testimonies and updates, and keep the heartbeat of ${APP_NAME} close.`}
        actions={
          <Button asChild variant="ghost">
            <Link href="#community-feed">
              Jump to the feed
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        }
      />

      <section aria-label="Feed at a glance" className="grid gap-4 sm:grid-cols-3">
        <StatTile label="Community reach" value={`${posts.length} active posts`} />
        <StatTile
          label="Conversation"
          value={`${posts.reduce((sum, post) => sum + Number(post.comment_count || 0), 0)} comments shared`}
        />
        <StatTile
          label="Encouragement"
          value={`${posts.reduce((sum, post) => sum + Number(post.like_count || 0), 0)} likes across the feed`}
        />
      </section>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-6">
          <Card>
            <CardContent className="space-y-4 p-6">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Join the conversation</h2>
                <p className="mt-1 text-sm text-muted">
                  Share updates, encouragement, or event moments with the wider community.
                </p>
              </div>

              {isAuthenticated ? (
                <>
                  <Label htmlFor="community-post" className="sr-only">
                    Your post
                  </Label>
                  <Textarea
                    id="community-post"
                    value={content}
                    onChange={(event) => setContent(event.target.value)}
                    rows={5}
                    placeholder="Share an update, testimony, reflection or invitation..."
                  />
                  <div className="flex justify-end">
                    <Button type="button" onClick={handleShare} disabled={!content.trim()} loading={createPost.isPending}>
                      {!createPost.isPending && <Send className="h-4 w-4" aria-hidden="true" />}
                      Share Post
                    </Button>
                  </div>
                </>
              ) : (
                <div className="space-y-4 rounded-card bg-surface p-5">
                  <p className="text-sm text-foreground/85">
                    Sign in to post, comment, and react to the community feed. You can still browse the conversation without an account.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Button asChild>
                      <Link href="/login">Sign In</Link>
                    </Button>
                    <Button asChild variant="secondary">
                      <Link href="/register">Create Account</Link>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <section id="community-feed" aria-label="Community posts" className="scroll-mt-24 space-y-5">
            {isLoading ? (
              <SkeletonGrid count={2} className="md:grid-cols-1" />
            ) : error ? (
              <EmptyState icon={Users} title="The community feed couldn't load right now" message="Please try again in a moment." />
            ) : posts.length === 0 ? (
              <EmptyState
                icon={MessageSquare}
                title="No posts yet"
                message="The first community post will show up here as soon as someone shares."
              />
            ) : (
              posts.map((post) => {
                const canDeletePost =
                  user?.role === 'admin' || Number(user?.id) === Number(post.author?.id);

                return (
                  <Card key={post.id}>
                    <CardContent className="p-5 sm:p-6">
                      <div className="flex items-start justify-between gap-3 border-b border-border pb-4">
                        <div className="flex min-w-0 items-start gap-3">
                          <Avatar user={post.author} />
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="truncate font-semibold text-foreground">
                                {getUserFullName(post.author) || 'Community Member'}
                              </h3>
                              {post.is_pinned ? <Badge tone="gold">Pinned</Badge> : null}
                              {post.author?.role === 'admin' ? <Badge tone="neutral">Admin</Badge> : null}
                            </div>
                            <p className="text-sm text-muted">{formatDateTime(post.created_at)}</p>
                          </div>
                        </div>

                        {canDeletePost ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => deletePost.mutate(post.id)}
                            className="shrink-0 text-muted hover:text-danger"
                            aria-label="Delete post"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </Button>
                        ) : null}
                      </div>

                      <p className="mt-4 whitespace-pre-wrap break-words text-base leading-relaxed text-foreground">{post.content}</p>

                      <div className="mt-5 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleLike.mutate(post.id)}
                          disabled={!isAuthenticated || toggleLike.isPending}
                          aria-pressed={Boolean(post.liked_by_me)}
                          className={cn(
                            'inline-flex h-11 items-center gap-2 rounded-lg border px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                            post.liked_by_me
                              ? 'border-danger/30 bg-danger/10 text-danger'
                              : 'border-input bg-background text-foreground hover:bg-surface',
                            !isAuthenticated && 'cursor-not-allowed opacity-70'
                          )}
                        >
                          <Heart className={cn('h-4 w-4', post.liked_by_me && 'fill-current')} aria-hidden="true" />
                          {post.like_count} likes
                        </button>
                        <span className="inline-flex h-11 items-center gap-2 px-2 text-sm text-muted">
                          <MessageSquare className="h-4 w-4" aria-hidden="true" />
                          {post.comment_count} comments
                        </span>
                      </div>

                      <div className="mt-4 space-y-3 rounded-card bg-surface p-4">
                        {(post.comments || []).length === 0 ? (
                          <p className="text-sm text-muted">No comments yet. Start the conversation.</p>
                        ) : (
                          (post.comments || []).map((comment: any) => {
                            const canDeleteComment =
                              user?.role === 'admin' || Number(user?.id) === Number(comment.author?.id);

                            return (
                              <div
                                key={comment.id}
                                className="flex items-start justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3"
                              >
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-foreground">
                                    {getUserFullName(comment.author) || 'Community Member'}
                                  </p>
                                  <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground/85">
                                    {comment.content}
                                  </p>
                                  <p className="mt-2 text-xs text-muted">{formatDateTime(comment.created_at)}</p>
                                </div>
                                {canDeleteComment ? (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                      deleteComment.mutate({ postId: post.id, commentId: comment.id })
                                    }
                                    className="shrink-0 text-muted hover:text-danger"
                                    aria-label="Delete comment"
                                  >
                                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                                  </Button>
                                ) : null}
                              </div>
                            );
                          })
                        )}

                        {isAuthenticated ? (
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                            <Label htmlFor={`comment-${post.id}`} className="sr-only">
                              Add a comment
                            </Label>
                            <Textarea
                              id={`comment-${post.id}`}
                              rows={2}
                              className="min-h-[80px]"
                              value={commentDrafts[post.id] || ''}
                              onChange={(event) =>
                                setCommentDrafts((state) => ({ ...state, [post.id]: event.target.value }))
                              }
                              placeholder="Add a thoughtful comment..."
                            />
                            <Button
                              type="button"
                              className="shrink-0"
                              onClick={() => handleComment(post.id)}
                              disabled={!String(commentDrafts[post.id] || '').trim()}
                              loading={createComment.isPending}
                            >
                              Reply
                            </Button>
                          </div>
                        ) : (
                          <p className="rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted">
                            Sign in to join the discussion on this post.
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </section>
        </div>

        <aside className="space-y-5">
          <Card>
            <CardContent className="space-y-3 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold-ink">Community notes</p>
              <div className="space-y-3 text-sm leading-relaxed text-foreground/85">
                <p>Share encouragement, testimonies, event moments, or practical updates that help the wider community stay connected.</p>
                <p>Posts use your ANT PRESS account, so names and profile photos stay in sync with the rest of the site.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold-ink">Helpful paths</p>
              <div className="space-y-2">
                <Link href="/events" className={pathLinkClass}>
                  Browse upcoming events
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
                </Link>
                <Link href="/prayer/new" className={pathLinkClass}>
                  Submit a prayer request
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
                </Link>
                <Link href="/news" className={pathLinkClass}>
                  Read the latest announcements
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-surface">
            <CardContent className="space-y-3 p-6">
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-gold-ink">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                Community pulse
              </p>
              <p className="text-sm leading-relaxed text-foreground/85">
                A healthy feed feels like a living foyer: updates from real people, practical care, and shared joy.
              </p>
              <ul className="space-y-2 text-sm">
                {posts.slice(0, 3).map((post) => (
                  <li key={post.id} className="rounded-lg border border-border bg-card px-4 py-3">
                    <p className="font-semibold text-foreground">{getUserFullName(post.author) || 'Community Member'}</p>
                    <p className="break-words text-foreground/85">{truncate(post.content, 88)}</p>
                  </li>
                ))}
                {posts.length === 0 ? (
                  <li className="rounded-lg border border-border bg-card px-4 py-3 text-muted">
                    Fresh community posts will appear here once members begin sharing.
                  </li>
                ) : null}
              </ul>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-card border border-border bg-card p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold-ink">{label}</p>
      <p className="mt-2 text-base font-semibold text-foreground">{value}</p>
    </div>
  );
}
```

**Disabled conditions:**
- Share: `disabled={!content.trim()}` plus `loading={createPost.isPending}`, the same as the old `createPost.isPending || !content.trim()`.
- Reply: `disabled={!draft}` plus `loading={createComment.isPending}`, the same as before.

**Hrefs:** `/events` appeared twice before. The old "Keep exploring" link also went to `/events`, so dropping it loses no destination.

- [ ] **Step 2: Run the standard checks**

```bash
FILES="frontend/src/app/community/page.tsx"
```

Expected:
- `CHECKS-OK`
- scans 2 and 3 print nothing. The old `#fff7ed`, `#0f766e`, `rgb(...)` and `fuchsia-` must all be gone.
- parity prints nothing: `#community-feed`, `/register`, `/login`, `/events`, `/prayer/new` and `/news` are all still present

- [ ] **Step 3: Check by eye (375px and 1280px, Light and Dark)**

- Signed out:
  - the composer card shows "Sign In" and "Create Account"
  - the like buttons are dimmed and unclickable
  - each post says "Sign in to join the discussion"
- Signed in:
  - Share Post is disabled until there is text, shows a spinner while posting, and then the box clears
  - the like toggle turns red with a filled heart, with `aria-pressed="true"`
  - Reply works and clears its box
  - your own post or comment shows a 44px trash button labelled "Delete post" or "Delete comment"; an admin sees it on every post
- "Jump to the feed" scrolls to the posts, below the sticky header (`scroll-mt-24`).
- At 375px:
  - the stat tiles stack, and the aside drops below the feed
  - long words in a post wrap (`break-words`)
  - avatars are 48px circles, not collapsed (the old `h-13` did not exist)
- Dark: there is no light gradient background left anywhere, and the "Community pulse" card is the surface colour.
- With the backend stopped: "The community feed couldn't load right now", and the stat tiles read 0.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/app/community/page.tsx
git commit -m "feat(web): community feed on the design system, readable in dark mode

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Ministries and the About family (about, contact, FAQ, privacy, terms)

**Files:**
- Rewrite: `frontend/src/app/ministries/page.tsx`, `frontend/src/app/ministries/[id]/page.tsx`, `frontend/src/app/about/page.tsx`, `frontend/src/app/contact/page.tsx`, `frontend/src/app/faq/page.tsx`, `frontend/src/app/privacy/page.tsx`, `frontend/src/app/terms/page.tsx`

**Interfaces:**
- Consumes (Task 1): `BackLink`, `SkeletonGrid`, `StatusMessage`, `LegalDocument` (with its `LegalSection` type).
- Produces: nothing new.

**Spec §3.1:** About is "church info, plus links to Ministries, Contact, FAQ, Privacy and Terms". The About page gains a "More about us" tile grid with exactly those five links. FAQ, Privacy and Terms get an "About ›" breadcrumb back.

- [ ] **Step 1: Rewrite the ministries list**

Replace `frontend/src/app/ministries/page.tsx` with:

```tsx
'use client';

import Link from 'next/link';
import { Church } from 'lucide-react';
import SkeletonGrid from '@/components/site/SkeletonGrid';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import EmptyState from '@/components/ui/empty-state';
import PageHeader from '@/components/ui/page-header';
import { useMinistries } from '@/hooks/useApi';
import { useAuthStore } from '@/lib/store';

export default function MinistriesPage() {
  const { data, isLoading, error } = useMinistries();
  const { user } = useAuthStore();
  const ministries = (data ?? []) as any[];
  const isAdmin = user?.role === 'admin';

  return (
    <div className="container-max space-y-8 py-10 sm:py-12">
      <PageHeader
        eyebrow="Ministries"
        title="Find a place to serve and belong"
        description="Explore our ministries and open each one to see its sermons and activity."
        actions={
          <>
            {isAdmin && (
              <Button asChild>
                <Link href="/admin/ministries">Manage Ministries</Link>
              </Button>
            )}
            <Button asChild variant="secondary">
              <Link href="/contact">Contact a Ministry</Link>
            </Button>
          </>
        }
      />

      {isLoading ? (
        <SkeletonGrid count={6} className="sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3" />
      ) : error ? (
        <EmptyState icon={Church} title="Ministries couldn't load right now" message="Please try again in a moment." />
      ) : ministries.length === 0 ? (
        <EmptyState icon={Church} title="No ministries listed yet" message="Ministries will appear here once they are added." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ministries.map((ministry: any) => (
            <Card key={ministry.id} className="flex h-full flex-col">
              <CardContent className="flex flex-1 flex-col gap-4 p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Church className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="break-words text-lg font-semibold text-foreground">{ministry.name}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-foreground/85">
                    {ministry.description || 'Open this ministry to explore its connected sermons and content.'}
                  </p>
                </div>
                <Button asChild variant="secondary" className="mt-auto self-start">
                  <Link href={`/ministries/${ministry.id}`}>View Ministry</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Rewrite the ministry detail page**

Replace `frontend/src/app/ministries/[id]/page.tsx` with:

```tsx
'use client';

import Link from 'next/link';
import { Church, Mic, PlayCircle } from 'lucide-react';
import { useParams } from 'next/navigation';
import BackLink from '@/components/site/BackLink';
import { Button } from '@/components/ui/button';
import EmptyState from '@/components/ui/empty-state';
import Section from '@/components/ui/section';
import { Skeleton } from '@/components/ui/skeleton';
import { useMinistry } from '@/hooks/useApi';

export default function MinistryDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ? Number(params.id) : 0;
  const { data, isLoading, error } = useMinistry(id);
  const ministry = data as any;

  return (
    <div className="container-max space-y-8 py-10 sm:py-12">
      <BackLink href="/ministries" label="Back to ministries" />

      {isLoading && (
        <div className="space-y-4" role="status">
          <span className="sr-only">Loading…</span>
          <Skeleton className="h-9 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-20 w-full" />
        </div>
      )}
      {!isLoading && error && (
        <EmptyState icon={Church} title="This ministry couldn't load right now" message="Please try again in a moment." />
      )}
      {!isLoading && !error && !ministry && (
        <EmptyState
          icon={Church}
          title="Ministry not found"
          message="It may have been moved or removed."
          action={
            <Button asChild variant="secondary">
              <Link href="/ministries">All ministries</Link>
            </Button>
          }
        />
      )}

      {ministry && (
        <>
          <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-start">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-card bg-primary/10 text-primary">
              <Church className="h-6 w-6" aria-hidden="true" />
            </span>
            <div className="min-w-0 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold-ink">Ministry</p>
              <h1 className="break-words text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {ministry.name || 'Ministry'}
              </h1>
              {ministry.description && (
                <p className="max-w-3xl leading-relaxed text-foreground/85">{ministry.description}</p>
              )}
            </div>
          </header>

          <Section title="Sermons">
            {!ministry.sermons || ministry.sermons.length === 0 ? (
              <EmptyState icon={PlayCircle} title="No sermons for this ministry yet" message="Messages linked to this ministry will appear here." />
            ) : (
              <div className="grid gap-3">
                {ministry.sermons.map((sermon: any) => (
                  <Link
                    key={sermon.id}
                    href={`/sermons/${sermon.id}`}
                    className="flex items-center gap-4 rounded-card border border-border bg-card p-4 transition-colors hover:border-primary/40"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <PlayCircle className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-foreground">{sermon.title}</span>
                      {sermon.speaker && (
                        <span className="mt-1 inline-flex items-center gap-1 text-sm text-muted">
                          <Mic className="h-3.5 w-3.5" aria-hidden="true" />
                          {sermon.speaker}
                        </span>
                      )}
                    </span>
                    <span className="hidden shrink-0 text-sm font-semibold text-link sm:inline">Open sermon</span>
                  </Link>
                ))}
              </div>
            )}
          </Section>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Rewrite About, with the spec's links**

Changes:
- the orange gradient hero becomes a surface panel
- the pillars and pathways become `Card`s
- a new "More about us" `Section` holds five `Tile`s (Ministries, Contact, FAQ, Privacy, Terms)

The copy is kept, apart from small tidying.

Replace `frontend/src/app/about/page.tsx` with:

```tsx
'use client';

import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  Calendar,
  Church,
  FileText,
  HeartHandshake,
  HelpCircle,
  Mail,
  Megaphone,
  Newspaper,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Section from '@/components/ui/section';
import Tile from '@/components/ui/tile';

const pillars = [
  {
    icon: Megaphone,
    title: 'Publishing With Purpose',
    description:
      'Announcements, updates, and stories move through one clear workflow instead of being scattered across disconnected tools.',
  },
  {
    icon: Calendar,
    title: 'Community Rhythm',
    description:
      'Events stay visible and actionable so people can move from reading to participating without friction.',
  },
  {
    icon: BookOpen,
    title: 'Content That Lasts',
    description:
      'Sermons, ministry resources, and archive content remain easy to revisit long after they are first published.',
  },
  {
    icon: HeartHandshake,
    title: 'Support And Service',
    description:
      'Giving, prayer, and member tools stay close to the public experience so support feels natural instead of hidden.',
  },
];

const statCards = [
  ['One connected platform', 'Sermons, events, news, community, and support tools working together.'],
  ['Real-time participation', 'People can respond to what they read instead of stopping at information.'],
  ['Admin clarity', 'Content and operations live in one manageable system for the team behind the scenes.'],
];

const pathways = [
  {
    kicker: 'Newsroom',
    title: 'Follow fresh updates',
    text: 'Read published announcements, stories, and practical updates.',
    href: '/news',
    label: 'Read News',
    icon: Newspaper,
  },
  {
    kicker: 'Ministries',
    title: 'Discover active communities',
    text: 'Browse ministry groups and see how content, leadership, and participation connect.',
    href: '/ministries',
    label: 'Explore Ministries',
    icon: Users,
  },
  {
    kicker: 'Giving',
    title: 'Support the mission simply',
    text: 'Use the connected giving flow to contribute without losing track of your account history.',
    href: '/donate',
    label: 'Open Giving',
    icon: HeartHandshake,
  },
];

// Spec §3.1: About links to Ministries, Contact, FAQ, Privacy and Terms.
const aboutLinks = [
  { href: '/ministries', label: 'Ministries', description: 'Serve and belong', icon: Church },
  { href: '/contact', label: 'Contact', description: 'Talk to the team', icon: Mail },
  { href: '/faq', label: 'FAQ', description: 'Quick answers', icon: HelpCircle },
  { href: '/privacy', label: 'Privacy', description: 'How we handle your data', icon: ShieldCheck },
  { href: '/terms', label: 'Terms', description: 'Using this site', icon: FileText },
];

export default function AboutPage() {
  return (
    <div className="container-max space-y-14 py-10 sm:py-12">
      <section className="rounded-panel border border-border bg-surface px-6 py-10 sm:px-10 md:py-14">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div className="space-y-5">
            <Badge tone="gold">About ANT PRESS</Badge>
            <h1 className="max-w-3xl text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl">
              A platform built to turn information into real community movement
            </h1>
            <p className="max-w-2xl text-lg text-muted">
              ANT PRESS brings together publishing, participation, support, and member tools so the public website feels
              intentional, clear, and ready for action.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/ministries">
                  Explore Ministries <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/contact">Talk To The Team</Link>
              </Button>
            </div>
          </div>

          <ul className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {statCards.map(([title, text]) => (
              <li key={title} className="rounded-card border border-border bg-card p-4">
                <p className="text-sm font-semibold text-foreground">{title}</p>
                <p className="mt-1 text-sm text-muted">{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardContent className="p-6 sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold-ink">Why it exists</p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-foreground">
              One digital home for the work that keeps people connected
            </h2>
            <div className="mt-5 space-y-4 leading-relaxed text-foreground/85">
              <p>
                Momentum is easy to lose when updates, sermons, events, and support tools live in separate places. ANT PRESS
                closes that gap by giving the public site and the operations side a single shared system.
              </p>
              <p>
                That means leaders can publish with more confidence, and members can find what matters without guessing where
                to go next.
              </p>
            </div>

            <div className="mt-6 rounded-card bg-surface p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">In practice</p>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-foreground/85">
                <li>People can move from reading an update to registering for an event in the same experience.</li>
                <li>Published content stays reusable instead of disappearing after one announcement cycle.</li>
                <li>Support tools like giving and prayer requests stay easy to reach from the public side of the site.</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2">
          {pillars.map((pillar) => (
            <Card key={pillar.title}>
              <CardContent className="p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <pillar.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-lg font-semibold text-foreground">{pillar.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-foreground/85">{pillar.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Section title="More about us">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {aboutLinks.map((link) => (
            <Tile key={link.href} href={link.href} icon={link.icon} label={link.label} description={link.description} />
          ))}
        </div>
      </Section>

      <Section title="What you can do next" href="/register" linkLabel="Create an account">
        <div className="grid gap-4 lg:grid-cols-3">
          {pathways.map((item) => (
            <Card key={item.title} className="flex flex-col">
              <CardContent className="flex flex-1 flex-col p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <item.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-muted">{item.kicker}</p>
                <h3 className="mt-1 text-lg font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-foreground/85">{item.text}</p>
                <Button asChild variant="secondary" className="mt-5 self-start">
                  <Link href={item.href}>{item.label}</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>
    </div>
  );
}
```

- [ ] **Step 4: Rewrite Contact**

Changes:
- every field gets a visible `Label`, plus a field-level error under it. This reads `formState.errors` from the same `useForm` call; the `{ required: true }` rules are unchanged.
- the success line becomes a `StatusMessage` inside the existing `aria-live` region

Replace `frontend/src/app/contact/page.tsx` with:

```tsx
'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { Mail, MessageSquare, User } from 'lucide-react';
import StatusMessage from '@/components/site/StatusMessage';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PageHeader from '@/components/ui/page-header';
import { Textarea } from '@/components/ui/textarea';
import { useSubmitContactMessage } from '@/hooks/useApi';

type ContactFormData = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

const contactPoints = [
  {
    icon: User,
    title: 'General inquiry',
    description: 'Use this form for questions about content, ministries, or next steps.',
  },
  {
    icon: Mail,
    title: 'Straight to the team',
    description: 'Messages go directly to the church team, who reply by email.',
  },
  {
    icon: MessageSquare,
    title: 'Clear follow-up',
    description: 'Give enough context in the subject and message fields so the team can respond well.',
  },
];

export default function ContactPage() {
  const [status, setStatus] = React.useState<'idle' | 'success'>('idle');
  const submitContact = useSubmitContactMessage();
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting, errors },
  } = useForm<ContactFormData>();

  const onSubmit = async (data: ContactFormData) => {
    try {
      await submitContact.mutateAsync(data);
      setStatus('success');
      reset();
    } catch {
      setStatus('idle');
    }
  };

  return (
    <div className="container-max space-y-8 py-10 sm:py-12">
      <PageHeader
        eyebrow="Contact"
        title="Start the conversation"
        description="Send a message, ask a question, or request information from the team."
        breadcrumb={[{ label: 'About', href: '/about' }, { label: 'Contact' }]}
      />

      <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-4">
          {contactPoints.map((item) => (
            <Card key={item.title}>
              <CardContent className="flex gap-4 p-5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <item.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="font-semibold text-foreground">{item.title}</h2>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{item.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardContent className="p-6 sm:p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contact-name">Name</Label>
                  <Input
                    id="contact-name"
                    placeholder="Your name"
                    aria-invalid={errors.name ? 'true' : undefined}
                    {...register('name', { required: true })}
                  />
                  {errors.name && <p className="text-sm text-danger">Please enter your name.</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-email">Email</Label>
                  <Input
                    id="contact-email"
                    type="email"
                    placeholder="Email address"
                    aria-invalid={errors.email ? 'true' : undefined}
                    {...register('email', { required: true })}
                  />
                  {errors.email && <p className="text-sm text-danger">Please enter your email address.</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact-subject">Subject</Label>
                <Input
                  id="contact-subject"
                  placeholder="Subject"
                  aria-invalid={errors.subject ? 'true' : undefined}
                  {...register('subject', { required: true })}
                />
                {errors.subject && <p className="text-sm text-danger">Please add a subject.</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact-message">Message</Label>
                <Textarea
                  id="contact-message"
                  rows={7}
                  placeholder="Write your message..."
                  aria-invalid={errors.message ? 'true' : undefined}
                  {...register('message', { required: true })}
                />
                {errors.message && <p className="text-sm text-danger">Please write a message.</p>}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Button type="submit" size="lg" loading={isSubmitting || submitContact.isPending}>
                  {isSubmitting || submitContact.isPending ? 'Sending...' : 'Send Message'}
                </Button>

                <div aria-live="polite">
                  {status === 'success' ? <StatusMessage tone="success">Message sent successfully.</StatusMessage> : null}
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

`Textarea` uses `fieldClass`, which already includes `aria-[invalid=true]:border-danger`, so invalid fields get a red border with no extra classes.

- [ ] **Step 5: Rewrite the FAQ**

Replace `frontend/src/app/faq/page.tsx` with:

```tsx
import Link from 'next/link';
import { HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import PageHeader from '@/components/ui/page-header';

const faqs = [
  {
    question: 'How do I create a church member account?',
    answer:
      'Go to the Register page, fill in your details, accept the Terms and Agreement, and submit the form.',
  },
  {
    question: 'How can I register for church events?',
    answer:
      'Open the Events page, select an event, and use the Register button on the event detail page.',
  },
  {
    question: 'Can I submit prayer requests privately?',
    answer:
      'Yes. On the Prayer Request page, you can choose to submit anonymously before sending.',
  },
  {
    question: 'How do notifications work?',
    answer:
      'You will receive in-app notifications for new events, prayer updates, and announcements. You can view them from the bell icon in the header.',
  },
  {
    question: 'How do I update my profile picture?',
    answer:
      'Visit your Profile page and use the Upload Photo button to upload a new image.',
  },
  {
    question: 'Who do I contact for support?',
    answer:
      'Use the Contact page and send a message to the church admin team.',
  },
];

export default function FaqPage() {
  return (
    <div className="container-max py-10 sm:py-12">
      <div className="mx-auto max-w-3xl space-y-8">
        <PageHeader
          title="Frequently asked questions"
          description="Quick answers to common questions about ANT PRESS."
          breadcrumb={[{ label: 'About', href: '/about' }, { label: 'FAQ' }]}
        />

        <Card>
          <dl className="divide-y divide-border">
            {faqs.map((item) => (
              <div key={item.question} className="space-y-2 p-6">
                <dt className="text-lg font-semibold text-foreground">{item.question}</dt>
                <dd className="leading-relaxed text-foreground/85">{item.answer}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <Card className="bg-surface">
          <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <HelpCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
              <div>
                <p className="font-semibold text-foreground">Still have a question?</p>
                <p className="text-sm text-muted">Send us a message and the team will get back to you.</p>
              </div>
            </div>
            <Button asChild className="self-start sm:self-auto">
              <Link href="/contact">Contact us</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

FAQ, Privacy and Terms drop `'use client'`. They have no state or hooks, so they render on the server; `Card` and `Button` are client components and work inside them.

- [ ] **Step 6: Rewrite Privacy and Terms on `LegalDocument`**

Replace `frontend/src/app/privacy/page.tsx` with:

```tsx
import LegalDocument, { type LegalSection } from '@/components/site/LegalDocument';

const sections: LegalSection[] = [
  {
    heading: 'Information We Collect',
    body: 'We collect account details you provide (name, email, phone), plus activity data related to events, prayer requests, and donations.',
  },
  {
    heading: 'How We Use Information',
    body: 'Your information is used for church communication, member support, event coordination, and secure platform operations.',
  },
  {
    heading: 'Data Protection',
    body: 'We apply reasonable security measures to protect personal data and limit access to authorized administrators and system processes.',
  },
  {
    heading: 'Sharing',
    body: 'We do not sell personal data. Information is only shared where required for payment processing, legal obligations, or trusted service operation.',
  },
  {
    heading: 'Contact',
    body: 'If you have questions about your privacy or data usage, contact the church admin team through the Contact page.',
  },
];

export default function PrivacyPage() {
  return <LegalDocument title="Privacy Policy" description="How ANT PRESS collects, uses and protects your information." sections={sections} />;
}
```

Replace `frontend/src/app/terms/page.tsx` with:

```tsx
import LegalDocument, { type LegalSection } from '@/components/site/LegalDocument';

const sections: LegalSection[] = [
  {
    heading: 'Membership Account',
    body: 'By creating an account, you confirm that the information you provide is accurate and that you are responsible for maintaining the confidentiality of your login credentials.',
  },
  {
    heading: 'Acceptable Use',
    body: 'You agree to use ANT PRESS respectfully and lawfully. Misuse, abusive behavior, or unauthorized access attempts may result in account suspension.',
  },
  {
    heading: 'Donations and Events',
    body: 'Donations and event registrations made through the platform must be genuine. The church may contact you to verify suspicious activity or confirm updates.',
  },
  {
    heading: 'Privacy',
    body: 'Your personal information is processed for church communication, event management, and ministry support. Please review the privacy policy for full details.',
  },
  {
    heading: 'Updates to Terms',
    body: 'These terms may be updated periodically. Continued use of the platform after updates means you accept the revised terms.',
  },
];

export default function TermsPage() {
  return <LegalDocument title="Terms and Agreement" description="The terms for using ANT PRESS and your member account." sections={sections} />;
}
```

The section text is copied word for word from the old pages. The numbers ("1. ") are now added by `LegalDocument`.

- [ ] **Step 7: Run the standard checks**

```bash
FILES="frontend/src/app/ministries/page.tsx frontend/src/app/ministries/[id]/page.tsx frontend/src/app/about/page.tsx frontend/src/app/contact/page.tsx frontend/src/app/faq/page.tsx frontend/src/app/privacy/page.tsx frontend/src/app/terms/page.tsx"
```

Expected:
- `CHECKS-OK`
- scans 2 and 3 print nothing (the About hero's `rgb(...)` gradient and data-URI `%23ffffff` pattern are gone)
- parity prints nothing: contact still has `register('name'`, `register('email'`, `register('subject'` and `register('message'`, and About keeps `/ministries`, `/contact`, `/register`, `/news` and `/donate`

- [ ] **Step 8: Check by eye (375px and 1280px, Light and Dark)**

- `/ministries`:
  - signed in as admin, "Manage Ministries" appears beside "Contact a Ministry"
  - the cards are equal height, with the button at the bottom
- `/ministries/<id>`: the header has the church icon; the sermon rows are whole-row links, and "Open sermon" text appears from 640px up. A ministry with no sermons shows the empty state.
- `/about`:
  - the hero is a calm surface panel (no orange), and its buttons stack at 375
  - "More about us" shows five tiles: 2 per row at 375, 5 in one row at 1280
  - each tile opens the right page
- `/contact`:
  - the labels sit above the fields
  - submitting empty shows four red messages and red borders; nothing is sent
  - a valid send shows the spinner, then "Message sent successfully." in green, and the form clears
- `/faq`, `/privacy` and `/terms`: the breadcrumb "About › …" works; the sections are numbered 1–5, with readable line length at 1280.
- With the backend stopped, `/ministries` and `/ministries/1` show their "couldn't load" states.

- [ ] **Step 9: Commit**

```bash
git add frontend/src/app/ministries frontend/src/app/about frontend/src/app/contact frontend/src/app/faq frontend/src/app/privacy frontend/src/app/terms
git commit -m "feat(web): ministries, about, contact, FAQ and legal pages on the design system; About links to its sub-pages

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Sign-in, registration, email verification and the route guard

**Files:**
- Rewrite: `frontend/src/components/auth/LoginForm.tsx`, `frontend/src/components/auth/RegisterForm.tsx`, `frontend/src/components/auth/RouteGuard.tsx`, `frontend/src/app/verify-email/page.tsx`
- Unchanged: `frontend/src/app/login/page.tsx`, `frontend/src/app/register/page.tsx` (they only render the forms) and `frontend/src/components/auth/AuthBootstrap.tsx` (no markup)

**Interfaces:**
- Consumes (Task 1): `StatusMessage`.
- Produces: nothing new. `RouteGuard`'s props and logic are unchanged. It is also used by the admin layout and the dashboard, so only its waiting screen changes.

**Rules for the auth forms:**
- the zod schemas, `onSubmit`, `handleGoogleLogin`/`handleGoogleRegister`, the redirect effects and the error-message chains are copied verbatim
- each field gets a visible `Label` and a 44px `Input`, with its leading icon kept
- field errors become `text-sm text-danger`, and the input gets `aria-invalid`
- the show-password toggle becomes a 44px button with `aria-label` and `aria-pressed`
- the amber primary buttons become the default primary `Button size="lg"` with `loading`
- the red mutation error box becomes `StatusMessage tone="danger"`

- [ ] **Step 1: Rewrite `LoginForm`**

Replace `frontend/src/components/auth/LoginForm.tsx` with:

```tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import StatusMessage from '@/components/site/StatusMessage';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useGoogleLogin, useLogin } from '@/hooks/useApi';
import { useAuthStore } from '@/lib/store';
import { requestGoogleAccessToken } from '@/lib/google-oauth';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const iconClass = 'pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted';

export default function LoginForm() {
  const router = useRouter();
  const { user, isAuthenticated, hydrate, setUser, setIsAuthenticated } = useAuthStore();
  const loginMutation = useLogin();
  const googleLoginMutation = useGoogleLogin();
  const [showPassword, setShowPassword] = React.useState(false);
  const loginErrorMessage =
    (loginMutation.error as any)?.response?.data?.message ||
    (loginMutation.error as any)?.response?.data?.error ||
    (loginMutation.error as any)?.response?.data?.details?.[0]?.message ||
    (loginMutation.error as Error | null)?.message ||
    'Could not sign in. Please confirm your credentials.';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  React.useEffect(() => {
    hydrate();
  }, [hydrate]);

  React.useEffect(() => {
    if (isAuthenticated && user) {
      router.replace(user.role === 'admin' ? '/admin/dashboard' : '/dashboard');
    }
  }, [isAuthenticated, router, user]);

  const onSubmit = async (data: LoginFormData) => {
    try {
      const response = await loginMutation.mutateAsync(data);
      const authenticatedUser = response?.user ?? null;

      setUser(authenticatedUser);
      setIsAuthenticated(Boolean(authenticatedUser));
      router.replace(authenticatedUser?.role === 'admin' ? '/admin/dashboard' : '/dashboard');
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
      const accessToken = await requestGoogleAccessToken(googleClientId);
      const response = await googleLoginMutation.mutateAsync(accessToken);
      const authenticatedUser = response?.user ?? null;

      setUser(authenticatedUser);
      setIsAuthenticated(Boolean(authenticatedUser));
      router.replace(authenticatedUser?.role === 'admin' ? '/admin/dashboard' : '/dashboard');
    } catch (error) {
      console.error('Google login error:', error);
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center text-center">
          <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-card bg-primary text-primary-foreground">
            <Lock className="h-7 w-7" aria-hidden="true" />
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Welcome Back</h1>
          <p className="mt-2 text-sm text-muted">Sign in to your ANT PRESS account</p>
        </div>

        <Card>
          <CardContent className="space-y-5 p-6 sm:p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <div className="relative">
                  <Mail className={iconClass} aria-hidden="true" />
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="Email address"
                    className="pl-10"
                    aria-invalid={errors.email ? 'true' : undefined}
                    {...register('email')}
                  />
                </div>
                {errors.email && <p className="text-sm text-danger">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <div className="relative">
                  <Lock className={iconClass} aria-hidden="true" />
                  <Input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    className="pl-10 pr-12"
                    aria-invalid={errors.password ? 'true' : undefined}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                    className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center rounded-lg text-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                  </button>
                </div>
                {errors.password && <p className="text-sm text-danger">{errors.password.message}</p>}
              </div>

              <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
                {isSubmitting ? 'Signing in...' : 'Sign In'}
              </Button>

              {loginMutation.isError && <StatusMessage tone="danger">{loginErrorMessage}</StatusMessage>}
            </form>

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs uppercase tracking-[0.14em] text-muted">or</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <Button
              type="button"
              variant="secondary"
              size="lg"
              className="w-full"
              onClick={handleGoogleLogin}
              loading={googleLoginMutation.isPending}
            >
              {googleLoginMutation.isPending ? 'Connecting to Google...' : 'Continue with Google'}
            </Button>

            <p className="text-center text-sm text-muted">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="font-semibold text-link hover:underline">
                Create one
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

The decorative "Secure access" label is dropped. `min-h-screen` becomes `min-h-[70vh]`, because the page already sits between the header and the footer.

- [ ] **Step 2: Rewrite `RegisterForm`**

Replace `frontend/src/components/auth/RegisterForm.tsx` with:

```tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Lock, Mail, MailCheck, Phone, User } from 'lucide-react';
import StatusMessage from '@/components/site/StatusMessage';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useGoogleLogin, useRegister } from '@/hooks/useApi';
import { requestGoogleAccessToken } from '@/lib/google-oauth';
import { useAuthStore } from '@/lib/store';

const registerSchema = z
  .object({
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    phone: z.string().min(10, 'Phone number must be at least 10 characters'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string(),
    acceptedTerms: z.boolean(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine((data) => data.acceptedTerms === true, {
    message: 'You must accept the terms and agreement',
    path: ['acceptedTerms'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

const iconClass = 'pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted';

export default function RegisterForm() {
  const registerMutation = useRegister();
  const googleLoginMutation = useGoogleLogin();
  const { setUser, setIsAuthenticated } = useAuthStore();
  const [showPassword, setShowPassword] = React.useState(false);
  const [registeredEmail, setRegisteredEmail] = React.useState<string | null>(null);
  const registerErrorMessage =
    (registerMutation.error as any)?.response?.data?.message ||
    (registerMutation.error as any)?.response?.data?.error ||
    (registerMutation.error as any)?.response?.data?.details?.[0]?.message ||
    (registerMutation.error as Error | null)?.message ||
    'Could not create account. Please check your details and try again.';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      const response = await registerMutation.mutateAsync({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        password: data.password,
        acceptedTerms: data.acceptedTerms,
      });
      setRegisteredEmail(response?.data?.email || data.email);
    } catch (error) {
      console.error('Registration error:', error);
    }
  };

  const handleGoogleRegister = async () => {
    try {
      const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
      const accessToken = await requestGoogleAccessToken(googleClientId);
      const response = await googleLoginMutation.mutateAsync(accessToken);
      const authenticatedUser = response?.user ?? null;
      setUser(authenticatedUser);
      setIsAuthenticated(Boolean(authenticatedUser));
      window.location.href = authenticatedUser?.role === 'admin' ? '/admin/dashboard' : '/dashboard';
    } catch (error) {
      console.error('Google registration error:', error);
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl space-y-6">
        <div className="flex flex-col items-center text-center">
          <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-card bg-primary text-primary-foreground">
            <User className="h-7 w-7" aria-hidden="true" />
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Join ANT PRESS</h1>
          <p className="mt-2 text-sm text-muted">Create your account and stay connected</p>
        </div>

        <Card>
          <CardContent className="space-y-5 p-6 sm:p-8">
            {registeredEmail ? (
              <div className="space-y-5" role="status">
                <span className="flex h-12 w-12 items-center justify-center rounded-card bg-success/10 text-success">
                  <MailCheck className="h-6 w-6" aria-hidden="true" />
                </span>
                <div className="space-y-2">
                  <h2 className="text-xl font-bold tracking-tight text-foreground">Check your email</h2>
                  <p className="text-sm leading-relaxed text-muted">
                    We sent a verification link to{' '}
                    <span className="break-all font-semibold text-foreground">{registeredEmail}</span>.
                    Open that message and click the link before signing in.
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button asChild size="lg">
                    <Link href="/login">Go to Sign In</Link>
                  </Button>
                  <Button type="button" size="lg" variant="secondary" onClick={() => setRegisteredEmail(null)}>
                    Register another account
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="register-first-name">First name</Label>
                      <div className="relative">
                        <User className={iconClass} aria-hidden="true" />
                        <Input
                          id="register-first-name"
                          placeholder="First name"
                          className="pl-10"
                          aria-invalid={errors.firstName ? 'true' : undefined}
                          {...register('firstName')}
                        />
                      </div>
                      {errors.firstName && <p className="text-sm text-danger">{errors.firstName.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-last-name">Last name</Label>
                      <Input
                        id="register-last-name"
                        placeholder="Last name"
                        aria-invalid={errors.lastName ? 'true' : undefined}
                        {...register('lastName')}
                      />
                      {errors.lastName && <p className="text-sm text-danger">{errors.lastName.message}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <div className="relative">
                      <Mail className={iconClass} aria-hidden="true" />
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="Email address"
                        className="pl-10"
                        aria-invalid={errors.email ? 'true' : undefined}
                        {...register('email')}
                      />
                    </div>
                    {errors.email && <p className="text-sm text-danger">{errors.email.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-phone">Phone number</Label>
                    <div className="relative">
                      <Phone className={iconClass} aria-hidden="true" />
                      <Input
                        id="register-phone"
                        type="tel"
                        placeholder="Phone number"
                        className="pl-10"
                        aria-invalid={errors.phone ? 'true' : undefined}
                        {...register('phone')}
                      />
                    </div>
                    {errors.phone && <p className="text-sm text-danger">{errors.phone.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-password">Password</Label>
                    <div className="relative">
                      <Lock className={iconClass} aria-hidden="true" />
                      <Input
                        id="register-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Create password"
                        className="pl-10 pr-12"
                        aria-invalid={errors.password ? 'true' : undefined}
                        aria-describedby="register-password-hint"
                        {...register('password')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((current) => !current)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        aria-pressed={showPassword}
                        className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center rounded-lg text-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                      </button>
                    </div>
                    <p id="register-password-hint" className="text-xs text-muted">
                      At least 8 characters, with an uppercase letter, a lowercase letter and a number.
                    </p>
                    {errors.password && <p className="text-sm text-danger">{errors.password.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-confirm-password">Confirm password</Label>
                    <Input
                      id="register-confirm-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Confirm password"
                      aria-invalid={errors.confirmPassword ? 'true' : undefined}
                      {...register('confirmPassword')}
                    />
                    {errors.confirmPassword && <p className="text-sm text-danger">{errors.confirmPassword.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="register-terms"
                      className="flex items-start gap-3 rounded-lg border border-border bg-surface px-4 py-3 text-sm text-foreground/85"
                    >
                      <input
                        id="register-terms"
                        type="checkbox"
                        aria-invalid={errors.acceptedTerms ? 'true' : undefined}
                        {...register('acceptedTerms')}
                        className="mt-0.5 h-5 w-5 shrink-0 rounded border-input accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                      <span>
                        I agree to the{' '}
                        <Link href="/terms" className="font-semibold text-link hover:underline">
                          Terms and Agreement
                        </Link>
                        .
                      </span>
                    </label>
                    {errors.acceptedTerms && <p className="text-sm text-danger">{errors.acceptedTerms.message}</p>}
                  </div>

                  <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
                    {isSubmitting ? 'Creating account...' : 'Create Account'}
                  </Button>

                  {registerMutation.isError && <StatusMessage tone="danger">{registerErrorMessage}</StatusMessage>}
                </form>

                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs uppercase tracking-[0.14em] text-muted">or use Google</span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                <Button
                  type="button"
                  variant="secondary"
                  size="lg"
                  className="w-full"
                  onClick={handleGoogleRegister}
                  loading={googleLoginMutation.isPending}
                >
                  {googleLoginMutation.isPending ? 'Connecting to Google...' : 'Continue with Google'}
                </Button>

                <p className="text-center text-sm text-muted">
                  Already have an account?{' '}
                  <Link href="/login" className="font-semibold text-link hover:underline">
                    Sign in
                  </Link>
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Restyle the `RouteGuard` waiting screen**

Only the fallback markup and one import change. Replace `frontend/src/components/auth/RouteGuard.tsx` with:

```tsx
'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '@/lib/store';

type RouteGuardProps = {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'member';
};

export default function RouteGuard({ children, requiredRole }: RouteGuardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, hydrate } = useAuthStore();
  const [isReady, setIsReady] = React.useState(false);
  const [hasStoredToken, setHasStoredToken] = React.useState(false);

  React.useEffect(() => {
    hydrate();
    if (typeof window !== 'undefined') {
      setHasStoredToken(Boolean(localStorage.getItem('access_token')));
    }
    setIsReady(true);
  }, [hydrate]);

  React.useEffect(() => {
    if (!isReady) return;
    if (isLoading) return;

    const tokenExists =
      typeof window !== 'undefined' ? Boolean(localStorage.getItem('access_token')) : hasStoredToken;

    if (!user && !tokenExists) {
      const next = pathname ? `?next=${encodeURIComponent(pathname)}` : '';
      router.replace(`/login${next}`);
      return;
    }

    if (requiredRole === 'admin' && user && user.role !== 'admin') {
      router.replace('/dashboard');
    }
  }, [hasStoredToken, isLoading, isReady, pathname, requiredRole, router, user]);

  if (
    !isReady ||
    isLoading ||
    !user ||
    (requiredRole === 'admin' && user.role !== 'admin')
  ) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-6 py-16" role="status">
        <div className="flex flex-col items-center text-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden="true" />
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-muted">Securing session</p>
          <p className="mt-2 text-sm text-foreground/85">Verifying your access before we open this workspace.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
```

- [ ] **Step 4: Rewrite the verify-email page**

The blue gradient banner becomes a centred heading. The result card uses token tones: success green, problem amber, working blue. The links become `Button`s. The verification effect is copied verbatim, including its `[token, verifyEmail]` dependency list.

Replace `frontend/src/app/verify-email/page.tsx` with:

```tsx
'use client';

import Link from 'next/link';
import React from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2, MailCheck, MailWarning } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useVerifyEmail } from '@/hooks/useApi';
import { cn } from '@/lib/utils';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const verifyEmail = useVerifyEmail();
  const [status, setStatus] = React.useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = React.useState('Preparing verification...');

  React.useEffect(() => {
    let active = true;

    const runVerification = async () => {
      if (!token) {
        setStatus('error');
        setMessage('This verification link is incomplete. Please request a new verification email.');
        return;
      }

      setStatus('loading');
      setMessage('Verifying your email...');

      try {
        const response = await verifyEmail.mutateAsync(token);
        if (!active) return;

        setStatus('success');
        setMessage(response?.message || 'Email verified successfully. You can sign in now.');
      } catch (error: any) {
        if (!active) return;

        const apiMessage =
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          'Verification failed';

        setStatus('error');
        setMessage(apiMessage);
      }
    };

    runVerification();

    return () => {
      active = false;
    };
  }, [token, verifyEmail]);

  const toneClass =
    status === 'success'
      ? 'bg-success/10 text-success'
      : status === 'error'
        ? 'bg-warning/10 text-warning'
        : 'bg-primary/10 text-primary';

  return (
    <div className="container-max py-12 sm:py-16">
      <div className="mx-auto max-w-xl space-y-6">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold-ink">Email verification</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Finish activating your account</h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-muted">
            We use email verification to confirm new ANT PRESS accounts before sign-in. This keeps community access more
            secure for everyone.
          </p>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center p-8 text-center" aria-live="polite">
            <span className={cn('mb-5 flex h-16 w-16 items-center justify-center rounded-panel', toneClass)}>
              {status === 'loading' ? (
                <Loader2 className="h-8 w-8 animate-spin" aria-hidden="true" />
              ) : status === 'success' ? (
                <MailCheck className="h-8 w-8" aria-hidden="true" />
              ) : (
                <MailWarning className="h-8 w-8" aria-hidden="true" />
              )}
            </span>

            <h2 className="text-xl font-bold tracking-tight text-foreground">
              {status === 'success'
                ? 'Email verified'
                : status === 'error'
                  ? 'Verification issue'
                  : 'Verifying your email'}
            </h2>

            <p className="mt-3 max-w-lg break-words text-sm leading-relaxed text-muted">{message}</p>

            <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Button asChild size="lg">
                <Link href="/login">Go to Sign In</Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/register">Back to Register</Link>
              </Button>
            </div>

            {status === 'error' ? (
              <p className="mt-6 text-xs text-muted">
                Need a new link? Use the same email on the sign-in page and we can add a resend action there next.
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <React.Suspense
      fallback={
        <div className="container-max py-12 sm:py-16">
          <Card className="mx-auto max-w-xl">
            <CardContent className="flex items-center justify-center gap-3 p-8 text-sm text-muted" role="status">
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              Preparing verification...
            </CardContent>
          </Card>
        </div>
      }
    >
      <VerifyEmailContent />
    </React.Suspense>
  );
}
```

- [ ] **Step 5: Run the standard checks**

```bash
FILES="frontend/src/components/auth/LoginForm.tsx frontend/src/components/auth/RegisterForm.tsx frontend/src/components/auth/RouteGuard.tsx frontend/src/app/verify-email/page.tsx"
```

Expected:
- `CHECKS-OK`
- scans 2 and 3 print nothing
- parity prints nothing:
  - LoginForm still registers `email` and `password`
  - RegisterForm still registers `firstName`, `lastName`, `email`, `phone`, `password`, `confirmPassword` and `acceptedTerms`
  - RouteGuard still calls `usePathname`, `useRouter`, `useAuthStore`, two `useState`s and two `useEffect`s

Also confirm the schemas are byte-identical:

```bash
diff <(git show fc3fd49:frontend/src/components/auth/RegisterForm.tsx | sed -n '/^const registerSchema/,/^type RegisterFormData/p') <(sed -n '/^const registerSchema/,/^type RegisterFormData/p' frontend/src/components/auth/RegisterForm.tsx) && echo schema-same
diff <(git show fc3fd49:frontend/src/components/auth/LoginForm.tsx | sed -n '/^const loginSchema/,/^type LoginFormData/p') <(sed -n '/^const loginSchema/,/^type LoginFormData/p' frontend/src/components/auth/LoginForm.tsx) && echo schema-same
```

Expected: `schema-same` twice. If the old file has CRLF endings, the diff may flag every line; then compare with `diff --strip-trailing-cr`.

- [ ] **Step 6: Check by eye (375px and 1280px, Light and Dark)**

- `/login`:
  - Email and Password labels above 44px fields with icons
  - submitting empty shows "Invalid email address" and "Password is required" in red, with red borders
  - the eye button toggles the password and announces Show/Hide (`aria-pressed`); Tab reaches it with a ring
  - wrong credentials show the red `StatusMessage` with the server's message
  - correct credentials redirect to `/dashboard`, or `/admin/dashboard` for admins
  - Google shows "Connecting to Google..." with a spinner
- `/register`:
  - at 375px first and last name stack, and at 640px+ they sit side by side
  - submitting empty shows every zod message
  - a weak password shows its rule message under the hint
  - mismatched passwords show "Passwords do not match"
  - an unticked terms box shows its message
  - a successful sign-up shows "Check your email", with a long email wrapping, and "Register another account" returns to the form
- `/verify-email`:
  - with no token, the amber "Verification issue" and the help line
  - with a bad token, the server message
  - with a valid token, the green "Email verified"
  - both buttons are 48px and stack at 375
- `/dashboard` while signed out: the RouteGuard spinner flashes, then redirects to `/login?next=%2Fdashboard`.
- Dark: the cards and fields are navy, with no white boxes left.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/components/auth frontend/src/app/verify-email
git commit -m "feat(web): sign-in, registration, email verification and route guard on the design system with labelled fields

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Member area (dashboard, registrations, profile), search and the notification bell

**Files:**
- Rewrite: `frontend/src/app/dashboard/page.tsx`, `frontend/src/app/dashboard/registrations/page.tsx`, `frontend/src/app/profile/page.tsx`, `frontend/src/app/search/page.tsx`, `frontend/src/components/layout/NotificationBell.tsx`
- Unchanged: `frontend/src/app/dashboard/layout.tsx`

**Interfaces:**
- Consumes (Task 1): `SearchField`, `SkeletonGrid`, `StatusMessage`.
- Produces: nothing new. `NotificationBell` keeps its default export and takes no props; `Header.tsx` (8a-owned, not edited) renders it unchanged.

- [ ] **Step 1: Rewrite the member dashboard**

Changes:
- the slate gradient banner becomes a `PageHeader` with the two actions
- the metric cards show skeletons while loading and "—" plus "Couldn't load right now" on error, instead of a misleading `0`. This uses `isLoading`/`isError` from the same three hook calls.
- Quick actions become `Tile`s
- "Stay connected" becomes a bordered link list

Replace `frontend/src/app/dashboard/page.tsx` with:

```tsx
'use client';

import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { ArrowRight, CalendarDays, ClipboardList, Gift, Heart, User, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import PageHeader from '@/components/ui/page-header';
import Section from '@/components/ui/section';
import { Skeleton } from '@/components/ui/skeleton';
import Tile from '@/components/ui/tile';
import { useDonations, usePrayerRequests, useProfile } from '@/hooks/useApi';

const quickActions = [
  { href: '/donate', label: 'Give Online', icon: Gift },
  { href: '/profile', label: 'Update Profile', icon: UserRound },
  { href: '/dashboard/registrations', label: 'My Registrations', icon: ClipboardList },
  { href: '/events', label: 'Explore Events', icon: CalendarDays },
];

const stayConnected = [
  { href: '/news', label: 'Read the latest news' },
  { href: '/sermons', label: 'Browse sermon content' },
  { href: '/ministries', label: 'Find active ministries' },
  { href: '/events', label: 'See upcoming events' },
];

export default function DashboardPage() {
  const { data: profile, isLoading: profileLoading, isError: profileError } = useProfile();
  const { data: donations, isLoading: donationsLoading, isError: donationsError } = useDonations();
  const { data: prayers, isLoading: prayersLoading, isError: prayersError } = usePrayerRequests();

  const displayName = `${profile?.first_name || profile?.firstName || ''} ${profile?.last_name || profile?.lastName || ''}`.trim();

  return (
    <div className="container-max space-y-12 py-10 sm:py-12">
      <PageHeader
        eyebrow="Member dashboard"
        title={displayName || 'Welcome back'}
        description="Track your profile, giving and prayer activity in one place."
        actions={
          <>
            <Button asChild>
              <Link href="/donate">Make a Donation</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/profile">Update Profile</Link>
            </Button>
          </>
        }
      />

      <section aria-label="Your activity" className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <MetricCard
          icon={User}
          title="Profile"
          value={displayName || 'Member account'}
          subtext={profile?.email || 'Your account details'}
          linkHref="/profile"
          linkLabel="Open profile"
          loading={profileLoading}
          error={profileError}
        />
        <MetricCard
          icon={Gift}
          title="Donations"
          value={String(donations?.length || 0)}
          subtext="Recorded giving entries"
          linkHref="/donate"
          linkLabel="Give again"
          loading={donationsLoading}
          error={donationsError}
        />
        <MetricCard
          icon={Heart}
          title="Prayer Requests"
          value={String(prayers?.length || 0)}
          subtext="Requests attached to your account"
          linkHref="/prayer/new"
          linkLabel="Submit prayer"
          loading={prayersLoading}
          error={prayersError}
        />
      </section>

      <Section title="Quick actions">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {quickActions.map((action) => (
            <Tile key={action.href} href={action.href} icon={action.icon} label={action.label} />
          ))}
        </div>
      </Section>

      <Section title="Stay connected">
        <Card>
          <ul className="divide-y divide-border">
            {stayConnected.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex min-h-11 items-center justify-between gap-3 px-5 py-4 text-sm font-semibold text-foreground transition-colors hover:bg-surface"
                >
                  {item.label}
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </Section>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  title,
  value,
  subtext,
  linkHref,
  linkLabel,
  loading,
  error,
}: {
  icon: LucideIcon;
  title: string;
  value: string;
  subtext: string;
  linkHref: string;
  linkLabel: string;
  loading: boolean;
  error: boolean;
}) {
  return (
    <Card className="flex h-full flex-col">
      <CardContent className="flex flex-1 flex-col p-6">
        <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-muted">{title}</p>
        {loading ? (
          <Skeleton className="mt-3 h-8 w-24" />
        ) : (
          <p className="mt-2 break-words text-2xl font-bold tracking-tight text-foreground">{error ? '—' : value}</p>
        )}
        <p className="mt-1 break-words text-sm text-muted">{error ? "Couldn't load right now" : subtext}</p>
        <Button asChild variant="secondary" size="sm" className="mt-5 self-start">
          <Link href={linkHref}>{linkLabel}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
```

**Hrefs:** before, the quick-action and stay-connected hrefs lived in `[label, href]` tuples. Now they are `{ href: '…' }` objects, which the parity check reads (`href: '`). The destinations are the same: `/donate`, `/profile`, `/dashboard/registrations`, `/events`, `/news`, `/sermons`, `/ministries` and `/prayer/new`.

- [ ] **Step 2: Rewrite My registrations**

The page gains an error state, using `isError` from the same `useQuery` call, and an empty state that links to events. Rows show a calendar-check chip.

Replace `frontend/src/app/dashboard/registrations/page.tsx` with (this also drops the old file's leading byte-order mark):

```tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { CalendarCheck } from 'lucide-react';
import apiClient from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import EmptyState from '@/components/ui/empty-state';
import PageHeader from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';

type Registration = {
  id: number;
  created_at: string;
  event_name?: string;
  name?: string;
};

async function fetchRegistrations(): Promise<Registration[]> {
  const res = await apiClient.get('/events/registrations/user');
  return res.data.data;
}

export default function RegistrationsPage() {
  const { data, isLoading, isError } = useQuery<Registration[]>({
    queryKey: ['registrations'],
    queryFn: fetchRegistrations,
  });

  return (
    <div className="container-max space-y-8 py-10 sm:py-12">
      <PageHeader
        title="My event registrations"
        description="Events you have signed up for."
        breadcrumb={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'My registrations' }]}
        actions={
          <Button asChild variant="secondary">
            <Link href="/events">Browse events</Link>
          </Button>
        }
      />

      {isLoading ? (
        <div className="space-y-3" role="status">
          <span className="sr-only">Loading…</span>
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : isError ? (
        <EmptyState icon={CalendarCheck} title="Your registrations couldn't load right now" message="Please try again in a moment." />
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title="No registrations yet"
          message="When you register for an event it will be listed here."
          action={
            <Button asChild>
              <Link href="/events">Find an event</Link>
            </Button>
          }
        />
      ) : (
        <Card>
          <ul className="divide-y divide-border">
            {data.map((r) => (
              <li key={r.id} className="flex items-start gap-4 p-5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <CalendarCheck className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="break-words font-semibold text-foreground">{r.event_name || r.name}</p>
                  <p className="text-sm text-muted">Registered at: {new Date(r.created_at).toLocaleString()}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Rewrite Profile**

Changes:
- the slate banner becomes a `PageHeader` with a "Dashboard ›" breadcrumb
- the photo row and the form sit in one `Card`
- the fields get `Label htmlFor`
- the save and upload buttons use `loading`
- the results become `StatusMessage`s

**One deliberate change:** if the profile fails to load (`isError` from the same `useProfile` call), an error state replaces the form. Before, an empty form was shown, and saving it would have sent blank values.

`register('firstName')`, `register('lastName')` and `register('phone')`, the `reset` effect, `onSubmit` and `onUploadPhoto` are unchanged.

Replace `frontend/src/app/profile/page.tsx` with:

```tsx
'use client';

import React from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { Camera, UserRound } from 'lucide-react';
import StatusMessage from '@/components/site/StatusMessage';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import EmptyState from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PageHeader from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { useProfile, useUpdateProfile, useUploadProfilePhoto } from '@/hooks/useApi';
import { useAuthStore } from '@/lib/store';
import { resolveAssetUrl } from '@/lib/utils';

type ProfileFormData = {
  firstName?: string;
  lastName?: string;
  phone?: string;
};

export default function ProfilePage() {
  const { data: profile, isLoading, isError } = useProfile();
  const update = useUpdateProfile();
  const uploadPhoto = useUploadProfilePhoto();
  const { setUser } = useAuthStore();
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const { register, handleSubmit, reset } = useForm<ProfileFormData>();

  React.useEffect(() => {
    if (profile) {
      reset({
        firstName: profile.first_name || profile.firstName,
        lastName: profile.last_name || profile.lastName,
        phone: profile.phone,
      });
    }
  }, [profile, reset]);

  const onSubmit = async (vals: ProfileFormData) => {
    const response = await update.mutateAsync(vals);
    if (response?.data) {
      setUser(response.data);
      localStorage.setItem('user', JSON.stringify(response.data));
    }
  };

  const onUploadPhoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const response = await uploadPhoto.mutateAsync(file);
    if (response?.data) {
      setUser(response.data);
      localStorage.setItem('user', JSON.stringify(response.data));
    }
  };

  const imageUrl = resolveAssetUrl(profile?.profile_image_url || profile?.profileImageUrl || null);
  const displayName = `${profile?.first_name || profile?.firstName || ''} ${profile?.last_name || profile?.lastName || ''}`.trim();

  return (
    <div className="container-max space-y-8 py-10 sm:py-12">
      <PageHeader
        eyebrow="Profile"
        title={displayName || 'Your Profile'}
        description="Keep your member details up to date across the site."
        breadcrumb={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Profile' }]}
      />

      {isLoading ? (
        <Card>
          <CardContent className="space-y-6 p-6 sm:p-8" role="status">
            <span className="sr-only">Loading…</span>
            <Skeleton className="h-28 w-28 rounded-full" />
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
          </CardContent>
        </Card>
      ) : isError ? (
        <EmptyState icon={UserRound} title="Your profile couldn't load right now" message="Please try again in a moment." />
      ) : (
        <Card>
          <CardContent className="space-y-8 p-6 sm:p-8">
            <section className="flex flex-col gap-5 sm:flex-row sm:items-center">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={displayName || 'Profile photo'}
                  width={112}
                  height={112}
                  unoptimized
                  className="h-28 w-28 rounded-full border border-border object-cover"
                />
              ) : (
                <div
                  className="inline-flex h-28 w-28 items-center justify-center rounded-full bg-primary/10 text-3xl font-bold text-primary"
                  aria-hidden="true"
                >
                  {(profile?.first_name || profile?.firstName || 'U').charAt(0).toUpperCase()}
                </div>
              )}

              <div className="space-y-3">
                <p className="text-sm text-muted">Upload a profile picture (JPG, PNG, WebP, max 5MB).</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={onUploadPhoto}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => fileInputRef.current?.click()}
                  loading={uploadPhoto.isPending}
                >
                  {!uploadPhoto.isPending && <Camera className="h-4 w-4" aria-hidden="true" />}
                  {uploadPhoto.isPending ? 'Uploading...' : 'Upload Photo'}
                </Button>
              </div>
            </section>

            <form onSubmit={handleSubmit(onSubmit)} className="grid gap-5 border-t border-border pt-8 lg:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="profile-first-name">First name</Label>
                <Input id="profile-first-name" {...register('firstName')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="profile-last-name">Last name</Label>
                <Input id="profile-last-name" {...register('lastName')} />
              </div>

              <div className="space-y-2 lg:col-span-2">
                <Label htmlFor="profile-phone">Phone</Label>
                <Input id="profile-phone" type="tel" {...register('phone')} />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:col-span-2">
                <Button type="submit" size="lg" loading={update.isPending}>
                  {update.isPending ? 'Saving...' : 'Save Profile'}
                </Button>
                <div aria-live="polite">
                  {update.isError && <StatusMessage tone="danger">Could not update profile.</StatusMessage>}
                  {update.isSuccess && <StatusMessage tone="success">Profile updated.</StatusMessage>}
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

The phone input gets `type="tel"`: the same text value, with a phone keypad on mobile. If the reviewer objects, drop the attribute; nothing else depends on it.

- [ ] **Step 4: Rewrite Search**

The page gains a `role="search"` form with `SearchField`, an error state (`isError` from the same `useGlobalSearch` call), and skeletons. Results become row cards with icon chips.

Replace `frontend/src/app/search/page.tsx` with:

```tsx
'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { CalendarDays, PlayCircle, Search, SearchX } from 'lucide-react';
import SearchField from '@/components/site/SearchField';
import SkeletonGrid from '@/components/site/SkeletonGrid';
import { useGlobalSearch } from '@/hooks/useApi';
import { Button } from '@/components/ui/button';
import EmptyState from '@/components/ui/empty-state';
import PageHeader from '@/components/ui/page-header';

const rowClass =
  'group flex items-center gap-4 rounded-card border border-border bg-card p-4 transition-colors hover:border-primary/40';
const chipClass = 'flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary';

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = React.useState(initialQuery);
  const { data, isLoading, isError } = useGlobalSearch(initialQuery, 1, 12);

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = query.trim();
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  const sermons = data?.sermons || [];
  const events = data?.events || [];
  const tooShort = initialQuery.trim().length < 2;

  return (
    <div className="container-max space-y-8 py-10 sm:py-12">
      <PageHeader title="Search" description="Find sermons and events in one place." />

      <form onSubmit={onSubmit} role="search" className="flex flex-col gap-3 sm:flex-row">
        <SearchField
          label="Search the site"
          className="flex-1"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search sermons, speakers, events..."
        />
        <Button type="submit">
          <Search className="h-4 w-4" aria-hidden="true" />
          Search
        </Button>
      </form>

      {tooShort ? (
        <EmptyState icon={Search} title="Enter at least 2 characters to search." message="Try a sermon title, a speaker or an event name." />
      ) : isLoading ? (
        <SkeletonGrid count={4} className="md:grid-cols-2" />
      ) : isError ? (
        <EmptyState icon={SearchX} title="Search couldn't run right now" message="Please try again in a moment." />
      ) : (
        <div className="space-y-10">
          <section className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold tracking-tight text-foreground">Sermons</h2>
              <span className="text-sm text-muted">{sermons.length} results</span>
            </div>
            {sermons.length === 0 ? (
              <EmptyState icon={SearchX} title="No sermons found." />
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {sermons.map((sermon: any) => (
                  <Link key={sermon.id} href={`/sermons/${sermon.id}`} className={rowClass}>
                    <span className={chipClass}>
                      <PlayCircle className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-foreground group-hover:underline">{sermon.title}</span>
                      <span className="block truncate text-sm text-muted">{sermon.speaker}</span>
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold tracking-tight text-foreground">Events</h2>
              <span className="text-sm text-muted">{events.length} results</span>
            </div>
            {events.length === 0 ? (
              <EmptyState icon={SearchX} title="No events found." />
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {events.map((event: any) => (
                  <Link key={event.id} href={`/events/${event.id}`} className={rowClass}>
                    <span className={chipClass}>
                      <CalendarDays className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-foreground group-hover:underline">{event.name}</span>
                      <span className="block truncate text-sm text-muted">{event.location}</span>
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="container-max py-12">
          <SkeletonGrid count={4} className="md:grid-cols-2" />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
```

- [ ] **Step 5: Rewrite `NotificationBell`**

Changes:
- the rose counter becomes `bg-danger-solid`; it is `aria-hidden`, and the count moves into the button's `aria-label`
- the "Mark all read" link uses `text-link`
- unread items get screen-reader "Unread:" text, so state is not shown by weight alone
- the menu gains loading and error rows (`isLoading`/`isError` from the same `useNotifications` call)

The browser-notification effects and `openEntity` routing are copied verbatim.

Replace `frontend/src/components/layout/NotificationBell.tsx` with:

```tsx
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Bell, CheckCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from '@/hooks/useApi';
import { APP_NAME } from '@/lib/app-config';

type NotificationItem = {
  id: number;
  title: string;
  message: string;
  type: string;
  entity_type?: string | null;
  entity_id?: number | null;
  is_read: boolean;
  created_at: string;
};

export default function NotificationBell() {
  const router = useRouter();
  const { data, isLoading, isError } = useNotifications(1, 10);
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const notifications = (data?.notifications || []) as NotificationItem[];
  const unreadCount = data?.unread_count || 0;

  const previousUnreadRef = React.useRef<number>(0);

  React.useEffect(() => {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  React.useEffect(() => {
    if (previousUnreadRef.current < unreadCount && Notification.permission === 'granted') {
      const diff = unreadCount - previousUnreadRef.current;
      new Notification(`${APP_NAME} updates`, {
        body: `${diff} new notification${diff > 1 ? 's' : ''}`,
      });
    }
    previousUnreadRef.current = unreadCount;
  }, [unreadCount]);

  const openEntity = (notification: NotificationItem) => {
    if (notification.entity_type === 'event' && notification.entity_id) {
      router.push(`/events/${notification.entity_id}`);
      return;
    }
    if (notification.entity_type === 'prayer') {
      router.push('/dashboard');
      return;
    }
    if (notification.entity_type === 'live') {
      router.push('/live');
      return;
    }
    if (notification.entity_type === 'news' && notification.entity_id) {
      router.push(`/news/${notification.entity_id}`);
      return;
    }
    if (notification.entity_type === 'album' && notification.entity_id) {
      router.push(`/gallery/${notification.entity_id}`);
      return;
    }
    if (notification.entity_type === 'devotional' && notification.entity_id) {
      router.push(`/devotionals/${notification.entity_id}`);
      return;
    }
    if (notification.entity_type === 'group' && notification.entity_id) {
      router.push(`/groups/${notification.entity_id}`);
      return;
    }
    router.push('/dashboard');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative"
          aria-label={unreadCount > 0 ? `Open notifications, ${unreadCount} unread` : 'Open notifications'}
        >
          <Bell className="h-4 w-4" aria-hidden="true" />
          {unreadCount > 0 && (
            <span
              aria-hidden="true"
              className="absolute -right-1 -top-1 inline-flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-danger-solid px-1 text-[10px] font-bold text-danger-solid-foreground"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-w-[calc(100vw-2rem)]">
        <DropdownMenuLabel className="flex items-center justify-between gap-3">
          Notifications
          <button
            type="button"
            onClick={() => markAllRead.mutate()}
            className="inline-flex min-h-8 items-center gap-1 rounded text-xs font-semibold text-link hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
            Mark all read
          </button>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {isLoading ? (
          <DropdownMenuItem disabled className="text-muted">
            Loading notifications…
          </DropdownMenuItem>
        ) : isError ? (
          <DropdownMenuItem disabled className="text-muted">
            Notifications couldn&apos;t load right now
          </DropdownMenuItem>
        ) : notifications.length === 0 ? (
          <DropdownMenuItem disabled className="text-muted">
            No notifications yet
          </DropdownMenuItem>
        ) : null}

        {notifications.map((notification) => (
          <DropdownMenuItem
            key={notification.id}
            onClick={() => {
              if (!notification.is_read) {
                markRead.mutate(notification.id);
              }
              openEntity(notification);
            }}
            className="cursor-pointer items-start gap-2 py-2"
          >
            <div className="w-full min-w-0">
              <p className={`text-sm font-semibold ${notification.is_read ? 'text-muted' : 'text-foreground'}`}>
                {!notification.is_read && <span className="sr-only">Unread: </span>}
                {notification.title}
              </p>
              <p className="mt-1 line-clamp-2 text-xs text-muted">{notification.message}</p>
              <p className="mt-1 text-[11px] text-muted">
                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
              </p>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

`max-w-[calc(100vw-2rem)]` keeps the 320px menu inside a 375px screen.

- [ ] **Step 6: Run the standard checks**

```bash
FILES="frontend/src/app/dashboard/page.tsx frontend/src/app/dashboard/registrations/page.tsx frontend/src/app/profile/page.tsx frontend/src/app/search/page.tsx frontend/src/components/layout/NotificationBell.tsx"
```

Expected:
- `CHECKS-OK`
- scans 2 and 3 print nothing
- parity prints nothing: profile keeps `firstName`, `lastName` and `phone`, and NotificationBell keeps `useRouter`, `useNotifications`, both mark hooks, `useRef` and two `useEffect`s

- [ ] **Step 7: Check by eye (375px and 1280px, Light and Dark)**

- `/dashboard`:
  - at 375px the two header buttons wrap under the title
  - the metric cards stack and show skeletons briefly, then values
  - the quick-action tiles are 2 per row on a phone and 4 at 1280
  - each tile and each "Stay connected" row opens the right page
- `/dashboard/registrations`:
  - the breadcrumb "Dashboard › My registrations" works
  - a new member sees the empty state and "Find an event"
  - a registered member sees the rows
- `/profile`:
  - the breadcrumb works
  - the avatar initial is primary on a light tint, or the photo shows
  - Upload Photo shows a spinner
  - Save shows a spinner, then the green "Profile updated."
  - the labels are clickable and focus their fields
- `/search`:
  - an empty `/search` shows "Enter at least 2 characters"
  - `/search?q=gr` shows skeletons, then two sections with counts
  - a nonsense query shows both "No … found" states
  - at 375px the Search button sits below the field
- Bell (signed in, header):
  - the red counter shows the unread number
  - the screen reader name includes "N unread" (check the Accessibility pane)
  - the menu fits within 375px
  - "Mark all read" clears the counter
  - clicking an item still routes as before (event, live, album and so on)
- With the backend stopped:
  - the dashboard metrics show "—" and "Couldn't load right now"
  - registrations and profile show their error states
  - `/search?q=test` shows "Search couldn't run right now"
  - the bell menu says "Notifications couldn't load right now"

- [ ] **Step 8: Commit**

```bash
git add frontend/src/app/dashboard frontend/src/app/profile frontend/src/app/search frontend/src/components/layout/NotificationBell.tsx
git commit -m "feat(web): member dashboard, registrations, profile, search and notification bell on the design system

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Docs, whole-scope scan and final checks

**Files:**
- Append: `docs/qa-checklist.md`, `docs/features.md`
- Verify only: everything Tasks 1–8 touched

**Interfaces:**
- Consumes: all earlier tasks.
- Produces: the finished branch, ready for the coordinator to merge with 8c and 8d.

- [ ] **Step 1: Append the QA checklist and feature notes**

Both docs use CRLF line endings. Append with node, which converts the new text to CRLF, so the files stay consistent. Do not hand-edit earlier sections; this is append-only.

```bash
cat > /tmp/p8b-qa.md <<'EOF'

## Website restyle (8b)

Check each page at 375px and 1280px wide, in Light and in Dark (header theme toggle).

- [ ] No public or member page scrolls sideways at 375px; rows of buttons wrap
- [ ] No light boxes, gradients or unreadable text remain on any public or member page in Dark
- [ ] Watch (`/sermons`): "Live stream" button, latest-sermon panel, series row, search plus speaker filter, and "Clear search" all work
- [ ] With the backend running, every list shows skeletons while loading and a friendly message when empty: sermons, series, events, news, gallery, album, devotionals, groups, prayer wall, my requests, ministries, community, registrations, search and notifications
- [ ] With the backend stopped, each of those pages (plus the dashboard metrics and profile) says it "couldn't load right now" instead of showing a blank page, a "0" or an empty form
- [ ] Give: the GH₵ box never overlaps the "Other amount" placeholder or the digits; fund and quick-amount buttons show their selected state
- [ ] Contact, sign in, register, profile, prayer request and group message have a label above every field; submitting empty shows red messages under the fields
- [ ] Tab shows a visible focus ring on every link, button, field, photo and lightbox control
- [ ] About shows tiles for Ministries, Contact, FAQ, Privacy and Terms; FAQ, Privacy and Terms link back to About
- [ ] A draft album's public link still says "Album not found"
EOF
cat > /tmp/p8b-features.md <<'EOF'

## Website Design (8b)

- Every public and member page uses the Clean & classic design system (`docs/design-system.md`) and works in light and dark mode and at phone width.
- `/sermons` is the Watch hub: a link to the livestream, the latest sermon, sermon series and a searchable list of all sermons.
- Every list shows loading placeholders, a friendly message when empty, and a clear message if it could not load.
- Give shows the GH₵ currency in its own box beside the amount.
- About links to Ministries, Contact, FAQ, Privacy and Terms.
- Shared website pieces live in `frontend/src/components/site/` (BackLink, SearchField, MediaPlaceholder, SkeletonGrid, StatusMessage, DateBadge, LegalDocument). They are candidates to move into `components/ui` once the admin and app restyles have merged.
EOF
node -e "const fs=require('fs');for(const [src,dst] of [['/tmp/p8b-qa.md','docs/qa-checklist.md'],['/tmp/p8b-features.md','docs/features.md']]){const add=fs.readFileSync(src,'utf8').split('\n').join('\r\n');const cur=fs.readFileSync(dst,'utf8');fs.writeFileSync(dst,(cur.endsWith('\r\n')?cur:cur+'\r\n')+add);}"
git diff --stat -- docs/qa-checklist.md docs/features.md
git diff -- docs/qa-checklist.md docs/features.md | grep -E '^-[^-]' ; echo "removed-lines-check-done"
```

Expected:
- the stat shows only insertions
- nothing is printed before `removed-lines-check-done`

If `/tmp` is not writable in Git Bash, use the scratchpad folder instead.

- [ ] **Step 2: Whole-scope colour scan over every file this phase owns**

```bash
SCOPE=$(git ls-files frontend/src/app frontend/src/components/auth frontend/src/components/devotionals frontend/src/components/gallery frontend/src/components/site frontend/src/components/layout/NotificationBell.tsx \
  | grep -E '\.tsx$' \
  | grep -vE '^frontend/src/app/(admin/|page\.tsx$|layout\.tsx$|icon\.tsx$|apple-icon\.tsx$)')
echo "$SCOPE" | wc -l
grep -nE "(sky|cyan|amber|slate|gray|indigo|purple|rose|pink|teal|green|red|orange|emerald|blue)-[0-9]|#[0-9A-Fa-f]{3,6}\b" $SCOPE
grep -nE "dark:|(fuchsia|violet|yellow|lime|zinc|stone|neutral)-[0-9]|\[linear-gradient|rgb\(|text-ui-(muted|subtle)|rounded-\[[0-9.]+rem\]|font-black" $SCOPE
grep -nE "(bg|text|ring)-(white|black)" $SCOPE | grep -vE "^frontend/src/(app/sermons/\[id\]/page\.tsx|app/live/page\.tsx|app/gallery/\[id\]/page\.tsx|components/gallery/PhotoViewer\.tsx):"
```

Expected:
- `48` files: 33 app pages and layouts, 4 auth, 2 devotionals, 1 gallery, 7 site and 1 bell. The non-UI `route.ts` and `manifest.ts` files are excluded by the `.tsx` filter.
- each of the three greps prints nothing. The third proves that black/white only appear on the allowed photo and video surfaces.

Fix any hit in its file, using the class-mapping table, and re-run.

- [ ] **Step 3: Ownership and parity across the whole branch**

```bash
# Files changed outside 8b's ownership: must print nothing
git diff --name-only fc3fd49..HEAD | grep -vE '^(frontend/src/app/|frontend/src/components/(auth|devotionals|gallery|site)/|frontend/src/components/layout/NotificationBell\.tsx$|docs/qa-checklist\.md$|docs/features\.md$|docs/superpowers/plans/2026-10-09-phase-8b-public-website\.md$)'
# Files inside app/ that 8b must not touch: must print nothing
git diff --name-only fc3fd49..HEAD | grep -E '^frontend/src/app/(admin/|page\.tsx$|layout\.tsx$|icon\.tsx$|apple-icon\.tsx$|manifest\.ts$|api/|uploads/)'
```

Then define the `parity` function from **Global Constraints → Standard checks**, and run:

```bash
parity $(git diff --name-only fc3fd49..HEAD -- frontend/src)
```

Expected: only the seven `NEW FILE (skipped)` lines for `components/site/*`.

- [ ] **Step 4: All web checks**

```bash
cd frontend && npm run -s type-check && npm run -s lint && npm run -s build && npm run -s check:contrast && npm run -s check:tokens && echo WEB-ALL-OK
```

Expected:
- `WEB-ALL-OK`
- the build lists every route, including `/sermons`, `/events/[id]`, `/donate`, `/community`, `/verify-email` and `/dashboard/registrations`
- the contrast and token checks pass unchanged, because 8b does not touch tokens

- [ ] **Step 5: Backend suite (must stay at 445)**

```bash
cd backend && pnpm install --frozen-lockfile && npx jest --runInBand --coverage=false
```

Expected: `Tests:       445 passed, 445 total`.

Then:

```bash
cd .. && git status --short backend/
```

If `backend/pnpm-workspace.yaml` shows as modified, revert it with `git checkout -- backend/pnpm-workspace.yaml`, then run `git status --short backend/` again and expect nothing.

- [ ] **Step 6: Final by-eye pass**

With `npm run dev`, walk the whole scope once in each of four modes: 375 Light, 375 Dark, 1280 Light and 1280 Dark.

The route list:
- `/sermons`, `/sermons/<id>`, `/sermons/series/<id>` and `/live`
- `/events`, `/events/<id>` and `/donate`
- `/devotionals` and `/devotionals/<id>`
- `/news`, `/news/<id>`, `/gallery` and `/gallery/<id>`
- `/groups`, `/groups/<id>`, `/prayer/new` and `/prayer/wall`
- `/community`
- `/ministries`, `/ministries/<id>`, `/about`, `/contact`, `/faq`, `/privacy` and `/terms`
- `/login`, `/register` and `/verify-email`
- `/dashboard`, `/dashboard/registrations`, `/profile`, `/search?q=gr`, and the bell menu

On each page:
- run the overflow console snippet
- confirm the page header, cards and buttons match the hub Home (`/`)

Tick the new "Website restyle (8b)" block in `docs/qa-checklist.md` as you go, but do not commit the ticks. Report the results instead.

- [ ] **Step 7: Commit**

```bash
git add docs/qa-checklist.md docs/features.md
git commit -m "docs: website restyle QA checks and feature notes

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git log --oneline fc3fd49..HEAD
```

Expected: 10 commits (the plan, Tasks 1–8, these docs) on `feature/ui-public`. Do not push or merge; the coordinator merges 8b, 8c and 8d.

**Merge note for the coordinator:** 8c and 8d may also append to `docs/qa-checklist.md` and `docs/features.md`. If they do, resolve the conflicts by keeping every appended section.

