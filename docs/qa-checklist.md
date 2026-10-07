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

## Small Groups

- [ ] Admin creates a group at `/admin/groups` with day, time, location, capacity and ministry; a duplicate name is refused
- [ ] Admin assigns a leader by searching members; the leader is shown on the group card
- [ ] A member asks to join on `/groups`; the button changes to "Request pending"; the leader gets a notification
- [ ] The leader approves on `/groups/[id]`; the member gets a notification and now sees the member list
- [ ] A non-member and a signed-out visitor do not see the member list
- [ ] A full group shows "This group is full" and refuses approvals
- [ ] The only leader cannot leave until another leader is assigned
- [ ] A deactivated group disappears for members and can be reactivated by an admin
- [ ] Mobile Small Groups screen: list, join, cancel, leader approve/decline

## Announcements and Push

- [ ] (Dev/store build) After sign-in the app asks for notification permission; a row appears in `push_tokens`
- [ ] Admin sends to Everyone on `/admin/announcements`; members get an in-app notification and a phone push
- [ ] A group leader sends from `/groups/[id]`; only that group's members receive it
- [ ] A leader cannot send to another group or to everyone
- [ ] An event announcement reaches registered and checked-in members once each
- [ ] Tapping a push opens the right screen (prayer, group, event, devotional, notifications)
- [ ] After sign-out the device's token is removed and it no longer receives pushes
- [ ] With push failing (airplane mode on the server side / Expo down), actions still succeed and in-app notifications still appear

## Daily Devotionals

- [ ] Admin saves a draft for today on `/admin/devotionals`; it does not appear on `/devotionals` yet
- [ ] "Publish" for today's devotional shows it to members and sends one notification; pressing again sends nothing
- [ ] A devotional dated tomorrow is published without a notification and is not visible until tomorrow
- [ ] A second devotional on a taken date is refused with a clear message
- [ ] With no devotional today, members see the latest past one labelled with its date
- [ ] Home page card and mobile home card open the devotional

## Images and Cedis

- [ ] With Cloudinary configured, upload a profile photo, a news image and a series cover; the image URLs start with `https://res.cloudinary.com/`
- [ ] Replace a profile photo; the old image disappears from the Cloudinary `antpresby/profile` folder
- [ ] Add, replace and remove an event image on web; the event list and event page update
- [ ] (Dev/store build) Add an event image from the phone's photo library
- [ ] Every amount on the donate pages, donation history and admin screens shows `GH₵`; no `$` anywhere
- [ ] A test donation opens Paystack checkout in GHS

## Livestream

- [ ] On web `/admin/live`, enter a title and a YouTube `/live/<id>` link and press "Go live"; the toast says everyone was notified
- [ ] The red banner appears on public pages within a minute; clicking it opens `/live` with the YouTube player
- [ ] Members receive one in-app notification (and one push on phones); the web bell opens `/live` and a push tap opens the mobile home screen
- [ ] Press "Go live" twice quickly (or from web and phone together): still only one notification
- [ ] Change the YouTube link while live and press "Update links": the player changes and no new notification is sent
- [ ] A Facebook-only stream shows the "Watch on Facebook" button and no player; on the phone it opens the Facebook app
- [ ] A `http://` link, a non-YouTube/Facebook link, or no link at all is refused with a clear message
- [ ] The mobile home live card appears when the app is reopened and its buttons open YouTube/Facebook
- [ ] "End" removes the banner, the `/live` player ("We're not live right now") and the mobile card; pressing End again is harmless
- [ ] The audit log shows the start, update and end entries
