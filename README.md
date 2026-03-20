# ANT PRESS

Full-stack workspace with:
- `frontend`: Next.js application
- `backend`: Express + Prisma API
- PostgreSQL database

## Status

- Frontend build passes
- Frontend type-check passes
- Backend tests pass
- Public and admin routes were runtime-verified locally
- Feature migrations now include `app_settings`

## Run

```bash
cd backend
npm install
npm run migrate
npm run migrate:features
npm run seed
npm start
```

```bash
cd frontend
npm install
npm run dev
```

## Notes

- `npm run seed` now clears demo/sample content and only creates an admin if `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` are provided.
- Package-level notes live in [backend/README.md](./backend/README.md) and [frontend/README.md](./frontend/README.md).
