# ANT PRESS Backend

Express API backed by PostgreSQL through Prisma.

## Responsibilities

The backend owns:

- Authentication and authorization
- Email verification
- Google OAuth account handling
- Users and roles
- Ministries
- News
- Sermons
- Events and registrations
- Donations and payment flow support
- Notifications
- Prayer requests
- Community feed
- Settings and audit-related data
- File uploads

## Stack

- Express
- Prisma
- PostgreSQL
- JWT
- Nodemailer
- Multer
- Jest
- ESLint

## Commands

```bash
npm start
npm run dev
npm run prisma:generate
npm run prisma:pull
npm run prisma:push
npm run migrate
npm run migrate:features
npm run seed
npm run lint
npm test -- --runInBand
```

## Local Setup

```bash
npm install
npm run prisma:generate
npm run migrate:features
npm run dev
```

## Environment

Use [`.env.example`](./.env.example) as the source of truth.

Important groups:

- database: `DATABASE_URL`
- auth: `JWT_SECRET`, `JWT_REFRESH_SECRET`
- web origin: `FRONTEND_URL`, `APP_BASE_URL`, `BACKEND_PUBLIC_URL`, `CORS_ORIGINS`
- email verification: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`
- Google OAuth: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_WEB_CLIENT_ID`, `GOOGLE_ANDROID_CLIENT_ID`, `GOOGLE_ALLOWED_CLIENT_IDS`, `MOBILE_APP_SCHEME`
- payment: `PAYSTACK_PUBLIC_KEY`, `PAYSTACK_SECRET_KEY`

## Auth Notes

- New email/password users must verify email before login.
- Legacy users created before verification rollout are auto-upgraded on successful login.
- Google-authenticated users are treated as verified.

## Migrations And Seeding

- `npm run migrate:features` applies the current feature/backfill migration path, including newer auth-related columns.
- `npm run seed` performs a clean reset path and only creates an admin when bootstrap seed variables are provided.

## Operational Notes

- Health endpoint: `/api/health`
- Uploads currently use local disk storage
- For long-term production durability, move uploads to object storage
