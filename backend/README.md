# Barbershop Booking Scheduler — Backend

## Setup
1. `npm install`
2. Copy `.env.example` to `.env` and fill in your Postgres `DATABASE_URL`.
3. Run `schema.sql` against your database (via Supabase/Neon SQL editor, or `psql`).
4. `npm run dev` (or `npm start`) to run the server.
5. Visit `http://localhost:4000/api/health` — should return `{"status":"ok"}`.

## Endpoints so far
- `GET /api/health`
- `GET /api/services`
- `POST /api/services`
