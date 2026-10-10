# Phase 8c: Admin Restyle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the web admin one layout, one table style and one form style on the 8a tokens:
- a grouped sidebar (spec §3.3) that collapses on desktop and becomes a drawer on phones
- a redesigned dashboard with key figures, quick actions and recent activity
- every page in `frontend/src/app/admin/**` moved to PageHeader + SimpleTable (or a card grid) + a two-column form layout, with loading, empty and error states, in light and dark

**Architecture:**
- **Layout:** `AdminLayout` renders a sticky desktop sidebar (`AdminSidebar`, collapsible, remembered in `localStorage`) and, below `lg`, a sticky admin bar whose Menu button opens the same sidebar as a modal drawer rendered into `<body>` with `createPortal`.
- **Navigation data:** one list, `ADMIN_NAV`, in `frontend/src/components/admin/admin-nav.ts`, drives the sidebar, the drawer and the admin bar's current-page label.
- **Admin-only shared pieces** live in a new folder, `frontend/src/components/admin/`: form layout (`FormSection`, `Field`, `FormActions`, `CheckboxField`, `formGridClass`), states (`TableSkeleton`, `CardListSkeleton`, `LoadError`), `StatCard`, `AdminSubNav` (link tabs) and `statusTone`. They compose the 8a `components/ui` primitives and never replace them.
- **Pages** keep their hooks, mutations, payloads, routes and validation attributes exactly; only markup and classes change, plus loading/empty/error branches built from data the page already has (`isLoading`, `isError`, `refetch`).

**Tech Stack:** Next.js 16 (App Router), React 18, Tailwind 3.4 on the 8a CSS-variable tokens, `@tanstack/react-query` (existing hooks in `hooks/useApi.ts`), `react-hook-form`, `lucide-react` 0.294, `react-dom` `createPortal`.

**Spec:** `docs/superpowers/specs/2026-10-08-ui-ux-redesign-design.md` (§1 intent and out of scope, §2 design system, §3.3 admin navigation, §4 stage 8c, §5 quality bar, §6 risks). Also read `docs/design-system.md`.

## Global Constraints

- **Branch:** `feature/ui-admin`, made from `fc3fd49` (tip of `feature/ui-foundation`). Do not push, merge or touch other branches or the main checkout.
- **No behaviour, data or route changes:** every hook call, mutation argument, request payload, `onSuccess` callback, route, `required`/`maxLength`/`min`/`max`/`type`/`accept` attribute and disabled condition stays as it is today. No new API calls; only hooks that already exist in `hooks/useApi.ts`. The backend is not touched; its suite stays at 445 passing tests.
- **File ownership:** edit only `frontend/src/app/admin/**`, `frontend/src/components/layout/AdminLayout.tsx`, `frontend/src/components/layout/AdminSidebar.tsx`, the NEW folder `frontend/src/components/admin/**`, and append-only additions to `docs/qa-checklist.md` and `docs/features.md`. Do NOT edit `frontend/src/components/ui/**`, other layout files, `lib/navigation.ts`, `tailwind.config.js`, `styles/**`, `hooks/useApi.ts`, `package.json`, `package-lock.json`, `mobile/` or `backend/`.
- **Colours come from tokens only.** No raw palette classes (`sky-`, `cyan-`, `amber-`, `slate-`, `gray-`, `indigo-`, `purple-`, `rose-`, `pink-`, `teal-`, `green-`, `red-`, `orange-`, `emerald-`, `blue-`, and also `violet-`) and no hex colours in any file this phase touches. Do not write HTML numeric entities such as `&#39;` (the hex scan flags `#39`); use `&apos;` or `{"'"}`.
- **Colour scan** (must print nothing, then `scan-exit=1`):
  ```bash
  grep -nE "(sky|cyan|amber|slate|gray|indigo|purple|rose|pink|teal|green|red|orange|emerald|blue|violet)-[0-9]|#[0-9A-Fa-f]{3,6}\b" <files> ; echo "scan-exit=$?"
  ```
- **Class mapping** (old → new). Every task applies this table to the files it owns:

  | Old | New |
  |---|---|
  | page wrapper `container-max space-y-6 py-12` (or `py-12` only) | `space-y-6` (the layout already supplies width and padding) |
  | `<h1 className="text-2xl font-extrabold …">` + `<p className="… text-ui-subtle">` | `<PageHeader title description breadcrumb actions />` |
  | `text-slate-900 dark:text-slate-50`, `text-slate-950 dark:text-white` | `text-foreground` |
  | `text-slate-700 dark:text-slate-300`, `text-ui-subtle` | `text-muted` |
  | `bg-white`, `bg-slate-50`, `dark:bg-slate-950`, `dark:bg-slate-900` | `bg-card` (panels) or `bg-surface` (inset boxes) |
  | `border-slate-200 dark:border-slate-800` (dividers) | `border-border` |
  | `divide-slate-200 dark:divide-slate-800` | `divide-border` |
  | raw `<select className="h-10 … border-slate-300 …">` | `<Select>` from `@/components/ui/select` (same props) |
  | `text-sky-700 dark:text-cyan-300` links | `text-link hover:underline` |
  | grey pill `bg-slate-100 … text-slate-700` | `<Badge tone="neutral">` |
  | sky/cyan pill (highlight) | `<Badge tone="gold">` |
  | emerald pill | `<Badge tone="success">` |
  | amber pill | `<Badge tone="warning">` |
  | rose/red pill or `text-red-600/700` text | `<Badge tone="danger">` / `text-danger` |
  | progress track `bg-slate-100/200 dark:bg-slate-800` | `bg-surface` (with `border border-border`) |
  | progress bar `bg-sky-600`, `bg-violet-600` | `bg-primary` |
  | "Loading…" text or card | `<TableSkeleton />` or `<CardListSkeleton />` |
  | dashed card "No … found" | `<EmptyState />`, or `SimpleTable` `emptyMessage` |
  | native checkbox with `className="h-4 w-4"` | `<CheckboxField />` |
  | `window.confirm(…)` | `<ConfirmDialog />` |
  | stacked `space-y-5` form | `<form className={formGridClass}>` + `<Field>` (two columns from `md`, one on phones) |

- **Breadcrumbs:** list pages use `[{ label: 'Admin', href: '/admin/dashboard' }, { label: '<Page>' }]`; sub-pages add the parent with its `href`, e.g. `[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Sermons', href: '/admin/sermons' }, { label: 'New sermon' }]`. Only the last crumb has no `href` (`PageHeader` marks crumbs without `href` as the current page).
- **States on every data page:** `isLoading` → skeleton; `isError` with no data → `<LoadError what="…" onRetry={() => refetch()} />`; empty → `EmptyState` (or `SimpleTable`'s `emptyMessage`), with a different message when a search or filter is active.
- **Tables:** `SimpleTable` renders the card fallback below `lg`, and every column (including `Actions`) appears in each card, so row actions stay reachable on phones. Action cells use `flex flex-wrap gap-2` so buttons wrap at 375px.
- **No fixed overlays inside blurred or transformed parents.** Do not put `backdrop-blur`, `transform`, `filter` or `translate-*` on any admin layout wrapper: `ConfirmDialog` is `position: fixed` and must cover the viewport. The phone drawer is portalled into `<body>`.
- **Accessibility:** visible focus ring on every control (the 8a components already have one; custom links in the sidebar add `focus-visible:ring-2 focus-visible:ring-ring`); touch targets of at least 44px (`h-11`); status is never colour alone (badges carry text); images keep their `alt`.
- **`cn` is plain `clsx`, not `tailwind-merge`:** passing a class that conflicts with a component's own class (e.g. `bg-border` to `Skeleton`, `h-10` to `Input`) does not reliably override it. Only pass non-conflicting classes (layout, width, margins).
- **Line endings:** working files are CRLF (`core.autocrlf=true`, index LF). Full-file rewrites with the Write tool are fine. For edit lists use the Edit tool; never `String.replace` with `$` in the replacement. No Python on this machine.
- **Commits:** every commit message ends with a blank line then `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Never commit `backend/pnpm-workspace.yaml`, `frontend/next-env.d.ts` or `frontend/package-lock.json` changes made by tooling.
- **Secrets:** none in any file.

## Rulings (spec questions decided in this plan)

1. **"Sermons & series" is one sidebar link** (`/admin/sermons`, also active on `/admin/series`). The two pages get a link-tab strip (`AdminSubNav`: Sermons · Series) under their PageHeader, so Series stays one click away.
2. **The three coloured "New Ministry / New Sermon / New Event" buttons leave the sidebar** (spec §3.3 lists only the five groups). They become dashboard quick actions, alongside Go live, Send announcement and Write devotional.
3. **"Members" in the sidebar is `/admin/users`** (route unchanged), and its PageHeader title becomes "Members". "Activity log" is `/admin/audit` (route unchanged), title "Activity log".
4. **Join requests are not a dashboard figure.** The API has no admin-wide pending-join count (`useGroupRequests` is per group, so a count would need one request per group). Spec: "where the data already exists". The dashboard shows Members, Giving this month, Upcoming events and Pending prayer requests.
5. **"Giving this month"** comes from the existing `useRevenueStats()` rows (completed donations grouped by month, ISO month start at UTC midnight): the row whose UTC year and month match today's, else `0`, shown with `formatCurrency`.
6. **Dashboard keeps its existing secondary panels** (giving by month, news publishing, engagement, top events, donation mix), restyled and placed below the new key figures, so no information is lost. The unused `useUserGrowthStats()` call (its result was never rendered) is dropped. Month labels format in UTC so a UTC-midnight month start never shows as the previous month.
7. **Two destructive actions gain a ConfirmDialog for consistency with the rest of admin:** deleting a news post (today one click) and ending the livestream (today `window.confirm`). Same mutation, same arguments; only the confirmation UI changes.
8. **Edit pages that load with `apiClient` in `useEffect`** (sermon, event, ministry edit and settings) show a skeleton until the record loads and `LoadError` if the request fails (today the failure is an unhandled promise rejection and the form silently stays empty). The request itself is unchanged. `react-hook-form` `reset()` runs before the inputs mount, so they mount with the loaded values (the settings page already works this way).
9. **The site header stays above admin.** It is `sticky top-0 h-16`, so the admin bar (phones) and the desktop sidebar stick at `top-16`.

## Review Focus

1. **A form loses a field, a value or its validation.** Every input keeps its `id`, `register(...)` / `value`+`onChange`, `required`, `maxLength`, `min`, `type` and `disabled` condition; the edit pages still show the loaded record (including the sermon's saved series). *(Each form task has a field-by-field checklist step.)*
2. **Table row actions missing or cramped on phones.** At 375px every list shows its row actions (Edit, Delete, Approve, Remove from wall, Mark completed/failed, Make admin/member, Check in/Undo) inside the card fallback, wrapping rather than overflowing. *(By-eye step in Tasks 4–9.)*
3. **Drawer focus and scroll lock.** Opening the phone drawer moves focus to Close, Tab and Shift+Tab stay inside, Escape and the backdrop close it, the page behind does not scroll, focus returns to Menu, following a link closes it, and widening the window to desktop closes it and unlocks scrolling. *(Task 2, Step 4.)*
4. **Dark-mode leftovers.** No raw palette class or hex survives in any admin file, and nothing in admin is unreadable in dark mode (chips, progress bars, drop zone, the album placeholder tile). *(Colour scan in every task; whole-scope scan in Task 10.)*
5. **A destructive action loses (or skips) its confirmation.** Delete sermon/series/devotional/event/ministry/album/photo/news post, deactivate group and end livestream all ask first, with Cancel focused, and Escape cancels. *(By-eye step in each owning task; Task 10 re-walks the list.)*

---

## File Map

| File | Change | Responsibility |
|---|---|---|
| `frontend/src/components/admin/admin-nav.ts` | Create | Grouped admin links, active-item matching |
| `frontend/src/components/admin/form-layout.tsx` | Create | `formGridClass`, `FormSection`, `Field`, `FormActions`, `CheckboxField` |
| `frontend/src/components/admin/states.tsx` | Create | `TableSkeleton`, `CardListSkeleton`, `LoadError` |
| `frontend/src/components/admin/stat-card.tsx` | Create | Key-figure card |
| `frontend/src/components/admin/sub-nav.tsx` | Create | `AdminSubNav` link tabs |
| `frontend/src/components/admin/status.ts` | Create | `statusTone(status)` → Badge tone |
| `frontend/src/components/layout/AdminLayout.tsx` | Rewrite | Sticky sidebar, collapse state, phone bar, portalled drawer |
| `frontend/src/components/layout/AdminSidebar.tsx` | Rewrite | Grouped, collapsible nav |
| `frontend/src/app/admin/dashboard/page.tsx` | Rewrite | Key figures, quick actions, recent activity, secondary panels |
| `frontend/src/app/admin/sermons/**`, `series/page.tsx` | Rewrite | Content: sermons and series |
| `frontend/src/app/admin/devotionals`, `news`, `announcements`, `live` | Rewrite / Edit | Content: publishing pages |
| `frontend/src/app/admin/gallery/page.tsx`, `gallery/[id]/page.tsx` | Rewrite / Edit | Content: albums |
| `frontend/src/app/admin/events/**`, `ministries/**` | Rewrite | Church life: events and ministries |
| `frontend/src/app/admin/attendance/**`, `groups`, `prayers` | Rewrite / Edit | Church life: attendance, groups, prayers |
| `frontend/src/app/admin/users`, `donations`, `audit`, `settings` | Rewrite | People & giving, activity log, settings |
| `docs/qa-checklist.md`, `docs/features.md` | Append | Admin redesign checks and description |

`frontend/src/app/admin/layout.tsx` and `frontend/src/app/admin/page.tsx` (the redirect) do not change.

---

### Task 1: Baseline and the admin-only shared pieces

**Files:**
- Create: `frontend/src/components/admin/admin-nav.ts`, `frontend/src/components/admin/form-layout.tsx`, `frontend/src/components/admin/states.tsx`, `frontend/src/components/admin/stat-card.tsx`, `frontend/src/components/admin/sub-nav.tsx`, `frontend/src/components/admin/status.ts`

**Interfaces:**
- Consumes (8a, read-only): `Card` (`@/components/ui/card`), `Label` (`@/components/ui/label`), `Button` (`@/components/ui/button`), `EmptyState` default export (`@/components/ui/empty-state`, props `icon?`, `title`, `message?`, `action?`), `Skeleton` and `SkeletonCard` (`@/components/ui/skeleton`), `BadgeTone` type (`@/components/ui/badge`), `cn` (`@/lib/utils`).
- Produces (later tasks import these exact names):
  - `admin-nav.ts`: `type AdminNavItem = { href: string; label: string; icon: LucideIcon; also?: string[] }`, `type AdminNavGroup = { title: string; items: AdminNavItem[] }`, `ADMIN_NAV: AdminNavGroup[]`, `isAdminNavActive(item: AdminNavItem, pathname: string): boolean`, `findAdminNavItem(pathname: string): AdminNavItem | undefined`, `SERMON_TABS: { href: string; label: string }[]`, `ADMIN_HOME_CRUMB: { label: 'Admin'; href: '/admin/dashboard' }`
  - `form-layout.tsx`: `formGridClass: string`, `FormSection({ title, description?, actions?, children, className? })`, `Field({ label, htmlFor, hint?, full?, children, className? })`, `FormActions({ children, className? })`, `CheckboxField` (forwardRef `<input type="checkbox">` with `label: ReactNode`, `full?: boolean` default `true`, and every other input prop)
  - `states.tsx`: `TableSkeleton({ rows?: number; label?: string })`, `CardListSkeleton({ count?: number; label?: string; className?: string })`, `LoadError({ what: string; onRetry?: () => void })`
  - `stat-card.tsx`: default `StatCard({ label: string; value: ReactNode; hint?: string; icon: LucideIcon; href?: string; loading?: boolean })`
  - `sub-nav.tsx`: default `AdminSubNav({ items: { href: string; label: string }[]; label: string })`
  - `status.ts`: `statusTone(status?: string | null): BadgeTone`, `statusLabel(status?: string | null, fallback?: string): string`

- [ ] **Step 1: Confirm the branch and install**

You are on branch `feature/ui-admin` at `fc3fd49` (the tip of `feature/ui-foundation`), plus one commit that adds this plan. Check:

```bash
git branch --show-current && git log --oneline -2
```

Expected: `feature/ui-admin`, the plan commit (`docs: phase 8c admin restyle plan`), then `fc3fd49 fix(web): visible card shadows, …`.

Install the web dependencies in the background (Bash tool with `run_in_background: true`; it takes a few minutes; carry on writing files meanwhile, and wait for it before Step 8):

```bash
cd frontend && npm ci --no-audit --no-fund
```

Expected when done: `added N packages`. `npm ci` does not change `package-lock.json`; if `git status` shows it changed anyway, run `git checkout -- frontend/package-lock.json`.

- [ ] **Step 2: The admin navigation list**

Create `frontend/src/components/admin/admin-nav.ts`:

```ts
import type { LucideIcon } from 'lucide-react';
import {
  Banknote,
  BellRing,
  BookOpenText,
  CalendarDays,
  Church,
  ClipboardCheck,
  HeartHandshake,
  History,
  ImageIcon,
  LayoutDashboard,
  Megaphone,
  Newspaper,
  Radio,
  Settings,
  Users,
  UsersRound,
} from 'lucide-react';

export type AdminNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Other route prefixes that also highlight this item. */
  also?: string[];
};

export type AdminNavGroup = { title: string; items: AdminNavItem[] };

// Spec §3.3: five groups. Routes are unchanged; only the grouping and labels are new.
export const ADMIN_NAV: AdminNavGroup[] = [
  {
    title: 'Overview',
    items: [
      { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/admin/audit', label: 'Activity log', icon: History },
    ],
  },
  {
    title: 'Content',
    items: [
      { href: '/admin/sermons', label: 'Sermons & series', icon: Megaphone, also: ['/admin/series'] },
      { href: '/admin/devotionals', label: 'Devotionals', icon: BookOpenText },
      { href: '/admin/news', label: 'News', icon: Newspaper },
      { href: '/admin/gallery', label: 'Gallery', icon: ImageIcon },
      { href: '/admin/announcements', label: 'Announcements', icon: BellRing },
      { href: '/admin/live', label: 'Livestream', icon: Radio },
    ],
  },
  {
    title: 'Church life',
    items: [
      { href: '/admin/events', label: 'Events', icon: CalendarDays },
      { href: '/admin/attendance', label: 'Attendance', icon: ClipboardCheck },
      { href: '/admin/ministries', label: 'Ministries', icon: Church },
      { href: '/admin/groups', label: 'Small groups', icon: UsersRound },
      { href: '/admin/prayers', label: 'Prayer requests', icon: HeartHandshake },
    ],
  },
  {
    title: 'People & giving',
    items: [
      { href: '/admin/users', label: 'Members', icon: Users },
      { href: '/admin/donations', label: 'Donations', icon: Banknote },
    ],
  },
  {
    title: 'Settings',
    items: [{ href: '/admin/settings', label: 'Settings', icon: Settings }],
  },
];

const matchesPrefix = (base: string, pathname: string) => pathname === base || pathname.startsWith(`${base}/`);

export const isAdminNavActive = (item: AdminNavItem, pathname: string) =>
  [item.href, ...(item.also ?? [])].some((base) => matchesPrefix(base, pathname));

export const findAdminNavItem = (pathname: string) =>
  ADMIN_NAV.flatMap((group) => group.items).find((item) => isAdminNavActive(item, pathname));

// Ruling 1: Sermons and Series share one sidebar item and switch with these tabs.
export const SERMON_TABS = [
  { href: '/admin/sermons', label: 'Sermons' },
  { href: '/admin/series', label: 'Series' },
];

export const ADMIN_HOME_CRUMB = { label: 'Admin', href: '/admin/dashboard' } as const;
```

- [ ] **Step 3: Form layout pieces**

Create `frontend/src/components/admin/form-layout.tsx`:

```tsx
'use client';

import * as React from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

/** Put this on the <form>: two columns from md up, one column on phones. */
export const formGridClass = 'grid gap-5 md:grid-cols-2';

export function FormSection({
  title,
  description,
  actions,
  children,
  className,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn('p-5 sm:p-6', className)}>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          {description && <p className="text-sm text-muted">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
      </div>
      {children}
    </Card>
  );
}

export function Field({
  label,
  htmlFor,
  hint,
  full = false,
  children,
  className,
}: {
  label: React.ReactNode;
  htmlFor: string;
  hint?: React.ReactNode;
  /** Span both columns on md and up. */
  full?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-2', full && 'md:col-span-2', className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function FormActions({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-wrap items-center gap-3 border-t border-border pt-5 md:col-span-2', className)}>
      {children}
    </div>
  );
}

type CheckboxFieldProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: React.ReactNode;
  /** Span both columns on md and up (default true). */
  full?: boolean;
};

// forwardRef so react-hook-form's register() can attach its ref.
export const CheckboxField = React.forwardRef<HTMLInputElement, CheckboxFieldProps>(
  ({ label, full = true, className, ...props }, ref) => (
    <label
      className={cn(
        'flex min-h-11 cursor-pointer items-center gap-3 text-sm text-foreground',
        full && 'md:col-span-2',
        className
      )}
    >
      <input
        ref={ref}
        type="checkbox"
        className="h-5 w-5 shrink-0 rounded border-input accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        {...props}
      />
      <span>{label}</span>
    </label>
  )
);
CheckboxField.displayName = 'CheckboxField';
```

- [ ] **Step 4: Loading and error states**

Create `frontend/src/components/admin/states.tsx`:

```tsx
import * as React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import EmptyState from '@/components/ui/empty-state';
import { Skeleton, SkeletonCard } from '@/components/ui/skeleton';

