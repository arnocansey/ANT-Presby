# UI/UX Redesign Design

**Date:** 2026-10-08
**Status:** Approved in conversation; awaiting written-spec review.

## 1. Intent

The owner wants the whole product to look modern and consistent, and to be easier to use. That covers the public website, the web admin and the mobile app.

Today's problems:
- **Dated and inconsistent:** colours and spacing vary page to page, and the website (blue and sky) and the app (dark, with orange) don't look like the same church.
- **Hard to navigate:** the website has 9 top-level links, Groups, Devotionals, Gallery, Prayer and Live are hard to find, and the app buries features under Account.
- **Clunky admin:** 17 flat sidebar links, plus tables and forms that differ from page to page.

**Success means:**
- One visual identity across web and app.
- Every member feature is reachable within two taps or clicks of Home.
- Admin pages share one layout, one table style and one form style.
- Every page works in light and dark mode.
- Every page works at phone width.

### Decisions the owner made
| Topic | Decision |
|---|---|
| Visual direction | **C · Clean & classic**: white and navy, with royal blue and a touch of gold |
| Navigation | **B · Few links and a "hub" Home.** The web header has Home, Watch, Events and About, plus a Give button. Everything else is tiles on Home. Mobile tabs are Home, Watch, Events, Give and Me. |
| Admin navigation | 17 flat links become 5 groups: Overview, Content, Church life, People & giving, Settings |
| Dark mode | Light by default, with a matching navy dark theme that follows the device setting, on both web and app |
| Approach | A shared design system first, then a staged restyle: 8a Foundation → 8b Public website, 8c Admin and 8d Mobile, with 8b–8d in parallel |

### Out of scope
- New features, API or schema changes. Every page keeps its data and behaviour.
- A new logo or brand name. The "ANT PRESS" wordmark stays, typeset in the new font.
- Replacing the component approach. We keep Tailwind and the existing `components/ui` primitives, restyled and extended; no new component library.

## 2. Design system

### 2.1 Colour tokens
Both apps use the same tokens. The web defines them as CSS variables in `globals.css`, mapped in `tailwind.config.js`; the app defines them in `mobile/src/constants/theme.ts`.

| Token | Light | Dark | Use |
|---|---|---|---|
| `primary` | #1E3A8A | #6F8FE8 | primary buttons, active navigation |
| `primary-foreground` | #FFFFFF | #0B1530 | text on primary |
| `link` | #1E3A8A | #9DB4F2 | links |
| `accent` (gold) | #C9A227 | #E3C35A | highlights, badges, scripture rule |
| `accent-soft` / `accent-text` | #FBF6E5 / #7A6216 | #3A3214 / #E3C35A | gold badges |
| `background` | #FFFFFF | #0B1530 | page |
| `surface` | #F6F8FC | #12204A | panels, table headers, tiles |
| `card` | #FFFFFF | #12204A | cards |
| `border` | #E6EAF2 | #1F2F5C | dividers, card borders |
| `input-border` | #CBD3E4 | #2A3B6E | inputs, secondary buttons |
| `text` | #13224A | #EEF2FB | body text and headings |
| `text-muted` | #56607A | #A9B4D0 | secondary text |
| `success` | #15803D | #4ADE80 | paid, done |
| `warning` | #B45309 | #FBBF24 | pending |
| `danger` | #B91C1C | #EF4444 | delete, errors, the "Live" pill |

Contrast must meet WCAG AA (4.5:1 for body text) in both themes. Any pair that fails is adjusted in 8a and recorded in the plan.

### 2.2 Type
- **UI and headings:** Inter, via `next/font/google` on the web and the system font on the app (San Francisco or Roboto, which are visually close), so the app needs no font dependency.
- **Scripture and quotes:** Source Serif 4 on the web via `next/font`, and the platform serif (Georgia or serif) on the app. These get a 3px gold left rule.
- **Scale:**
  - page title 30/36 bold (24 on mobile)
  - section 20/28 semibold
  - body 16/26
  - small 14/20
  - caption 12/16

### 2.3 Shape, spacing and motion
- **Spacing:** an 8-point grid.
- **Corners:** 8px on buttons and inputs, 12px on cards, 16px on large panels.
- **Touch targets:** at least 44px.
- **Shadows:** one subtle card shadow in light mode, none in dark mode (borders carry the depth).
- **Motion:** 150–200 ms ease-out on hover and press, and none under `prefers-reduced-motion`.

### 2.4 Components (the web `components/ui`, mirrored in the app's `components/ui`)
| Component | Variants and rules |
|---|---|
| **Button** | primary, secondary (outline), ghost, link, danger. Sizes sm, md (44px) and lg. Has a loading state and shows a visible focus ring. |
| **Card** | default and interactive (hover lift); optional media header |
| **Input, Textarea, Select, Checkbox, Switch** | label above, hint and error text below, red border on error |
| **Badge** | neutral, gold, success, warning, danger, live (red, pulsing dot) |
| **PageHeader** | title, description, breadcrumb (admin) and action slot |
| **Section** | title, "See all" link and content |
| **Tile** | icon, label and optional count/status (for the hub Home) |
| **EmptyState** | icon, message and optional action |
| **Skeleton** | text, card and table-row shapes |
| **Table (admin)** | sticky header, zebra-free rows separated by borders, row actions, a responsive card fallback below 640px, and an empty state |
| **Tabs** | underline style |
| **Toast** | the existing `react-hot-toast`, styled to the tokens |
| **Modal, ConfirmDialog** | restyled existing ones |
| **ThemeToggle** | web only, with System, Light and Dark choices (`next-themes` is already installed) |

