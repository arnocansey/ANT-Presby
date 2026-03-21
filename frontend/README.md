# ANT PRESS Frontend

Next.js web application for ANT PRESS.

## Responsibilities

The frontend provides:

- Public website experience
- Member dashboard and profile flows
- Admin web experience
- Community feed web UI
- PWA shell and installability
- Same-origin API proxying

## Stack

- Next.js App Router
- React
- TanStack Query
- Tailwind CSS
- React Hook Form
- Zod

## Commands

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run type-check
```

## Local Setup

```bash
npm install
npm run dev
```

## Environment

Use [`.env.example`](./.env.example) as the source of truth.

Important values:

- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_APP_NAME`
- `NEXT_PUBLIC_APP_TAGLINE`
- `NEXT_PUBLIC_CONTACT_EMAIL`
- `NEXT_PUBLIC_CONTACT_PHONE`
- `NEXT_PUBLIC_CONTACT_LOCATION`
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`

## Auth Notes

- Web uses same-origin `/api` proxying to communicate with the backend.
- Email/password registration ends in verification, not immediate login.
- Google sign-in exchanges Google identity with the backend so ANT PRESS still owns the session.

## Key Areas

- public pages: `/`, `/about`, `/contact`, `/ministries`, `/news`, `/sermons`, `/events`, `/donate`, `/community`
- member pages: `/login`, `/register`, `/verify-email`, `/dashboard`, `/profile`
- admin pages: `/admin/*`

## Operational Notes

- `/admin` redirects to `/admin/dashboard`
- profile image rendering uses frontend-side proxying for uploads
- public/admin/member UI now follows the current `church-web-ui` direction in the project
