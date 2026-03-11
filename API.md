# EMR Appointment System — API Documentation
Base URL (dev): `http://localhost:5000/api`
## Response shape
Success:
```json
{ "success": true, "message": "…", "data": {} }
```
Error:
```
{ "success": false, "message": "…", "errors": [ { "field": "…", "message": "…" } ] }
```
Auth
POST /auth/login
Body:
```

{ "email": "admin@emr.com", "password": "Admin@1234" }
```
Response (200):
```
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "JWT",
    "user": { "id": "...", "name": "...", "email": "...", "role": "superadmin" }
  }
}
```
Notes:

Refresh token is set as an httpOnly cookie named refreshToken.

POST /auth/refresh
Uses refresh cookie.

Response (200):
```
{ "success": true, "message": "Token refreshed successfully", "data": { "accessToken": "JWT" } }
```

POST /auth/logout (protected)
Clears refresh token (DB + cookie).

GET /auth/me (protected)
Returns current user.

Users
GET /users/doctors (protected)
Query (optional): department

Example: /users/doctors?department=cardiology

Super Admin staff management (protected)
GET /users (query: role, isActive, search, page, limit)
POST /users
PUT /users/:id
DELETE /users/:id (soft deactivates user)
Slots
GET /slots (protected)
Query (required):

doctorId
date (YYYY-MM-DD)
Returns generated slots with status such as:

available
past
or appointment status (e.g. booked, arrived)
Patients (Receptionist/Admin)
GET /patients (query: search, page, limit)
GET /patients/:id
POST /patients
PUT /patients/:id
Appointments
GET /appointments (protected)
Query: doctorId (admin/receptionist), date, status, page, limit

Doctor rule:

If role is doctor, API returns only that doctor’s appointments.
GET /appointments/:id (protected)
Doctor cannot access another doctor’s appointment (403).

POST /appointments (Receptionist/Admin)
Existing patient example:
```
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
New patient example:
```
{
  "doctorId": "...",
  "slotDate": "2026-03-11",
  "slotStart": "09:00",
  "slotEnd": "09:15",
  "patientType": "new",
  "patientData": { "name": "John Doe", "mobile": "0123456789" }
}
```
Conflict (409):

Returned if the slot was already booked.
PUT /appointments/:id (Receptionist/Admin)
Edits purpose, notes.

DELETE /appointments/:id (Receptionist/Admin)
Cancels (sets status cancelled).

POST /appointments/:id/arrive (Receptionist/Admin)
Marks booked → arrived.
