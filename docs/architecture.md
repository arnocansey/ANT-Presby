# ANT PRESS Architecture

## Overview

ANT PRESS is a shared-platform product with three clients connected to one backend and one primary database:

- `frontend` - Next.js website and PWA
- `mobile` - Expo / React Native mobile app
- `backend` - Express API with Prisma
- `database` - PostgreSQL

All major business features flow through the backend so web and mobile can share the same source of truth.

## High-Level Flow

1. Public, member, or admin users access the web app or mobile app.
2. The client sends requests to the backend API.
3. The backend applies validation, auth, authorization, and business rules.
4. Prisma persists and reads data from PostgreSQL.
5. The client renders live data from the backend.

## Repositories And Responsibilities

### Backend

Responsible for:

- Authentication and authorization
- Email verification
- Google OAuth account handling
- User, ministry, event, sermon, news, donation, notification, and prayer logic
- Admin operations
- Community feed persistence
- File uploads
- Payment initialization and verification

Main stack:

- Express
- Prisma
- PostgreSQL
- JWT
- Nodemailer
- Multer

### Frontend

Responsible for:

- Public marketing/content pages
- Member dashboard and profile flows
- Admin web operations
- Community feed web experience
- Same-origin API proxying
- PWA shell behavior

Main stack:

- Next.js App Router
- React
- TanStack Query
- Tailwind CSS
- React Hook Form
- Zod

### Mobile

Responsible for:

- Member-facing mobile experience
- Mobile admin surfaces
- Native auth persistence
- Payment return flow
- OTA-deliverable UI and logic updates

Main stack:

- Expo
- Expo Router
- React Native
- TanStack Query
- Zustand
- Expo Secure Store
- Expo Auth Session

## Data Domains

Main functional domains currently in the platform:

- Users and roles
- Authentication and sessions
- Email verification
- Ministries
- News
- Sermons
- Events and registrations
- Donations and finance
- Notifications
- Prayer requests
- Community feed
- App settings and audit data

## Auth Model

### Web

- The web app talks to same-origin `/api/*` proxy routes.
- The frontend stores access tokens client-side.
- Refresh/session continuity is supported through the web auth flow.
- Protected routing is handled in the current client-side auth/bootstrap model.

### Mobile

- Mobile uses bearer tokens against the backend API.
- Native devices persist credentials in Secure Store.
- Web fallback inside Expo uses localStorage.
- OTA updates can change JS/UI behavior, but not native config already baked into an installed build.

## Media And Uploads

- Backend currently stores uploads on disk.
- Frontend proxies uploaded assets through a same-origin route for more reliable rendering.
- For long-term production durability, object storage such as S3 or Cloudinary is recommended.

## Deployment Shape

- Backend runs on Render
- Frontend runs on Vercel
- Mobile Android builds run through EAS
- Mobile JS/UI updates ship through EAS Update

See [deployment.md](./deployment.md) for production setup.
