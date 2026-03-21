# ANT PRESS

ANT PRESS is a full-stack church and community platform with a shared backend, a Next.js website, and an Expo mobile app. It supports public content, member experiences, admin operations, donations, events, notifications, community interaction, email verification, and Google sign-in.

## Workspace

- `backend` - Express API, Prisma models, PostgreSQL access, auth, payments, uploads, notifications, and admin business logic
- `frontend` - Next.js website and PWA shell for public, member, and admin web experiences
- `mobile` - Expo / React Native app for members and admins, with OTA updates and Android build support
- `docs` - project documentation, architecture notes, deployment guide, auth guide, feature map, and QA checklist
- `render.yaml` - Render blueprint for backend deployment
- `docker-compose.yml` - local orchestration helper

## Product Scope

### Public

- Home, About, Contact, FAQ
- Ministries
- News
- Sermons
- Events
- Donate
- Community feed
- Search
- Privacy / Terms

### Member

- Email/password registration and login
- Email verification for new accounts
- Google sign-in
- Profile management
- Profile photo upload
- Dashboard
- Event registration and cancellation
- Prayer requests
- Notifications
- Donation history and payment initialization

### Admin

- Dashboard and analytics
- Users and role updates
- Ministries CRUD
- News CRUD
- Events CRUD
- Sermons CRUD
- Donations review
- Prayer moderation
- Settings
- Audit log
- Extended admin flows on mobile

## Authentication At A Glance

ANT PRESS currently supports:

- Email/password authentication
- Email verification before first login for newly created accounts
- Google OAuth
- JWT access tokens
- Refresh token support for session continuity
- Cookie support for web and bearer token support for API/mobile requests

Important behavior:

- Legacy accounts created before email verification was introduced are auto-upgraded on successful login.
- Newly registered email/password users must verify their email before they can log in.
- Google-authenticated users are treated as verified because Google supplies a verified email identity.

See [docs/auth.md](./docs/auth.md).

## Local Development

### 1. Backend

```bash
cd backend
npm install
npm run prisma:generate
npm run migrate:features
npm run dev
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

### 3. Mobile

```bash
cd mobile
npm install
npx expo start
```

## Environment Files

Use these example files as the source of truth:

- [backend/.env.example](./backend/.env.example)
- [frontend/.env.example](./frontend/.env.example)
- [mobile/.env.example](./mobile/.env.example)

## Quality Checks

### Backend

```bash
npm run prisma:generate
npm run migrate:features
npm run lint
npm test -- --runInBand
```

### Frontend

```bash
npm run lint
npm run type-check
npm run build
```

### Mobile

```bash
npm run lint
npx tsc --noEmit
npx expo export --platform web
```

## Deployment Stack

Recommended production stack:

- Render for backend
- Vercel for frontend
- EAS Build / EAS Update for mobile

See [docs/deployment.md](./docs/deployment.md).

## Documentation Index

- [docs/architecture.md](./docs/architecture.md)
- [docs/auth.md](./docs/auth.md)
- [docs/features.md](./docs/features.md)
- [docs/deployment.md](./docs/deployment.md)
- [docs/qa-checklist.md](./docs/qa-checklist.md)
- [backend/README.md](./backend/README.md)
- [frontend/README.md](./frontend/README.md)
- [mobile/README.md](./mobile/README.md)
