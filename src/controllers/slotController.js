const DoctorSchedule = require("../models/DoctorSchedule");
const Appointment = require("../models/Appointment");
const User = require("../models/User");
const { generateSlots } = require("../services/slotService");
const { sendSuccess, sendError } = require("../utils/responseUtils");
const { audit, getRequestMeta } = require("../utils/auditUtils");
const {
  AUDIT_ACTIONS,
  AUDIT_ENTITIES,
  ROLES,
  DAYS_OF_WEEK,
  APPOINTMENT_STATUS,
} = require("../config/constants");

const getSlots = async (req, res, next) => {
  try {
    const { doctorId, date } = req.query;

    if (!doctorId || !date) {
      return sendError(res, "doctorId and date are required", 400);
    }

    const today = new Date().toISOString().split("T")[0];
    if (date < today) {
      return sendError(res, "Cannot fetch slots for past dates", 400);
    }

    const dayName = DAYS_OF_WEEK[new Date(`${date}T00:00:00`).getDay()];

    const schedule = await DoctorSchedule.findOne({
      doctorId,
      dayOfWeek: dayName,
      isActive: true,
    });

    if (!schedule) {
      return sendSuccess(res, {
        slots: [],
        hasSchedule: false,
        message: `Doctor has no schedule on ${dayName}`,
      });
    }

    const rawSlots = generateSlots({
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      slotDuration: schedule.slotDuration,
      breaks: schedule.breaks,
    });

    const bookedAppointments = await Appointment.find({
      doctorId,
      slotDate: date,
      status: { $nin: [APPOINTMENT_STATUS.CANCELLED] }, // cancelled = available again
    })
      .select("slotStart status patientId")
      .lean();

    const bookedMap = {};
    bookedAppointments.forEach((apt) => {
      bookedMap[apt.slotStart] = {
        appointmentId: apt._id,
        status: apt.status,
      };
    });

    const now = new Date();
    const isToday = date === today;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const enrichedSlots = rawSlots.map((slot) => {
      const [h, m] = slot.start.split(":").map(Number);
      const slotMinutes = h * 60 + m;

      let status = "available";

      if (isToday && slotMinutes <= currentMinutes) {
        status = "past";
      } else if (bookedMap[slot.start]) {
        status = bookedMap[slot.start].status;
      }

      return {
        start: slot.start,
        end: slot.end,
        status,
        appointmentId: bookedMap[slot.start]?.appointmentId || null,
      };
    });

    return sendSuccess(res, {
      slots: enrichedSlots,
      hasSchedule: true,
      dayOfWeek: dayName,
      slotDuration: schedule.slotDuration,
      workingHours: {
        start: schedule.startTime,
        end: schedule.endTime,
      },
      breaks: schedule.breaks,
    });
  } catch (error) {
    next(error);
  }
};

const getDoctorSchedule = async (req, res, next) => {
  try {
    const schedules = await DoctorSchedule.find({
      doctorId: req.params.doctorId,
      isActive: true,
    }).sort({ dayOfWeek: 1 });

    return sendSuccess(res, { schedules }, "Schedule fetched successfully");
  } catch (error) {
    next(error);
  }
};

const upsertDoctorSchedule = async (req, res, next) => {
  try {
    const { doctorId, dayOfWeek, startTime, endTime, slotDuration, breaks } =
      req.body;
    const meta = getRequestMeta(req);

    const doctor = await User.findOne({
      _id: doctorId,
      role: ROLES.DOCTOR,
      isActive: true,
    });

    if (!doctor) {
      return sendError(res, "Doctor not found or inactive", 404);
    }

    const [startH, startM] = startTime.split(":").map(Number);
    const [endH, endM] = endTime.split(":").map(Number);
    if (startH * 60 + startM >= endH * 60 + endM) {
      return sendError(res, "Start time must be before end time", 400);
    }

    const schedule = await DoctorSchedule.findOneAndUpdate(
      { doctorId, dayOfWeek },
      { startTime, endTime, slotDuration, breaks, isActive: true },
      { upsert: true, new: true, runValidators: true },
    );

    audit({
      userId: req.user._id,
      role: req.user.role,
      action: AUDIT_ACTIONS.CREATE,
      entity: AUDIT_ENTITIES.DOCTOR_SCHEDULE,
      entityId: schedule._id,
      metadata: { doctorId, dayOfWeek, startTime, endTime, slotDuration },
      ...meta,
    });

    return sendSuccess(res, { schedule }, "Schedule saved successfully", 201);
  } catch (error) {
    next(error);
  }
};

const deleteSchedule = async (req, res, next) => {
  try {
    const meta = getRequestMeta(req);

    const schedule = await DoctorSchedule.findByIdAndUpdate(
      req.params.scheduleId,
      { isActive: false },
      { new: true },
    );

    if (!schedule) {
      return sendError(res, "Schedule not found", 404);
    }

    audit({
      userId: req.user._id,
      role: req.user.role,
      action: AUDIT_ACTIONS.DELETE,
      entity: AUDIT_ENTITIES.DOCTOR_SCHEDULE,
      entityId: schedule._id,
      ...meta,
    });

    return sendSuccess(res, {}, "Schedule removed successfully");
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSlots,
  getDoctorSchedule,
  upsertDoctorSchedule,
  deleteSchedule,
};
