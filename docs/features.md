# ANT PRESS Feature Map

## Public Features

- Homepage
- About page
- Contact page
- FAQ
- Ministries listing and detail pages
- News listing and detail pages
- Sermons listing and detail pages
- Sermon series (browse series and their sermons in order)
- Daily devotional (today's scripture, reflection and prayer, plus an archive)
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
- Prayer wall (members only): share approved requests, pray for others, milestone notifications
- Small groups: browse, ask to join, leave; group leaders approve requests
- Notifications
- Community posting, commenting, liking, and deletion of owned content

## Admin Features

### Web

- Dashboard
- Users management
- Ministries CRUD
- Small groups management (create, edit, deactivate, assign leaders)
- News CRUD
- Announcements to everyone, a small group or an event's attendees (with push)
- Events CRUD
- Attendance check-in and headcount trend
- Sermons CRUD
- Sermon series CRUD with cover images
- Daily devotional authoring with publish & notify
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

## Prayer Wall

- Members choose "Share on the prayer wall" when submitting a request; requests are private by default.
- Only approved or answered requests that were shared appear, newest first, to signed-in members.
- Anonymous requests show "A church member" and never expose the author.
- "I prayed" counts once per member per request; the requester is notified at 1, 5, 10, 25, 50 and 100 prayers.
- Editing the text of an approved request sends it back for approval.
- Available on web (`/prayer/wall`) and mobile (Prayer Wall screen).

## Sermon Series

- Admins create series (title, description, dates, cover image) on web `/admin/series` or mobile Series Manager, and assign sermons on the sermon form.
- Members see a Series strip on `/sermons`, each series at `/sermons/series/[id]` (sermons oldest first), and series filter pills on the mobile Sermons tab.
- Deleting a series keeps its sermons; they simply lose the series label.
- Series titles are unique; covers must be uploaded through the admin upload.

## Attendance

- Admins open an event at web `/admin/attendance` or the mobile Attendance screen and check in registered members, any member found by name or email, or walk-in guests by name.
- A member can be checked in once per event (enforced in the database); checking in again returns the existing record. Check-ins can be undone.
- Cancelled events are closed for check-in.
- The headcount trend shows members, guests and total for recent past events.
- Every check-in and undo is recorded in the audit log.

## Small Groups

- Members browse active groups at web `/groups` or the mobile Small Groups screen and ask to join; requests are pending until a group leader or an admin approves.
- Groups can have a capacity (active members only); full groups refuse new requests and approvals.
- Only active members and admins see a group's member list; others see details, leaders and member count.
- Members can leave or cancel a request; the last leader must hand over leadership first.
- Leaders are notified of join requests; members are notified when approved.
- Admins create, edit, deactivate/reactivate groups and assign leaders at `/admin/groups` (audited).

## Announcements and Push Notifications

- Admins send announcements to everyone, a small group, or an event's attendees (registered plus checked in) from web `/admin/announcements` or the mobile Send Announcement screen; group leaders can message their own group from `/groups/[id]`.
- Every notification the platform sends (prayer milestones, group requests and approvals, devotionals, announcements) is created in-app and also pushed to members' phones.
- Phones register for push after sign-in and unregister on sign-out; tapping a push opens the related screen.
- The website uses in-app notifications only.

## Daily Devotionals

- One devotional per day (scripture reference and text, reflection, optional prayer), written by admins on web `/admin/devotionals` or the mobile Devotionals screen.
- "Today" follows the church time zone (`CHURCH_TIMEZONE`, default Africa/Accra). Members see today's devotional on `/devotionals`, the home page card and the mobile Daily Devotional screen; if none is published for today they see the latest past one.
- Drafts and future-dated devotionals are never shown to members.
- "Publish" on the devotional's own day notifies everyone, exactly once; a future-dated devotional is published silently and can be notified on its day.

## Images and Currency

- Uploaded images are stored on Cloudinary (local disk when Cloudinary isn't configured); replaced images are cleaned up.
- Events can have a cover image, added on web `/admin/events/[id]/edit` or in the mobile admin event screen, and shown on event lists and pages.
- All amounts are shown in Ghana cedis (`GH₵ 1,250.00`), and Paystack charges in GHS.

## Livestream

- Admins go live from web `/admin/live` or the mobile Livestream screen. They enter a title and a YouTube and/or Facebook link (https only; YouTube on youtube.com or youtu.be, Facebook on facebook.com or fb.watch).
- Going live shows a red "We're live" banner on every web page (refreshed every minute) and a live card at the top of the mobile home screen (refreshed when the screen opens).
- `/live` embeds the YouTube stream when the link contains a video ID (`watch?v=`, `youtu.be/`, `/live/`, `/embed/`), and offers "Watch on YouTube" and "Watch on Facebook" buttons. Facebook is never embedded. On mobile, the buttons open the YouTube or Facebook app.
- Everyone is notified exactly once per stream, even if two admins press "Go live" together. Updating the links while live does not notify again.
- "End" takes the banner and card down for everyone and is safe to press twice. Every start, update and end is in the audit log.

## Photo Albums

- Anyone with the link can browse published albums at `/gallery` (web) or Account → Photo Gallery (mobile), open photos full size, and download them one at a time or all at once as a zip.
- Albums can link to an event (the event page shows "View photos") and to an outside folder such as Google Drive.
- Admins manage albums at `/admin/gallery` or in the mobile admin console. They upload many photos at once (straight to Cloudinary, up to 10 MB each), choose a cover, and publish.
- Everyone is notified once, the first time a published album has photos.
