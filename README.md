# Polotno MiniApp

Telegram MiniApp for consumables accounting with:
- email/password auth (admin creates users)
- inventory in Google Sheets
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

## Required Google Sheets setup

1. Create a Google Spreadsheet.
2. Share the spreadsheet with your service account email (`Editor` role).
3. Set `GOOGLE_SHEETS_SPREADSHEET_ID`.
4. First API call auto-creates/updates headers in sheets:
   - `users`
   - `inventory`
   - `movements`

## API routes

- `POST /api/auth/login`
- `POST /api/auth/create-user`
- `GET /api/inventory/list`
- `POST /api/inventory/upsert`
- `POST /api/inventory/consume`
- `GET /api/alerts/low-stock`
- `POST /api/alerts/notify`

## Notes

- For personal alerts, each user should have `telegram_chat_id` in `users` sheet.
- If `telegram_chat_id` is empty, backend uses `TELEGRAM_DEFAULT_CHAT_ID`.
- Frontend has a fallback demo mode when backend is unreachable.
