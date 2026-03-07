# Polotno MiniApp

Telegram MiniApp for consumables accounting with:
- email/password auth (admin creates users)
- inventory in Vercel Postgres
- QR generation + print labels
- low-stock personal Telegram alerts

## Local run

1. Install dependencies:
   - `npm install`
2. Create env file:
   - `cp .env.example .env.local`
3. Fill `.env.local` values.
4. Start Vercel dev:
   - `npm run dev`

## Required DB setup (Vercel Postgres)

1. Add `POSTGRES_URL` in Vercel project env.
2. First API call auto-creates tables:
   - `users`
   - `items`
   - `movements`
   - `groups_dir`

## Optional migration from Google Sheets

1. Fill Google env vars in `.env.local`:
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`
   - `GOOGLE_SHEETS_SPREADSHEET_ID`
2. Run:
   - `npm run migrate:sheets-to-postgres`

## API routes

- `POST /api/auth/login`
- `POST /api/auth/create-user`
- `GET /api/inventory/list`
- `GET /api/inventory/history`
- `POST /api/inventory/upsert`
- `POST /api/inventory/consume`
- `POST /api/inventory/adjust`
- `POST /api/inventory/delete`
- `GET /api/alerts/low-stock`
- `POST /api/alerts/notify`

## Notes

- For personal alerts, each user should have `telegram_chat_id` in `users`.
- If `telegram_chat_id` is empty, backend uses `TELEGRAM_DEFAULT_CHAT_ID`.
- Frontend works in DB/API mode only (Vercel Postgres via Vercel API).
- Role model:
  - `admin`: can create/edit/delete items and users, can run stock adjustments.
  - `staff`: can view items/history and consume stock.
