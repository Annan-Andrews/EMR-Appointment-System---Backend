# EMR Appointment System — API Documentation

**Base URL (dev):** `http://localhost:5000/api`

---

## Response Shape

### Success

```json
{ "success": true, "message": "…", "data": {} }
```

### Error

```json
{ "success": false, "message": "…", "errors": [ { "field": "…", "message": "…" } ] }
```

---

# Authentication

## POST /auth/login

**Body**

```json
{ "email": "admin@emr.com", "password": "Admin@1234" }
```

**Response (200)**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "JWT",
    "user": {
      "id": "...",
      "name": "...",
      "email": "...",
      "role": "superadmin"
    }
  }
}
```

**Notes**

Refresh token is set as an httpOnly cookie named `refreshToken`.

---

## POST /auth/refresh

Uses refresh cookie.

**Response (200)**

```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": { "accessToken": "JWT" }
}
```

---

## POST /auth/logout

**Protected Route**

Clears refresh token (DB + cookie).

---

## GET /auth/me

**Protected Route**

Returns the currently authenticated user.

---

# Users

## GET /users/doctors

**Protected Route**

**Query (optional)**

* `department`

Example:

```
/users/doctors?department=cardiology
```

---

## Super Admin Staff Management (Protected)

### GET /users

**Query Parameters**

* `role`
* `isActive`
* `search`
* `page`
* `limit`

---

### POST /users

Create a new user.

---

### PUT /users/:id

Update an existing user.

---

### DELETE /users/:id

Soft deletes (deactivates) a user.

---

# Slots

## GET /slots

**Protected Route**

**Query Parameters (required)**

* `doctorId`
* `date` (YYYY-MM-DD)

Returns generated slots with status such as:

* `available`
* `past`
* appointment status (e.g. `booked`, `arrived`)

---

# Patients (Receptionist/Admin)

## GET /patients

**Query Parameters**

* `search`
* `page`
* `limit`

---

## GET /patients/:id

Get a specific patient.

---

## POST /patients

Create a new patient.

---

## PUT /patients/:id

Update patient details.

---

# Appointments

## GET /appointments

**Protected Route**

**Query Parameters**

* `doctorId` (admin/receptionist)
* `date`
* `status`
* `page`
* `limit`

**Doctor Rule**

If role is `doctor`, the API returns only that doctor’s appointments.

---

## GET /appointments/:id

**Protected Route**

Doctors cannot access another doctor’s appointment (`403`).

---

## POST /appointments

**Receptionist/Admin Only**

### Existing Patient Example

```json
{
  "doctorId": "...",
  "slotDate": "2026-03-11",
  "slotStart": "09:00",
  "slotEnd": "09:15",
  "patientType": "existing",
  "patientId": "...",
  "purpose": "Checkup",
  "notes": "..."
}
```

### New Patient Example

```json
{
  "doctorId": "...",
  "slotDate": "2026-03-11",
  "slotStart": "09:00",
  "slotEnd": "09:15",
  "patientType": "new",
  "patientData": {
    "name": "John Doe",
    "mobile": "0123456789"
  }
}
```

**Conflict (409)**

Returned if the slot was already booked.

---

## PUT /appointments/:id

**Receptionist/Admin Only**

Edits `purpose` and `notes`.

---

## DELETE /appointments/:id

**Receptionist/Admin Only**

Cancels an appointment (sets status to `cancelled`).

---

## POST /appointments/:id/arrive

**Receptionist/Admin Only**

Marks appointment status from `booked` → `arrived`.
