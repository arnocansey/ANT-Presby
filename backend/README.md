# ANT PRESS Backend

Express API backed by PostgreSQL through Prisma.

## Commands

```bash
npm start
npm run dev
npm run migrate
npm run migrate:features
npm run seed
npm test
```

## Notes

- Admin, public, and auth routes were runtime-verified locally.
- The feature migration creates news, notifications, contact messages, and app settings support.
- `npm run seed` performs a clean reset and only creates an admin when `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` are set.
