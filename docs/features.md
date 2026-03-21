# ANT PRESS Feature Map

## Public Features

- Homepage
- About page
- Contact page
- FAQ
- Ministries listing and detail pages
- News listing and detail pages
- Sermons listing and detail pages
- Events listing and detail pages
- Donate page
- Community feed
- Search
- Privacy page
- Terms page

## Member Features

- Registration
- Email verification
- Login
- Google sign-in
- Dashboard
- Profile editing
- Profile photo upload
- Event registration
- Event cancellation
- Donation initialization and history
- Prayer request submission
- Notifications
- Community posting, commenting, liking, and deletion of owned content

## Admin Features

### Web

- Dashboard
- Users management
- Ministries CRUD
- News CRUD
- Events CRUD
- Sermons CRUD
- Donations review
- Settings
- Audit / operational areas

### Mobile

- Admin dashboard
- User and role views
- Donations / finance views
- Events, sermons, and news management screens
- Prayer moderation
- Attendance, analytics, announcements, and series surfaces
- Mobile-focused admin shortcuts

## Platform Features

- PWA support on web
- Android APK build support
- EAS OTA updates for mobile JS/UI changes
- Hosted backend support for both clients
- Shared live data across web and mobile

## Community Feed

Current feed capabilities:

- create posts
- browse feed
- like posts
- comment on posts
- delete owned content

The feed is available on:

- web
- mobile
- backend API

## Events

Current event behavior:

- users can register
- users cannot register twice
- already-registered events are shown as registered on web and mobile
- cancellation flows exist where supported by the current UI

## Donations

Current donation behavior:

- payment initialization
- return/callback handling
- donation history surfaces
- admin donation review

## Media

Current media behavior:

- profile photo upload
- uploaded media proxying through frontend for better display reliability

## Notes

- Some deeper admin and mobile surfaces are intentionally more task-focused than the web equivalents, but they are backed by the same shared live data.
- The project has been moved off major dummy/mock data flows in the main product paths.
