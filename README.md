# LifeLink — Smart Blood & Organ Donation Matching System

A full-stack platform connecting **Donors**, **Recipients**, **Hospitals**, **Blood Banks**, and **Administrators** to streamline blood and organ donation matching, requests, inventory, and reporting.

## Tech Stack

| Layer     | Technology |
|-----------|------------|
| Frontend  | React 18, Vite, Tailwind CSS, React Router, Recharts, Axios |
| Backend   | Node.js, Express, MySQL (mysql2), JWT auth, bcrypt |
| Reports   | pdfkit (PDF), json2csv (CSV) |
| Uploads   | Multer (medical documents, profile pictures) |

## Project Structure

```
blood-organ-donation-system/
├── backend/
│   ├── config/db.js            # MySQL pool + connection check
│   ├── controllers/            # Business logic per module
│   ├── routes/                 # Express route definitions
│   ├── middleware/              # auth, upload, error handling
│   ├── utils/                  # jwt, matching engine, notifications, validators
│   ├── db/schema.sql           # Full MySQL schema
│   ├── db/seed.js              # Demo data seeder
│   └── server.js               # App entrypoint
└── frontend/
    ├── src/pages/               # Route-level pages, grouped by role
    ├── src/components/          # Shared UI (layout, cards, badges)
    ├── src/context/AuthContext.jsx
    └── src/lib/api.js           # Axios client with JWT interceptor
```

## Core Modules Implemented

1. **Authentication** — JWT-based, role-based (donor/recipient/hospital/bloodbank/admin), bcrypt password hashing, rate-limited login/register.
2. **Donor Registration & Profile** — Blood group, medical info, geolocation, organ donor opt-in, availability toggle.
3. **Recipient Registration & Requests** — Blood/organ requests with urgency, hospital routing, document upload.
4. **Matching Engine** (`utils/matchingEngine.js`) — Blood-group compatibility matrix + Haversine distance + eligibility/availability scoring, ranks donors per request.
5. **Blood Bank Management** — Inventory per blood group (8 types), request approval/fulfillment with transactional stock deduction.
6. **Hospital Management** — Verification workflow, patient request coordination, organ approval workflow.
7. **Blood & Organ Request Management** — Full CRUD + status lifecycle: pending → approved/rejected → fulfilled/cancelled.
8. **Donor/Recipient/Hospital/Blood Bank/Admin Dashboards** — Role-specific stats, history, and recommendations.
9. **Search & Filter** — Cross-entity search (donors, blood banks, hospitals, emergency requests).
10. **Notifications** — DB-backed, polled every 30s, emergency broadcast to relevant roles.
11. **Analytics Dashboard** — 7 chart endpoints (stock, trends, distribution, registrations, emergencies, facility activity) rendered with Recharts.
12. **Reports** — CSV and PDF generation for 7 report types (donations, requests, inventory, hospitals, blood banks, users).
13. **Profile Management** — Update info, change password, upload picture, deactivate account.

## Getting Started

### 1. Database

```bash
mysql -u root -p < backend/db/schema.sql
```

### 2. Backend

```bash
cd backend
cp .env.example .env      # edit DB credentials + JWT secret
npm install
npm run seed               # optional: creates demo accounts (password: Password123!)
npm run dev                 # starts on http://localhost:5000
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev                 # starts on http://localhost:5173
```

The Vite dev server proxies `/api` and `/uploads` to `http://localhost:5000` automatically.

## Demo Accounts (after running `npm run seed`)

| Role       | Email                     | Password      |
|------------|---------------------------|---------------|
| Admin      | admin@example.com         | Password123!  |
| Hospital   | hospital@example.com      | Password123!  |
| Blood Bank | bloodbank@example.com     | Password123!  |
| Donor      | donor1@example.com        | Password123!  |
| Recipient  | recipient@example.com     | Password123!  |

## Security Notes

- All SQL queries use parameterized statements (mysql2 `?` placeholders) — no string concatenation.
- Passwords hashed with bcrypt (10 rounds).
- JWT auth middleware + role-based `authorize()` guard on every sensitive route.
- Helmet, CORS allow-list, and rate limiting (general + strict on auth endpoints) applied globally.
- File uploads restricted by type (pdf/jpg/png/doc) and size (5MB).
- Centralized error handler avoids leaking stack traces in production.

## Deployment

**Frontend (Vercel):**
```bash
cd frontend
vercel deploy
```
Set `VITE_API_URL` to your deployed backend URL in Vercel project settings.

**Backend (any Node-capable host — Railway, Render, a VPS, or Hostinger's Node.js hosting):**
- Set environment variables from `.env.example` in your host's dashboard.
- Run `npm install && npm start`.
- Point `DB_HOST`/`DB_USER`/`DB_PASSWORD`/`DB_NAME` at your managed MySQL instance (PlanetScale, Hostinger MySQL, AWS RDS, etc).

> Note: this backend is Node.js/Express, not PHP. Classic shared hosts like plain XAMPP/InfinityFree only run PHP — they will not run this server directly. Use a Node-capable host (Railway, Render, Hostinger's Node.js/VPS plans, or your own VPS with PM2 + Nginx) for the backend, and keep MySQL on any MySQL-compatible host.

## Next Iteration Ideas

- Automated test suite (Jest + Supertest for API, Vitest + RTL for frontend)
- WebSocket-based real-time notifications (currently 30s polling)
- Map-based nearby blood bank/donor visualization
- Multi-language support