## 3. Navigation and information architecture

### 3.1 Website (public)
- **Header:**
  - the ANT PRESS wordmark
  - links: **Home · Watch · Events · About**
  - a **Give** button (primary)
  - search, the notification bell and the account menu (when signed in), and Sign in (when signed out)
  - On phones, a slide-over menu holds the same links plus all the hub destinations.
- **Watch** (`/sermons` restyled as the Watch hub): the live banner/player link when live, the latest sermon, series, and all sermons.
- **About** (`/about`): church info, plus links to Ministries, Contact, FAQ, Privacy and Terms.
- **The Home hub, top to bottom:**
  1. hero with the next service and Plan a visit / Watch live
  2. today's devotional
  3. a **tile grid** with Live, Devotional, Small groups, Prayer wall, Gallery, News, Community, Ministries and My dashboard (signed in)
  4. upcoming events
  5. the latest sermon
  6. news
- **Footer:** the same destinations grouped, plus contact details and service times.
- **Existing URLs stay valid.** Nothing is renamed; navigation only regroups links.

### 3.2 Mobile app
- **Tabs:**
  - **Home** (the hub: greeting, live card, devotional, tile grid as on the web, upcoming events)
  - **Watch** (the sermons tab, plus the live card and series)
  - **Events**
  - **Give**
  - **Me** (the account tab: profile, my groups, my registrations, donations, notifications, settings and sign out, plus Admin for admins)
- Screens outside the tabs (groups, devotional, gallery, prayer wall, news, community, ministries) open from Home tiles or Me.

### 3.3 Admin (web)
- **The sidebar groups:**
  - **Overview:** Dashboard, Activity log
  - **Content:** Sermons & series, Devotionals, News, Gallery, Announcements, Livestream
  - **Church life:** Events, Attendance, Ministries, Small groups, Prayer requests
  - **People & giving:** Members, Donations
  - **Settings**
- **Behaviour:** collapsible on desktop, a drawer on phones, and the active item highlighted.
- **Pages:** every admin page uses PageHeader, plus Table or a card grid, plus forms in a consistent two-column layout (one column on phones).
- **Dashboard:** key-figure cards (members, giving this month in GH₵, upcoming events, pending prayer requests and join requests), quick actions, and recent activity.
- **Mobile admin screens:** restyled in 8d to the same tokens, with structure unchanged.

## 4. Stages

| Stage | Scope | Depends on |
|---|---|---|
| **8a Foundation** | Tokens (web CSS variables plus the Tailwind mapping, and the app theme); fonts; the web ThemeProvider plus ThemeToggle; restyled and new web UI components (§2.4); the new website header, mobile menu and footer; the **hub Home page**; the matching app UI primitives (Button, Card, Badge, Tile, EmptyState, Skeleton, Input) and app theme switching that follows the device | — |
| **8b Public website** | Every public and member page restyled with the 8a components: sermons/Watch, sermon detail, series, events and detail, donate, devotionals, groups, prayer, gallery, live, news, community, ministries, about/contact/faq/legal, auth (login, register, verify), dashboard, profile, search | 8a |
| **8c Admin** | The grouped sidebar and admin layout, the dashboard redesign, and every admin page moved to PageHeader + Table + form layout | 8a |
| **8d Mobile app** | The new tab bar (Home/Watch/Events/Give/Me), the hub Home, every screen restyled to the tokens in light and dark, and the mobile admin screens restyled | 8a |

8b, 8c and 8d run in parallel worktrees after 8a merges. Each has its own plan, branch and PR.

## 5. Quality bar
- **No behaviour changes:** every existing page still loads its data and every action still works. The backend suite (445 tests) stays green, untouched.
- **Web:** `type-check`, `lint` and `build` pass. Every page is checked at 375px and 1280px wide, in light and dark.
- **App:** `lint` and `tsc --noEmit` pass. Screens are checked in light and dark on a phone or simulator.
- **Accessibility:** keyboard focus is visible; images have alt text; colour is never the only signal (status badges have text); contrast is AA.
- **Hard-coded colours:** none remain in restyled files (no stray `sky-`, `cyan-`, `amber-` or `#hex`). Everything goes through tokens.
- **Verification is visual review, not unit tests:** neither the web nor the app has a UI test runner. Each stage's PR lists the pages to check and includes before/after screenshots where the environment allows.

## 6. Risks
- **Scale:** 59 web pages and 52 app screens. Mitigation: staged PRs and shared components, so most pages become composition rather than custom styling.
- **Dark-mode regressions** from leftover hard-coded colours. Mitigation: a grep check in every stage's final step.
- **Parallel stages touching shared files** (`components/ui`, the layout). Mitigation: 8a owns all shared components, and 8b–8d only consume them. A missing component is added inside the stage's own folder and promoted afterwards.
