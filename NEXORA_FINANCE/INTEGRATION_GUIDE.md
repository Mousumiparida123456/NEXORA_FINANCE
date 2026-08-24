# NEXORA Frontend-Backend Integration Guide

This repo now has one backend path and one canonical database package:

- Frontend: `artifacts/fintech-dashboard`
- Backend: `artifacts/api-server`
- Shared DB layer: `lib/db`

## Local Setup

1. Configure backend env:
   ```bash
   cd artifacts/api-server
   cp .env.example .env
   ```

   Set at least:
   ```env
   DATABASE_URL=postgresql://...
   CLIENT_ORIGIN=http://localhost:5173
   GEMINI_API_KEY=your_key_here
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_app_password
   SMTP_FROM="Nexora Security <your_email@gmail.com>"
   ```

2. Apply the database schema:
   ```bash
   pnpm db:push
   ```

   If you want to apply the checked-in migration history, use:
   ```bash
   cd lib/db
   pnpm run migrate
   ```

3. Start the backend:
   ```bash
   cd artifacts/api-server
   pnpm run dev
   ```

   The local API base is:
   ```text
   http://localhost:9999/api/v1
   ```

4. Start the frontend:
   ```bash
   cd artifacts/fintech-dashboard
   npm install
   npm run dev
   ```

   Set frontend env values to:
   ```env
   VITE_API_URL=http://localhost:9999/api/v1
   VITE_API_BASE_URL=http://localhost:9999
   ```

## API Endpoints

Current backend routes include:

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/user`
- `GET /api/v1/healthz`
- `GET|POST|PATCH|DELETE /api/v1/transactions`

## Database Notes

- The canonical schema lives in `lib/db/src/schema.ts`.
- The initial SQL migration is checked in at `lib/db/drizzle/0000_initial_schema.sql`.
- The migration journal is checked in at `lib/db/drizzle/meta/_journal.json`.
- The API server re-exports the shared DB layer instead of owning a duplicate schema.

## Deployment Notes

- Vercel routes should point at `api/index.ts`, which now forwards to the backend implementation in `artifacts/api-server/api/index.ts`.
- Do not reintroduce runtime schema patching on server start; apply schema changes through Drizzle instead.
