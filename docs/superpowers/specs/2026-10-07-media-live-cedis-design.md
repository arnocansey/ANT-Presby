# Media, Livestream and Cedis Design

**Date:** 2026-10-07
**Status:** Approved in conversation; awaiting written-spec review.

## 1. Intent

The church wants five things:

1. Members and visitors can view and download event photos.
2. Events can have an image.
3. When the church streams live on YouTube or Facebook, the app shows it and tells members.
4. Uploaded images survive redeploys.
5. All money is shown in Ghana cedis.

Success means:
- after a service, an admin publishes an album, and anyone with the link can view and download the photos, one at a time or all at once
- events show cover images
- tapping "Go live" puts a live banner on the website and the app and sends one notification
- no uploaded image is lost when Render redeploys
- no `$` amount appears anywhere

### What the user chose
| Topic | Decision |
|---|---|
| Downloads | Photo albums uploaded into the app, **and** an optional link to an outside folder (Google Drive or Photos) per album |
| Album access | Anyone with the link; no sign-in needed. Admins publish and unpublish. |
| Livestream | Admin pastes the YouTube and/or Facebook link and taps "Go live". A live banner appears on web and mobile, the web embeds the YouTube stream, and members get one notification. The admin taps "End". |
| Cloudinary | New uploads only. Existing `/uploads` links are left as they are; admins re-upload any missing images. |
| Upload path | Hybrid: single images go through the server to Cloudinary; album photos are uploaded directly to Cloudinary with a server-issued signature |

### Assumptions
- Only admins create albums, upload album photos, set event images and go live.
- Cloudinary credentials live only in Render's environment, never in any file.
- Donation quick amounts stay at 25, 50, 100, 250 and 500.

## 2. Conventions (unchanged from earlier phases)

- **Schema changes:** every change goes in `backend/prisma/schema.prisma` **and** as idempotent SQL in `backend/migrations/migrateFeatureUpdates.js`, before `COMMIT`. Never run `prisma:push` against production.
- **Shared helpers:** `parseId` for every id. Responses use `apiResponse`, with snake_case response bodies.
- **Admin actions:** routes under `/api/admin/*` use `isAuthenticated` + `isAdmin`, and every write calls `auditLogModel.createAuditLog`.
- **Notifications:** sent only through `notificationService.notify` / `notifyAll`, which also push and never throw.
- **Secrets:** none in any file. `.env.example` and `render.yaml` get empty placeholders (`sync: false`).
- **Testing:** backend tests are Jest with mocks. Web and mobile are verified by type-check, lint and build.
- **Commits:** every commit message ends with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## 3. Data model

```prisma
model Event {
  // existing fields...
  imageUrl String? @map("image_url") @db.VarChar(500)
  albums   PhotoAlbum[]
}

model PhotoAlbum {
  id           Int          @id @default(autoincrement())
  title        String       @db.VarChar(255)
  description  String?
  eventId      Int?         @map("event_id")       // SetNull
  externalUrl  String?      @map("external_url") @db.VarChar(500)
  coverPhotoId Int?         @map("cover_photo_id") // plain column; no FK (avoids a cycle)
  isPublished  Boolean      @default(false) @map("is_published")
  notifiedAt   DateTime?    @map("notified_at")
  createdBy    Int?         @map("created_by")     // SetNull
  createdAt / updatedAt
  photos       AlbumPhoto[]
  @@index([isPublished, createdAt(sort: Desc)])
  @@map("photo_albums")
}

model AlbumPhoto {
  id        Int      @id @default(autoincrement())
  albumId   Int      @map("album_id")               // Cascade
  publicId  String   @unique @map("public_id") @db.VarChar(255)
  url       String   @db.VarChar(500)
  width     Int?
  height    Int?
  bytes     Int?
  format    String?  @db.VarChar(10)
  sortOrder Int      @default(0) @map("sort_order")
  createdAt DateTime @default(now()) @map("created_at")
  @@index([albumId, sortOrder])
  @@map("album_photos")
}

model LiveStream {          // a single row, id = 1
  id          Int       @id @default(1)
  isLive      Boolean   @default(false) @map("is_live")
  title       String?   @db.VarChar(255)
  youtubeUrl  String?   @map("youtube_url") @db.VarChar(500)
  facebookUrl String?   @map("facebook_url") @db.VarChar(500)
  startedAt   DateTime? @map("started_at")
  endedAt     DateTime? @map("ended_at")
  updatedBy   Int?      @map("updated_by")          // SetNull
  updatedAt   DateTime  @updatedAt @map("updated_at")
  @@map("live_stream")
}
```

