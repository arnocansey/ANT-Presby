# ANT PRESS Deployment

ANT PRESS is currently designed to deploy as:

- `Render` for backend
- `Vercel` for frontend
- `EAS Build` and `EAS Update` for mobile

## Recommended Order

1. Deploy backend on Render
2. Deploy frontend on Vercel
3. Update backend `FRONTEND_URL` and `CORS_ORIGINS`
4. Verify web auth and core public pages
5. Configure mobile env to the live backend
6. Build Android APK and publish OTA updates as needed

## Backend Deployment

The repo includes `render.yaml` so Render can create the backend service directly from the repository.

### Backend Required Environment Variables

```env
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://...
FRONTEND_URL=https://your-frontend-domain.vercel.app
APP_BASE_URL=https://your-frontend-domain.vercel.app
BACKEND_PUBLIC_URL=https://your-backend-domain.onrender.com
CORS_ORIGINS=https://your-frontend-domain.vercel.app,https://your-custom-domain.com
JWT_SECRET=change-this
JWT_REFRESH_SECRET=change-this-too
```

### Backend Email Verification Variables

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_FROM=ANT PRESS <no-reply@yourdomain.com>
```

### Backend Google OAuth Variables

```env
GOOGLE_CLIENT_ID=your_web_client_id
GOOGLE_CLIENT_SECRET=your_web_client_secret
GOOGLE_WEB_CLIENT_ID=your_web_client_id
GOOGLE_ANDROID_CLIENT_ID=your_android_client_id
GOOGLE_ALLOWED_CLIENT_IDS=your_web_client_id,your_android_client_id
MOBILE_APP_SCHEME=antpressmobile
```

### Backend Optional Payment Variables

```env
PAYSTACK_PUBLIC_KEY=
PAYSTACK_SECRET_KEY=
```

### Backend Notes

- Health check path: `/api/health`
- Build should include `npm run prisma:generate` and `npm run migrate:features`
- Uploaded files currently use local disk storage, which is acceptable for early deployment but should be moved to object storage for long-term durability

## Frontend Deployment

Deploy the `frontend` folder as a Next.js app on Vercel.

### Frontend Required Environment Variables

```env
NEXT_PUBLIC_APP_NAME=ANT PRESS
NEXT_PUBLIC_APP_TAGLINE=
NEXT_PUBLIC_API_URL=https://your-backend-domain.onrender.com/api
NEXT_PUBLIC_CONTACT_EMAIL=
NEXT_PUBLIC_CONTACT_PHONE=
NEXT_PUBLIC_CONTACT_LOCATION=
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_web_client_id
```

### Frontend Notes

- The frontend uses same-origin proxy routes for API requests.
- After deployment, make sure backend `FRONTEND_URL` matches the deployed frontend domain.
- If you use both a Vercel default domain and a custom domain, include both in `CORS_ORIGINS`.

## Mobile Deployment

Mobile uses the hosted backend and EAS for build/update workflows.

### Mobile Environment Variables

```env
EXPO_PUBLIC_APP_NAME=ANT PRESS Mobile
EXPO_PUBLIC_API_URL=https://your-backend-domain.onrender.com/api
EXPO_PUBLIC_API_URL_WEB=https://your-backend-domain.onrender.com/api
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your_android_client_id
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your_web_client_id
```

### Build And Delivery

Android APK:

```bash
eas build --platform android --profile apk
```

Development client:

```bash
eas build --platform android --profile development
```

OTA update:

```bash
eas update --channel production --message "Describe the update"
```

### Important Mobile Notes

- OTA updates can deliver JS/UI changes.
- A fresh build is still required for icon, splash, native package, permission, or native OAuth changes.
- Production mobile builds should never point to `10.0.2.2` or `localhost`.

## OAuth Setup Notes

### Web Google Client

Authorized JavaScript origins typically include:

- `http://localhost:3000`
- your production frontend domain

Authorized redirect URIs typically include:

- `http://localhost:5000/api/auth/google/callback`
- `https://your-backend-domain.onrender.com/api/auth/google/callback`

### Android Google Client

Use:

- package name: `com.antpress.mobile`
- correct Android SHA-1 signing fingerprint

## Final Post-Deploy Checks

1. Test `/api/health`
2. Test web login
3. Test email verification for a new account
4. Test Google sign-in if configured
5. Test community feed create/comment/like
6. Test event registration and duplicate-registration blocking
7. Test donation initialization
8. Test mobile login and feed behavior against the hosted backend
