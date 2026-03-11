# MERN EMR Appointment System — Backend (API)

Node/Express + MongoDB backend for EMR appointment scheduling.

**Frontend Repository:**
[https://github.com/Annan-Andrews/EMR-Appointment-System---Frontend](https://github.com/Annan-Andrews/EMR-Appointment-System---Frontend)

---

# Tech Stack

* Node.js
* Express
* MongoDB (Mongoose)
* JWT (Access Token + Refresh Token)
* bcrypt
* express-validator
* Helmet
* CORS

---

# Architecture (Folder Structure)

```
src
 ├ app.js
 ├ routes
 ├ controllers
 ├ models
 ├ middleware
 └ utils
```

### src/app.js

Express application setup including:

* Helmet
* CORS
* Cookie parser
* Routes
* Error handlers

### src/routes/*

Defines API route endpoints.

### src/controllers/*

Handles request processing and business logic.

### src/models/*

Mongoose models:

* User
* Patient
* Appointment
* DoctorSchedule
* AuditLog

### src/middleware/*

**authMiddleware**
Verifies access token (`Authorization: Bearer <token>`)

**rbacMiddleware**
Handles role-based authorization.

**errorMiddleware**
Handles 404 responses and standardized API error responses.

### src/utils/*

Helper utilities including:

* Response helpers
* Token helpers
* Audit logging utilities

---

# Auth Design (Important)

### Access Token

* Short-lived token
* Default expiration: **15 minutes**

### Refresh Token

* Long-lived token
* Default expiration: **7 days**

### Storage Strategy

* Refresh token is stored in an **httpOnly cookie** named `refreshToken`.
* Token rotation occurs on:

```
POST /auth/refresh
```

* The refresh token is also stored in the database on the user record:

```
User.refreshToken
```

---

# Concurrency / Double Booking Protection

Double booking is prevented at the **database level** using a unique compound index on:

```
(doctorId, slotDate, slotStart)
```

for appointments where status is not cancelled.

If two users attempt to book the same slot simultaneously:

* One request succeeds
* The other receives:

```
409 Conflict
```

---

# Environment Variables

Create a `.env` file in the project root (use `.env.example` as a template).

```env
PORT=5000
NODE_ENV=development
MONGO_URI=
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

---

# Local Setup

## 1) Install Dependencies

```bash
npm install
```

---

## 2) Run in Development Mode

```bash
npm run dev
```

Uses **nodemon** for automatic server restart.

---

## 3) Run in Production Mode

```bash
npm start
```

---

# Health Check

Endpoint to verify the API server is running.

```
GET /health
```