`coverPhotoId` is checked in code: it must belong to the album. If the cover photo is deleted, it is set back to null and the first photo is used instead.

## 4. Image storage (`backend/src/services/imageStorage.js`)

This is the only module that imports `cloudinary` (the official SDK, the one new backend dependency).

- **Configuration:**
  - Read from `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET`.
  - `isConfigured()` is true only when all three are set.
  - Every new image goes under the folder `antpresby/`.
- **`uploadImage(buffer, { kind })`:**
  - `kind` is one of `profile`, `news`, `series` or `events`.
  - Uploads to `antpresby/<kind>/` with `resource_type: 'image'` and returns `{ url: secure_url, publicId }`.
  - **When Cloudinary isn't configured**, it writes to the existing `uploads/<dir>/` folders (as today) and returns the `/uploads/...` URL. This keeps local development working without keys.
- **`deleteImage(url)`:** deletes only if the URL is a Cloudinary URL for this cloud under `antpresby/`. It never throws; it logs instead.
- **`createAlbumUploadSignature(albumId)`:**
  - Returns `{ cloudName, apiKey, timestamp, signature, folder, allowedFormats, maxFileSize }`.
  - The signed parameters are the folder `antpresby/albums/<albumId>`, the timestamp, and `allowed_formats` (jpg, jpeg, png, webp, heic).
  - The 10 MB limit is checked on the client, and the server checks `bytes` when the photos are recorded.
  - Cloudinary rejects a signature after an hour, which is its own expiry.
  - **The API secret is never returned.**
- **`verifyAlbumAssets(albumId, publicIds)`:**
  - Asks the Cloudinary Admin API for each `public_id` and keeps only those that exist, are images, sit under `antpresby/albums/<albumId>/`, and are 10 MB or smaller.
  - Returns the asset details (`url`, `width`, `height`, `bytes`, `format`).
- **`downloadUrl(publicId)`:** a delivery URL with the `fl_attachment` flag.
- **`albumArchiveUrl(albumId, publicIds)`:**
  - Builds a signed `generate_archive` download URL (zip) for those IDs, named `<album-title-slug>.zip`. Cloudinary builds the zip on its side.
  - It is generated on request and never stored.

**Upload middleware:** `uploadMiddleware.js` switches from `diskStorage` to `memoryStorage`. The allowed types (JPEG, PNG, WebP, GIF) and the 5 MB limit stay. The controllers then call `uploadImage`:
- profile photo
- news image
- series cover
- event image (new)

When an image is replaced, the old one is deleted with `deleteImage`.

**Existing data:** existing `/uploads/...` URLs stay valid and are left alone. No migration script is needed.

## 5. API

### Albums

**Public:**
- `GET /api/albums`:
  - Lists published albums with `{ id, title, description, event_id, event_name, cover_url, photo_count, external_url, created_at }`.
  - Newest first, paginated with `getPagination`.
- `GET /api/albums/:id`:
  - Returns the album plus `photos: [{ id, url, thumb_url, download_url, width, height }]`.
  - `thumb_url` is a Cloudinary transformation: `c_fill,w_400,h_400,q_auto,f_auto`.
  - Drafts and unknown ids return 404.
- `GET /api/albums/:id/download`:
  - Returns `{ url }`, the archive URL.
  - 404 when the album is a draft or unknown; 404 "No photos yet" when it is empty.
- `GET /api/events/:id`: the response now also includes `image_url` and `album_id` (the first published album for that event, if any).

**Admin, under `/api/admin/albums`:**
- **List and create:**
  - `GET /` lists every album, drafts included.
  - `POST /` creates one with `{ title, description?, eventId?, externalUrl? }`.
  - `externalUrl` must be an `https` URL. An unknown `eventId` returns 400.
- **Edit and delete:**
  - `PUT /:id` edits those fields and `isPublished`.
  - `DELETE /:id` deletes the album's Cloudinary folder assets (best-effort), then the album.
- **Photo uploads:**
  - `POST /:id/upload-signature` issues an upload signature.
  - If Cloudinary isn't configured, it returns 503 "Photo uploads need Cloudinary to be configured".
  - `POST /:id/photos` takes `{ publicIds: string[] }` (1–100). The server verifies each ID with `verifyAlbumAssets`, then inserts the verified ones, skipping duplicates.
  - It returns `{ added, rejected }`, and returns 400 when none were valid.
