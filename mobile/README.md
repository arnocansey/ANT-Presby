# ANT PRESS Mobile

Expo + React Native mobile app for ANT PRESS, powered by the shared backend in `../backend`.

## Responsibilities

The mobile app provides:

- public browsing flows
- member flows
- community feed
- donation and event flows
- mobile admin surfaces
- Android APK delivery
- OTA updates for JS/UI changes

## Stack

- Expo
- React Native
- Expo Router
- TypeScript
- TanStack Query
- Zustand
- Axios
- React Hook Form
- Zod
- Expo Dev Client
- Expo Auth Session
- Expo Updates

## Local Setup

1. Install dependencies

```bash
npm install
```

2. Create your env file

```bash
cp .env.example .env
```

3. Start the backend

```bash
cd ../backend
npm run dev
```

4. Start Expo

```bash
cd ../mobile
npx expo start
```

## Environment

Use [`.env.example`](./.env.example) as the source of truth.

Typical production-oriented values:

```env
EXPO_PUBLIC_APP_NAME=ANT PRESS Mobile
EXPO_PUBLIC_API_URL=https://ant-presby-backend.onrender.com/api
EXPO_PUBLIC_API_URL_WEB=https://ant-presby-backend.onrender.com/api
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=
```

Important notes:

- Production APK builds should point to the hosted backend.
- `10.0.2.2` only works inside the Android emulator.
- If you intentionally switch native builds back to a local backend, rebuild the APK.

## Auth Notes

- Native devices use Secure Store for auth persistence.
- Expo web fallback uses localStorage.
- Email/password registration requires email verification before first login.
- Google sign-in uses Expo Auth Session and exchanges identity with the backend.

## Build Profiles

### Development client

```bash
npx eas build --platform android --profile development
```

### Android APK

```bash
npx eas build --platform android --profile apk
```

### iOS preview

```bash
npx eas build --platform ios --profile ios-preview
```

### iOS production

```bash
npx eas build --platform ios --profile ios-production
```

## OTA Updates

The app is configured for EAS Update.

Channels:

- `development`
- `preview`
- `production`

Publish preview update:

```bash
npx eas update --channel preview --message "Describe the update"
```

Publish production update:

```bash
npx eas update --channel production --message "Describe the update"
```

### OTA vs Rebuild

OTA can deliver:

- UI changes
- logic changes
- route changes
- most JS/TS updates

Fresh native build required for:

- app icon changes
- splash changes
- native package changes
- permissions
- native OAuth config changes

## Notes

- The mobile app is designed to share live backend data with the website.
- Android is currently the practical release path while Apple Developer setup is pending.
