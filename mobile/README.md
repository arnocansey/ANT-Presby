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

- Android emulator default: `http://10.0.2.2:5000/api`
- Expo web default: `http://localhost:5000/api`
- Physical device: replace with your computer LAN IP, for example `http://192.168.1.25:5000/api`

Set these in `.env` when needed:

```bash
EXPO_PUBLIC_APP_NAME=ANT PRESS Mobile
EXPO_PUBLIC_API_URL=http://192.168.1.25:5000/api
EXPO_PUBLIC_API_URL_WEB=http://localhost:5000/api
```

Important:

- `10.0.2.2` only works inside the Android emulator.
- A real APK installed on a phone cannot use `10.0.2.2`.
- For a physical device, either host the backend publicly or point `EXPO_PUBLIC_API_URL` to your computer's LAN IP and keep the phone and computer on the same Wi-Fi.
- If you change the API URL for a native build, rebuild the APK so the new value is included.

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

## Notes

- Web uses `localStorage` as the auth token fallback because `expo-secure-store` is not available the same way in browsers.
- Native uses `expo-secure-store`.
- The backend must be running before login, news, donations, events, or notifications can work.