- **Photo management:**
  - `DELETE /:id/photos/:photoId` deletes the photo from Cloudinary (best-effort) and then from the database.
  - `PATCH /:id/cover` takes `{ photoId }`. The photo must belong to the album, otherwise 400.
- **Notify on publish, once:**
  - On the change from draft to published, an atomic claim on `notifiedAt` (`updateMany where notifiedAt null`) sends `notifyAll` once with type `album`, entity `album`, title "New photos: \<title\>".
  - Re-publishing never notifies again.

### Event image (admin)

- `POST /api/admin/events/:id/image` takes multipart `image`. It uploads with `kind: 'events'`, saves `imageUrl`, and deletes the previous image.
- `DELETE /api/admin/events/:id/image` clears the image and deletes it from Cloudinary.

### Livestream

- `GET /api/live` (public) returns `{ is_live, title, youtube_url, facebook_url, youtube_embed_url, started_at }`.
  - With no row yet, it returns `is_live: false`.
  - `youtube_embed_url` is derived on the server from the video ID (`https://www.youtube.com/embed/<id>`), or null if no ID can be parsed.
- `POST /api/admin/live/start` takes `{ title, youtubeUrl?, facebookUrl? }`.
  - At least one link is required.
  - YouTube links must be `https` on `youtube.com`, `www.youtube.com`, `m.youtube.com` or `youtu.be`.
  - Facebook links must be on `facebook.com`, `www.facebook.com`, `m.facebook.com`, `web.facebook.com` or `fb.watch`.
  - Anything else returns 400.
  - It upserts the single row. If it was **not** live before, it sets `startedAt` and sends `notifyAll` (type `live`, entity `live`, "We're live: \<title\>"). If it was already live, it updates the links without notifying.
  - The check and the update happen in one transaction, so two simultaneous "Go live" taps send one notification.
- `POST /api/admin/live/end` sets `isLive=false` and `endedAt`. It is safe to repeat.

Every admin write is audited.

## 6. Web

- **Gallery:**
  - `/gallery`: a grid of album cards.
  - `/gallery/[id]`:
    - a photo grid using `thumb_url`
    - a full-size viewer with arrow-key navigation
    - a download button on each photo (`download_url`)
    - "Download all" (fetches `/download`, then navigates)
    - "Open folder" when `external_url` is set
    - "Share", which copies the URL
  - Gallery is added to the main navigation.
- **Events:**
  - Event cards and the event page show `image_url`.
  - The event page links to its album when `album_id` is set.
- **Admin gallery** (`/admin/gallery`, with a sidebar link):
  - album create and edit form (title, description, event picker, external link, published toggle)
  - a multi-file drop zone that uploads to Cloudinary in parallel (4 at a time) with a progress count
  - files over 10 MB are rejected before upload
  - the successful IDs are then posted to `/photos`
  - a per-photo delete and "Set as cover"
- **Admin events:** an image picker with preview, plus a remove button.
- **Livestream:**
  - `LiveBanner` in the site layout polls `/api/live` every 60 s and shows a red "We're live: \<title\>" bar linking to `/live`.
  - `/live` shows the YouTube embed (when `youtube_embed_url` is set), plus "Watch on YouTube" and "Watch on Facebook" buttons. When not live it shows "We're not live right now".
  - The admin dashboard gets a Livestream card (title, YouTube link, Facebook link, "Go live" and "End").
- **NotificationBell:** `album` opens `/gallery/:id` and `live` opens `/live`.

## 7. Mobile

- **Gallery:**
  - The album list and album screens use `thumb_url`. Tapping a photo opens a full-screen viewer.
  - "Save to Photos" uses `expo-file-system` to download and `expo-media-library` to save. It asks for photo permission and shows "Saved" or a clear error.
  - "Download all" and "Open folder" open in the browser.
- **Admin gallery:**
  - `expo-image-picker` with multiple selection. Each photo is uploaded straight to Cloudinary using the signature, 3 at a time, with a progress count, and the IDs are then posted to `/photos`.
  - Album fields and publish, as on web.
- **Events:** show `image_url`, and admin events gets an image picker.
- **Livestream:**
  - The home screen shows a live card from `/api/live`, refreshed when the screen is focused.
  - "Watch on YouTube" and "Watch on Facebook" open with `Linking`, which hands them to the apps when installed.
  - There is an admin Livestream screen.
