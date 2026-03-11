const ROLES = {
  SUPER_ADMIN: "superadmin",
  DOCTOR: "doctor",
  RECEPTIONIST: "receptionist",
};

const APPOINTMENT_STATUS = {
  BOOKED: "booked",
  ARRIVED: "arrived",
  CANCELLED: "cancelled",
  COMPLETED: "completed",
  NO_SHOW: "no_show",
};

const AUDIT_ACTIONS = {
  LOGIN: "LOGIN",
  LOGOUT: "LOGOUT",
  LOGIN_FAILED: "LOGIN_FAILED",
  CREATE: "CREATE",
  UPDATE: "UPDATE",
  DELETE: "DELETE",
  ARRIVE: "ARRIVE",
};

const AUDIT_ENTITIES = {
  USER: "User",
  APPOINTMENT: "Appointment",
  PATIENT: "Patient",
  DOCTOR_SCHEDULE: "DoctorSchedule",
};

const DAYS_OF_WEEK = [
  "sunday", "monday", "tuesday",
  "wednesday", "thursday", "friday", "saturday",
];

module.exports = {
  ROLES,
  APPOINTMENT_STATUS,
  AUDIT_ACTIONS,
  AUDIT_ENTITIES,
  DAYS_OF_WEEK,
};