# ANT PRESS Mobile

Expo + React Native mobile app for ANT PRESS, powered by the existing backend in `../backend`.

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

## Local setup

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

## API URLs

The app talks to the existing ANT PRESS backend.

- Production default: `https://ant-presby-backend.onrender.com/api`
- Local Android emulator option: `http://10.0.2.2:5000/api`
- Local Expo web option: `http://localhost:5000/api`

Set these in `.env` when needed:

```bash
EXPO_PUBLIC_APP_NAME=ANT PRESS Mobile
EXPO_PUBLIC_API_URL=https://ant-presby-backend.onrender.com/api
EXPO_PUBLIC_API_URL_WEB=https://ant-presby-backend.onrender.com/api
```

Important:

- Production APK builds now default to the hosted backend on Render.
- `10.0.2.2` only works inside the Android emulator.
- If you intentionally switch back to a local backend for native testing, rebuild the APK so the new value is included.

## Development build

This project is configured for Expo development builds through `expo-dev-client` and `eas.json`.

### One-time setup

1. Log in to Expo

```bash
npx eas login
```

2. Configure the project if prompted

```bash
npx eas init
```

### Build a development client

Android:

```bash
npx eas build --platform android --profile development
```

iOS:

```bash
npx eas build --platform ios --profile development
```

Install the generated build on your device, then start Metro with:

```bash
npm run start:dev-client
```

After that, open the installed ANT PRESS dev client app on your phone and connect to the Metro server.

### Build a direct Android APK

If you want a normal installable Android APK first:

```bash
npx eas build --platform android --profile apk
```

That profile is configured in `eas.json` with `android.buildType = "apk"`.

## OTA updates

The app is now configured for Expo over-the-air updates through EAS Update.

Channels:

- `development` for dev-client builds
- `preview` for internal testing
- `production` for the installed APK / release line

What updates automatically:

- screen changes
- styling updates
- JavaScript or TypeScript logic
- most Expo Router changes

What still needs a new APK/build:

- native package changes
- app icons
- splash screen config
- permissions
- anything that changes native Android or iOS code

### Publish an OTA update

Preview channel:

```bash
npx eas update --channel preview --message "Describe the update"
```

Production channel:

```bash
npx eas update --channel production --message "Describe the update"
```

Installed builds on the matching channel will fetch the update on app launch.

### Important

- The installed APK must have been built from a profile that uses the same channel.
- `apk` and `production` builds use the `production` channel.
- If you change native config, publish will not be enough. Build a new APK instead.

## Notes

- Web uses `localStorage` as the auth token fallback because `expo-secure-store` is not available the same way in browsers.
- Native uses `expo-secure-store`.
- The backend must be running before login, news, donations, events, or notifications can work.