- **Push tap routing:** `album` opens the gallery album and `live` opens the home screen.
- **New packages:** `expo-image-picker` (if it isn't already installed), `expo-media-library` and `expo-file-system`, installed with `npx expo install`. Photo-library permission strings go in `app.json`. This needs a new EAS build.

## 8. Cedis

- **Web:** `formatCurrency` (already GHS) displays as `GH₵ 1,250.00`, using `en-GH` with a `GH₵` fallback.
- **Mobile:** a new `src/lib/currency.ts` with `formatCedis(amount)` and the same output.
- **Every hard-coded symbol moves to the formatter:**
  - `frontend/src/app/donate/page.tsx`: the field prefix, the quick amounts, and the "Give" button
  - `frontend/src/app/admin/dashboard/page.tsx` and `frontend/src/app/admin/donations/page.tsx`
  - `mobile/src/app/donate.tsx`, `mobile/src/app/admin-donations.tsx`, and `mobile/src/app/(tabs)/events.tsx`, which strips `$` from donate links
  - `backend/src/controllers/dashboardController.js` keeps its `GHS` text, standardised to `GH₵`
- **Payments:** `paymentService` adds `currency: 'GHS'` to the Paystack initialize payload.
- **Verification:** a repo grep for currency `$` patterns (`\$\{?amount`, `>\$`, `'\$'`) in the web and mobile source finds none.

## 9. Errors

- **Single-image upload with Cloudinary failing:** 502 "Image storage is unavailable, please try again". The record is unchanged.
- **Wrong file type or size:** 400, same as today.
- **Album photos:** a partial success returns `{ added, rejected }`, and clients show "12 of 15 uploaded" and offer a retry for the failed files. Invalid IDs (wrong folder, a missing asset, not an image, over 10 MB) count as rejected; all rejected returns 400.
- **Unknown or draft album:** 404. An empty album's download returns 404 "No photos yet".
- **Live links:** a non-YouTube or non-Facebook link, or no link at all, returns 400.
- **Invalid ids:** `parseId` returns 404 without touching the database.
- **Cleanup failures:** `deleteImage` and album-folder cleanup failures are logged and never fail the request.

## 10. Testing

**Backend (Jest; `cloudinary` mocked with `jest.doMock`):**
- **The storage service:**
  - configured vs. disk fallback
  - the upload folder per kind
  - `deleteImage` ignores non-Cloudinary and foreign URLs
  - the signature contains the album folder and never the secret
  - `verifyAlbumAssets` rejects a wrong folder, a non-image or an oversize asset
  - the archive URL
- **Albums:**
  - public list and detail hide drafts
  - download 404s when empty
  - admin CRUD and audit
  - recording photos (added / rejected / all-rejected 400 / duplicates)
  - the cover must belong to the album
  - notify-once on publish
  - 503 without Cloudinary
- **Event image:** upload saves the URL and deletes the old one; a Cloudinary failure returns 502 and leaves the event unchanged; delete.
- **Live:**
  - public state with no row
  - start validation (hosts, at least one link)
  - notify only on the change from not-live to live, and concurrent starts notify once
  - the embed URL is derived
  - end is safe to repeat
- **Payments:** the Paystack payload includes `currency: 'GHS'`.
- **Upload middleware:** uses memory storage; type and size limits are unchanged.

**Web and mobile:** type-check, lint and build.

**Owner on device:**
- save a photo to the gallery
- upload several album photos from the phone
- the live banner appears and tapping it opens YouTube or Facebook
- the live push arrives

## 11. Delivery

Three phases, each with its own plan, branch and PR:

| Phase | Contents | Depends on |
|---|---|---|
| 7a | `imageStorage` service, memory-storage middleware, existing uploads moved to Cloudinary, event images, cedis, Paystack GHS | — |
| 7b | Photo albums (backend, web, mobile, notifications) | 7a's `imageStorage` |
| 7c | Livestream (backend, web, mobile, notifications) | none (can run in parallel with 7b) |

**Order:** 7a first; then 7b and 7c in parallel worktrees, branched from 7a, and integrated as before.

**Deployment notes for `docs/deployment.md`:**
- Create a Cloudinary account and set the three `CLOUDINARY_*` variables in Render.
- Run `migrate:features` (the Render build already does this).
- Make a new EAS build for the new mobile packages.

## 12. Out of scope

- Copying existing `/uploads` files to Cloudinary.
- Detecting automatically whether the church is live on YouTube or Facebook.
- Facebook video embedding.
- A history of past livestreams.
- Members uploading photos.
- Private albums.
- Changing the donation quick amounts.
