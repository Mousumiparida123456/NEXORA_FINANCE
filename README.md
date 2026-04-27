# nexora

## Live Demo
https://nexora-finance-fintech-dashboard.vercel.app/

## BACKENED
https://nexora-finance-api-server.vercel.app/

## Environment Security
`.env` files are already ignored by git in this repo, including nested app-level `.env` files.

Do not commit real secrets to GitHub. Keep real values only in:
- local untracked `.env` files
- Vercel project Environment Variables

Important:
- `artifacts/api-server/.env` can contain secrets because it is server-only.
- `artifacts/fintech-dashboard/.env` must only contain public `VITE_...` values. Anything in `VITE_...` is exposed to the browser bundle.
- The old `VITE_GEMINI_API_KEY` placeholder has been removed from the frontend example because client-side API keys are not secret.

## Vercel Setup
Set these in the Vercel dashboard for the API project:
- `NODE_ENV=production`
- `DATABASE_URL=...`
- `JWT_ACCESS_SECRET=...`
- `JWT_REFRESH_SECRET=...`
- `CLIENT_ORIGIN=https://your-frontend-domain.vercel.app`
- `APP_URL=https://your-api-domain.vercel.app`
- `COOKIE_SECURE=true`
- `COOKIE_DOMAIN=`
- `ACCESS_TOKEN_TTL=15m`
- `REFRESH_TOKEN_TTL=7d`
- `REQUEST_SIZE_LIMIT=1mb`
- `LOG_LEVEL=info`

Set these in the Vercel dashboard for the frontend project:
- `VITE_API_BASE_URL=https://your-api-domain.vercel.app`
- `VITE_API_URL=https://your-api-domain.vercel.app/api/v1`

If any secret was ever committed earlier, remove it from GitHub history and rotate it before deploying.
