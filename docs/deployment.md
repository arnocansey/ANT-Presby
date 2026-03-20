# ANT PRESS Deployment

This project is ready to deploy with:

- `Render` for the backend API
- `Vercel` for the Next.js frontend
- `EAS Build` for the Android app, pointing to the same hosted backend

## 1. Backend on Render

The repo includes `render.yaml` so Render can create the backend service directly from the repo.

### Required backend environment variables

Set these in Render:

```env
NODE_ENV=production
DATABASE_URL=postgresql://...
FRONTEND_URL=https://your-frontend-domain.vercel.app
CORS_ORIGINS=https://your-custom-domain.com,https://your-frontend-domain.vercel.app
JWT_SECRET=change-this
JWT_REFRESH_SECRET=change-this-too
PAYSTACK_PUBLIC_KEY=
PAYSTACK_SECRET_KEY=
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
```

### Notes

- Health check path: `/api/health`
- Build command runs Prisma generate and the feature migration
- File uploads currently use local disk storage. That is fine for first deployment, but long term you should move uploads to object storage such as S3 or Cloudinary because container filesystems are not durable

## 2. Frontend on Vercel

Deploy the `frontend` folder as a Next.js app.

### Required frontend environment variables

```env
NEXT_PUBLIC_APP_NAME=ANT PRESS
NEXT_PUBLIC_API_URL=https://your-render-api.onrender.com/api
NEXT_PUBLIC_APP_TAGLINE=A connected publishing and content operations platform.
NEXT_PUBLIC_CONTACT_EMAIL=
NEXT_PUBLIC_CONTACT_PHONE=
NEXT_PUBLIC_CONTACT_LOCATION=
```

### Important

- After deployment, set `FRONTEND_URL` on the backend to the exact frontend domain
- If you use a custom domain and a Vercel preview domain, include both in `CORS_ORIGINS`

## 3. Mobile app

After the backend is deployed, point the mobile app to the live API:

```env
EXPO_PUBLIC_API_URL=https://your-render-api.onrender.com/api
EXPO_PUBLIC_API_URL_WEB=https://your-render-api.onrender.com/api
```

Then rebuild the APK:

```bash
eas build --platform android --profile apk
```

## 4. Suggested order

1. Deploy backend on Render
2. Deploy frontend on Vercel
3. Update backend `FRONTEND_URL` and `CORS_ORIGINS`
4. Verify login on the website
5. Update mobile env to the live backend
6. Rebuild the APK
