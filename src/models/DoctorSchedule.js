const mongoose = require("mongoose");
const { DAYS_OF_WEEK } = require("../config/constants");

const breakSchema = new mongoose.Schema(
  {
    start: {
      type: String,
      required: true,
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, "Use HH:MM format"],
    },
    end: {
      type: String,
      required: true,
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, "Use HH:MM format"],
    },
    label: {
      type: String,
      default: "Break",
    },
  },
  { _id: false }
);

const doctorScheduleSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    dayOfWeek: {
      type: String,
      enum: DAYS_OF_WEEK,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, "Use HH:MM format"],
    },
    endTime: {
      type: String,
      required: true,
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, "Use HH:MM format"],
    },
    slotDuration: {
      type: Number,
      required: true,
      min: [5, "Minimum slot is 5 minutes"],
      max: [120, "Maximum slot is 120 minutes"],
      default: 15,
    },
    breaks: {
      type: [breakSchema],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// One schedule entry per doctor per day
doctorScheduleSchema.index(
  { doctorId: 1, dayOfWeek: 1 },
  { unique: true }
);

module.exports = mongoose.model("DoctorSchedule", doctorScheduleSchema);