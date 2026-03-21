# ANT PRESS Authentication

## Supported Methods

ANT PRESS currently supports:

- Email/password authentication
- Email verification for new registrations
- Google OAuth
- JWT-based access tokens
- Refresh-token-backed session continuity

## Email/Password Flow

### Registration

When a user registers with email and password:

1. The account is created.
2. The backend generates an email verification token.
3. A verification email is sent.
4. The user is not treated as logged in yet.
5. The user must verify the email before normal login.

If SMTP is not configured, the backend falls back to logging the verification link to the server output so local development can continue.

### Login

When a user logs in with email/password:

- verified users can log in normally
- unverified new users are blocked and asked to verify first
- legacy users created before verification rollout are auto-upgraded so they are not trapped by a rule that did not exist when they signed up

## Email Verification

Relevant backend support:

- verification token generation
- verification expiry handling
- resend verification endpoint
- verification-link completion endpoint

Required backend email-related env vars for real delivery:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASSWORD`
- `SMTP_FROM`
- `APP_BASE_URL`

## Google OAuth

Google OAuth is currently the external auth provider in the platform.

### Backend

Backend supports:

- token-based Google login exchange
- browser-started Google OAuth flow
- Google callback handling
- account linking or account creation

Important backend env vars:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_WEB_CLIENT_ID`
- `GOOGLE_ANDROID_CLIENT_ID`
- `GOOGLE_ALLOWED_CLIENT_IDS`
- `BACKEND_PUBLIC_URL`
- `MOBILE_APP_SCHEME`

### Frontend

Web uses the Google client ID through:

- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`

The frontend obtains a Google identity token / access token and then exchanges it with the backend so ANT PRESS still owns the application session.

### Mobile

Mobile uses Expo Auth Session for Google sign-in.

Relevant env vars:

- `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`
- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`

## Session Model

### Web

- uses same-origin `/api` proxying
- stores access token on the frontend side
- refresh/session continuity is supported through the auth flow

### Mobile

- uses bearer tokens for API requests
- stores auth data in Secure Store on native devices
- uses localStorage fallback on web

## Recommended OAuth Configuration

### Web Google client

Authorized JavaScript origins should typically include:

- `http://localhost:3000`
- your production frontend URL

Authorized redirect URIs should typically include:

- `http://localhost:5000/api/auth/google/callback`
- your hosted backend callback URL

### Android Google client

You need:

- package name: `com.antpress.mobile`
- correct Android SHA-1 signing fingerprint

## Practical Notes

- Google-authenticated users are treated as verified immediately.
- Email/password users must verify before login.
- Changes to native mobile OAuth config usually require a fresh build, not only OTA.