function Loading({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

export function TableSkeleton({ rows = 5, label = 'Loading' }: { rows?: number; label?: string }) {
  return (
    <Loading label={label}>
      <div className="overflow-hidden rounded-card border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <Skeleton className="h-3 w-1/4" />
        </div>
        {Array.from({ length: rows }, (_, index) => (
          <div key={index} className="flex items-center gap-4 border-b border-border px-4 py-4 last:border-b-0">
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="hidden h-4 w-1/5 sm:block" />
            <Skeleton className="ml-auto h-9 w-20" />
          </div>
        ))}
      </div>
    </Loading>
  );
}

export function CardListSkeleton({
  count = 3,
  label = 'Loading',
  className = 'grid gap-3',
}: {
  count?: number;
  label?: string;
  className?: string;
}) {
  return (
    <Loading label={label}>
      <div className={className}>
        {Array.from({ length: count }, (_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>
    </Loading>
  );
}

export function LoadError({ what, onRetry }: { what: string; onRetry?: () => void }) {
  return (
    <div role="alert">
      <EmptyState
        icon={AlertTriangle}
        title={`Couldn't load ${what}`}
        message="Check your connection and try again."
        action={
          onRetry ? (
            <Button variant="secondary" onClick={onRetry}>
              Try again
            </Button>
          ) : undefined
        }
      />
    </div>
  );
}
```

- [ ] **Step 5: Key-figure card**

Create `frontend/src/components/admin/stat-card.tsx`:

```tsx
import * as React from 'react';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export default function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  href,
  loading = false,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon: LucideIcon;
  href?: string;
  loading?: boolean;
}) {
  const body = (
    <Card className={cn('flex h-full items-start gap-4 p-5', href && 'transition-colors group-hover:border-primary')}>
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="min-w-0 space-y-1">
        <p className="text-sm font-medium text-muted">{label}</p>
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <p className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{value}</p>
        )}
        {hint && <p className="text-xs text-muted">{hint}</p>}
      </div>
    </Card>
  );

  if (!href) return body;
  return (
    <Link
      href={href}
      className="group block rounded-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      {body}
    </Link>
  );
}
```

- [ ] **Step 6: Link tabs and status helpers**

Create `frontend/src/components/admin/sub-nav.tsx`:

```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

// Underline tabs like the 8a Tabs component, but each tab is a page link.
export default function AdminSubNav({ items, label }: { items: { href: string; label: string }[]; label: string }) {
  const pathname = usePathname() ?? '';
  return (
    <nav aria-label={label} className="flex gap-1 overflow-x-auto border-b border-border">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              '-mb-px inline-flex h-11 items-center whitespace-nowrap border-b-2 px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              active ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-foreground'
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
```

Create `frontend/src/components/admin/status.ts`:

```ts
import type { BadgeTone } from '@/components/ui/badge';

// Status words used across admin (donations, prayers, news, devotionals, albums, events, users).
const TONES: Record<string, BadgeTone> = {
  active: 'success',
  answered: 'success',
  approved: 'success',
  completed: 'success',
  published: 'success',
  pending: 'warning',
  review: 'warning',
  scheduled: 'warning',
  archived: 'neutral',
  draft: 'neutral',
  cancelled: 'danger',
  failed: 'danger',
  inactive: 'danger',
};

export const statusTone = (status?: string | null): BadgeTone => TONES[String(status ?? '').toLowerCase()] ?? 'neutral';

/** "in_review" → "In review"; empty → fallback. */
export const statusLabel = (status?: string | null, fallback = 'Unknown') => {
  const text = String(status ?? '').replace(/_/g, ' ').trim();
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : fallback;
};
```

- [ ] **Step 7: Colour scan**

```bash
grep -nE "(sky|cyan|amber|slate|gray|indigo|purple|rose|pink|teal|green|red|orange|emerald|blue|violet)-[0-9]|#[0-9A-Fa-f]{3,6}\b" frontend/src/components/admin/* ; echo "scan-exit=$?"
```

Expected: no lines, then `scan-exit=1`.

- [ ] **Step 8: Type-check, lint and build**

Wait for the Step 1 install to finish, then:

```bash
cd frontend && npm run -s type-check && npm run -s lint && npm run -s build
```

Expected: all three pass (the new files are not imported yet; this proves they compile). If `next build` rewrites `frontend/next-env.d.ts`, run `git checkout -- frontend/next-env.d.ts` before committing.

There is nothing to check by eye in this task: the pieces render from Task 2 on.

- [ ] **Step 9: Commit**

```bash
git add frontend/src/components/admin
git commit -m "feat(admin): shared admin nav list, form layout, states, stat card, link tabs and status helpers

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Admin layout, grouped collapsible sidebar and phone drawer

**Files:**
- Rewrite: `frontend/src/components/layout/AdminSidebar.tsx`, `frontend/src/components/layout/AdminLayout.tsx`

**Interfaces:**
- Consumes: `ADMIN_NAV`, `isAdminNavActive`, `findAdminNavItem` (Task 1, `@/components/admin/admin-nav`); `Button` (8a, forwards `ref`).
- Produces:
  - `AdminSidebar` default export, props `{ className?: string; collapsed?: boolean; onToggleCollapse?: () => void; onNavigate?: () => void }`. Without `onToggleCollapse` it renders no collapse button (the drawer uses it that way).
  - `AdminLayout` default export, props `{ children: React.ReactNode }` (unchanged; `app/admin/layout.tsx` keeps wrapping pages in it).
  - `localStorage` key `admin-sidebar-collapsed` (`'1'` collapsed, `'0'` expanded).
  - Pages render inside a `max-w-6xl` column with the layout's padding, so pages must not add `container-max` or `py-12`.

- [ ] **Step 1: The sidebar**

Replace the whole of `frontend/src/components/layout/AdminSidebar.tsx` with:

```tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { ADMIN_NAV, isAdminNavActive } from '@/components/admin/admin-nav';
import { cn } from '@/lib/utils';

type AdminSidebarProps = {
  className?: string;
  /** Desktop only: icons only, labels kept for screen readers and tooltips. */
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  /** Called when a link is followed (the phone drawer closes itself with it). */
  onNavigate?: () => void;
};

const itemClass =
  'flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

export default function AdminSidebar({ className, collapsed = false, onToggleCollapse, onNavigate }: AdminSidebarProps) {
  const pathname = usePathname() ?? '';

  return (
    <aside aria-label="Admin" className={cn('flex flex-col bg-surface', className)}>
      <nav aria-label="Admin sections" className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
        {ADMIN_NAV.map((group, index) => (
          <div key={group.title} role="group" aria-label={group.title} className={cn(index > 0 && 'mt-5')}>
            {collapsed ? (
              index > 0 && <div className="mx-2 mb-3 border-t border-border" aria-hidden="true" />
            ) : (
              <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted" aria-hidden="true">
                {group.title}
              </p>
            )}
            <ul className="space-y-1">
              {group.items.map((item) => {
                const active = isAdminNavActive(item, pathname);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? 'page' : undefined}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        itemClass,
                        collapsed && 'justify-center px-0',
                        active ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-background'
                      )}
                    >
                      <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                      <span className={cn('truncate', collapsed && 'sr-only')}>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="space-y-1 border-t border-border px-3 py-3">
        <Link
          href="/"
          onClick={onNavigate}
          title={collapsed ? 'Back to site' : undefined}
          className={cn(itemClass, 'text-link hover:bg-background', collapsed && 'justify-center px-0')}
        >
          <ArrowLeft className="h-5 w-5 shrink-0" aria-hidden="true" />
          <span className={cn(collapsed && 'sr-only')}>Back to site</span>
        </Link>
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-expanded={!collapsed}
            title={collapsed ? 'Expand sidebar' : undefined}
            className={cn(itemClass, 'w-full text-muted hover:bg-background hover:text-foreground', collapsed && 'justify-center px-0')}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-5 w-5 shrink-0" aria-hidden="true" />
            ) : (
              <PanelLeftClose className="h-5 w-5 shrink-0" aria-hidden="true" />
            )}
            <span className={cn(collapsed && 'sr-only')}>{collapsed ? 'Expand sidebar' : 'Collapse sidebar'}</span>
          </button>
        )}
      </div>
    </aside>
  );
}
```

Notes for the implementer:
- The group heading is `aria-hidden` because the wrapping `role="group"` already carries the group name; collapsed mode keeps that name for screen readers.
- Active item: `bg-primary text-primary-foreground` (navy on white in light, light blue with navy text in dark) plus `aria-current="page"`, so it is not colour alone.

- [ ] **Step 2: The layout, with the phone drawer in a portal**

Replace the whole of `frontend/src/components/layout/AdminLayout.tsx` with:

```tsx
'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import AdminSidebar from './AdminSidebar';
import { Button } from '@/components/ui/button';
import { findAdminNavItem } from '@/components/admin/admin-nav';
import { cn } from '@/lib/utils';

const COLLAPSE_KEY = 'admin-sidebar-collapsed';
const DESKTOP_QUERY = '(min-width: 1024px)';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '';
  const current = findAdminNavItem(pathname);
  const [collapsed, setCollapsed] = React.useState(false);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const menuButtonRef = React.useRef<HTMLButtonElement>(null);
  const closeButtonRef = React.useRef<HTMLButtonElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);

  // Read the saved collapse choice after mount, so server and first client render match.
  React.useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(COLLAPSE_KEY) === '1');
    } catch {
      // Storage blocked (private mode): stay expanded.
    }
  }, []);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    try {
      window.localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0');
    } catch {
      // Not remembered; still works for this visit.
    }
  };

  // Any navigation closes the drawer.
  React.useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // The drawer is a modal dialog: focus moves in, Tab stays inside, Escape closes it, the page
  // behind doesn't scroll, focus returns to Menu on close, and widening to desktop closes it.
  React.useEffect(() => {
    if (!drawerOpen) return undefined;
    const trigger = menuButtonRef.current;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setDrawerOpen(false);
        return;
      }
      if (event.key !== 'Tab' || !panelRef.current) return;
      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || !panelRef.current.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !panelRef.current.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    };
    const desktop = window.matchMedia(DESKTOP_QUERY);
    const onDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) setDrawerOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    desktop.addEventListener('change', onDesktop);
    closeButtonRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey);
      desktop.removeEventListener('change', onDesktop);
      trigger?.focus();
    };
  }, [drawerOpen]);

  return (
    <div className="bg-background text-foreground">
      {/* Phones and tablets: a bar under the site header (h-16) that opens the admin drawer. */}
      <div className="sticky top-16 z-30 flex items-center justify-between gap-3 border-b border-border bg-background px-4 py-2 lg:hidden">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold-ink">Admin</p>
          <p className="truncate text-sm font-semibold text-foreground">{current?.label ?? 'Admin'}</p>
        </div>
        <Button
          ref={menuButtonRef}
          variant="secondary"
          onClick={() => setDrawerOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={drawerOpen}
          aria-controls="admin-drawer"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
          Menu
        </Button>
      </div>

      <div className="flex">
        <AdminSidebar
          collapsed={collapsed}
          onToggleCollapse={toggleCollapsed}
          className={cn(
            'sticky top-16 hidden h-[calc(100vh-4rem)] shrink-0 border-r border-border lg:flex',
            collapsed ? 'w-[4.5rem]' : 'w-64'
          )}
        />
        <div className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </div>
      </div>

      {/* Rendered into <body> so no ancestor (the site header's blur, sticky bars) can clip it. */}
      {drawerOpen &&
        createPortal(
          <div className="fixed inset-0 z-[60] lg:hidden">
            <button
              type="button"
              tabIndex={-1}
              aria-label="Close admin menu"
              className="absolute inset-0 bg-foreground/40 animate-fade-in"
              onClick={() => setDrawerOpen(false)}
            />
            <div
              ref={panelRef}
              id="admin-drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Admin menu"
              className="absolute inset-y-0 left-0 flex w-[min(18rem,85vw)] flex-col border-r border-border bg-surface shadow-xl animate-fade-in"
            >
              <div className="flex items-center justify-between border-b border-border px-4 py-2">
                <p className="text-sm font-semibold text-foreground">Admin menu</p>
                <Button
                  ref={closeButtonRef}
                  variant="ghost"
                  size="icon"
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Close admin menu"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </Button>
              </div>
              <AdminSidebar onNavigate={() => setDrawerOpen(false)} className="min-h-0 flex-1" />
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
```

Notes for the implementer:
- The old layout had its own `<main>`; the root layout already renders `<main id="main-content">`, so this layout uses plain `<div>`s (no nested `main`).
- No wrapper here has `backdrop-blur`, `transform` or `filter`, so `ConfirmDialog` (fixed, `z-50`) still covers the viewport from inside a page.
- `createPortal` runs only after a click (`drawerOpen` starts `false`), so `document` always exists.

- [ ] **Step 3: Colour scan, type-check, lint and build**

```bash
grep -nE "(sky|cyan|amber|slate|gray|indigo|purple|rose|pink|teal|green|red|orange|emerald|blue|violet)-[0-9]|#[0-9A-Fa-f]{3,6}\b" frontend/src/components/layout/AdminLayout.tsx frontend/src/components/layout/AdminSidebar.tsx ; echo "scan-exit=$?"
cd frontend && npm run -s type-check && npm run -s lint && npm run -s build
```

Expected: no scan lines and `scan-exit=1`; all three checks pass.

- [ ] **Step 4: Check by eye (375px and 1280px, light and dark)**

Run `cd frontend && npm run dev`, sign in as an admin, open `/admin/dashboard`. Use the theme toggle in the site header to switch light/dark. Check:

- [ ] 1280px: the sidebar shows five groups in this order, with these items: **Overview** (Dashboard, Activity log), **Content** (Sermons & series, Devotionals, News, Gallery, Announcements, Livestream), **Church life** (Events, Attendance, Ministries, Small groups, Prayer requests), **People & giving** (Members, Donations), **Settings** (Settings). No "New Ministry/Sermon/Event" buttons.
- [ ] The current page's item is filled navy (light) / light blue (dark). `/admin/series` highlights "Sermons & series"; `/admin/events/new` highlights "Events".
- [ ] The sidebar stays in place under the site header while the page scrolls; a long nav scrolls inside the sidebar.
- [ ] "Collapse sidebar" shrinks it to icons; hovering an icon shows its name; reload keeps it collapsed; "Expand sidebar" restores it. Tab through it: every item has a visible focus ring.
- [ ] 375px: no sidebar; a sticky bar under the site header shows "ADMIN" and the current page name, plus a Menu button. No horizontal page scroll.
- [ ] Menu opens the drawer from the left over a dimmed page, focus lands on Close; Tab and Shift+Tab cycle inside the drawer only; Escape closes it and focus returns to Menu; tapping the dim area closes it; the page behind does not scroll while it is open.
- [ ] Choosing a drawer link navigates and closes the drawer; choosing the current page's link also closes it.
- [ ] With the drawer open, widen the window past 1024px: the drawer closes and the page scrolls again.
- [ ] Dark mode: sidebar, bar and drawer have no white or grey slabs; all text is readable.
- [ ] Open any page with a delete button (e.g. `/admin/sermons`), press Delete: the confirm dialog covers the whole screen at both widths.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/layout/AdminLayout.tsx frontend/src/components/layout/AdminSidebar.tsx
git commit -m "feat(admin): grouped sidebar that collapses on desktop and opens as a focus-trapped drawer on phones

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Dashboard redesign

**Files:**
- Rewrite: `frontend/src/app/admin/dashboard/page.tsx`

**Interfaces:**
- Consumes: `StatCard` (Task 1, `@/components/admin/stat-card`), `LoadError` (Task 1, `@/components/admin/states`), `ADMIN_HOME_CRUMB` (Task 1, `@/components/admin/admin-nav`); 8a `PageHeader`, `Card`, `Badge`, `Button`, `Skeleton`; existing hooks `useDashboardOverview`, `useRevenueStats`, `useDashboardContentStats`, `useDashboardEngagementStats`, `useRecentActivities`; `formatCurrency` from `@/lib/utils`.
- Data shapes already returned by the backend (`backend/src/controllers/dashboardController.js`, read-only):
  - overview: `users { total, members, admins }`, `content { sermons }`, `events { total, upcoming, registrations }`, `prayers { pending_count, … }`
  - revenue: rows `{ month: ISO string at UTC month start, total: number | string }` for the last 12 months
  - activities: up to 20 rows `{ type, description, created_at }`
- Produces: nothing used by other tasks.

- [ ] **Step 1: Rewrite the dashboard**

Replace the whole of `frontend/src/app/admin/dashboard/page.tsx` with:

```tsx
'use client';

import React from 'react';
import Link from 'next/link';
import {
  BellRing,
  BookOpenText,
  CalendarDays,
  Church,
  HeartHandshake,
  Megaphone,
  Radio,
  Users,
  Wallet,
} from 'lucide-react';
import PageHeader from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import StatCard from '@/components/admin/stat-card';
import { LoadError } from '@/components/admin/states';
import { ADMIN_HOME_CRUMB } from '@/components/admin/admin-nav';
import { formatCurrency } from '@/lib/utils';
import {
  useDashboardContentStats,
  useDashboardEngagementStats,
  useDashboardOverview,
  useRecentActivities,
  useRevenueStats,
} from '@/hooks/useApi';

type MonthlyRevenueStat = { month?: string; total?: number | string };
type ActivityItem = { type: string; description: string; created_at: string };

const toNumber = (value: number | string | undefined) => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Number(value);
  return 0;
};

// Month starts arrive as UTC midnight; format in UTC so they never show as the previous month.
const formatMonth = (value?: string) =>
  value ? new Date(value).toLocaleDateString(undefined, { month: 'short', year: '2-digit', timeZone: 'UTC' }) : 'N/A';

const isThisMonth = (value?: string) => {
  if (!value) return false;
  const month = new Date(value);
  const now = new Date();
  return month.getUTCFullYear() === now.getFullYear() && month.getUTCMonth() === now.getMonth();
};

const QUICK_ACTIONS = [
  { href: '/admin/sermons/new', label: 'New sermon', icon: Megaphone },
  { href: '/admin/events/new', label: 'New event', icon: CalendarDays },
  { href: '/admin/ministries/new', label: 'New ministry', icon: Church },
  { href: '/admin/devotionals', label: 'Write devotional', icon: BookOpenText },
  { href: '/admin/announcements', label: 'Send announcement', icon: BellRing },
  { href: '/admin/live', label: 'Go live', icon: Radio },
];

export default function AdminDashboardPage() {
  const overviewQuery = useDashboardOverview();
  const revenueQuery = useRevenueStats();
  const { data: contentStats, isLoading: contentLoading } = useDashboardContentStats();
  const { data: engagementStats, isLoading: engagementLoading } = useDashboardEngagementStats();
  const activitiesQuery = useRecentActivities();

  const overview = overviewQuery.data;
  const revenueStats = (revenueQuery.data ?? []) as MonthlyRevenueStat[];
  const givingThisMonth = toNumber(revenueStats.find((row) => isThisMonth(row.month))?.total);
  const revenueThisYear = revenueStats.reduce((sum, item) => sum + toNumber(item.total), 0);
  const maxRevenue = Math.max(...revenueStats.map((item) => toNumber(item.total)), 1);
  const newsStats = contentStats?.news || {};
  const topEvents = contentStats?.top_events_by_registrations || [];
  const donationMix = engagementStats?.donations_by_type_last_30_days || [];
  const recentItems = (activitiesQuery.data ?? []) as ActivityItem[];
  const figuresLoading = overviewQuery.isLoading;

  return (
    <div className="space-y-8">
      <PageHeader
        breadcrumb={[ADMIN_HOME_CRUMB, { label: 'Dashboard' }]}
        title="Dashboard"
        description="Members, giving, events and prayer at a glance."
      />

      {overviewQuery.isError && !overview ? (
        <LoadError
          what="the key figures"
          onRetry={() => {
            overviewQuery.refetch();
            revenueQuery.refetch();
          }}
        />
      ) : (
        <section aria-label="Key figures" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Members"
            icon={Users}
            href="/admin/users"
            loading={figuresLoading}
            value={overview?.users?.members ?? 0}
            hint={`${overview?.users?.total ?? 0} accounts · ${overview?.users?.admins ?? 0} admins`}
          />
          <StatCard
            label="Giving this month"
            icon={Wallet}
            href="/admin/donations"
            loading={revenueQuery.isLoading}
            value={formatCurrency(givingThisMonth)}
            hint={`${formatCurrency(revenueThisYear)} in the last 12 months`}
          />
          <StatCard
            label="Upcoming events"
            icon={CalendarDays}
            href="/admin/events"
            loading={figuresLoading}
            value={overview?.events?.upcoming ?? 0}
            hint={`${overview?.events?.total ?? 0} events in total`}
          />
          <StatCard
            label="Pending prayer requests"
            icon={HeartHandshake}
            href="/admin/prayers"
            loading={figuresLoading}
            value={overview?.prayers?.pending_count ?? 0}
            hint="Waiting for approval"
          />
        </section>
      )}

      <section className="grid gap-6 lg:grid-cols-3">
        <Panel title="Quick actions">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
            {QUICK_ACTIONS.map((action) => (
              <Button key={action.href} asChild variant="secondary" className="justify-start">
                <Link href={action.href}>
                  <action.icon className="h-4 w-4" aria-hidden="true" />
                  {action.label}
                </Link>
              </Button>
            ))}
          </div>
        </Panel>

        <Panel
          title="Recent activity"
          className="lg:col-span-2"
          action={
            <Link href="/admin/audit" className="text-sm font-semibold text-link hover:underline">
              View activity log
            </Link>
          }
        >
          {activitiesQuery.isLoading ? (
            <PanelSkeleton />
          ) : activitiesQuery.isError && recentItems.length === 0 ? (
            <LoadError what="recent activity" onRetry={() => activitiesQuery.refetch()} />
          ) : recentItems.length === 0 ? (
            <PanelEmpty>No activity recorded yet.</PanelEmpty>
          ) : (
            <ul className="max-h-[28rem] divide-y divide-border overflow-y-auto">
              {recentItems.map((item, index) => (
                <li key={`${item.type}-${item.created_at}-${index}`} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                  <div className="min-w-0 space-y-1">
                    <p className="text-sm font-medium text-foreground">{item.description}</p>
                    <Badge tone="neutral">{item.type}</Badge>
                  </div>
                  <time dateTime={item.created_at} className="shrink-0 text-xs text-muted">
                    {new Date(item.created_at).toLocaleString()}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Panel title="Giving by month">
          {revenueQuery.isLoading ? (
            <PanelSkeleton />
          ) : revenueStats.length === 0 ? (
            <PanelEmpty>No giving recorded in the last 12 months.</PanelEmpty>
          ) : (
            <ul className="space-y-3">
              {revenueStats.map((item) => {
                const total = toNumber(item.total);
                const width = `${Math.max((total / maxRevenue) * 100, 6)}%`;
                return (
                  <li key={`${item.month}-${total}`} className="space-y-1">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-muted">{formatMonth(item.month)}</span>
                      <span className="font-semibold text-foreground">{formatCurrency(total)}</span>
                    </div>
                    <div className="h-2 rounded-full border border-border bg-surface" aria-hidden="true">
                      <div className="h-full rounded-full bg-primary" style={{ width }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel title="Donation mix (30 days)">
          {engagementLoading ? (
            <PanelSkeleton />
          ) : donationMix.length === 0 ? (
            <PanelEmpty>No completed donations in the last 30 days.</PanelEmpty>
          ) : (
            <ul className="divide-y divide-border">
              {donationMix.map((item: any) => (
                <li key={item.donation_type} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold capitalize text-foreground">
                      {String(item.donation_type).replace(/_/g, ' ')}
                    </p>
                    <p className="text-xs text-muted">
                      {item.count} completed donation{item.count === 1 ? '' : 's'}
                    </p>
                  </div>
                  <p className="shrink-0 text-base font-bold text-foreground">{formatCurrency(toNumber(item.total_amount))}</p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Panel title="Publishing">
          {contentLoading || figuresLoading ? (
            <PanelSkeleton />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <StatBox label="Sermons" value={overview?.content?.sermons ?? 0} />
              <StatBox label="News drafts" value={newsStats.draft || 0} />
              <StatBox label="In review" value={newsStats.review || 0} />
              <StatBox label="Scheduled" value={newsStats.scheduled || 0} />
              <StatBox label="Published" value={newsStats.published || 0} />
              <StatBox label="Archived" value={newsStats.archived || 0} />
              <StatBox label="Featured" value={newsStats.featured || 0} />
            </div>
          )}
        </Panel>

        <Panel title="Engagement">
          {engagementLoading ? (
            <PanelSkeleton />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <StatBox label="Unread notifications" value={engagementStats?.notifications?.unread || 0} />
              <StatBox label="Total notifications" value={engagementStats?.notifications?.total || 0} />
              <StatBox label="Unread messages" value={engagementStats?.contacts?.unread || 0} />
              <StatBox label="Registrations (30d)" value={engagementStats?.registrations_last_30_days || 0} />
              <StatBox label="Completed gifts (30d)" value={engagementStats?.completed_donations_last_30_days || 0} />
              <StatBox label="Admin actions (30d)" value={engagementStats?.admin_actions_last_30_days || 0} />
            </div>
          )}
        </Panel>
      </section>

      <Panel title="Top events by registration">
        {contentLoading ? (
          <PanelSkeleton />
        ) : topEvents.length === 0 ? (
          <PanelEmpty>No event registrations yet.</PanelEmpty>
        ) : (
          <ul className="divide-y divide-border">
            {topEvents.map((item: any) => (
              <li key={`${item.id}-${item.registrations}`} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-foreground">{item.name}</p>
                  <p className="text-sm text-muted">{formatMonth(item.event_date)}</p>
                </div>
                <span className="shrink-0 text-lg font-bold text-foreground">
                  {item.registrations}
                  <span className="sr-only"> registrations</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

function Panel({
  title,
  action,
  className,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className={`p-5 sm:p-6 ${className ?? ''}`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        {action}
      </div>
      {children}
    </Card>
  );
}

function StatBox({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">{value}</p>
    </div>
  );
}

function PanelEmpty({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed border-input bg-surface/50 px-4 py-6 text-center text-sm text-muted">
      {children}
    </p>
  );
}

function PanelSkeleton() {
  return (
    <div className="space-y-3" role="status" aria-live="polite">
      <span className="sr-only">Loading</span>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}
```

What changed versus today (all from data the page already loaded):
- The four gradient cards (users, events, sermons, 12-month revenue) become Members, Giving this month, Upcoming events and Pending prayer requests (Rulings 4–5). Total accounts, total events and 12-month giving move into the cards' hints; the sermon count moves into Publishing.
- The dark hero banner is replaced by `PageHeader`.
- The unused `useUserGrowthStats()` call is removed (Ruling 6).

- [ ] **Step 2: Colour scan, type-check, lint and build**

```bash
grep -nE "(sky|cyan|amber|slate|gray|indigo|purple|rose|pink|teal|green|red|orange|emerald|blue|violet)-[0-9]|#[0-9A-Fa-f]{3,6}\b" frontend/src/app/admin/dashboard/page.tsx ; echo "scan-exit=$?"
cd frontend && npm run -s type-check && npm run -s lint && npm run -s build
```

Expected: no scan lines and `scan-exit=1`; all three checks pass.

- [ ] **Step 3: Check by eye (375px and 1280px, light and dark)**

- [ ] 1280px: four key-figure cards in one row; Members matches the member count on `/admin/users`; "Giving this month" shows `GH₵` and matches this month's completed donations; Pending prayer requests matches the pending rows on `/admin/prayers`.
- [ ] Each card is a link (Members → `/admin/users`, Giving → `/admin/donations`, Upcoming events → `/admin/events`, Prayer → `/admin/prayers`) with a visible focus ring.
- [ ] Quick actions open New sermon, New event, New ministry, Devotionals, Announcements and Livestream.
- [ ] Recent activity lists entries with their type badge and time; "View activity log" opens `/admin/audit`.
- [ ] Throttle the network (DevTools, Slow 3G) and reload: skeletons show, not zeros. Stop the backend and reload: "Couldn't load the key figures" with Try again; restarting the backend and pressing it loads the figures.
- [ ] 375px: cards stack in one column; no horizontal scroll; amounts don't overflow.
- [ ] Dark mode: no white panels, bars are light blue on a navy track, all text readable.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/app/admin/dashboard/page.tsx
git commit -m "feat(admin): dashboard with key figures, quick actions and recent activity on tokens

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Content — sermons (list, new, edit) and series

**Files:**
- Rewrite: `frontend/src/app/admin/sermons/page.tsx`, `frontend/src/app/admin/sermons/new/page.tsx`, `frontend/src/app/admin/sermons/[id]/edit/page.tsx`, `frontend/src/app/admin/series/page.tsx`

**Interfaces:**
- Consumes: Task 1 `ADMIN_HOME_CRUMB`, `SERMON_TABS`, `AdminSubNav`, `TableSkeleton`, `CardListSkeleton`, `LoadError`, `formGridClass`, `FormSection`, `Field`, `FormActions`; 8a `PageHeader`, `SimpleTable`, `ConfirmDialog`, `Button`, `Input`, `Textarea`, `Select`, `Skeleton`; existing hooks `useAdminSermons`, `useDeleteSermon`, `useRefreshSermonData`, `useSermonSeriesList`, `useSaveSermonSeries`, `useDeleteSermonSeries`, `useUploadSeriesCover` and types `SeriesInput`, `SermonSeriesSummary`.
- Produces: nothing used by other tasks.

- [ ] **Step 1: Sermons list**

Replace the whole of `frontend/src/app/admin/sermons/page.tsx` with:

```tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import ConfirmDialog from '@/components/ui/confirm-dialog';
import PageHeader from '@/components/ui/page-header';
import SimpleTable from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AdminSubNav from '@/components/admin/sub-nav';
import { LoadError, TableSkeleton } from '@/components/admin/states';
import { ADMIN_HOME_CRUMB, SERMON_TABS } from '@/components/admin/admin-nav';
import { useAdminSermons, useDeleteSermon } from '@/hooks/useApi';

type AdminSermon = {
  id: number;
  title: string;
  speaker?: string;
  sermon_date?: string;
  ministry_name?: string | null;
};

export default function AdminSermonsPage() {
  const { data, isLoading, isError, refetch } = useAdminSermons();
  const del = useDeleteSermon();
  const [query, setQuery] = React.useState('');
  const [selectedSermon, setSelectedSermon] = React.useState<AdminSermon | null>(null);
  const sermons = (data ?? []) as AdminSermon[];

  const filteredSermons = sermons.filter((sermon) => {
    const q = query.trim().toLowerCase();
    return !q || sermon.title.toLowerCase().includes(q) || String(sermon.speaker || '').toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={[ADMIN_HOME_CRUMB, { label: 'Sermons' }]}
        title="Sermons"
        description="Keep the sermon library organised and easy to maintain."
        actions={
          <Button asChild>
            <Link href="/admin/sermons/new">
              <Plus className="h-4 w-4" aria-hidden="true" />
              New sermon
            </Link>
          </Button>
        }
      />
      <AdminSubNav label="Sermons and series" items={SERMON_TABS} />

      <div className="w-full sm:max-w-sm">
        <Input
          aria-label="Search sermons"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by title or speaker"
        />
      </div>

      {isLoading ? (
        <TableSkeleton label="Loading sermons" />
      ) : isError && sermons.length === 0 ? (
        <LoadError what="sermons" onRetry={() => refetch()} />
      ) : (
        <SimpleTable
          emptyMessage={query.trim() ? 'No sermons match your search.' : 'No sermons yet.'}
          columns={[
            {
              key: 'title',
              header: 'Title',
              render: (sermon: AdminSermon) => (
                <div>
                  <p className="font-semibold text-foreground">{sermon.title}</p>
                  <p className="text-xs text-muted">{sermon.ministry_name || 'No ministry assigned'}</p>
                </div>
              ),
            },
            {
              key: 'speaker',
              header: 'Speaker',
              render: (sermon: AdminSermon) => sermon.speaker || 'Unknown speaker',
            },
            {
              key: 'sermon_date',
              header: 'Date',
              render: (sermon: AdminSermon) =>
                sermon.sermon_date ? new Date(sermon.sermon_date).toLocaleDateString() : 'Unknown',
            },
            {
              key: 'actions',
              header: 'Actions',
              render: (sermon: AdminSermon) => (
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary" asChild>
                    <Link href={`/admin/sermons/${sermon.id}/edit`} aria-label={`Edit ${sermon.title}`}>
                      Edit
                    </Link>
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => setSelectedSermon(sermon)} aria-label={`Delete ${sermon.title}`}>
                    Delete
                  </Button>
                </div>
              ),
            },
          ]}
          data={filteredSermons}
        />
      )}

      {selectedSermon && (
        <ConfirmDialog
          title="Delete sermon?"
          description={`This will permanently remove "${selectedSermon.title}".`}
          confirmLabel="Delete sermon"
          onCancel={() => setSelectedSermon(null)}
          onConfirm={() => {
            del.mutate(selectedSermon.id, {
              onSuccess: () => setSelectedSermon(null),
            });
          }}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: New sermon**

Replace the whole of `frontend/src/app/admin/sermons/new/page.tsx` with:

```tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import apiClient from '@/lib/api';
import { useRefreshSermonData, useSermonSeriesList } from '@/hooks/useApi';
import PageHeader from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Field, FormActions, FormSection, formGridClass } from '@/components/admin/form-layout';
import { ADMIN_HOME_CRUMB } from '@/components/admin/admin-nav';

type SermonForm = {
  title: string;
  speaker: string;
  videoUrl: string;
  description: string;
  sermonDate: string;
  ministryId: number;
  seriesId: string;
};

export default function NewSermonPage() {
  const { register, handleSubmit } = useForm<SermonForm>({
    defaultValues: {
      sermonDate: new Date().toISOString().slice(0, 16),
      seriesId: '',
    },
  });
  const router = useRouter();
  const { data: seriesList } = useSermonSeriesList();
  const refreshSermonData = useRefreshSermonData();

  const onSubmit = async (data: SermonForm) => {
    try {
      await apiClient.post('/admin/sermons', {
        ...data,
        seriesId: data.seriesId ? Number(data.seriesId) : null,
      });
      refreshSermonData();
      toast.success('Sermon created');
      router.push('/admin/sermons');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create sermon');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={[ADMIN_HOME_CRUMB, { label: 'Sermons', href: '/admin/sermons' }, { label: 'New sermon' }]}
        title="New sermon"
        description="Add a sermon to the library."
      />

      <FormSection title="Sermon details">
        <form onSubmit={handleSubmit(onSubmit)} className={formGridClass}>
          <Field label="Title" htmlFor="sermon-title" full>
            <Input id="sermon-title" {...register('title')} />
          </Field>
          <Field label="Speaker" htmlFor="sermon-speaker">
            <Input id="sermon-speaker" {...register('speaker')} />
          </Field>
          <Field label="Sermon date" htmlFor="sermon-date">
            <Input id="sermon-date" type="datetime-local" {...register('sermonDate')} />
          </Field>
          <Field label="Video URL (embed)" htmlFor="sermon-video-url" full>
            <Input id="sermon-video-url" {...register('videoUrl')} />
          </Field>
          <Field label="Ministry ID" htmlFor="sermon-ministry-id">
            <Input id="sermon-ministry-id" type="number" min="1" {...register('ministryId', { valueAsNumber: true })} />
          </Field>
          <Field label="Series" htmlFor="sermon-series">
            <Select id="sermon-series" {...register('seriesId')}>
              <option value="">No series</option>
              {(seriesList ?? []).map((series) => (
                <option key={series.id} value={String(series.id)}>
                  {series.title}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Description" htmlFor="sermon-description" full>
            <Textarea id="sermon-description" rows={6} {...register('description')} />
          </Field>
          <FormActions>
            <Button type="submit">Create sermon</Button>
            <Button asChild variant="secondary">
              <Link href="/admin/sermons">Cancel</Link>
            </Button>
          </FormActions>
        </form>
      </FormSection>
    </div>
  );
}
```

- [ ] **Step 3: Edit sermon**

Replace the whole of `frontend/src/app/admin/sermons/[id]/edit/page.tsx` with:

```tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import apiClient from '@/lib/api';
import { useRefreshSermonData, useSermonSeriesList } from '@/hooks/useApi';
import PageHeader from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Field, FormActions, FormSection, formGridClass } from '@/components/admin/form-layout';
import { CardListSkeleton, LoadError } from '@/components/admin/states';
import { ADMIN_HOME_CRUMB } from '@/components/admin/admin-nav';

type SermonForm = {
  title: string;
  speaker: string;
  videoUrl: string;
  description: string;
  sermonDate: string;
  ministryId?: number;
  seriesId?: string;
};

export default function EditSermonPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const { register, handleSubmit, reset } = useForm<SermonForm>();
  const router = useRouter();
  const { data: seriesList } = useSermonSeriesList();
  const refreshSermonData = useRefreshSermonData();
  const [loadState, setLoadState] = React.useState<'loading' | 'ready' | 'error'>('loading');
  const [attempt, setAttempt] = React.useState(0);

  React.useEffect(() => {
    if (!id) return;
    setLoadState('loading');
    apiClient
      .get(`/admin/sermons/${id}`)
      .then((res) => {
        reset({
          ...res.data.data,
          videoUrl: res.data.data?.video_url || '',
          sermonDate: res.data.data?.sermon_date
            ? new Date(res.data.data.sermon_date).toISOString().slice(0, 16)
            : '',
          ministryId: res.data.data?.ministry_id,
          seriesId: res.data.data?.series_id ? String(res.data.data.series_id) : '',
        });
        setLoadState('ready');
      })
      .catch(() => setLoadState('error'));
  }, [id, reset, attempt]);

  const onSubmit = async (vals: SermonForm) => {
    try {
      await apiClient.put(`/admin/sermons/${id}`, {
        ...vals,
        seriesId: vals.seriesId ? Number(vals.seriesId) : null,
      });
      refreshSermonData();
      toast.success('Sermon updated');
      router.push('/admin/sermons');
    } catch {
      toast.error('Update failed');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={[ADMIN_HOME_CRUMB, { label: 'Sermons', href: '/admin/sermons' }, { label: 'Edit sermon' }]}
        title="Edit sermon"
      />

      {loadState === 'loading' ? (
        <CardListSkeleton count={1} label="Loading sermon" />
      ) : loadState === 'error' ? (
        <LoadError what="this sermon" onRetry={() => setAttempt((value) => value + 1)} />
      ) : (
        <FormSection title="Sermon details">
          <form onSubmit={handleSubmit(onSubmit)} className={formGridClass}>
            <Field label="Title" htmlFor="edit-sermon-title" full>
              <Input id="edit-sermon-title" {...register('title')} />
            </Field>
            <Field label="Speaker" htmlFor="edit-sermon-speaker">
              <Input id="edit-sermon-speaker" {...register('speaker')} />
            </Field>
            <Field label="Sermon date" htmlFor="edit-sermon-date">
              <Input id="edit-sermon-date" type="datetime-local" {...register('sermonDate')} />
            </Field>
            <Field label="Video URL" htmlFor="edit-sermon-video-url" full>
              <Input id="edit-sermon-video-url" {...register('videoUrl')} />
            </Field>
            <Field label="Ministry ID" htmlFor="edit-sermon-ministry-id">
              <Input
                id="edit-sermon-ministry-id"
                type="number"
                min="1"
                {...register('ministryId', { valueAsNumber: true })}
              />
            </Field>
            <Field label="Series" htmlFor="edit-sermon-series">
              {/* Mount the select only once its options exist, so the sermon's saved series
                  is selected even when the series list loads after the sermon. */}
              {seriesList ? (
                <Select id="edit-sermon-series" {...register('seriesId')}>
                  <option value="">No series</option>
                  {seriesList.map((series) => (
                    <option key={series.id} value={String(series.id)}>
                      {series.title}
                    </option>
                  ))}
                </Select>
              ) : (
                <Skeleton className="h-11 w-full" />
              )}
            </Field>
            <Field label="Description" htmlFor="edit-sermon-description" full>
              <Textarea id="edit-sermon-description" rows={6} {...register('description')} />
            </Field>
            <FormActions>
              <Button type="submit">Save</Button>
              <Button asChild variant="secondary">
                <Link href="/admin/sermons">Cancel</Link>
              </Button>
            </FormActions>
          </form>
        </FormSection>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Series**

Replace the whole of `frontend/src/app/admin/series/page.tsx` with:

```tsx
'use client';

import React from 'react';
import Image from 'next/image';
import ConfirmDialog from '@/components/ui/confirm-dialog';
import PageHeader from '@/components/ui/page-header';
import SimpleTable from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import AdminSubNav from '@/components/admin/sub-nav';
import { Field, FormActions, FormSection, formGridClass } from '@/components/admin/form-layout';
import { LoadError, TableSkeleton } from '@/components/admin/states';
import { ADMIN_HOME_CRUMB, SERMON_TABS } from '@/components/admin/admin-nav';
import {
  useDeleteSermonSeries,
  useSaveSermonSeries,
  useSermonSeriesList,
  useUploadSeriesCover,
  type SeriesInput,
  type SermonSeriesSummary,
} from '@/hooks/useApi';
import { formatDateOnly, resolveAssetUrl } from '@/lib/utils';

const EMPTY: SeriesInput = { title: '', description: '', coverImageUrl: '', startDate: '', endDate: '' };

// Date inputs need YYYY-MM-DD; the API sends ISO timestamps at midnight UTC.
const toDateInput = (value: string | null) => (value ? value.slice(0, 10) : '');

export default function AdminSeriesPage() {
  const { data: seriesList, isLoading, isError, refetch } = useSermonSeriesList();
  const save = useSaveSermonSeries();
  const remove = useDeleteSermonSeries();
  const upload = useUploadSeriesCover();

  const [editingId, setEditingId] = React.useState<number | undefined>();
  const [form, setForm] = React.useState<SeriesInput>(EMPTY);
  const [pendingDelete, setPendingDelete] = React.useState<SermonSeriesSummary | null>(null);

  const set = (field: keyof SeriesInput) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setForm((current) => ({ ...current, [field]: event.target.value }));

  const startEdit = (series: SermonSeriesSummary) => {
    setEditingId(series.id);
    setForm({
      title: series.title,
      description: series.description || '',
      coverImageUrl: series.cover_image_url || '',
      startDate: toDateInput(series.start_date),
      endDate: toDateInput(series.end_date),
    });
  };

  const resetForm = () => {
    setEditingId(undefined);
    setForm(EMPTY);
  };

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    save.mutate({ id: editingId, input: form }, { onSuccess: resetForm });
  };

  const onCoverChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    upload.mutate(file, {
      onSuccess: ({ url }) => setForm((current) => ({ ...current, coverImageUrl: url })),
    });
    event.target.value = '';
  };

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={[ADMIN_HOME_CRUMB, { label: 'Series' }]}
        title="Sermon series"
        description="Group sermons into series. Deleting a series keeps its sermons; they just lose the series label."
      />
      <AdminSubNav label="Sermons and series" items={SERMON_TABS} />

      <FormSection title={editingId ? 'Edit series' : 'New series'}>
        <form onSubmit={onSubmit} className={formGridClass}>
          <Field label="Title" htmlFor="series-title" full>
            <Input id="series-title" value={form.title} onChange={set('title')} required maxLength={255} />
          </Field>
          <Field label="Description" htmlFor="series-description" full>
            <Textarea id="series-description" rows={3} value={form.description} onChange={set('description')} />
          </Field>
          <Field label="Start date" htmlFor="series-start">
            <Input id="series-start" type="date" value={form.startDate} onChange={set('startDate')} />
          </Field>
          <Field label="End date" htmlFor="series-end">
            <Input
              id="series-end"
              type="date"
              value={form.endDate}
              min={form.startDate || undefined}
              onChange={set('endDate')}
            />
          </Field>
          <Field label="Cover image" htmlFor="series-cover" full>
            <div className="flex flex-wrap items-center gap-3">
              {form.coverImageUrl && (
                <Image
                  src={resolveAssetUrl(form.coverImageUrl)}
                  alt="Series cover"
                  width={120}
                  height={68}
                  unoptimized
                  className="h-auto w-[120px] rounded-lg border border-border object-cover"
                />
              )}
              <Input
                id="series-cover"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={onCoverChange}
                disabled={upload.isPending}
                className="max-w-xs"
              />
              {form.coverImageUrl && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setForm((c) => ({ ...c, coverImageUrl: '' }))}
                >
                  Remove cover
                </Button>
              )}
            </div>
          </Field>
          <FormActions>
            <Button type="submit" disabled={save.isPending || upload.isPending}>
              {editingId ? 'Save changes' : 'Create series'}
            </Button>
            {editingId && (
              <Button type="button" variant="secondary" onClick={resetForm}>
                Cancel
              </Button>
            )}
          </FormActions>
        </form>
      </FormSection>

      {isLoading ? (
        <TableSkeleton rows={3} label="Loading series" />
      ) : isError && !seriesList ? (
        <LoadError what="series" onRetry={() => refetch()} />
      ) : (
        <SimpleTable
          emptyMessage="No series yet."
          columns={[
            {
              key: 'title',
              header: 'Series',
              render: (series: SermonSeriesSummary) => <p className="font-semibold text-foreground">{series.title}</p>,
            },
            {
              key: 'sermon_count',
              header: 'Sermons',
              render: (series: SermonSeriesSummary) =>
                `${series.sermon_count} ${series.sermon_count === 1 ? 'sermon' : 'sermons'}`,
            },
            {
              key: 'start_date',
              header: 'Dates',
              render: (series: SermonSeriesSummary) =>
                series.start_date || series.end_date ? (
                  <span>
                    {series.start_date ? formatDateOnly(series.start_date) : ''}
                    {series.end_date ? ` – ${formatDateOnly(series.end_date)}` : ''}
                  </span>
                ) : (
                  <span className="text-muted">No dates</span>
                ),
            },
            {
              key: 'actions',
              header: 'Actions',
              render: (series: SermonSeriesSummary) => (
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary" onClick={() => startEdit(series)} aria-label={`Edit ${series.title}`}>
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setPendingDelete(series)}
                    disabled={remove.isPending}
                    aria-label={`Delete ${series.title}`}
                  >
                    Delete
                  </Button>
                </div>
              ),
            },
          ]}
          data={seriesList ?? []}
        />
      )}

      {pendingDelete && (
        <ConfirmDialog
          title={`Delete "${pendingDelete.title}"?`}
          description={`Its ${pendingDelete.sermon_count} sermon(s) will stay in the library without a series.`}
          confirmLabel="Delete series"
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => {
            remove.mutate(pendingDelete.id);
            if (editingId === pendingDelete.id) resetForm();
            setPendingDelete(null);
          }}
        />
      )}
    </div>
  );
}
```

If type-check complains that `SermonSeriesSummary` does not satisfy `Record<string, any>` for `SimpleTable`, pass `data={(seriesList ?? []) as Array<SermonSeriesSummary & Record<string, any>>}` and leave everything else unchanged.

- [ ] **Step 5: Field-by-field check of the forms**

Open each rewritten form beside `git show HEAD:<path>` and tick:
- [ ] New sermon: `sermon-title`, `sermon-speaker`, `sermon-video-url`, `sermon-date` (`datetime-local`, default now), `sermon-ministry-id` (`number`, `min="1"`, `valueAsNumber`), `sermon-series` (`No series` + list), `sermon-description` (6 rows). Submit posts the same payload with `seriesId` as number or `null`.
- [ ] Edit sermon: the same seven fields with `edit-` ids; the series select still mounts only after `seriesList` exists; the `reset(...)` mapping is byte-for-byte the old one.
- [ ] Series: `series-title` (`required`, `maxLength={255}`), `series-description`, `series-start`, `series-end` (`min` = start date), `series-cover` (same `accept`, disabled while uploading), Remove cover, submit disabled while saving or uploading, Cancel only when editing.

- [ ] **Step 6: Colour scan, type-check, lint and build**

```bash
grep -nE "(sky|cyan|amber|slate|gray|indigo|purple|rose|pink|teal|green|red|orange|emerald|blue|violet)-[0-9]|#[0-9A-Fa-f]{3,6}\b" frontend/src/app/admin/sermons/page.tsx frontend/src/app/admin/sermons/new/page.tsx "frontend/src/app/admin/sermons/[id]/edit/page.tsx" frontend/src/app/admin/series/page.tsx ; echo "scan-exit=$?"
cd frontend && npm run -s type-check && npm run -s lint && npm run -s build
```

Expected: no scan lines and `scan-exit=1`; all three checks pass.

- [ ] **Step 7: Check by eye (375px and 1280px, light and dark)**

- [ ] `/admin/sermons`: header with breadcrumb "Admin › Sermons" and a "New sermon" button; Sermons · Series tabs (Sermons underlined); search filters by title and speaker; a search with no hits says "No sermons match your search."
- [ ] Throttled reload shows skeleton rows; with the backend stopped, "Couldn't load sermons" with Try again.
- [ ] 375px: each sermon is a card with Title, Speaker, Date and Actions; Edit and Delete are both visible and tappable.
- [ ] Delete asks "Delete sermon?" with Cancel focused; Escape cancels; confirming removes the row.
- [ ] New sermon at 1280px: Title full width; Speaker | Sermon date; Video URL full; Ministry ID | Series; Description full; Create sermon + Cancel. At 375px every field is one column. Creating a sermon still returns to the list with the "Sermon created" toast.
- [ ] Edit sermon: skeleton, then the form filled with the sermon (including its series); Save returns to the list. Visit `/admin/sermons/999999/edit`: "Couldn't load this sermon" with Try again.
- [ ] `/admin/series`: Series tab underlined, the sidebar still highlights "Sermons & series"; creating, editing (form fills, title switches to "Edit series"), cover upload/remove and delete (confirm dialog) all work.
- [ ] Dark mode on all four pages: inputs, selects, the cover thumbnail and tables are readable with no white boxes.

- [ ] **Step 8: Commit**

```bash
git add frontend/src/app/admin/sermons frontend/src/app/admin/series
git commit -m "feat(admin): sermons and series on page headers, tables and the two-column form layout

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Content — devotionals, news, announcements and livestream

**Files:**
- Rewrite: `frontend/src/app/admin/devotionals/page.tsx`, `frontend/src/app/admin/news/page.tsx`, `frontend/src/app/admin/announcements/page.tsx`, `frontend/src/app/admin/live/page.tsx`

**Interfaces:**
- Consumes: Task 1 `ADMIN_HOME_CRUMB`, `formGridClass`, `FormSection`, `Field`, `FormActions`, `CheckboxField`, `TableSkeleton`, `CardListSkeleton`, `LoadError`, `statusTone`, `statusLabel`; 8a `PageHeader`, `SimpleTable`, `ConfirmDialog`, `Badge`, `Button`, `Input`, `Textarea`, `Select`; existing hooks `useAdminDevotionals`, `useSaveDevotional`, `useDeleteDevotional`, `usePublishDevotional` (types `Devotional`, `DevotionalInput`), `useAdminNews`, `useAuditLogs`, `useCreateNewsPost`, `useDeleteNewsPost`, `useUploadNewsImage`, `useAdminGroups`, `useCheckInEvents`, `useSendAnnouncement`, `useSentAnnouncements` (type `AnnouncementInput`), `useLiveStream`, `useStartLive`, `useEndLive`.
- Produces: nothing used by other tasks.

- [ ] **Step 1: Devotionals**

Replace the whole of `frontend/src/app/admin/devotionals/page.tsx` with:

```tsx
'use client';

import React from 'react';
import ConfirmDialog from '@/components/ui/confirm-dialog';
import PageHeader from '@/components/ui/page-header';
import SimpleTable from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field, FormActions, FormSection, formGridClass } from '@/components/admin/form-layout';
import { LoadError, TableSkeleton } from '@/components/admin/states';
import { ADMIN_HOME_CRUMB } from '@/components/admin/admin-nav';
import { statusLabel, statusTone } from '@/components/admin/status';
import {
  useAdminDevotionals,
  useDeleteDevotional,
  usePublishDevotional,
  useSaveDevotional,
  type Devotional,
  type DevotionalInput,
} from '@/hooks/useApi';
import { formatDateOnly } from '@/lib/utils';

type FormState = { title: string; scriptureReference: string; scriptureText: string; body: string; prayer: string; publishDate: string };
const EMPTY: FormState = { title: '', scriptureReference: '', scriptureText: '', body: '', prayer: '', publishDate: '' };

const toInput = (form: FormState): DevotionalInput => ({
  title: form.title.trim(),
  scriptureReference: form.scriptureReference.trim(),
  scriptureText: form.scriptureText.trim(),
  body: form.body.trim(),
  prayer: form.prayer.trim() || null,
  publishDate: form.publishDate,
});

export default function AdminDevotionalsPage() {
  const { data: devotionals, isLoading, isError, refetch } = useAdminDevotionals();
  const save = useSaveDevotional();
  const remove = useDeleteDevotional();
  const publish = usePublishDevotional();
  const [editingId, setEditingId] = React.useState<number | undefined>();
  const [form, setForm] = React.useState<FormState>(EMPTY);
  const [pendingDelete, setPendingDelete] = React.useState<Devotional | null>(null);

  const set = (field: keyof FormState) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((current) => ({ ...current, [field]: event.target.value }));

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
  const resetForm = () => {
    setEditingId(undefined);
    setForm(EMPTY);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={[ADMIN_HOME_CRUMB, { label: 'Devotionals' }]}
        title="Daily devotionals"
        description="Write one devotional per day. Save it as a draft, then use Publish; on its own day, publishing also notifies everyone (once)."
      />

      <FormSection title={editingId ? 'Edit devotional' : 'New devotional'}>
        <form
          className={formGridClass}
          onSubmit={(event) => {
            event.preventDefault();
            save.mutate({ id: editingId, input: toInput(form) }, { onSuccess: resetForm });
          }}
        >
          <Field label="Title" htmlFor="dev-title">
            <Input id="dev-title" value={form.title} onChange={set('title')} required maxLength={255} />
          </Field>
          <Field label="Date" htmlFor="dev-date">
            <Input id="dev-date" type="date" value={form.publishDate} onChange={set('publishDate')} required />
          </Field>
          <Field label="Scripture reference" htmlFor="dev-ref" full>
            <Input
              id="dev-ref"
              value={form.scriptureReference}
              onChange={set('scriptureReference')}
              required
              maxLength={255}
              placeholder="Psalm 23:1-3"
            />
          </Field>
          <Field label="Scripture text" htmlFor="dev-scripture" full>
            <Textarea id="dev-scripture" rows={3} value={form.scriptureText} onChange={set('scriptureText')} required maxLength={5000} />
          </Field>
          <Field label="Reflection" htmlFor="dev-body" full>
            <Textarea id="dev-body" rows={8} value={form.body} onChange={set('body')} required maxLength={20000} />
          </Field>
          <Field label="Closing prayer (optional)" htmlFor="dev-prayer" full>
            <Textarea id="dev-prayer" rows={3} value={form.prayer} onChange={set('prayer')} maxLength={5000} />
          </Field>
          <FormActions>
            <Button type="submit" disabled={save.isPending}>
              {editingId ? 'Save changes' : 'Save draft'}
            </Button>
            {editingId && (
              <Button type="button" variant="secondary" onClick={resetForm}>
                Cancel
              </Button>
            )}
          </FormActions>
        </form>
      </FormSection>

      {isLoading ? (
        <TableSkeleton label="Loading devotionals" />
      ) : isError && !devotionals ? (
        <LoadError what="devotionals" onRetry={() => refetch()} />
      ) : (
        <SimpleTable
          emptyMessage="No devotionals yet."
          columns={[
            {
              key: 'title',
              header: 'Devotional',
              render: (item: Devotional) => (
                <div>
                  <p className="font-semibold text-foreground">{item.title}</p>
                  <p className="text-xs text-muted">{item.scripture_reference}</p>
                </div>
              ),
            },
            {
              key: 'publish_date',
              header: 'Date',
              render: (item: Devotional) => formatDateOnly(item.publish_date),
            },
            {
              key: 'status',
              header: 'Status',
              render: (item: Devotional) => (
                <div className="flex flex-wrap gap-2">
                  <Badge tone={statusTone(item.status)}>{statusLabel(item.status)}</Badge>
                  {item.notified_at && <Badge tone="neutral">Everyone notified</Badge>}
                </div>
              ),
            },
            {
              key: 'actions',
              header: 'Actions',
              render: (item: Devotional) => (
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary" onClick={() => startEdit(item)} aria-label={`Edit ${item.title}`}>
                    Edit
                  </Button>
                  {(item.status === 'draft' || !item.notified_at) && (
                    <Button size="sm" disabled={publish.isPending} onClick={() => publish.mutate(item.id)}>
                      {item.status === 'draft' ? 'Publish' : 'Publish & notify'}
                    </Button>
                  )}
                  <Button size="sm" variant="secondary" onClick={() => setPendingDelete(item)} aria-label={`Delete ${item.title}`}>
                    Delete
                  </Button>
                </div>
              ),
            },
          ]}
          data={devotionals ?? []}
        />
      )}

      {pendingDelete && (
        <ConfirmDialog
          title={`Delete "${pendingDelete.title}"?`}
          description="This cannot be undone."
          confirmLabel="Delete"
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => {
            remove.mutate(pendingDelete.id);
            if (editingId === pendingDelete.id) resetForm();
            setPendingDelete(null);
          }}
        />
      )}
    </div>
  );
}
```

If type-check rejects `Devotional` as a `SimpleTable` row type, cast the data: `data={(devotionals ?? []) as Array<Devotional & Record<string, any>>}`.

- [ ] **Step 2: News**

Replace the whole of `frontend/src/app/admin/news/page.tsx` with:

```tsx
'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import {
  useAdminNews,
  useAuditLogs,
  useCreateNewsPost,
  useDeleteNewsPost,
  useUploadNewsImage,
} from '@/hooks/useApi';
import ConfirmDialog from '@/components/ui/confirm-dialog';
import PageHeader from '@/components/ui/page-header';
import SimpleTable from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CheckboxField, Field, FormActions, FormSection, formGridClass } from '@/components/admin/form-layout';
import { LoadError, TableSkeleton } from '@/components/admin/states';
import { ADMIN_HOME_CRUMB } from '@/components/admin/admin-nav';
import { statusLabel, statusTone } from '@/components/admin/status';

type NewsStatus = 'draft' | 'review' | 'scheduled' | 'published' | 'archived';

type NewsForm = {
  title: string;
  summary: string;
  content: string;
  slug?: string;
  imageUrl?: string;
  status: NewsStatus;
  scheduledFor?: string;
  featured: boolean;
};

type NewsRow = {
  id: number;
  title: string;
  summary?: string;
  slug?: string;
  status?: string;
  featured?: boolean;
  scheduled_for?: string | null;
};

const statusOptions: NewsStatus[] = ['draft', 'review', 'scheduled', 'published', 'archived'];

export default function AdminNewsPage() {
  const [statusFilter, setStatusFilter] = React.useState<string>('');
  const [search, setSearch] = React.useState('');
  const [pendingDelete, setPendingDelete] = React.useState<NewsRow | null>(null);
  const { data, isLoading, isError, refetch } = useAdminNews(1, 30, statusFilter || undefined, search || undefined);
  const { data: auditData } = useAuditLogs(1, 8, 'news_post');
  const createNews = useCreateNewsPost();
  const deleteNews = useDeleteNewsPost();
  const uploadNewsImage = useUploadNewsImage();
  const { register, handleSubmit, reset, watch, setValue } = useForm<NewsForm>({
    defaultValues: {
      status: 'draft',
      featured: false,
    },
  });

  const selectedStatus = watch('status');
  const posts = (data?.data || []) as NewsRow[];
  const auditLogs = auditData?.data || [];
  const filtering = Boolean(search.trim() || statusFilter);

  const onSubmit = async (values: NewsForm) => {
    await createNews.mutateAsync({
      ...values,
      imageUrl: values.imageUrl?.trim() || undefined,
      slug: values.slug?.trim() || undefined,
      scheduledFor: values.status === 'scheduled' ? values.scheduledFor || undefined : undefined,
    });
    reset({
      title: '',
      summary: '',
      content: '',
      slug: '',
      imageUrl: '',
      status: 'draft',
      scheduledFor: '',
      featured: false,
    });
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const uploaded = await uploadNewsImage.mutateAsync(file);
    setValue('imageUrl', uploaded.url, { shouldDirty: true });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={[ADMIN_HOME_CRUMB, { label: 'News' }]}
        title="News"
        description="Write, review, schedule and publish news posts."
      />

      <FormSection title="New post">
        <form onSubmit={handleSubmit(onSubmit)} className={formGridClass}>
          <Field label="Title" htmlFor="news-title">
            <Input id="news-title" {...register('title')} />
          </Field>
          <Field label="Slug" htmlFor="news-slug" hint="Optional. Made from the title when left blank.">
            <Input id="news-slug" {...register('slug')} placeholder="optional-custom-slug" />
          </Field>
          <Field label="Summary" htmlFor="news-summary" full>
            <Textarea id="news-summary" rows={3} {...register('summary')} />
          </Field>
          <Field label="Content" htmlFor="news-content" full>
            <Textarea id="news-content" rows={6} {...register('content')} />
          </Field>
          <Field label="Status" htmlFor="news-status">
            <Select id="news-status" {...register('status')}>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {statusLabel(status)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Scheduled for" htmlFor="news-scheduled-for" hint="Only used when the status is Scheduled.">
            <Input
              id="news-scheduled-for"
              type="datetime-local"
              {...register('scheduledFor')}
              disabled={selectedStatus !== 'scheduled'}
            />
          </Field>
          <Field label="Upload image" htmlFor="news-image-upload">
            <Input id="news-image-upload" type="file" accept="image/*" onChange={handleImageUpload} />
          </Field>
          <Field label="Image URL" htmlFor="news-image-url">
            <Input id="news-image-url" {...register('imageUrl')} />
          </Field>
          <CheckboxField label="Mark as featured" {...register('featured')} />
          <FormActions>
            <Button type="submit" disabled={createNews.isPending || uploadNewsImage.isPending}>
              {createNews.isPending ? 'Saving...' : 'Create post'}
            </Button>
          </FormActions>
        </form>
      </FormSection>

      <section className="grid gap-6 xl:grid-cols-[2fr,1fr]">
        <div className="min-w-0 space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="text-xl font-semibold text-foreground">Posts</h2>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Input
                aria-label="Search posts"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search title, summary, content..."
              />
              <Select
                aria-label="Filter by status"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="sm:w-44"
              >
                <option value="">All statuses</option>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {statusLabel(status)}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {isLoading ? (
            <TableSkeleton label="Loading news posts" />
          ) : isError && posts.length === 0 ? (
            <LoadError what="news posts" onRetry={() => refetch()} />
          ) : (
            <SimpleTable
              emptyMessage={filtering ? 'No news posts match the current filters.' : 'No news posts yet.'}
              columns={[
                {
                  key: 'title',
                  header: 'Post',
                  render: (post: NewsRow) => (
                    <div className="space-y-1">
                      <p className="font-semibold text-foreground">{post.title}</p>
                      {post.summary && <p className="line-clamp-2 text-sm text-muted">{post.summary}</p>}
                      <p className="text-xs text-muted">Slug: {post.slug}</p>
                    </div>
                  ),
                },
                {
                  key: 'status',
                  header: 'Status',
                  render: (post: NewsRow) => (
                    <div className="space-y-1">
                      <div className="flex flex-wrap gap-2">
                        <Badge tone={statusTone(post.status)}>{statusLabel(post.status)}</Badge>
                        {post.featured && <Badge tone="gold">Featured</Badge>}
                      </div>
                      {post.scheduled_for && (
                        <p className="text-xs text-muted">Scheduled: {new Date(post.scheduled_for).toLocaleString()}</p>
                      )}
                    </div>
                  ),
                },
                {
                  key: 'actions',
                  header: 'Actions',
                  render: (post: NewsRow) => (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setPendingDelete(post)}
                      disabled={deleteNews.isPending}
                      aria-label={`Delete ${post.title}`}
                    >
                      Delete
                    </Button>
                  ),
                },
              ]}
              data={posts}
            />
          )}
        </div>

        <aside className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Recent changes</h2>
          {auditLogs.length === 0 ? (
            <p className="rounded-card border border-dashed border-input bg-surface/50 px-4 py-6 text-center text-sm text-muted">
              No audit entries yet.
            </p>
          ) : (
            <ul className="divide-y divide-border rounded-card border border-border bg-card">
              {auditLogs.map((log: any) => (
                <li key={log.id} className="space-y-1 p-4">
                  <p className="text-sm font-semibold text-foreground">{log.summary}</p>
                  <p className="text-xs text-muted">{log.actor_name || log.actor_email || 'System'}</p>
                  <p className="text-xs text-muted">{new Date(log.created_at).toLocaleString()}</p>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </section>

      {/* Ruling 7: deleting a post now asks first, like every other delete in admin. */}
      {pendingDelete && (
        <ConfirmDialog
          title={`Delete "${pendingDelete.title}"?`}
          description="This post will be removed for everyone. This cannot be undone."
          confirmLabel="Delete post"
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => {
            deleteNews.mutate(pendingDelete.id);
            setPendingDelete(null);
          }}
        />
      )}
    </div>
  );
}
```

Note: the Select's `className="sm:w-44"` does not conflict with `fieldClass` (`w-full` applies below `sm`).

- [ ] **Step 3: Announcements**

Replace the whole of `frontend/src/app/admin/announcements/page.tsx` with:

```tsx
'use client';

import React from 'react';
import PageHeader from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Field, FormActions, FormSection, formGridClass } from '@/components/admin/form-layout';
import { CardListSkeleton, LoadError } from '@/components/admin/states';
import { ADMIN_HOME_CRUMB } from '@/components/admin/admin-nav';
import {
  useAdminGroups,
  useCheckInEvents,
  useSendAnnouncement,
  useSentAnnouncements,
  type AnnouncementInput,
} from '@/hooks/useApi';
import { formatDateTime } from '@/lib/utils';

type Audience = 'everyone' | 'group' | 'event';

export default function AdminAnnouncementsPage() {
  const { data: groups } = useAdminGroups();
  const { data: events } = useCheckInEvents();
  const { data: sent, isLoading, isError, refetch } = useSentAnnouncements();
  const send = useSendAnnouncement();

  const [title, setTitle] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [audience, setAudience] = React.useState<Audience>('everyone');
  const [targetId, setTargetId] = React.useState('');

  const needsTarget = audience !== 'everyone';

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const base = { title: title.trim(), message: message.trim() };
    const input: AnnouncementInput =
      audience === 'group'
        ? { ...base, audience, groupId: Number(targetId) }
        : audience === 'event'
          ? { ...base, audience, eventId: Number(targetId) }
          : { ...base, audience: 'everyone' };
    send.mutate(input, {
      onSuccess: () => {
        setTitle('');
        setMessage('');
      },
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={[ADMIN_HOME_CRUMB, { label: 'Announcements' }]}
        title="Announcements"
        description="Sends an in-app notification, and a push notification to phones with the app installed."
      />

      <FormSection title="New announcement">
        <form onSubmit={onSubmit} className={formGridClass}>
          <Field label="Send to" htmlFor="ann-audience">
            <Select
              id="ann-audience"
              value={audience}
              onChange={(event) => {
                setAudience(event.target.value as Audience);
                setTargetId('');
              }}
            >
              <option value="everyone">Everyone</option>
              <option value="group">A small group</option>
              <option value="event">An event&apos;s attendees</option>
            </Select>
          </Field>
          {needsTarget && (
            <Field label={audience === 'group' ? 'Group' : 'Event'} htmlFor="ann-target">
              <Select id="ann-target" value={targetId} onChange={(event) => setTargetId(event.target.value)} required>
                <option value="">Choose...</option>
                {audience === 'group'
                  ? (groups ?? []).filter((g) => g.is_active).map((g) => (
                      <option key={g.id} value={String(g.id)}>
                        {g.name}
                      </option>
                    ))
                  : (events ?? []).map((e) => (
                      <option key={e.id} value={String(e.id)}>
                        {e.name} · {formatDateTime(e.event_date)}
                      </option>
                    ))}
              </Select>
            </Field>
          )}
          <Field label="Title" htmlFor="ann-title" full>
            <Input id="ann-title" value={title} onChange={(event) => setTitle(event.target.value)} required maxLength={255} />
          </Field>
          <Field label="Message" htmlFor="ann-message" full>
            <Textarea
              id="ann-message"
              rows={4}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              required
              maxLength={2000}
            />
          </Field>
          <FormActions>
            <Button type="submit" disabled={send.isPending || !title.trim() || !message.trim() || (needsTarget && !targetId)}>
              Send announcement
            </Button>
          </FormActions>
        </form>
      </FormSection>

      <FormSection title="Sent">
        {isLoading ? (
          <CardListSkeleton count={2} label="Loading sent announcements" />
        ) : isError && !sent ? (
          <LoadError what="sent announcements" onRetry={() => refetch()} />
        ) : !sent || sent.length === 0 ? (
          <p className="rounded-lg border border-dashed border-input bg-surface/50 px-4 py-6 text-center text-sm text-muted">
            Nothing sent yet.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {sent.map((item) => (
              <li key={item.id} className="space-y-2 py-4 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-foreground">{item.title}</p>
                  <Badge tone="neutral">
                    {item.audience === 'everyone'
                      ? 'Everyone'
                      : item.audience === 'group'
                        ? item.group_name || 'Group'
                        : item.event_name || 'Event'}
                  </Badge>
                </div>
                <p className="line-clamp-2 text-sm text-muted">{item.message}</p>
                <p className="text-xs text-muted">
                  {formatDateTime(item.created_at)} · {item.recipient_count} people · {item.push_count} phones
                  {item.sender_name ? ` · by ${item.sender_name}` : ''}
                </p>
              </li>
            ))}
          </ul>
        )}
      </FormSection>
    </div>
  );
}
```

- [ ] **Step 4: Livestream**

Replace the whole of `frontend/src/app/admin/live/page.tsx` with:

```tsx
'use client';

import React from 'react';
import Link from 'next/link';
import ConfirmDialog from '@/components/ui/confirm-dialog';
import PageHeader from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Field, FormActions, FormSection, formGridClass } from '@/components/admin/form-layout';
import { LoadError } from '@/components/admin/states';
import { ADMIN_HOME_CRUMB } from '@/components/admin/admin-nav';
import { useEndLive, useLiveStream, useStartLive } from '@/hooks/useApi';
import { formatDateTime } from '@/lib/utils';

export default function AdminLivePage() {
  const { data: live, isLoading, isError, refetch } = useLiveStream();
  const start = useStartLive();
  const end = useEndLive();

  const [title, setTitle] = React.useState('');
  const [youtubeUrl, setYoutubeUrl] = React.useState('');
  const [facebookUrl, setFacebookUrl] = React.useState('');
  const [confirmEnd, setConfirmEnd] = React.useState(false);
  const filledFromLive = React.useRef(false);

  // While live, start from the current title and links so they can be corrected.
  React.useEffect(() => {
    if (filledFromLive.current || !live?.is_live) return;
    filledFromLive.current = true;
    setTitle(live.title ?? '');
    setYoutubeUrl(live.youtube_url ?? '');
    setFacebookUrl(live.facebook_url ?? '');
  }, [live]);

  const isLive = Boolean(live?.is_live);
  const hasLink = Boolean(youtubeUrl.trim() || facebookUrl.trim());

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    start.mutate({
      title: title.trim(),
      youtubeUrl: youtubeUrl.trim() || undefined,
      facebookUrl: facebookUrl.trim() || undefined,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={[ADMIN_HOME_CRUMB, { label: 'Livestream' }]}
        title="Livestream"
        description="Paste the YouTube and/or Facebook link and go live. Everyone is notified once when you go live; updating the links while live does not notify again."
      />

      <FormSection title="Status">
        {isLoading ? (
          <Skeleton className="h-6 w-48" />
        ) : isError && !live ? (
          <LoadError what="the livestream status" onRetry={() => refetch()} />
        ) : isLive ? (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="live">Live now</Badge>
              <p className="font-semibold text-foreground">{live?.title}</p>
            </div>
            {live?.started_at && <p className="text-sm text-muted">Since {formatDateTime(live.started_at)}</p>}
            <Link href="/live" className="text-sm font-semibold text-link hover:underline">
              Open the live page
            </Link>
          </div>
        ) : (
          <Badge tone="neutral">Not live</Badge>
        )}
      </FormSection>

      <FormSection title={isLive ? 'Update the livestream' : 'Go live'}>
        <form onSubmit={onSubmit} className={formGridClass}>
          <Field label="Title" htmlFor="live-title" full>
            <Input
              id="live-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Sunday Worship Service"
              required
              maxLength={255}
            />
          </Field>
          <Field label="YouTube link" htmlFor="live-youtube">
            <Input
              id="live-youtube"
              type="url"
              value={youtubeUrl}
              onChange={(event) => setYoutubeUrl(event.target.value)}
              placeholder="https://www.youtube.com/live/..."
              maxLength={500}
            />
          </Field>
          <Field label="Facebook link" htmlFor="live-facebook">
            <Input
              id="live-facebook"
              type="url"
              value={facebookUrl}
              onChange={(event) => setFacebookUrl(event.target.value)}
              placeholder="https://www.facebook.com/.../videos/..."
              maxLength={500}
            />
          </Field>
          <p className="text-xs text-muted md:col-span-2">
            Add at least one link. YouTube streams are shown on the website; Facebook opens as a link.
          </p>
          <FormActions>
            <Button type="submit" disabled={start.isPending || !title.trim() || !hasLink}>
              {isLive ? 'Update links' : 'Go live'}
            </Button>
            {isLive && (
              <Button type="button" variant="danger" onClick={() => setConfirmEnd(true)} disabled={end.isPending}>
                End livestream
              </Button>
            )}
          </FormActions>
        </form>
      </FormSection>

      {/* Ruling 7: the same question as the old window.confirm, in the admin's own dialog. */}
      {confirmEnd && (
        <ConfirmDialog
          title="End the livestream?"
          description="The live banner will disappear for everyone."
          confirmLabel="End livestream"
          onCancel={() => setConfirmEnd(false)}
          onConfirm={() => {
            setConfirmEnd(false);
            end.mutate();
          }}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 5: Field-by-field check of the forms**

Compare each file with `git show HEAD:<path>` and tick:
- [ ] Devotionals: `dev-title` (required, 255), `dev-date` (date, required), `dev-ref` (required, 255, placeholder), `dev-scripture` (3 rows, required, 5000), `dev-body` (8 rows, required, 20000), `dev-prayer` (3 rows, 5000); Save draft/Save changes; Cancel only when editing; Publish/Publish & notify only when draft or not yet notified.
- [ ] News: `news-title`, `news-slug`, `news-summary`, `news-content`, `news-status` (five options), `news-scheduled-for` (disabled unless Scheduled), `news-image-upload` (`accept="image/*"`, fills Image URL), `news-image-url`, `featured` checkbox; submit disabled while saving or uploading; the form resets after a successful create; search and status filter still drive `useAdminNews`.
- [ ] Announcements: Send to (three options, resets the target), target select only for group/event (`required`; groups filtered to active), title (required, 255), message (required, 2000); the submit's disabled condition is unchanged.
- [ ] Livestream: title (required, 255), YouTube and Facebook (`url`, 500); Go live/Update links disabled without a title or a link; End livestream only while live.

- [ ] **Step 6: Colour scan, type-check, lint and build**

```bash
grep -nE "(sky|cyan|amber|slate|gray|indigo|purple|rose|pink|teal|green|red|orange|emerald|blue|violet)-[0-9]|#[0-9A-Fa-f]{3,6}\b" frontend/src/app/admin/devotionals/page.tsx frontend/src/app/admin/news/page.tsx frontend/src/app/admin/announcements/page.tsx frontend/src/app/admin/live/page.tsx ; echo "scan-exit=$?"
cd frontend && npm run -s type-check && npm run -s lint && npm run -s build
```

Expected: no scan lines and `scan-exit=1`; all three checks pass.

- [ ] **Step 7: Check by eye (375px and 1280px, light and dark)**

- [ ] Devotionals: Title | Date side by side at 1280px, one column at 375px; table shows Draft/Published badges and "Everyone notified"; Edit fills the form; Publish works; Delete asks first.
- [ ] News: the form is two columns at 1280px (Title | Slug, Status | Scheduled for, Upload image | Image URL); the featured checkbox is a 44px-tall row; posts table plus a "Recent changes" column on wide screens and stacked below on narrow ones; Delete asks "Delete "…"?" with Cancel focused, and only Delete post removes it.
- [ ] Announcements: choosing "A small group" shows the Group select beside Send to; sending clears title and message; the Sent list shows audience badges.
- [ ] Livestream: when not live, a "Not live" badge; after Go live, a pulsing red "Live now" badge with the title; End livestream opens the confirm dialog, and Cancel leaves the stream live.
- [ ] Backend stopped: each page shows its "Couldn't load …" state with Try again, and the forms still render.
- [ ] Dark mode on all four: no white boxes; the live badge, gold Featured badge and status badges are readable.

- [ ] **Step 8: Commit**

```bash
git add frontend/src/app/admin/devotionals frontend/src/app/admin/news frontend/src/app/admin/announcements frontend/src/app/admin/live
git commit -m "feat(admin): devotionals, news, announcements and livestream on the shared admin layout

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Content — gallery albums list and album manager

**Files:**
- Rewrite: `frontend/src/app/admin/gallery/page.tsx`
- Modify (exact edit list): `frontend/src/app/admin/gallery/[id]/page.tsx`

**Interfaces:**
- Consumes: Task 1 `ADMIN_HOME_CRUMB`, `formGridClass`, `FormSection`, `Field`, `FormActions`, `CheckboxField`, `CardListSkeleton`, `LoadError`; 8a `PageHeader`, `Card`, `Badge`, `Button`, `Input`, `Textarea`, `Select`, `EmptyState`, `ConfirmDialog`; existing hooks `useAdminAlbums`, `useAdminEvents`, `useSaveAlbum`, and on the album page everything it already imports (unchanged).
- Produces: nothing used by other tasks.

- [ ] **Step 1: Albums list (card grid)**

Replace the whole of `frontend/src/app/admin/gallery/page.tsx` with:

```tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ImageIcon } from 'lucide-react';
import PageHeader from '@/components/ui/page-header';
import EmptyState from '@/components/ui/empty-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Field, FormActions, FormSection, formGridClass } from '@/components/admin/form-layout';
import { CardListSkeleton, LoadError } from '@/components/admin/states';
import { ADMIN_HOME_CRUMB } from '@/components/admin/admin-nav';
import { useAdminAlbums, useAdminEvents, useSaveAlbum } from '@/hooks/useApi';

type FormState = { title: string; description: string; eventId: string; externalUrl: string };
const EMPTY: FormState = { title: '', description: '', eventId: '', externalUrl: '' };

export default function AdminGalleryPage() {
  const router = useRouter();
  const { data: albums, isLoading, isError, refetch } = useAdminAlbums();
  const { data: events } = useAdminEvents();
  const save = useSaveAlbum();
  const [form, setForm] = React.useState<FormState>(EMPTY);

  const set = (field: keyof FormState) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((current) => ({ ...current, [field]: event.target.value }));

  const onCreate = (event: React.FormEvent) => {
    event.preventDefault();
    save.mutate(
      {
        input: {
          title: form.title.trim(),
          description: form.description.trim() || null,
          eventId: form.eventId ? Number(form.eventId) : null,
          externalUrl: form.externalUrl.trim() || null,
          isPublished: false,
        },
      },
      {
        onSuccess: ({ album }) => {
          setForm(EMPTY);
          if (album?.id) router.push(`/admin/gallery/${album.id}`);
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={[ADMIN_HOME_CRUMB, { label: 'Gallery' }]}
        title="Photo gallery"
        description="Create an album as a draft, add photos, then publish it. Everyone is notified once, when a published album first has photos."
      />

      <FormSection title="New album">
        <form className={formGridClass} onSubmit={onCreate}>
          <Field label="Title" htmlFor="album-title">
            <Input id="album-title" value={form.title} onChange={set('title')} required maxLength={255} />
          </Field>
          <Field label="Event (optional)" htmlFor="album-event">
            <Select id="album-event" value={form.eventId} onChange={set('eventId')}>
              <option value="">No event</option>
              {(events || []).map((item: any) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Description (optional)" htmlFor="album-description" full>
            <Textarea id="album-description" rows={3} value={form.description} onChange={set('description')} maxLength={5000} />
          </Field>
          <Field label="Outside folder link (optional, https)" htmlFor="album-link" full>
            <Input
              id="album-link"
              type="url"
              value={form.externalUrl}
              onChange={set('externalUrl')}
              maxLength={500}
              placeholder="https://drive.google.com/..."
            />
          </Field>
          <FormActions>
            <Button type="submit" disabled={save.isPending}>
              Create draft album
            </Button>
          </FormActions>
        </form>
      </FormSection>

      <section aria-label="Albums" className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Albums</h2>
        {isLoading ? (
          <CardListSkeleton count={3} label="Loading albums" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" />
        ) : isError && !albums ? (
          <LoadError what="albums" onRetry={() => refetch()} />
        ) : !albums || albums.length === 0 ? (
          <EmptyState icon={ImageIcon} title="No albums yet." message="Create a draft album above, then add photos." />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {albums.map((album) => (
              <li key={album.id}>
                <Card className="flex h-full flex-col overflow-hidden">
                  {album.cover_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={album.cover_url} alt="" className="aspect-video w-full object-cover" />
                  ) : (
                    <div className="flex aspect-video w-full items-center justify-center bg-surface text-muted">
                      <ImageIcon className="h-8 w-8" aria-hidden="true" />
                    </div>
                  )}
                  <div className="flex flex-1 flex-col gap-3 p-4">
                    <div className="min-w-0 space-y-2">
                      <p className="truncate font-semibold text-foreground">{album.title}</p>
                      <div className="flex flex-wrap gap-2">
                        <Badge tone={album.is_published ? 'success' : 'neutral'}>
                          {album.is_published ? 'Published' : 'Draft'}
                        </Badge>
                        {album.notified_at && <Badge tone="neutral">Everyone notified</Badge>}
                      </div>
                      <p className="text-xs text-muted">
                        {album.photo_count} photo{album.photo_count === 1 ? '' : 's'}
                        {album.event_name ? ` · ${album.event_name}` : ''}
                      </p>
                    </div>
                    <Button asChild size="sm" variant="secondary" className="mt-auto self-start">
                      <Link href={`/admin/gallery/${album.id}`} aria-label={`Manage ${album.title}`}>
                        Manage
                      </Link>
                    </Button>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Album manager — exact edit list**

Apply these edits to `frontend/src/app/admin/gallery/[id]/page.tsx` with the Edit tool, in order. Every piece of upload, retry, cover and delete logic stays untouched.

**2a. Imports.** Replace:

```tsx
import { ArrowLeft, Star, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ConfirmDialog from '@/components/ui/confirm-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
```

with:

```tsx
import { ImageIcon, Star, Trash2, Upload } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import ConfirmDialog from '@/components/ui/confirm-dialog';
import EmptyState from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import PageHeader from '@/components/ui/page-header';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CheckboxField, Field, FormActions, FormSection, formGridClass } from '@/components/admin/form-layout';
import { CardListSkeleton } from '@/components/admin/states';
import { ADMIN_HOME_CRUMB } from '@/components/admin/admin-nav';
```

**2b. Loading and not-found.** Replace:

```tsx
  if (isLoading || (album && !form)) {
    return <div className="container-max py-12 text-sm text-ui-subtle">Loading album...</div>;
  }
  if (!album || !form || !id) {
    return <div className="container-max py-12 text-sm text-ui-subtle">Album not found.</div>;
  }
```

with:

```tsx
  const crumbs = [ADMIN_HOME_CRUMB, { label: 'Gallery', href: '/admin/gallery' }];

  if (isLoading || (album && !form)) {
    return (
      <div className="space-y-6">
        <PageHeader breadcrumb={[...crumbs, { label: 'Album' }]} title="Album" />
        <CardListSkeleton count={2} label="Loading album" />
      </div>
    );
  }
  if (!album || !form || !id) {
    return (
      <div className="space-y-6">
        <PageHeader breadcrumb={[...crumbs, { label: 'Album' }]} title="Album" />
        <EmptyState
          icon={ImageIcon}
          title="Album not found."
          message="It may have been deleted, or the link is wrong."
          action={
            <Button asChild variant="secondary">
              <Link href="/admin/gallery">All albums</Link>
            </Button>
          }
        />
      </div>
    );
  }
```

(`useAdminAlbum` returning an error also lands here, as today, now with a way back.)

**2c. Page header and details form.** Replace from `    <div className="container-max space-y-6 py-12">` through the closing `      </Card>` of the "Album details" card (the line just before `      <Card>` that opens the Photos card), i.e. this block:

```tsx
    <div className="container-max space-y-6 py-12">
      <Link href="/admin/gallery" className="inline-flex items-center gap-2 text-sm font-medium text-sky-700 dark:text-cyan-300">
        <ArrowLeft className="h-4 w-4" />
        All albums
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Album details</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={onSave}>
            <div className="space-y-2">
              <Label htmlFor="album-title">Title</Label>
              <Input id="album-title" value={form.title} onChange={set('title')} required maxLength={255} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="album-event">Event (optional)</Label>
              <select
                id="album-event"
                value={form.eventId}
                onChange={set('eventId')}
                className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
              >
                <option value="">No event</option>
                {(events || []).map((item: any) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="album-description">Description (optional)</Label>
              <Textarea id="album-description" rows={3} value={form.description} onChange={set('description')} maxLength={5000} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="album-link">Outside folder link (optional, https)</Label>
              <Input id="album-link" type="url" value={form.externalUrl} onChange={set('externalUrl')} maxLength={500} />
            </div>
            <label className="flex items-center gap-2 text-sm md:col-span-2">
              <input
                type="checkbox"
                checked={form.isPublished}
                onChange={(event) => setForm((current) => (current ? { ...current, isPublished: event.target.checked } : current))}
              />
              Published (anyone with the link can see it)
            </label>
            <div className="flex flex-wrap gap-3 md:col-span-2">
              <Button type="submit" disabled={save.isPending}>
                Save
              </Button>
              {album.is_published && (
                <Button asChild variant="outline">
                  <Link href={`/gallery/${album.id}`}>View public page</Link>
                </Button>
              )}
              <Button type="button" variant="outline" onClick={() => setConfirmDelete(true)}>
                Delete album
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
```

with:

```tsx
    <div className="space-y-6">
      <PageHeader
        breadcrumb={[...crumbs, { label: album.title }]}
        title={album.title}
        description="Edit the details, add photos and choose the cover."
        actions={
          <Badge tone={album.is_published ? 'success' : 'neutral'}>{album.is_published ? 'Published' : 'Draft'}</Badge>
        }
      />

      <FormSection title="Album details">
        <form className={formGridClass} onSubmit={onSave}>
          <Field label="Title" htmlFor="album-title">
            <Input id="album-title" value={form.title} onChange={set('title')} required maxLength={255} />
          </Field>
          <Field label="Event (optional)" htmlFor="album-event">
            <Select id="album-event" value={form.eventId} onChange={set('eventId')}>
              <option value="">No event</option>
              {(events || []).map((item: any) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Description (optional)" htmlFor="album-description" full>
            <Textarea id="album-description" rows={3} value={form.description} onChange={set('description')} maxLength={5000} />
          </Field>
          <Field label="Outside folder link (optional, https)" htmlFor="album-link" full>
            <Input id="album-link" type="url" value={form.externalUrl} onChange={set('externalUrl')} maxLength={500} />
          </Field>
          <CheckboxField
            label="Published (anyone with the link can see it)"
            checked={form.isPublished}
            onChange={(event) => setForm((current) => (current ? { ...current, isPublished: event.target.checked } : current))}
          />
          <FormActions>
            <Button type="submit" disabled={save.isPending}>
              Save
            </Button>
            {album.is_published && (
              <Button asChild variant="secondary">
                <Link href={`/gallery/${album.id}`}>View public page</Link>
              </Button>
            )}
            <Button type="button" variant="danger" onClick={() => setConfirmDelete(true)}>
              Delete album
            </Button>
          </FormActions>
        </form>
      </FormSection>
```

**2d. Photos section opening.** Replace:

```tsx
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Photos ({album.photo_count})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
```

with:

```tsx
      <FormSection title={`Photos (${album.photo_count})`}>
        <div className="space-y-4">
```

**2e. Drop zone colours.** Replace:

```tsx
            className={`flex flex-col items-center gap-3 rounded-xl border-2 border-dashed p-8 text-center text-sm ${
              dragging ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/30' : 'border-slate-300 dark:border-slate-700'
            }`}
          >
            <Upload className="h-6 w-6 text-ui-subtle" />
            <p>{progress
```

with:

```tsx
            className={`flex flex-col items-center gap-3 rounded-card border-2 border-dashed p-8 text-center text-sm text-foreground ${
              dragging ? 'border-primary bg-primary/10' : 'border-input bg-surface/50'
            }`}
          >
            <Upload className="h-6 w-6 text-muted" aria-hidden="true" />
            <p aria-live="polite">{progress
```

**2f. Choose photos button.** Replace:

```tsx
              <Button type="button" variant="outline" disabled={Boolean(progress)} onClick={() => fileInput.current?.click()}>
```

with:

```tsx
              <Button type="button" variant="secondary" disabled={Boolean(progress)} onClick={() => fileInput.current?.click()}>
```

and replace the `<div className="flex gap-2">` directly below the hidden file input with `<div className="flex flex-wrap justify-center gap-2">`.

**2g. Empty photos text.** Replace:

```tsx
            <p className="text-sm text-ui-subtle">No photos yet.</p>
```

with:

```tsx
            <p className="rounded-lg border border-dashed border-input bg-surface/50 px-4 py-6 text-center text-sm text-muted">
              No photos yet.
            </p>
```

**2h. Photo tiles.** Replace:

```tsx
                    <img src={photo.thumb_url} alt="" loading="lazy" className="aspect-square w-full rounded-lg object-cover" />
```

with:

```tsx
                    <img src={photo.thumb_url} alt="" loading="lazy" className="aspect-square w-full rounded-lg border border-border object-cover" />
```

and in the two tile buttons replace `variant={isCover ? 'default' : 'outline'}` with `variant={isCover ? 'primary' : 'secondary'}`, and the delete button's `variant="outline"` with `variant="secondary"`. Keep their `aria-label`s ("Set as cover", "Delete photo").

**2i. Photos section closing.** Replace the two lines that close the Photos card:

```tsx
        </CardContent>
      </Card>
```

with:

```tsx
        </div>
      </FormSection>
```

After the edits, `Link` is still imported and used (not-found action and View public page), `ArrowLeft`, `Card*` and `Label` are gone, and `grep -n "Card\|Label\|ui-subtle\|outline" "frontend/src/app/admin/gallery/[id]/page.tsx"` shows only `CardListSkeleton`.

- [ ] **Step 3: Logic check**

Run `git diff "frontend/src/app/admin/gallery/[id]/page.tsx"` and confirm the diff touches only imports, the two early returns, JSX wrappers/classes and button variants. `recordIds`, `uploadFiles`, the drag handlers, the hidden input's `accept`/`multiple`/`onChange`, the retry button, `setCover`, both `ConfirmDialog`s and the `useEffect` that fills the form must be unchanged lines.

- [ ] **Step 4: Colour scan, type-check, lint and build**

```bash
grep -nE "(sky|cyan|amber|slate|gray|indigo|purple|rose|pink|teal|green|red|orange|emerald|blue|violet)-[0-9]|#[0-9A-Fa-f]{3,6}\b" frontend/src/app/admin/gallery/page.tsx "frontend/src/app/admin/gallery/[id]/page.tsx" ; echo "scan-exit=$?"
cd frontend && npm run -s type-check && npm run -s lint && npm run -s build
```

Expected: no scan lines and `scan-exit=1`; all three checks pass.

- [ ] **Step 5: Check by eye (375px and 1280px, light and dark)**

- [ ] `/admin/gallery`: albums appear as a card grid (three across at 1280px, one at 375px) with cover or a placeholder tile, a Published/Draft badge, photo count and event; Manage opens the album.
- [ ] Creating a draft album still jumps to its page.
- [ ] Album page: breadcrumb "Admin › Gallery › <title>", a status badge, the details form two columns at 1280px; the Published checkbox toggles and Save keeps it.
- [ ] Drag photos over the drop zone: the border turns primary and the zone tints; the progress text updates while uploading; Retry appears after a failed upload.
- [ ] Set cover (star) and Delete photo (confirm dialog) still work; Delete album (red) asks first and returns to the list.
- [ ] `/admin/gallery/999999`: "Album not found." with an "All albums" button.
- [ ] Dark mode: placeholder tiles, drop zone and photo borders are navy-toned, never white.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/app/admin/gallery
git commit -m "feat(admin): gallery album grid and album manager on the shared admin layout

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Church life — events (list, new, edit) and ministries (list, new, edit)

**Files:**
- Rewrite: `frontend/src/app/admin/events/page.tsx`, `frontend/src/app/admin/events/new/page.tsx`, `frontend/src/app/admin/events/[id]/edit/page.tsx`, `frontend/src/app/admin/ministries/page.tsx`, `frontend/src/app/admin/ministries/new/page.tsx`, `frontend/src/app/admin/ministries/[id]/edit/page.tsx`

**Interfaces:**
- Consumes: Task 1 `ADMIN_HOME_CRUMB`, `formGridClass`, `FormSection`, `Field`, `FormActions`, `TableSkeleton`, `CardListSkeleton`, `LoadError`, `statusTone`, `statusLabel`; 8a `PageHeader`, `SimpleTable`, `ConfirmDialog`, `Badge`, `Button`, `Input`, `Textarea`; existing hooks `useAdminEvents`, `useDeleteEvent`, `useUploadEventImage`, `useRemoveEventImage`, `useMinistries`; `apiClient` (`@/lib/api`), `resolveAssetUrl` (`@/lib/utils`).
- Produces: nothing used by other tasks.

- [ ] **Step 1: Events list**

Replace the whole of `frontend/src/app/admin/events/page.tsx` with:

```tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import ConfirmDialog from '@/components/ui/confirm-dialog';
import PageHeader from '@/components/ui/page-header';
import SimpleTable from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadError, TableSkeleton } from '@/components/admin/states';
import { ADMIN_HOME_CRUMB } from '@/components/admin/admin-nav';
import { statusLabel, statusTone } from '@/components/admin/status';
import { useAdminEvents, useDeleteEvent } from '@/hooks/useApi';

type AdminEvent = {
  id: number;
  name: string;
  event_date: string;
  location?: string;
  status?: string;
  max_registrations?: number | null;
};

export default function AdminEventsPage() {
  const { data, isLoading, isError, refetch } = useAdminEvents();
  const del = useDeleteEvent();
  const [query, setQuery] = React.useState('');
  const [selectedEvent, setSelectedEvent] = React.useState<AdminEvent | null>(null);
  const events = (data ?? []) as AdminEvent[];

  const filteredEvents = events.filter((event) => {
    const q = query.trim().toLowerCase();
    return !q || event.name.toLowerCase().includes(q) || String(event.location || '').toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={[ADMIN_HOME_CRUMB, { label: 'Events' }]}
        title="Events"
        description="Review, edit and prune scheduled events."
        actions={
          <Button asChild>
            <Link href="/admin/events/new">
              <Plus className="h-4 w-4" aria-hidden="true" />
              New event
            </Link>
          </Button>
        }
      />

      <div className="w-full sm:max-w-sm">
        <Input
          aria-label="Search events"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name or location"
        />
      </div>

      {isLoading ? (
        <TableSkeleton label="Loading events" />
      ) : isError && events.length === 0 ? (
        <LoadError what="events" onRetry={() => refetch()} />
      ) : (
        <SimpleTable
          emptyMessage={query.trim() ? 'No events match your search.' : 'No events yet.'}
          columns={[
            {
              key: 'name',
              header: 'Event',
              render: (event: AdminEvent) => (
                <div>
                  <p className="font-semibold text-foreground">{event.name}</p>
                  <p className="text-xs text-muted">{event.location || 'No location set'}</p>
                </div>
              ),
            },
            {
              key: 'event_date',
              header: 'Date',
              render: (event: AdminEvent) => new Date(event.event_date).toLocaleString(),
            },
            {
              key: 'status',
              header: 'Status',
              render: (event: AdminEvent) => (
                <Badge tone={statusTone(event.status || 'active')}>{statusLabel(event.status || 'active')}</Badge>
              ),
            },
            {
              key: 'actions',
              header: 'Actions',
              render: (event: AdminEvent) => (
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary" asChild>
                    <Link href={`/admin/events/${event.id}/edit`} aria-label={`Edit ${event.name}`}>
                      Edit
                    </Link>
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => setSelectedEvent(event)} aria-label={`Delete ${event.name}`}>
                    Delete
                  </Button>
                </div>
              ),
            },
          ]}
          data={filteredEvents}
        />
      )}

      {selectedEvent && (
        <ConfirmDialog
          title="Delete event?"
          description={`This will permanently remove "${selectedEvent.name}".`}
          confirmLabel="Delete event"
          onCancel={() => setSelectedEvent(null)}
          onConfirm={() => {
            del.mutate(selectedEvent.id, {
              onSuccess: () => setSelectedEvent(null),
            });
          }}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: New event**

Replace the whole of `frontend/src/app/admin/events/new/page.tsx` with:

```tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import apiClient from '@/lib/api';
import PageHeader from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field, FormActions, FormSection, formGridClass } from '@/components/admin/form-layout';
import { ADMIN_HOME_CRUMB } from '@/components/admin/admin-nav';

type EventForm = {
  name: string;
  description: string;
  eventDate: string;
  location: string;
  maxRegistrations?: number;
};

export default function NewEventPage() {
  const { register, handleSubmit } = useForm<EventForm>({
    defaultValues: {
      eventDate: new Date().toISOString().slice(0, 16),
    },
  });
  const router = useRouter();

  const onSubmit = async (data: EventForm) => {
    try {
      const response = await apiClient.post('/admin/events', data);
      const createdId = response.data?.data?.id;
      toast.success(createdId ? 'Event created. You can add an image now.' : 'Event created');
      router.push(createdId ? `/admin/events/${createdId}/edit` : '/admin/events');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create event');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={[ADMIN_HOME_CRUMB, { label: 'Events', href: '/admin/events' }, { label: 'New event' }]}
        title="New event"
        description="You can add an image after the event is created."
      />

      <FormSection title="Event details">
        <form onSubmit={handleSubmit(onSubmit)} className={formGridClass}>
          <Field label="Name" htmlFor="event-name" full>
            <Input id="event-name" {...register('name')} />
          </Field>
          <Field label="Description" htmlFor="event-description" full>
            <Textarea id="event-description" rows={4} {...register('description')} />
          </Field>
          <Field label="Event date" htmlFor="event-date">
            <Input id="event-date" type="datetime-local" {...register('eventDate')} />
          </Field>
          <Field label="Location" htmlFor="event-location">
            <Input id="event-location" {...register('location')} />
          </Field>
          <Field label="Max registrations" htmlFor="event-max-registrations" hint="Leave blank for no limit.">
            <Input
              id="event-max-registrations"
              type="number"
              min="1"
              {...register('maxRegistrations', {
                setValueAs: (value) => (value === '' ? undefined : Number(value)),
              })}
            />
          </Field>
          <FormActions>
            <Button type="submit">Create event</Button>
            <Button asChild variant="secondary">
              <Link href="/admin/events">Cancel</Link>
            </Button>
          </FormActions>
        </form>
      </FormSection>
    </div>
  );
}
```

- [ ] **Step 3: Edit event**

Replace the whole of `frontend/src/app/admin/events/[id]/edit/page.tsx` with:

```tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import apiClient from '@/lib/api';
import PageHeader from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field, FormActions, FormSection, formGridClass } from '@/components/admin/form-layout';
import { CardListSkeleton, LoadError } from '@/components/admin/states';
import { ADMIN_HOME_CRUMB } from '@/components/admin/admin-nav';
import { useRemoveEventImage, useUploadEventImage } from '@/hooks/useApi';
import { resolveAssetUrl } from '@/lib/utils';

type EventForm = {
  name: string;
  description: string;
  eventDate: string;
  location: string;
  maxRegistrations?: number;
};

export default function EditEventPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const { register, handleSubmit, reset } = useForm<EventForm>();
  const router = useRouter();
  const [imageUrl, setImageUrl] = React.useState<string | null>(null);
  const uploadImage = useUploadEventImage(id);
  const removeImage = useRemoveEventImage(id);
  const [loadState, setLoadState] = React.useState<'loading' | 'ready' | 'error'>('loading');
  const [attempt, setAttempt] = React.useState(0);

  React.useEffect(() => {
    if (!id) return;
    setLoadState('loading');
    apiClient
      .get(`/admin/events/${id}`)
      .then((res) => {
        reset({
          ...res.data.data,
          eventDate: res.data.data?.event_date
            ? new Date(res.data.data.event_date).toISOString().slice(0, 16)
            : '',
        });
        setImageUrl(res.data.data?.image_url ?? null);
        setLoadState('ready');
      })
      .catch(() => setLoadState('error'));
  }, [id, reset, attempt]);

  const onSubmit = async (vals: EventForm) => {
    try {
      await apiClient.put(`/admin/events/${id}`, vals);
      toast.success('Event updated');
      router.push('/admin/events');
    } catch {
      toast.error('Update failed');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={[ADMIN_HOME_CRUMB, { label: 'Events', href: '/admin/events' }, { label: 'Edit event' }]}
        title="Edit event"
      />

      {loadState === 'loading' ? (
        <CardListSkeleton count={2} label="Loading event" />
      ) : loadState === 'error' ? (
        <LoadError what="this event" onRetry={() => setAttempt((value) => value + 1)} />
      ) : (
        <>
          <FormSection title="Image" description="JPEG, PNG, WebP or GIF, up to 5 MB.">
            <div className="space-y-3">
              {imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={resolveAssetUrl(imageUrl)}
                  alt=""
                  className="h-48 w-full rounded-card border border-border object-cover"
                />
              )}
              <div className="flex flex-wrap items-center gap-3">
                <label htmlFor="edit-event-image" className="sr-only">
                  Image
                </label>
                <Input
                  id="edit-event-image"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="max-w-xs"
                  disabled={uploadImage.isPending}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = '';
                    if (!file) return;
                    if (file.size > 5 * 1024 * 1024) {
                      toast.error('Choose an image under 5 MB');
                      return;
                    }
                    uploadImage.mutate(file, { onSuccess: (data) => setImageUrl(data.image_url) });
                  }}
                />
                {imageUrl && (
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={removeImage.isPending}
                    onClick={() => removeImage.mutate(undefined, { onSuccess: () => setImageUrl(null) })}
                  >
                    Remove image
                  </Button>
                )}
              </div>
            </div>
          </FormSection>

          <FormSection title="Event details">
            <form onSubmit={handleSubmit(onSubmit)} className={formGridClass}>
              <Field label="Name" htmlFor="edit-event-name" full>
                <Input id="edit-event-name" {...register('name')} />
              </Field>
              <Field label="Description" htmlFor="edit-event-description" full>
                <Textarea id="edit-event-description" rows={4} {...register('description')} />
              </Field>
              <Field label="Event date" htmlFor="edit-event-date">
                <Input id="edit-event-date" type="datetime-local" {...register('eventDate')} />
              </Field>
              <Field label="Location" htmlFor="edit-event-location">
                <Input id="edit-event-location" {...register('location')} />
              </Field>
              <Field label="Max registrations" htmlFor="edit-event-max-registrations" hint="Leave blank for no limit.">
                <Input
                  id="edit-event-max-registrations"
                  type="number"
                  min="1"
                  {...register('maxRegistrations', {
                    setValueAs: (value) => (value === '' ? undefined : Number(value)),
                  })}
                />
              </Field>
              <FormActions>
                <Button type="submit">Save</Button>
                <Button asChild variant="secondary">
                  <Link href="/admin/events">Cancel</Link>
                </Button>
              </FormActions>
            </form>
          </FormSection>
        </>
      )}
    </div>
  );
}
```

(The image `Label` became a visually hidden `<label>` because the section title already says "Image"; the input keeps `id="edit-event-image"`.)

- [ ] **Step 4: Ministries list**

Replace the whole of `frontend/src/app/admin/ministries/page.tsx` with:

```tsx
'use client';

import React from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Plus } from 'lucide-react';
import ConfirmDialog from '@/components/ui/confirm-dialog';
import PageHeader from '@/components/ui/page-header';
import SimpleTable from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadError, TableSkeleton } from '@/components/admin/states';
import { ADMIN_HOME_CRUMB } from '@/components/admin/admin-nav';
import { useMinistries } from '@/hooks/useApi';
import apiClient from '@/lib/api';

type Ministry = {
  id: number;
  name: string;
  description?: string | null;
  leader_name?: string | null;
  sermon_count?: number;
};

export default function AdminMinistriesPage() {
  const { data, isLoading, isError, refetch } = useMinistries();
  const [query, setQuery] = React.useState('');
  const [selectedMinistry, setSelectedMinistry] = React.useState<Ministry | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const ministries = (data ?? []) as Ministry[];

  const filteredMinistries = ministries.filter((ministry) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;

    return (
      ministry.name.toLowerCase().includes(q) ||
      String(ministry.description || '').toLowerCase().includes(q) ||
      String(ministry.leader_name || '').toLowerCase().includes(q)
    );
  });

  const handleDelete = async () => {
    if (!selectedMinistry) return;

    try {
      setIsDeleting(true);
      await apiClient.delete(`/ministries/${selectedMinistry.id}`);
      toast.success('Ministry deleted');
      setSelectedMinistry(null);
      refetch();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to delete ministry');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={[ADMIN_HOME_CRUMB, { label: 'Ministries' }]}
        title="Ministries"
        description="Create, update and remove ministries so sermons and participation stay organised."
        actions={
          <Button asChild>
            <Link href="/admin/ministries/new">
              <Plus className="h-4 w-4" aria-hidden="true" />
              New ministry
            </Link>
          </Button>
        }
      />

      <div className="w-full sm:max-w-sm">
        <Input
          aria-label="Search ministries"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name, leader or description"
        />
      </div>

      {isLoading ? (
        <TableSkeleton label="Loading ministries" />
      ) : isError && ministries.length === 0 ? (
        <LoadError what="ministries" onRetry={() => refetch()} />
      ) : (
        <SimpleTable
          emptyMessage={query.trim() ? 'No ministries match your search.' : 'No ministries yet.'}
          columns={[
            {
              key: 'name',
              header: 'Ministry',
              render: (ministry: Ministry) => (
                <div>
                  <p className="font-semibold text-foreground">{ministry.name}</p>
                  <p className="text-xs text-muted">{ministry.leader_name || 'Leader not assigned'}</p>
                </div>
              ),
            },
            {
              key: 'description',
              header: 'Description',
              render: (ministry: Ministry) => (
                <span className="line-clamp-2 max-w-xl">{ministry.description || 'No ministry description yet.'}</span>
              ),
            },
            {
              key: 'sermon_count',
              header: 'Sermons',
              render: (ministry: Ministry) => <Badge tone="neutral">{Number(ministry.sermon_count || 0)}</Badge>,
            },
            {
              key: 'actions',
              header: 'Actions',
              render: (ministry: Ministry) => (
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary" asChild>
                    <Link href={`/ministries/${ministry.id}`} aria-label={`View ${ministry.name}`}>
                      View
                    </Link>
                  </Button>
                  <Button size="sm" variant="secondary" asChild>
                    <Link href={`/admin/ministries/${ministry.id}/edit`} aria-label={`Edit ${ministry.name}`}>
                      Edit
                    </Link>
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => setSelectedMinistry(ministry)} aria-label={`Delete ${ministry.name}`}>
                    Delete
                  </Button>
                </div>
              ),
            },
          ]}
          data={filteredMinistries}
        />
      )}

      {selectedMinistry && (
        <ConfirmDialog
          title="Delete ministry?"
          description={`This will permanently remove "${selectedMinistry.name}".`}
          confirmLabel={isDeleting ? 'Deleting...' : 'Delete ministry'}
          onCancel={() => setSelectedMinistry(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 5: New ministry**

Replace the whole of `frontend/src/app/admin/ministries/new/page.tsx` with:

```tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import apiClient from '@/lib/api';
import PageHeader from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field, FormActions, FormSection, formGridClass } from '@/components/admin/form-layout';
import { ADMIN_HOME_CRUMB } from '@/components/admin/admin-nav';

type MinistryForm = {
  name: string;
  description: string;
  leaderName: string;
};

export default function NewMinistryPage() {
  const { register, handleSubmit } = useForm<MinistryForm>();
  const router = useRouter();

  const onSubmit = async (data: MinistryForm) => {
    try {
      await apiClient.post('/ministries', data);
      toast.success('Ministry created');
      router.push('/admin/ministries');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create ministry');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={[ADMIN_HOME_CRUMB, { label: 'Ministries', href: '/admin/ministries' }, { label: 'New ministry' }]}
        title="New ministry"
      />

      <FormSection title="Ministry details">
        <form onSubmit={handleSubmit(onSubmit)} className={formGridClass}>
          <Field label="Name" htmlFor="ministry-name">
            <Input id="ministry-name" {...register('name', { required: true })} />
          </Field>
          <Field label="Leader name" htmlFor="ministry-leader-name">
            <Input id="ministry-leader-name" {...register('leaderName')} />
          </Field>
          <Field label="Description" htmlFor="ministry-description" full>
            <Textarea id="ministry-description" rows={5} {...register('description')} />
          </Field>
          <FormActions>
            <Button type="submit">Create ministry</Button>
            <Button asChild variant="secondary">
              <Link href="/admin/ministries">Cancel</Link>
            </Button>
          </FormActions>
        </form>
      </FormSection>
    </div>
  );
}
```

- [ ] **Step 6: Edit ministry**

Replace the whole of `frontend/src/app/admin/ministries/[id]/edit/page.tsx` with:

```tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import apiClient from '@/lib/api';
import PageHeader from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field, FormActions, FormSection, formGridClass } from '@/components/admin/form-layout';
import { CardListSkeleton, LoadError } from '@/components/admin/states';
import { ADMIN_HOME_CRUMB } from '@/components/admin/admin-nav';

type MinistryForm = {
  name: string;
  description: string;
  leaderName: string;
};

export default function EditMinistryPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();
  const { register, handleSubmit, reset } = useForm<MinistryForm>();
  const [loadState, setLoadState] = React.useState<'loading' | 'ready' | 'error'>('loading');
  const [attempt, setAttempt] = React.useState(0);

  React.useEffect(() => {
    if (!id) return;
    setLoadState('loading');
    apiClient
      .get(`/ministries/${id}`)
      .then((res) => {
        reset({
          name: res.data.data?.name || '',
          description: res.data.data?.description || '',
          leaderName: res.data.data?.leader_name || res.data.data?.leaderName || '',
        });
        setLoadState('ready');
      })
      .catch(() => setLoadState('error'));
  }, [id, reset, attempt]);

  const onSubmit = async (vals: MinistryForm) => {
    try {
      await apiClient.put(`/ministries/${id}`, vals);
      toast.success('Ministry updated');
      router.push('/admin/ministries');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={[ADMIN_HOME_CRUMB, { label: 'Ministries', href: '/admin/ministries' }, { label: 'Edit ministry' }]}
        title="Edit ministry"
      />

      {loadState === 'loading' ? (
        <CardListSkeleton count={1} label="Loading ministry" />
      ) : loadState === 'error' ? (
        <LoadError what="this ministry" onRetry={() => setAttempt((value) => value + 1)} />
      ) : (
        <FormSection title="Ministry details">
          <form onSubmit={handleSubmit(onSubmit)} className={formGridClass}>
            <Field label="Name" htmlFor="edit-ministry-name">
              <Input id="edit-ministry-name" {...register('name', { required: true })} />
            </Field>
            <Field label="Leader name" htmlFor="edit-ministry-leader-name">
              <Input id="edit-ministry-leader-name" {...register('leaderName')} />
            </Field>
            <Field label="Description" htmlFor="edit-ministry-description" full>
              <Textarea id="edit-ministry-description" rows={5} {...register('description')} />
            </Field>
            <FormActions>
              <Button type="submit">Save ministry</Button>
              <Button asChild variant="secondary">
                <Link href="/admin/ministries">Cancel</Link>
              </Button>
            </FormActions>
          </form>
        </FormSection>
      )}
    </div>
  );
}
```

- [ ] **Step 7: Field-by-field check of the forms**

Compare with `git show HEAD:<path>`:
- [ ] New event: `event-name`, `event-description` (4 rows), `event-date` (`datetime-local`, default now), `event-location`, `event-max-registrations` (`number`, `min="1"`, blank → `undefined`). After create it still goes to the new event's edit page.
- [ ] Edit event: image input (same `accept`, 5 MB check, disabled while uploading), Remove image, then the same five fields with `edit-` ids; the `reset(...)` mapping is unchanged.
- [ ] New/edit ministry: name (`required: true`), leader name, description (5 rows); the edit `reset(...)` mapping is unchanged.

- [ ] **Step 8: Colour scan, type-check, lint and build**

```bash
grep -nE "(sky|cyan|amber|slate|gray|indigo|purple|rose|pink|teal|green|red|orange|emerald|blue|violet)-[0-9]|#[0-9A-Fa-f]{3,6}\b" frontend/src/app/admin/events/page.tsx frontend/src/app/admin/events/new/page.tsx "frontend/src/app/admin/events/[id]/edit/page.tsx" frontend/src/app/admin/ministries/page.tsx frontend/src/app/admin/ministries/new/page.tsx "frontend/src/app/admin/ministries/[id]/edit/page.tsx" ; echo "scan-exit=$?"
cd frontend && npm run -s type-check && npm run -s lint && npm run -s build
```

Expected: no scan lines and `scan-exit=1`; all three checks pass.

- [ ] **Step 9: Check by eye (375px and 1280px, light and dark)**

- [ ] `/admin/events`: status badges read "Active"/"Cancelled" with text; search; at 375px each event card shows Edit and Delete; Delete asks first.
- [ ] New event: Name and Description full width, Event date | Location, Max registrations; Create event opens the edit page with the toast.
- [ ] Edit event: skeleton, then Image section (upload, preview, Remove image) and Event details filled in; Save returns to the list. `/admin/events/999999/edit` shows "Couldn't load this event".
- [ ] `/admin/ministries`: View, Edit and Delete per row (all visible at 375px); Delete asks first and the row disappears.
- [ ] New/edit ministry: Name | Leader name, Description full; submitting with an empty name does nothing (`required`).
- [ ] Dark mode on all six pages: no white boxes; badges and the image border readable.

- [ ] **Step 10: Commit**

```bash
git add frontend/src/app/admin/events frontend/src/app/admin/ministries
git commit -m "feat(admin): events and ministries on page headers, tables and the two-column form layout

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Church life — attendance (overview and check-in sheet), small groups and prayer requests

**Files:**
- Rewrite: `frontend/src/app/admin/attendance/page.tsx`, `frontend/src/app/admin/attendance/[eventId]/page.tsx`, `frontend/src/app/admin/groups/page.tsx`, `frontend/src/app/admin/prayers/page.tsx`

**Interfaces:**
- Consumes: Task 1 `ADMIN_HOME_CRUMB`, `formGridClass`, `FormSection`, `Field`, `FormActions`, `TableSkeleton`, `CardListSkeleton`, `LoadError`, `statusTone`, `statusLabel`; 8a `PageHeader`, `SimpleTable`, `ConfirmDialog`, `Badge`, `Button`, `Input`, `Textarea`, `Select`, `Label`, `EmptyState`; existing hooks `useCheckInEvents`, `useAttendanceSummary`, `useEventAttendance`, `useCheckIn`, `useUndoCheckIn`, `useMemberSearch`, `useAdminGroups`, `useDeactivateGroup`, `useMinistries`, `useSaveGroup`, `useSetGroupLeaders` (types `GroupInput`, `GroupSummary`), `useAdminPrayerRequests`, `useApprovePrayer`, `useSetPrayerSharing`.
- Produces: nothing used by other tasks.

- [ ] **Step 1: Attendance overview**

Replace the whole of `frontend/src/app/admin/attendance/page.tsx` with:

```tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import PageHeader from '@/components/ui/page-header';
import { FormSection } from '@/components/admin/form-layout';
import { CardListSkeleton, LoadError } from '@/components/admin/states';
import { ADMIN_HOME_CRUMB } from '@/components/admin/admin-nav';
import { useAttendanceSummary, useCheckInEvents } from '@/hooks/useApi';
import { formatDateTime } from '@/lib/utils';

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed border-input bg-surface/50 px-4 py-6 text-center text-sm text-muted">
      {children}
    </p>
  );
}

export default function AdminAttendancePage() {
  const eventsQuery = useCheckInEvents();
  const summaryQuery = useAttendanceSummary();
  const events = eventsQuery.data ?? [];
  const summary = summaryQuery.data;
  const maxTotal = Math.max(1, ...(summary ?? []).map((row) => row.total));

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={[ADMIN_HOME_CRUMB, { label: 'Attendance' }]}
        title="Attendance"
        description="Check people in to an event and follow headcounts over time."
      />

      <FormSection title="Check in" description="Events from the last and next two weeks.">
        {eventsQuery.isLoading ? (
          <CardListSkeleton count={2} label="Loading events" />
        ) : eventsQuery.isError && !eventsQuery.data ? (
          <LoadError what="events" onRetry={() => eventsQuery.refetch()} />
        ) : events.length === 0 ? (
          <Empty>No events in the last or next two weeks.</Empty>
        ) : (
          <ul className="divide-y divide-border">
            {events.map((event) => (
              <li key={event.id}>
                <Link
                  href={`/admin/attendance/${event.id}`}
                  className="flex min-h-11 items-center justify-between gap-3 rounded-lg py-3 text-foreground transition-colors hover:text-link focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{event.name}</span>
                    <span className="text-xs text-muted">
                      {formatDateTime(event.event_date)}
                      {event.location ? ` · ${event.location}` : ''}
                    </span>
                  </span>
                  <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-link">
                    Open sheet
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </FormSection>

      <FormSection title="Recent headcounts">
        {summaryQuery.isLoading ? (
          <CardListSkeleton count={2} label="Loading headcounts" />
        ) : summaryQuery.isError && !summary ? (
          <LoadError what="headcounts" onRetry={() => summaryQuery.refetch()} />
        ) : !summary || summary.length === 0 ? (
          <Empty>No past events with attendance yet.</Empty>
        ) : (
          <ul className="space-y-4">
            {summary.map((row) => (
              <li key={row.event_id} className="space-y-1">
                <div className="flex flex-col gap-1 text-sm sm:flex-row sm:justify-between sm:gap-3">
                  <span className="min-w-0 truncate font-medium text-foreground">
                    {row.name} <span className="text-muted">· {formatDateTime(row.event_date)}</span>
                  </span>
                  <span className="shrink-0 tabular-nums text-foreground">
                    {row.total} ({row.members} members, {row.guests} guests)
                  </span>
                </div>
                <div className="h-2 rounded-full border border-border bg-surface" aria-hidden="true">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${(row.total / maxTotal) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </FormSection>
    </div>
  );
}
```

- [ ] **Step 2: Check-in sheet**

Replace the whole of `frontend/src/app/admin/attendance/[eventId]/page.tsx` with:

```tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { CalendarX } from 'lucide-react';
import EmptyState from '@/components/ui/empty-state';
import PageHeader from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormSection } from '@/components/admin/form-layout';
import { CardListSkeleton, LoadError } from '@/components/admin/states';
import { ADMIN_HOME_CRUMB } from '@/components/admin/admin-nav';
import { useCheckIn, useEventAttendance, useMemberSearch, useUndoCheckIn } from '@/hooks/useApi';
import { formatDateTime } from '@/lib/utils';

const fullName = (person: { first_name: string; last_name: string }) =>
  `${person.first_name || ''} ${person.last_name || ''}`.trim() || 'Member';

const crumbs = [ADMIN_HOME_CRUMB, { label: 'Attendance', href: '/admin/attendance' }];

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed border-input bg-surface/50 px-4 py-6 text-center text-sm text-muted">
      {children}
    </p>
  );
}

export default function EventCheckInPage() {
  const params = useParams<{ eventId: string }>();
  const id = Number(params?.eventId);
  const eventId = Number.isInteger(id) && id > 0 ? id : undefined;

  const { data: sheet, isLoading, error, refetch } = useEventAttendance(eventId);
  const checkIn = useCheckIn(eventId);
  const undo = useUndoCheckIn();

  const [searchInput, setSearchInput] = React.useState('');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [guestName, setGuestName] = React.useState('');
  const { data: searchResults, isFetching: searching } = useMemberSearch(searchTerm);

  // Wait for a pause in typing before searching.
  React.useEffect(() => {
    const timer = setTimeout(() => setSearchTerm(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const checkedInIds = new Set([
    ...(sheet?.registered ?? []).filter((p) => p.checked_in).map((p) => p.user_id),
    ...(sheet?.walk_in_members ?? []).map((p) => p.user_id),
  ]);
  const busy = checkIn.isPending || undo.isPending;
  const cancelled = sheet?.event.status === 'cancelled';

  const addGuest = (event: React.FormEvent) => {
    event.preventDefault();
    const name = guestName.trim();
    if (!name) return;
    checkIn.mutate({ guestName: name }, { onSuccess: () => setGuestName('') });
  };

  // Keep showing a loaded sheet if a background refresh fails (e.g. a flaky connection mid check-in).
  const notFound = !eventId || (error as any)?.response?.status === 404;

  if (notFound) {
    return (
      <div className="space-y-6">
        <PageHeader breadcrumb={[...crumbs, { label: 'Check-in' }]} title="Check-in" />
        <EmptyState
          icon={CalendarX}
          title="This event could not be found."
          action={
            <Button asChild variant="secondary">
              <Link href="/admin/attendance">Back to attendance</Link>
            </Button>
          }
        />
      </div>
    );
  }

  if (error && !sheet) {
    return (
      <div className="space-y-6">
        <PageHeader breadcrumb={[...crumbs, { label: 'Check-in' }]} title="Check-in" />
        <LoadError what="the check-in sheet" onRetry={() => refetch()} />
      </div>
    );
  }

  if (isLoading || !sheet) {
    return (
      <div className="space-y-6">
        <PageHeader breadcrumb={[...crumbs, { label: 'Check-in' }]} title="Check-in" />
        <CardListSkeleton count={3} label="Loading check-in sheet" className="grid gap-6 lg:grid-cols-2" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={[...crumbs, { label: sheet.event.name }]}
        title={sheet.event.name}
        description={`${formatDateTime(sheet.event.event_date)}${sheet.event.location ? ` · ${sheet.event.location}` : ''}`}
      />

      <div className="space-y-3">
        {cancelled && (
          <p role="status" className="text-sm font-semibold text-danger">
            This event was cancelled; check-in is closed.
          </p>
        )}
        <div className="flex flex-wrap gap-2" aria-label="Totals">
          <Badge tone="gold">{sheet.totals.total} present</Badge>
          <Badge tone="neutral">{sheet.totals.checked_in_members} members</Badge>
          <Badge tone="neutral">{sheet.totals.guests} guests</Badge>
          <Badge tone="neutral">{sheet.totals.registered} registered</Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <FormSection title={`Registered (${sheet.registered.length})`}>
          {sheet.registered.length === 0 ? (
            <Empty>Nobody registered for this event.</Empty>
          ) : (
            <ul className="divide-y divide-border">
              {sheet.registered.map((person) => (
                <li key={person.user_id} className="flex items-center justify-between gap-3 py-2">
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-foreground">{fullName(person)}</span>
                    <span className="block truncate text-xs text-muted">{person.email}</span>
                  </span>
                  {person.checked_in && person.record_id ? (
                    <Button size="sm" variant="secondary" disabled={busy} onClick={() => undo.mutate(person.record_id as number)}>
                      Undo
                    </Button>
                  ) : (
                    <Button size="sm" disabled={busy || cancelled} onClick={() => checkIn.mutate({ userId: person.user_id })}>
                      Check in
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </FormSection>

        <div className="space-y-6">
          <FormSection title="Add someone">
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="member-search">Find a member</Label>
                <Input
                  id="member-search"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Name or email (at least 2 letters)"
                  disabled={cancelled}
                />
                {searchTerm.trim().length >= 2 && (
                  <ul className="divide-y divide-border" aria-live="polite">
                    {searching && <li className="py-2 text-xs text-muted">Searching...</li>}
                    {!searching && (searchResults ?? []).length === 0 && (
                      <li className="py-2 text-xs text-muted">No members match.</li>
                    )}
                    {(searchResults ?? []).map((member) => {
                      const already = checkedInIds.has(member.id);
                      return (
                        <li key={member.id} className="flex items-center justify-between gap-3 py-2">
                          <span className="min-w-0">
                            <span className="block truncate font-medium text-foreground">{fullName(member)}</span>
                            <span className="block truncate text-xs text-muted">{member.email}</span>
                          </span>
                          <Button
                            size="sm"
                            variant={already ? 'secondary' : 'primary'}
                            disabled={already || busy || cancelled}
                            onClick={() => checkIn.mutate({ userId: member.id })}
                          >
                            {already ? 'Checked in' : 'Check in'}
                          </Button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <form onSubmit={addGuest} className="space-y-2">
                <Label htmlFor="guest-name">Walk-in guest</Label>
                <div className="flex gap-2">
                  <Input
                    id="guest-name"
                    value={guestName}
                    onChange={(event) => setGuestName(event.target.value)}
                    placeholder="Guest's name"
                    maxLength={255}
                    disabled={cancelled}
                  />
                  <Button type="submit" disabled={!guestName.trim() || busy || cancelled}>
                    Add
                  </Button>
                </div>
              </form>
            </div>
          </FormSection>

          <FormSection title={`Walk-ins (${sheet.walk_in_members.length + sheet.guests.length})`}>
            {sheet.walk_in_members.length + sheet.guests.length === 0 ? (
              <Empty>No walk-ins yet.</Empty>
            ) : (
              <ul className="divide-y divide-border">
                {sheet.walk_in_members.map((person) => (
                  <li key={`m-${person.record_id}`} className="flex items-center justify-between gap-3 py-2">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="truncate text-foreground">{fullName(person)}</span>
                      <Badge tone="neutral">Member</Badge>
                    </span>
                    <Button size="sm" variant="secondary" disabled={busy} onClick={() => undo.mutate(person.record_id)}>
                      Undo
                    </Button>
                  </li>
                ))}
                {sheet.guests.map((guest) => (
                  <li key={`g-${guest.record_id}`} className="flex items-center justify-between gap-3 py-2">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="truncate text-foreground">{guest.guest_name}</span>
                      <Badge tone="gold">Guest</Badge>
                    </span>
                    <Button size="sm" variant="secondary" disabled={busy} onClick={() => undo.mutate(guest.record_id)}>
                      Undo
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </FormSection>
        </div>
      </div>
    </div>
  );
}
```

Check that `CalendarX` exists in lucide-react 0.294 (`grep -c "declare const CalendarX:" frontend/node_modules/lucide-react/dist/lucide-react.d.ts` prints `1`); if not, use `CalendarDays`.

- [ ] **Step 3: Small groups**

Replace the whole of `frontend/src/app/admin/groups/page.tsx` with:

```tsx
'use client';

import React from 'react';
import { X } from 'lucide-react';
import ConfirmDialog from '@/components/ui/confirm-dialog';
import PageHeader from '@/components/ui/page-header';
import SimpleTable from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Field, FormActions, FormSection, formGridClass } from '@/components/admin/form-layout';
import { LoadError, TableSkeleton } from '@/components/admin/states';
import { ADMIN_HOME_CRUMB } from '@/components/admin/admin-nav';
import {
  useAdminGroups,
  useDeactivateGroup,
  useMemberSearch,
  useMinistries,
  useSaveGroup,
  useSetGroupLeaders,
  type GroupInput,
  type GroupSummary,
} from '@/hooks/useApi';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

type FormState = {
  name: string;
  description: string;
  meetingDay: string;
  meetingTime: string;
  location: string;
  capacity: string;
  ministryId: string;
};

const EMPTY: FormState = { name: '', description: '', meetingDay: '', meetingTime: '', location: '', capacity: '', ministryId: '' };

const toInput = (form: FormState): GroupInput => ({
  name: form.name.trim(),
  description: form.description.trim() || null,
  meetingDay: form.meetingDay || null,
  meetingTime: form.meetingTime || null,
  location: form.location.trim() || null,
  capacity: form.capacity ? Number(form.capacity) : null,
  ministryId: form.ministryId ? Number(form.ministryId) : null,
});

type Leader = { user_id: number; name: string };

function LeadersEditor({ group, onDone }: { group: GroupSummary; onDone: () => void }) {
  const [leaders, setLeaders] = React.useState<Leader[]>(
    group.leaders.map((leader) => ({ user_id: leader.user_id, name: `${leader.first_name} ${leader.last_name}`.trim() }))
  );
  const [searchInput, setSearchInput] = React.useState('');
  const [term, setTerm] = React.useState('');
  const { data: results } = useMemberSearch(term);
  const save = useSetGroupLeaders(group.id);

  React.useEffect(() => {
    const timer = setTimeout(() => setTerm(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const add = (leader: Leader) =>
    setLeaders((current) => (current.some((l) => l.user_id === leader.user_id) || current.length >= 10 ? current : [...current, leader]));

  return (
    <FormSection title={`Leaders of ${group.name}`} description="Up to 10 leaders. Leaders approve join requests on the group's page.">
      <div className="space-y-5">
        <div className="flex flex-wrap gap-2">
          {leaders.length === 0 && <span className="text-sm text-muted">No leaders yet.</span>}
          {leaders.map((leader) => (
            <span
              key={leader.user_id}
              className="inline-flex items-center gap-1 rounded-full bg-gold-soft py-1 pl-3 pr-1 text-sm font-medium text-gold-ink"
            >
              {leader.name || `Member #${leader.user_id}`}
              <button
                type="button"
                aria-label={`Remove ${leader.name}`}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-gold/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => setLeaders((current) => current.filter((l) => l.user_id !== leader.user_id))}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </span>
          ))}
        </div>
        <div className="space-y-2">
          <Label htmlFor="leader-search">Add a leader</Label>
          <Input
            id="leader-search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search members by name or email"
          />
          {term.trim().length >= 2 && (
            <ul className="divide-y divide-border">
              {(results ?? []).map((member) => (
                <li key={member.id} className="flex items-center justify-between gap-3 py-2">
                  <span className="min-w-0 truncate text-sm text-foreground">
                    {`${member.first_name} ${member.last_name}`.trim()} <span className="text-muted">{member.email}</span>
                  </span>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => add({ user_id: member.id, name: `${member.first_name} ${member.last_name}`.trim() })}
                  >
                    Add
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex flex-wrap gap-3 border-t border-border pt-5">
          <Button disabled={save.isPending} onClick={() => save.mutate(leaders.map((l) => l.user_id), { onSuccess: onDone })}>
            Save leaders
          </Button>
          <Button variant="secondary" onClick={onDone}>
            Close
          </Button>
        </div>
      </div>
    </FormSection>
  );
}

export default function AdminGroupsPage() {
  const { data: groups, isLoading, isError, refetch } = useAdminGroups();
  const { data: ministries } = useMinistries();
  const save = useSaveGroup();
  const deactivate = useDeactivateGroup();

  const [editingId, setEditingId] = React.useState<number | undefined>();
  const [form, setForm] = React.useState<FormState>(EMPTY);
  const [leadersFor, setLeadersFor] = React.useState<GroupSummary | null>(null);
  const [pendingDeactivate, setPendingDeactivate] = React.useState<GroupSummary | null>(null);

  const set = (field: keyof FormState) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm((current) => ({ ...current, [field]: event.target.value }));

  const startEdit = (group: GroupSummary) => {
    setEditingId(group.id);
    setForm({
      name: group.name,
      description: group.description || '',
      meetingDay: group.meeting_day || '',
      meetingTime: group.meeting_time || '',
      location: group.location || '',
      capacity: group.capacity !== null ? String(group.capacity) : '',
      ministryId: group.ministry_id !== null ? String(group.ministry_id) : '',
    });
  };

  const resetForm = () => {
    setEditingId(undefined);
    setForm(EMPTY);
  };

  const reactivate = (group: GroupSummary) =>
    save.mutate({
      id: group.id,
      input: {
        ...toInput({
          name: group.name,
          description: group.description || '',
          meetingDay: group.meeting_day || '',
          meetingTime: group.meeting_time || '',
          location: group.location || '',
          capacity: group.capacity !== null ? String(group.capacity) : '',
          ministryId: group.ministry_id !== null ? String(group.ministry_id) : '',
        }),
        isActive: true,
      },
    });

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={[ADMIN_HOME_CRUMB, { label: 'Small groups' }]}
        title="Small groups"
        description="Create groups and assign leaders. Leaders approve join requests on the group's page."
      />

      <FormSection title={editingId ? 'Edit group' : 'New group'}>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            save.mutate({ id: editingId, input: toInput(form) }, { onSuccess: resetForm });
          }}
          className={formGridClass}
        >
          <Field label="Name" htmlFor="group-name" full>
            <Input id="group-name" value={form.name} onChange={set('name')} required maxLength={255} />
          </Field>
          <Field label="Description" htmlFor="group-description" full>
            <Textarea id="group-description" rows={3} maxLength={2000} value={form.description} onChange={set('description')} />
          </Field>
          <Field label="Meeting day" htmlFor="group-day">
            <Select id="group-day" value={form.meetingDay} onChange={set('meetingDay')}>
              <option value="">Not set</option>
              {DAYS.map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Meeting time" htmlFor="group-time">
            <Input id="group-time" type="time" value={form.meetingTime} onChange={set('meetingTime')} />
          </Field>
          <Field label="Location" htmlFor="group-location">
            <Input id="group-location" value={form.location} onChange={set('location')} maxLength={255} />
          </Field>
          <Field label="Capacity" htmlFor="group-capacity" hint="Leave blank for no limit.">
            <Input id="group-capacity" type="number" min={1} max={1000} value={form.capacity} onChange={set('capacity')} />
          </Field>
          <Field label="Ministry" htmlFor="group-ministry" full>
            <Select id="group-ministry" value={form.ministryId} onChange={set('ministryId')}>
              <option value="">None</option>
              {((ministries ?? []) as Array<{ id: number; name: string }>).map((ministry) => (
                <option key={ministry.id} value={String(ministry.id)}>
                  {ministry.name}
                </option>
              ))}
            </Select>
          </Field>
          <FormActions>
            <Button type="submit" disabled={save.isPending}>
              {editingId ? 'Save changes' : 'Create group'}
            </Button>
            {editingId && (
              <Button type="button" variant="secondary" onClick={resetForm}>
                Cancel
              </Button>
            )}
          </FormActions>
        </form>
      </FormSection>

      {leadersFor && <LeadersEditor key={leadersFor.id} group={leadersFor} onDone={() => setLeadersFor(null)} />}

      {isLoading ? (
        <TableSkeleton label="Loading groups" />
      ) : isError && !groups ? (
        <LoadError what="groups" onRetry={() => refetch()} />
      ) : (
        <SimpleTable
          emptyMessage="No groups yet."
          columns={[
            {
              key: 'name',
              header: 'Group',
              render: (group: GroupSummary) => (
                <div className="space-y-1">
                  <p className="font-semibold text-foreground">{group.name}</p>
                  <p className="text-xs text-muted">
                    {group.leaders.length > 0
                      ? `Led by ${group.leaders.map((l) => `${l.first_name} ${l.last_name}`.trim()).join(', ')}`
                      : 'No leader'}
                  </p>
                </div>
              ),
            },
            {
              key: 'member_count',
              header: 'Members',
              render: (group: GroupSummary) =>
                `${group.member_count} members${group.capacity !== null ? ` of ${group.capacity}` : ''}`,
            },
            {
              key: 'is_active',
              header: 'Status',
              render: (group: GroupSummary) => (
                <Badge tone={group.is_active ? 'success' : 'danger'}>{group.is_active ? 'Active' : 'Inactive'}</Badge>
              ),
            },
            {
              key: 'actions',
              header: 'Actions',
              render: (group: GroupSummary) => (
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary" onClick={() => startEdit(group)} aria-label={`Edit ${group.name}`}>
                    Edit
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => setLeadersFor(group)} aria-label={`Leaders of ${group.name}`}>
                    Leaders
                  </Button>
                  {group.is_active ? (
                    <Button size="sm" variant="secondary" onClick={() => setPendingDeactivate(group)} aria-label={`Deactivate ${group.name}`}>
                      Deactivate
                    </Button>
                  ) : (
                    <Button size="sm" variant="secondary" disabled={save.isPending} onClick={() => reactivate(group)}>
                      Reactivate
                    </Button>
                  )}
                </div>
              ),
            },
          ]}
          data={groups ?? []}
        />
      )}

      {pendingDeactivate && (
        <ConfirmDialog
          title={`Deactivate "${pendingDeactivate.name}"?`}
          description="Members keep their membership, but the group is hidden and stops accepting requests. You can reactivate it later."
          confirmLabel="Deactivate"
          onCancel={() => setPendingDeactivate(null)}
          onConfirm={() => {
            deactivate.mutate(pendingDeactivate.id);
            setPendingDeactivate(null);
          }}
        />
      )}
    </div>
  );
}
```

`reactivate` is the old inline Reactivate `onClick` body moved into a named function; the payload is identical.

- [ ] **Step 4: Prayer requests**

Replace the whole of `frontend/src/app/admin/prayers/page.tsx` with:

```tsx
'use client';

import React from 'react';
import PageHeader from '@/components/ui/page-header';
import SimpleTable from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadError, TableSkeleton } from '@/components/admin/states';
import { ADMIN_HOME_CRUMB } from '@/components/admin/admin-nav';
import { statusLabel, statusTone } from '@/components/admin/status';
import { useAdminPrayerRequests, useApprovePrayer, useSetPrayerSharing } from '@/hooks/useApi';

type AdminPrayer = {
  id: number;
  title: string;
  description?: string;
  category?: string;
  status?: string;
  created_at?: string;
  share_on_wall?: boolean;
  is_anonymous?: boolean;
};

export default function AdminPrayersPage() {
  const { data, isLoading, isError, refetch } = useAdminPrayerRequests();
  const approve = useApprovePrayer();
  const setSharing = useSetPrayerSharing();
  const [query, setQuery] = React.useState('');
  const prayers = (data ?? []) as AdminPrayer[];

  const filteredPrayers = prayers.filter((prayer) => {
    const q = query.trim().toLowerCase();
    return !q || prayer.title.toLowerCase().includes(q) || String(prayer.category || '').toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={[ADMIN_HOME_CRUMB, { label: 'Prayer requests' }]}
        title="Prayer requests"
        description="Review incoming requests and approve them."
      />

      <div className="w-full sm:max-w-sm">
        <Input
          aria-label="Search prayer requests"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by title or category"
        />
      </div>

      {isLoading ? (
        <TableSkeleton label="Loading prayer requests" />
      ) : isError && prayers.length === 0 ? (
        <LoadError what="prayer requests" onRetry={() => refetch()} />
      ) : (
        <SimpleTable
          emptyMessage={query.trim() ? 'No prayer requests match your search.' : 'No prayer requests yet.'}
          columns={[
            {
              key: 'title',
              header: 'Request',
              render: (prayer: AdminPrayer) => (
                <div>
                  <p className="font-semibold text-foreground">{prayer.title}</p>
                  <p className="line-clamp-2 text-xs text-muted">{prayer.description}</p>
                </div>
              ),
            },
            {
              key: 'category',
              header: 'Category',
              render: (prayer: AdminPrayer) => <span className="capitalize">{prayer.category || 'general'}</span>,
            },
            {
              key: 'share_on_wall',
              header: 'Wall',
              render: (prayer: AdminPrayer) =>
                prayer.share_on_wall ? (
                  <Badge tone="gold">{prayer.is_anonymous ? 'Shared (anonymous)' : 'Shared'}</Badge>
                ) : (
                  <span className="text-xs text-muted">Private</span>
                ),
            },
            {
              key: 'status',
              header: 'Status',
              render: (prayer: AdminPrayer) => (
                <Badge tone={statusTone(prayer.status || 'pending')}>{statusLabel(prayer.status || 'pending')}</Badge>
              ),
            },
            {
              key: 'actions',
              header: 'Actions',
              render: (prayer: AdminPrayer) => (
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => approve.mutate(prayer.id)}
                    disabled={approve.isPending || prayer.status === 'approved'}
                  >
                    {prayer.status === 'approved' ? 'Approved' : 'Approve'}
                  </Button>
                  {prayer.share_on_wall && (
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={setSharing.isPending}
                      onClick={() =>
                        setSharing.mutate({
                          id: prayer.id,
                          title: prayer.title,
                          description: prayer.description || '',
                          category: prayer.category || 'other',
                          shareOnWall: false,
                        })
                      }
                    >
                      Remove from wall
                    </Button>
                  )}
                </div>
              ),
            },
          ]}
          data={filteredPrayers}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 5: Field-by-field and action check**

Compare with `git show HEAD:<path>`:
- [ ] Check-in sheet: member search (300 ms debounce, ≥2 letters, disabled when cancelled), Check in/Checked in/Undo buttons with the same `disabled` conditions, walk-in guest form (`maxLength={255}`, disabled when cancelled), the 404 vs error vs loading order of the early returns.
- [ ] Groups: `group-name` (required, 255), `group-description` (2000), `group-day` (Not set + 7 days), `group-time` (`time`), `group-location` (255), `group-capacity` (`number`, 1–1000), `group-ministry` (None + ministries); Leaders editor still caps at 10, de-duplicates and saves the user ids; Reactivate sends the same payload with `isActive: true`.
- [ ] Prayers: Approve disabled while an approval is in flight or when already approved; Remove from wall only when shared, with the same payload.

- [ ] **Step 6: Colour scan, type-check, lint and build**

```bash
grep -nE "(sky|cyan|amber|slate|gray|indigo|purple|rose|pink|teal|green|red|orange|emerald|blue|violet)-[0-9]|#[0-9A-Fa-f]{3,6}\b" frontend/src/app/admin/attendance/page.tsx "frontend/src/app/admin/attendance/[eventId]/page.tsx" frontend/src/app/admin/groups/page.tsx frontend/src/app/admin/prayers/page.tsx ; echo "scan-exit=$?"
cd frontend && npm run -s type-check && npm run -s lint && npm run -s build
```

Expected: no scan lines and `scan-exit=1`; all three checks pass. (Note `Member #${leader.user_id}` is not flagged: `#$` is not hex.)

- [ ] **Step 7: Check by eye (375px and 1280px, light and dark)**

- [ ] `/admin/attendance`: events list rows are full-width 44px links with "Open sheet ›"; headcount bars are primary on a bordered track.
- [ ] Check-in sheet: breadcrumb "Admin › Attendance › <event>", totals as badges ("N present" gold); Registered and Add someone side by side at 1280px, stacked at 375px; Check in, Undo, member search and Add guest all work; a cancelled event shows the red notice and disables check-in.
- [ ] `/admin/attendance/abc` shows "This event could not be found." with a Back to attendance button; stopping the backend on a fresh load shows "Couldn't load the check-in sheet".
- [ ] Groups: two-column form (Meeting day | Meeting time, Location | Capacity); table with Active/Inactive badges; at 375px Edit, Leaders and Deactivate/Reactivate are visible in each card; Deactivate asks first; leader chips are gold with a round remove button.
- [ ] Prayers: Wall and Status badges have text; Approve and Remove from wall visible at 375px.
- [ ] Dark mode on all four: chips, bars and badges readable; no white boxes.

- [ ] **Step 8: Commit**

```bash
git add frontend/src/app/admin/attendance frontend/src/app/admin/groups frontend/src/app/admin/prayers
git commit -m "feat(admin): attendance, check-in sheet, small groups and prayer requests on the shared admin layout

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: People & giving, activity log and settings — members, donations, audit and settings

**Files:**
- Rewrite: `frontend/src/app/admin/users/page.tsx`, `frontend/src/app/admin/donations/page.tsx`, `frontend/src/app/admin/audit/page.tsx`, `frontend/src/app/admin/settings/page.tsx`

**Interfaces:**
- Consumes: Task 1 `ADMIN_HOME_CRUMB`, `StatCard`, `formGridClass`, `FormSection`, `Field`, `FormActions`, `TableSkeleton`, `CardListSkeleton`, `LoadError`, `statusTone`, `statusLabel`; 8a `PageHeader`, `SimpleTable`, `Badge`, `Button`, `Input`, `Textarea`, `Select`; existing hooks `useAdminUsers`, `useUpdateUserRole`, `useAdminDonations`, `useUpdateDonationStatus`, `useAuditLogs`; `apiClient`; `formatCurrency`.
- Produces: nothing used by other tasks.

- [ ] **Step 1: Members (`/admin/users`)**

Replace the whole of `frontend/src/app/admin/users/page.tsx` with:

```tsx
'use client';

import React from 'react';
import { UserRoundCog, Users, UsersRound } from 'lucide-react';
import PageHeader from '@/components/ui/page-header';
import SimpleTable from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import StatCard from '@/components/admin/stat-card';
import { LoadError, TableSkeleton } from '@/components/admin/states';
import { ADMIN_HOME_CRUMB } from '@/components/admin/admin-nav';
import { useAdminUsers, useUpdateUserRole } from '@/hooks/useApi';

type AdminUser = {
  id: number;
  firstName?: string;
  lastName?: string;
  email: string;
  role: 'admin' | 'member';
  is_active?: boolean;
  created_at?: string;
};

export default function AdminUsersPage() {
  const { data, isLoading, isError, refetch } = useAdminUsers();
  const updateRole = useUpdateUserRole();
  const [query, setQuery] = React.useState('');
  const users = (data ?? []) as AdminUser[];

  const filteredUsers = users.filter((user) => {
    const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').toLowerCase();
    const q = query.trim().toLowerCase();
    return !q || fullName.includes(q) || user.email.toLowerCase().includes(q) || user.role.includes(q);
  });

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={[ADMIN_HOME_CRUMB, { label: 'Members' }]}
        title="Members"
        description="Search people and change who has admin access."
      />

      <section aria-label="Totals" className="grid gap-4 sm:grid-cols-3">
        <StatCard label="All accounts" icon={Users} loading={isLoading} value={users.length} />
        <StatCard label="Admins" icon={UserRoundCog} loading={isLoading} value={users.filter((user) => user.role === 'admin').length} />
        <StatCard label="Members" icon={UsersRound} loading={isLoading} value={users.filter((user) => user.role === 'member').length} />
      </section>

      <div className="w-full sm:max-w-sm">
        <Input
          aria-label="Search members"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name, email or role"
        />
      </div>

      {isLoading ? (
        <TableSkeleton label="Loading members" />
      ) : isError && users.length === 0 ? (
        <LoadError what="members" onRetry={() => refetch()} />
      ) : (
        <SimpleTable
          emptyMessage={query.trim() ? 'No one matches your search.' : 'No accounts yet.'}
          columns={[
            {
              key: 'name',
              header: 'Name',
              render: (user: AdminUser) => (
                <div>
                  <p className="font-semibold text-foreground">
                    {[user.firstName, user.lastName].filter(Boolean).join(' ') || 'Unnamed user'}
                  </p>
                  <p className="text-xs text-muted">{user.email}</p>
                </div>
              ),
            },
            {
              key: 'role',
              header: 'Role',
              render: (user: AdminUser) => (
                <Badge tone={user.role === 'admin' ? 'gold' : 'neutral'}>{user.role === 'admin' ? 'Admin' : 'Member'}</Badge>
              ),
            },
            {
              key: 'status',
              header: 'Status',
              render: (user: AdminUser) => (
                <Badge tone={user.is_active === false ? 'danger' : 'success'}>
                  {user.is_active === false ? 'Inactive' : 'Active'}
                </Badge>
              ),
            },
            {
              key: 'actions',
              header: 'Actions',
              render: (user: AdminUser) => (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => updateRole.mutate({ id: user.id, role: user.role === 'admin' ? 'member' : 'admin' })}
                  disabled={updateRole.isPending}
                >
                  Make {user.role === 'admin' ? 'member' : 'admin'}
                </Button>
              ),
            },
          ]}
          data={filteredUsers}
        />
      )}
    </div>
  );
}
```

Check `UserRoundCog` exists in lucide-react 0.294 (the old sidebar imported it, so it does).

- [ ] **Step 2: Donations**

Replace the whole of `frontend/src/app/admin/donations/page.tsx` with:

```tsx
'use client';

import React from 'react';
import { Banknote, CheckCircle2, Hourglass } from 'lucide-react';
import PageHeader from '@/components/ui/page-header';
import SimpleTable from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import StatCard from '@/components/admin/stat-card';
import { LoadError, TableSkeleton } from '@/components/admin/states';
import { ADMIN_HOME_CRUMB } from '@/components/admin/admin-nav';
import { statusLabel, statusTone } from '@/components/admin/status';
import { useAdminDonations, useUpdateDonationStatus } from '@/hooks/useApi';
import { formatCurrency } from '@/lib/utils';

type Donation = {
  id: number;
  reference: string;
  amount: number | string;
  status: string;
  donation_type?: string;
  email?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  created_at?: string;
};

const STATUS_OPTIONS = ['pending', 'completed', 'failed', 'cancelled'];

export default function AdminDonationsPage() {
  const { data, isLoading, isError, refetch } = useAdminDonations();
  const updateStatus = useUpdateDonationStatus();
  const [statusFilter, setStatusFilter] = React.useState('');
  const [query, setQuery] = React.useState('');
  const donations = (data ?? []) as Donation[];

  const filteredDonations = donations.filter((donation) => {
    const q = query.trim().toLowerCase();
    const matchesQuery =
      !q ||
      String(donation.reference || '').toLowerCase().includes(q) ||
      String(donation.email || '').toLowerCase().includes(q) ||
      String(donation.donation_type || '').toLowerCase().includes(q);
    const matchesStatus = !statusFilter || donation.status === statusFilter;
    return matchesQuery && matchesStatus;
  });
  const filtering = Boolean(query.trim() || statusFilter);

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={[ADMIN_HOME_CRUMB, { label: 'Donations' }]}
        title="Donations"
        description="Track donation records and update their status."
      />

      <section aria-label="Totals" className="grid gap-4 sm:grid-cols-3">
        <StatCard label="All records" icon={Banknote} loading={isLoading} value={donations.length} />
        <StatCard
          label="Completed"
          icon={CheckCircle2}
          loading={isLoading}
          value={donations.filter((item) => item.status === 'completed').length}
        />
        <StatCard
          label="Pending"
          icon={Hourglass}
          loading={isLoading}
          value={donations.filter((item) => item.status === 'pending').length}
        />
      </section>

      <div className="flex w-full flex-col gap-3 sm:flex-row">
        <div className="w-full sm:max-w-sm">
          <Input
            aria-label="Search donations"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by reference, email or type"
          />
        </div>
        <Select
          aria-label="Filter by status"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="sm:w-48"
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {statusLabel(status)}
            </option>
          ))}
        </Select>
      </div>

      {isLoading ? (
        <TableSkeleton label="Loading donations" />
      ) : isError && donations.length === 0 ? (
        <LoadError what="donations" onRetry={() => refetch()} />
      ) : (
        <SimpleTable
          emptyMessage={filtering ? 'No donations match the current filters.' : 'No donations yet.'}
          columns={[
            {
              key: 'reference',
              header: 'Reference',
              render: (donation: Donation) => (
                <div>
                  <p className="font-semibold text-foreground">{donation.reference || `Donation #${donation.id}`}</p>
                  <p className="text-xs text-muted">{donation.email || 'No email attached'}</p>
                </div>
              ),
            },
            {
              key: 'amount',
              header: 'Amount',
              render: (donation: Donation) => <span className="font-semibold tabular-nums">{formatCurrency(donation.amount)}</span>,
            },
            {
              key: 'status',
              header: 'Status',
              render: (donation: Donation) => <Badge tone={statusTone(donation.status)}>{statusLabel(donation.status)}</Badge>,
            },
            {
              key: 'actions',
              header: 'Actions',
              render: (donation: Donation) => (
                <div className="flex flex-wrap gap-2">
                  {donation.status !== 'completed' && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => updateStatus.mutate({ id: donation.id, status: 'completed' })}
                      disabled={updateStatus.isPending}
                    >
                      Mark completed
                    </Button>
                  )}
                  {donation.status !== 'failed' && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => updateStatus.mutate({ id: donation.id, status: 'failed' })}
                      disabled={updateStatus.isPending}
                    >
                      Mark failed
                    </Button>
                  )}
                </div>
              ),
            },
          ]}
          data={filteredDonations}
        />
      )}
    </div>
  );
}
```

`CheckCircle2` and `Hourglass` were checked against lucide-react 0.294 while writing this plan (`CircleCheck` does not exist in that version, so do not use it).

- [ ] **Step 3: Activity log (`/admin/audit`)**

Replace the whole of `frontend/src/app/admin/audit/page.tsx` with:

```tsx
'use client';

import React from 'react';
import PageHeader from '@/components/ui/page-header';
import SimpleTable from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { LoadError, TableSkeleton } from '@/components/admin/states';
import { ADMIN_HOME_CRUMB } from '@/components/admin/admin-nav';
import { useAuditLogs } from '@/hooks/useApi';

type AuditLog = {
  id: number;
  summary: string;
  action: string;
  entity_type: string;
  actor_name?: string | null;
  actor_email?: string | null;
  created_at: string;
};

export default function AdminAuditPage() {
  const { data, isLoading, isError, refetch } = useAuditLogs(1, 50);
  const logs = (data?.data || []) as AuditLog[];

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={[ADMIN_HOME_CRUMB, { label: 'Activity log' }]}
        title="Activity log"
        description="Important admin actions across content, settings, members and donations (latest 50)."
      />

      {isLoading ? (
        <TableSkeleton label="Loading activity" />
      ) : isError && logs.length === 0 ? (
        <LoadError what="the activity log" onRetry={() => refetch()} />
      ) : (
        <SimpleTable
          emptyMessage="No activity recorded yet."
          columns={[
            {
              key: 'summary',
              header: 'Summary',
              render: (log: AuditLog) => (
                <div className="space-y-1">
                  <p className="font-semibold text-foreground">{log.summary}</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge tone="neutral">{log.entity_type}</Badge>
                    <Badge tone="neutral">{log.action}</Badge>
                  </div>
                </div>
              ),
            },
            {
              key: 'actor',
              header: 'Actor',
              render: (log: AuditLog) => log.actor_name || log.actor_email || 'System',
            },
            {
              key: 'created_at',
              header: 'When',
              render: (log: AuditLog) => (
                <time dateTime={log.created_at} className="text-muted">
                  {new Date(log.created_at).toLocaleString()}
                </time>
              ),
            },
          ]}
          data={logs}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 4: Settings**

Replace the whole of `frontend/src/app/admin/settings/page.tsx` with:

```tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import apiClient from '@/lib/api';
import PageHeader from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field, FormActions, FormSection, formGridClass } from '@/components/admin/form-layout';
import { CardListSkeleton, LoadError } from '@/components/admin/states';
import { ADMIN_HOME_CRUMB } from '@/components/admin/admin-nav';

type SettingsForm = {
  siteTitle: string;
  contactEmail: string;
  paymentPublicKey: string;
  donationSuccessMessage: string;
};

export default function AdminSettingsPage() {
  const { register, handleSubmit, reset } = useForm<SettingsForm>();
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setLoadFailed(false);
      try {
        const res = await apiClient.get('/admin/settings');
        reset(res.data?.data || {});
      } catch {
        toast.error('Failed to load settings');
        setLoadFailed(true);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [reset, attempt]);

  const onSubmit = async (values: SettingsForm) => {
    setIsSaving(true);
    try {
      const res = await apiClient.put('/admin/settings', values);
      reset(res.data?.data || values);
      toast.success('Settings saved');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={[ADMIN_HOME_CRUMB, { label: 'Settings' }]}
        title="Settings"
        description="Site details and giving options."
      />

      {isLoading ? (
        <CardListSkeleton count={1} label="Loading settings" />
      ) : loadFailed ? (
        <LoadError what="settings" onRetry={() => setAttempt((value) => value + 1)} />
      ) : (
        <FormSection title="Site settings">
          <form onSubmit={handleSubmit(onSubmit)} className={formGridClass}>
            <Field label="Site title" htmlFor="settings-site-title">
              <Input id="settings-site-title" {...register('siteTitle')} />
            </Field>
            <Field label="Contact email" htmlFor="settings-contact-email">
              <Input id="settings-contact-email" type="email" {...register('contactEmail')} />
            </Field>
            <Field
              label="Payment public key"
              htmlFor="settings-payment-key"
              hint="The public key only. Never paste a secret key here."
              full
            >
              <Input id="settings-payment-key" {...register('paymentPublicKey')} />
            </Field>
            <Field label="Donation success message" htmlFor="settings-donation-message" full>
              <Textarea id="settings-donation-message" rows={3} {...register('donationSuccessMessage')} />
            </Field>
            <FormActions>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save settings'}
              </Button>
            </FormActions>
          </form>
        </FormSection>
      )}
    </div>
  );
}
```

(Ruling 8: today a failed load shows the toast and an empty form whose Save would overwrite the real settings with blanks; now it shows the toast and `LoadError` instead.)

- [ ] **Step 5: Field-by-field and action check**

Compare with `git show HEAD:<path>`:
- [ ] Members: search by name/email/role; Make admin/Make member sends the opposite role; disabled while a change is in flight.
- [ ] Donations: search by reference/email/type plus the four-status filter; Mark completed hidden when completed, Mark failed hidden when failed; amounts via `formatCurrency` (`GH₵`).
- [ ] Activity log: still `useAuditLogs(1, 50)`.
- [ ] Settings: the four fields keep their ids, `type="email"` and `register` names; the PUT and the post-save `reset` are unchanged.

- [ ] **Step 6: Colour scan, type-check, lint and build**

```bash
grep -nE "(sky|cyan|amber|slate|gray|indigo|purple|rose|pink|teal|green|red|orange|emerald|blue|violet)-[0-9]|#[0-9A-Fa-f]{3,6}\b" frontend/src/app/admin/users/page.tsx frontend/src/app/admin/donations/page.tsx frontend/src/app/admin/audit/page.tsx frontend/src/app/admin/settings/page.tsx ; echo "scan-exit=$?"
cd frontend && npm run -s type-check && npm run -s lint && npm run -s build
```

Expected: no scan lines and `scan-exit=1` (`Donation #${donation.id}` is not hex); all three checks pass.

- [ ] **Step 7: Check by eye (375px and 1280px, light and dark)**

- [ ] Members: title "Members", three stat cards; role badges "Admin" (gold) / "Member" (neutral) and status badges with text; at 375px "Make admin/member" is visible in each card and works.
- [ ] Donations: stat cards; search and status filter side by side at 1280px, stacked at 375px; filters with no hits say "No donations match the current filters."; Mark completed/failed work from the phone cards.
- [ ] Activity log: entries with entity and action badges, actor and time.
- [ ] Settings: skeleton, then Site title | Contact email, Payment public key (with the hint) and Donation success message full width; Save shows "Settings saved". With the backend stopped: the toast plus "Couldn't load settings" and Try again, and no empty form.
- [ ] Dark mode on all four: stat cards, badges and tables readable; no white boxes.

- [ ] **Step 8: Commit**

```bash
git add frontend/src/app/admin/users frontend/src/app/admin/donations frontend/src/app/admin/audit frontend/src/app/admin/settings
git commit -m "feat(admin): members, donations, activity log and settings on the shared admin layout

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Docs, whole-scope colour scan and final checks

**Files:**
- Modify (append only): `docs/qa-checklist.md`, `docs/features.md`

**Interfaces:**
- Consumes: everything from Tasks 1–9.
- Produces: the finished branch, ready to merge alongside 8b and 8d.

- [ ] **Step 1: Append the QA checklist section**

Append to the end of `docs/qa-checklist.md` (keep one blank line before the heading):

```markdown

## Admin Redesign (Phase 8c)

Check each item at 375px and 1280px wide, in light and dark mode.

- [ ] The sidebar has five groups: Overview (Dashboard, Activity log), Content (Sermons & series, Devotionals, News, Gallery, Announcements, Livestream), Church life (Events, Attendance, Ministries, Small groups, Prayer requests), People & giving (Members, Donations) and Settings
- [ ] The current page is highlighted in the sidebar, including sub-pages (`/admin/series`, `/admin/events/new`, `/admin/gallery/<id>`)
- [ ] On desktop, "Collapse sidebar" shrinks it to icons and the choice survives a reload
- [ ] On a phone, Menu opens the admin drawer; focus goes to Close, Tab stays inside, Escape or the dimmed area closes it, the page behind does not scroll, and focus returns to Menu
- [ ] Choosing a link in the drawer opens the page and closes the drawer; widening the window to desktop closes it too
- [ ] The dashboard shows Members, Giving this month (GH₵), Upcoming events and Pending prayer requests, each linking to its page; quick actions and recent activity work
- [ ] Every admin page has a title with a breadcrumb starting "Admin"
- [ ] Every list shows skeletons while loading, a friendly message when empty (a different one when a search finds nothing), and "Couldn't load …" with Try again when the backend is down
- [ ] On a phone, every table row shows its actions (Edit, Delete, Approve, Mark completed, Make admin, Check in…) and nothing scrolls sideways
- [ ] Forms are two columns on desktop and one column on phones; required fields still refuse to submit when empty
- [ ] Deleting a sermon, series, devotional, event, ministry, album, photo or news post, deactivating a group, and ending the livestream all ask for confirmation first, with Cancel focused
- [ ] Sermons and Series switch with the tabs under the page title
- [ ] Dark mode: no white panels, grey chips or unreadable text anywhere in admin
```

- [ ] **Step 2: Append the features section**

Append to the end of `docs/features.md` (keep one blank line before the heading):

```markdown

## Admin Redesign

- The web admin uses the Clean & classic design system. Its sidebar has five groups: Overview, Content, Church life, People & giving, and Settings. On desktop it can be collapsed to icons (remembered on that browser); on phones it opens as a drawer from the Menu button.
- The dashboard shows four key figures (members, giving this month in GH₵, upcoming events and pending prayer requests), quick actions (new sermon, event or ministry, write a devotional, send an announcement, go live) and recent activity, followed by giving by month, donation mix, publishing, engagement and top events.
- Every admin page has the same title bar with a breadcrumb, the same table (which becomes cards on phones), and the same two-column form layout (one column on phones). Lists show loading placeholders, friendly empty messages and a "Try again" message when they can't load.
- Sermons and series share one sidebar entry and switch with tabs. Members (`/admin/users`) and Activity log (`/admin/audit`) keep their addresses.
- Deleting a news post and ending the livestream now ask for confirmation, like every other delete.
```

- [ ] **Step 3: Whole-scope colour scan**

```bash
grep -rnE "(sky|cyan|amber|slate|gray|indigo|purple|rose|pink|teal|green|red|orange|emerald|blue|violet)-[0-9]|#[0-9A-Fa-f]{3,6}\b" frontend/src/app/admin frontend/src/components/admin frontend/src/components/layout/AdminLayout.tsx frontend/src/components/layout/AdminSidebar.tsx ; echo "scan-exit=$?"
grep -rn "container-max\|text-ui-subtle\|dark:" frontend/src/app/admin frontend/src/components/admin frontend/src/components/layout/AdminLayout.tsx frontend/src/components/layout/AdminSidebar.tsx ; echo "leftover-exit=$?"
grep -rn "window.confirm" frontend/src/app/admin ; echo "confirm-exit=$?"
```

Expected: each command prints no matches, then `scan-exit=1`, `leftover-exit=1` and `confirm-exit=1`. (`dark:` must not appear: tokens switch by themselves.) Any hit is fixed in the file it names and folded into this task's commit.

- [ ] **Step 4: Ownership check**

```bash
git diff --name-only fc3fd49..HEAD ; git status --short
```

Expected: only paths under `frontend/src/app/admin/`, `frontend/src/components/admin/`, `frontend/src/components/layout/AdminLayout.tsx`, `frontend/src/components/layout/AdminSidebar.tsx`, `docs/superpowers/plans/2026-10-09-phase-8c-admin.md`, plus (uncommitted) `docs/qa-checklist.md` and `docs/features.md`. If `frontend/next-env.d.ts` or `frontend/package-lock.json` show as modified, run `git checkout -- frontend/next-env.d.ts frontend/package-lock.json`. Nothing under `frontend/src/components/ui/`, `frontend/src/lib/`, `frontend/src/hooks/`, `frontend/src/styles/`, `frontend/tailwind.config.js`, `mobile/` or `backend/` may appear.

- [ ] **Step 5: All web checks**

```bash
cd frontend && npm run -s check:contrast && npm run -s check:tokens && npm run -s type-check && npm run -s lint && npm run -s build && cd ..
```

Expected: all pass. `check:contrast` and `check:tokens` are 8a's checks; this phase does not touch tokens, so they must pass unchanged.

- [ ] **Step 6: Backend suite (untouched, still 445)**

```bash
cd backend && pnpm install --frozen-lockfile && npx jest --runInBand --coverage=false 2>&1 | grep -E "^Tests:" ; cd ..
git status --short backend
```

Expected: `Tests:       445 passed, 445 total`. If `git status` shows `backend/pnpm-workspace.yaml` modified by pnpm, revert it with `git checkout -- backend/pnpm-workspace.yaml`; nothing under `backend/` may remain modified.

- [ ] **Step 7: Whole-admin walk-through (375px and 1280px, light and dark)**

With `cd frontend && npm run dev` and an admin account, visit every page once at each width and theme, using the QA list from Step 1:
`/admin/dashboard`, `/admin/audit`, `/admin/sermons`, `/admin/sermons/new`, `/admin/sermons/<id>/edit`, `/admin/series`, `/admin/devotionals`, `/admin/news`, `/admin/gallery`, `/admin/gallery/<id>`, `/admin/announcements`, `/admin/live`, `/admin/events`, `/admin/events/new`, `/admin/events/<id>/edit`, `/admin/attendance`, `/admin/attendance/<eventId>`, `/admin/ministries`, `/admin/ministries/new`, `/admin/ministries/<id>/edit`, `/admin/groups`, `/admin/prayers`, `/admin/users`, `/admin/donations`, `/admin/settings`.

Re-walk the Review Focus list at the top of this plan:
- [ ] (1) every form still has all its fields and refuses empty required fields
- [ ] (2) every row action is reachable on a 375px phone
- [ ] (3) the drawer traps focus, locks scrolling and restores focus
- [ ] (4) no dark-mode leftovers
- [ ] (5) every destructive action listed in Review Focus 5 asks first, with Cancel focused and Escape cancelling

Also visit `/admin` (redirects to the dashboard) and a public page (`/`) to confirm the site header and footer are unchanged.

- [ ] **Step 8: Commit**

```bash
git add docs/qa-checklist.md docs/features.md
git commit -m "docs: admin redesign QA checklist and feature notes

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git log --oneline fc3fd49..HEAD
```

Expected: eleven commits on top of `fc3fd49` (the plan, Tasks 1–9 and this one). Do not push or merge; the coordinator merges 8b, 8c and 8d.
