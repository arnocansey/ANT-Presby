# Changelog

All notable ANT PRESS project updates can be recorded here.

This file is intentionally lightweight. The goal is to keep a practical running history of meaningful platform changes without replacing the deeper documentation in `docs/`.

## 2026-03-21

### Added

- Full-stack ANT PRESS platform across:
  - Express + Prisma backend
  - Next.js frontend
  - Expo mobile app
- Shared PostgreSQL-backed feature set for:
  - users and roles
  - ministries
  - news
  - sermons
  - events and registrations
  - donations
  - notifications
  - prayer requests
  - community feed
- Community feed support on backend, web, and mobile
- Ministries CRUD on the web admin side
- Email verification flow for new registrations
- Google OAuth support for web and mobile
- Mobile admin surfaces and expanded member flows
- Web PWA support
- Mobile OTA update support through EAS Update
- Android APK build flow and dedicated iOS build profiles
- Project documentation set:
  - root README
  - architecture guide
  - auth guide
  - feature map
  - deployment guide
  - QA checklist
  - refreshed backend/frontend/mobile READMEs

### Changed

- Migrated the website UI toward the `church-web-ui` direction
- Migrated the mobile UI toward the church mobile design references
- Reworked web auth to function correctly in the deployed frontend/backend split-domain setup
- Updated mobile production defaults to use the hosted backend instead of emulator-only URLs
- Improved profile image rendering through frontend upload proxying
- Improved responsive behavior and header/search behavior on the website
- Improved mobile navigation, admin wiring, payment return flow, and real-data usage across screens
- Replaced major dummy/mock content paths with real backend-backed data

### Fixed

- Duplicate event registration is now blocked and reflected in web/mobile UI
- Legacy accounts created before email verification are no longer incorrectly trapped as unverified
- Multiple auth response-shape and proxy/session issues on the deployed web app
- Mobile tab bar overlap with Android system navigation
- Admin dashboard stat mismatches that produced incorrect `0` or `NaN` values
- Profile photo uploads not displaying immediately after successful upload
- CTA/button text visibility issues across public pages and community UI

## Notes

- For detailed setup and deployment instructions, see [README.md](./README.md) and [docs/deployment.md](./docs/deployment.md).
- For authentication behavior, see [docs/auth.md](./docs/auth.md).
