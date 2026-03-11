# MERN EMR Appointment System — Backend (API)
Node/Express + MongoDB backend for EMR appointment scheduling.
- **Frontend repo**: [EMR-Appointment-System---Frontend](https://github.com/Annan-Andrews/EMR-Appointment-System---Frontend)
## Tech stack
Node.js, Express, MongoDB (Mongoose), JWT (access + refresh), bcrypt, express-validator, Helmet, CORS
---
## Architecture (folder structure)
- `src/app.js` — Express app (helmet, cors, cookies, routes, error handlers)
- `src/routes/*` — route definitions
- `src/controllers/*` — request handlers
- `src/models/*` — Mongoose models (User, Patient, Appointment, DoctorSchedule, AuditLog)
- `src/middleware/*`
  - `authMiddleware` — verifies access token (Bearer)
  - `rbacMiddleware` — role authorization
  - `errorMiddleware` — 404 + consistent error responses
- `src/utils/*` — response helpers, token helpers, audit logging
## Auth design (important)
- **Access token**: short-lived (default **15m**)
- **Refresh token**: long-lived (default **7d**)
- Refresh token is stored in a **httpOnly cookie** named `refreshToken`
- Refresh token rotates on `/auth/refresh` and is stored on the user record (`User.refreshToken`)
## Concurrency / double-booking protection
- Double-booking is prevented at the database level using a unique index on:
  `(doctorId, slotDate, slotStart)` for non-cancelled appointments.
- If two users book the same slot simultaneously, one succeeds and the other receives **409 Conflict**.
---
## Environment variables
Create `./.env` (use `.env.example` as template):
```env
PORT=5000
NODE_ENV=development
MONGO_URI=
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
Local setup
1) Install dependencies
npm install
2) Run in development (nodemon)
npm run dev
3) Run in production mode
npm start
Health check:

GET /health
