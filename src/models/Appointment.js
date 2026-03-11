const mongoose = require("mongoose");
const { APPOINTMENT_STATUS } = require("../config/constants");

const appointmentSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    slotDate: {
      type: String,
      required: true,
      match: [/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"],
    },
    slotStart: {
      type: String,
      required: true,
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, "Use HH:MM format"],
    },
    slotEnd: {
      type: String,
      required: true,
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, "Use HH:MM format"],
    },
    status: {
      type: String,
      enum: Object.values(APPOINTMENT_STATUS),
      default: APPOINTMENT_STATUS.BOOKED,
    },
    purpose: {
      type: String,
      trim: true,
      maxlength: [500, "Purpose cannot exceed 500 characters"],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, "Notes cannot exceed 1000 characters"],
    },
    bookedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    arrivedAt: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
    },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

// Prevents double booking atomically at DB level
appointmentSchema.index(
  { doctorId: 1, slotDate: 1, slotStart: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $nin: ["cancelled"] },
    },
  }
);

// Query performance indexes
appointmentSchema.index({ doctorId: 1, slotDate: 1 });
appointmentSchema.index({ doctorId: 1, slotDate: -1 });
appointmentSchema.index({ patientId: 1, slotDate: -1 });

module.exports = mongoose.model("Appointment", appointmentSchema);