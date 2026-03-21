# ANT PRESS QA Checklist

Use this checklist for final smoke testing on web and Android.

## Web

1. Open `/` and confirm header, search, hero CTAs, and footer render cleanly.
2. Open `/about`, `/contact`, `/ministries`, `/news`, `/sermons`, `/events`, `/donate`, and `/community`.
3. Confirm there is no invisible CTA text or horizontal overflow at mobile widths.
4. Register a new account and confirm the email verification step is enforced.
5. Verify the account, then log in successfully.
6. Test Google sign-in if Google OAuth env vars are configured.
7. Open `/profile`, upload a profile photo, refresh, and confirm the image still shows.
8. Open the community feed, create a post, like it, comment on it, and delete owned content.
9. Test donation initialization from `/donate`.
10. If admin, test `/admin/dashboard`, `/admin/ministries`, `/admin/news`, `/admin/events`, `/admin/sermons`, `/admin/users`, and `/admin/donations`.

## Mobile

1. Open the app and confirm splash/logo branding appears correctly.
2. Confirm the bottom tab bar renders above the Android system navigation area.
3. Test `Home`, `Sermons`, `Events`, `Give`, and `Profile`.
4. Log in with an existing verified account.
5. Test Google sign-in if mobile Google env vars are configured.
6. Confirm event registration marks the user as registered and blocks duplicate registration.
7. Confirm the payment flow starts correctly and returns into the app correctly.
8. Open the community feed, create a post, like it, comment on it, and delete owned content.
9. Open profile/account and verify real data appears.
10. If admin, test dashboard stats, ministries, users, donations, events, sermons, news, and settings.

## Deployment

1. Confirm backend health endpoint responds.
2. Confirm frontend uses the hosted backend API URL.
3. Confirm mobile is not pointing to local or emulator-only URLs in production.
4. Publish OTA for JS/UI-only changes.
5. Rebuild APK when native config, icon, splash, or OAuth native setup changes.

## Known High-Value Checks

- Donation callback flow
- Profile image rendering after upload
- Community feed live updates after action success
- Admin dashboards showing real values instead of stale `0` or `NaN`
- Responsive behavior of public pages and header navigation
