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

## Prayer Wall

- [ ] Signed out, `/prayer/wall` redirects to login; the mobile screen asks to sign in
- [ ] A new request is private unless "Share on the prayer wall" is ticked
- [ ] A shared request appears on the wall only after admin approval
- [ ] An anonymous shared request shows "A church member"
- [ ] "I prayed" counts once per member, even when tapped repeatedly
- [ ] The requester is notified on the 1st prayer, not the 2nd
- [ ] Editing an approved request's text removes it from the wall until re-approved
- [ ] A member cannot open another member's private request by id
- [ ] The mobile "+" button opens the request form and does not auto-submit
- [ ] "Stop sharing" (web My requests, mobile My requests) removes a request from the wall; "Share on wall" puts it back
- [ ] Admin "Remove from wall" on `/admin/prayers` takes a shared request off the wall
- [ ] On mobile, "I prayed" on a request that just left the wall shows an alert; a failed load shows "Could not load prayers" with Try again

## Sermon Series

- [ ] Admin creates a series with a cover on `/admin/series`; a duplicate title shows "A series with this title already exists"
- [ ] An end date before the start date is refused
- [ ] Assigning a sermon to a series (web form and mobile edit) shows it on `/sermons/series/[id]`, oldest first
- [ ] Deleting a series keeps its sermons in the library
- [ ] Series dates show the same day in any time zone
- [ ] Mobile Sermons tab: tapping a series pill filters; "All" resets

## Attendance

- [ ] Admin opens an event on `/admin/attendance`; registered members are listed with Check in buttons
- [ ] Checking in a registered member updates "present" and switches the button to Undo
- [ ] Searching a member by name or email and checking them in lists them under Walk-ins as "member"
- [ ] Adding a walk-in guest works; a blank name cannot be added
- [ ] Checking the same member in twice (two tabs or a double tap) keeps one record
- [ ] A cancelled event shows "check-in is closed"
- [ ] Recent headcounts show members and guests for past events
- [ ] Members (non-admins) cannot reach any attendance page or endpoint
