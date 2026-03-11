const Appointment = require("../models/Appointment");
const Patient = require("../models/Patient");
const { generateSlots } = require("../services/slotService");
const DoctorSchedule = require("../models/DoctorSchedule");
const {
  sendSuccess,
  sendError,
  getPagination,
  paginatedResponse,
} = require("../utils/responseUtils");
const { audit, getRequestMeta } = require("../utils/auditUtils");
const {
  AUDIT_ACTIONS,
  AUDIT_ENTITIES,
  APPOINTMENT_STATUS,
  ROLES,
  DAYS_OF_WEEK,
} = require("../config/constants");

const getAppointments = async (req, res, next) => {
  try {
    const { doctorId, date, status, page, limit } = req.query;
    const { skip, page: pageNum, limit: limitNum } = getPagination(page, limit);
    const { user } = req;

    const filter = {};

    if (user.role === ROLES.DOCTOR) {
      filter.doctorId = user._id;
    } else {
      if (doctorId) filter.doctorId = doctorId;
    }

    if (date) filter.slotDate = date;
    if (status) filter.status = status;

    const [appointments, total] = await Promise.all([
      Appointment.find(filter)
        .populate("doctorId", "name department specialization")
        .populate("patientId", "name mobile patientId")
        .populate("bookedBy", "name role")
        .sort({ slotDate: -1, slotStart: 1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Appointment.countDocuments(filter),
    ]);

    return sendSuccess(
      res,
      paginatedResponse(appointments, total, pageNum, limitNum),
      "Appointments fetched successfully",
    );
  } catch (error) {
    next(error);
  }
};

const getAppointmentById = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate("doctorId", "name department specialization phone")
      .populate("patientId", "name mobile patientId dob gender bloodGroup")
      .populate("bookedBy", "name role")
      .populate("cancelledBy", "name role")
      .lean();

    if (!appointment) {
      return sendError(res, "Appointment not found", 404);
    }

    if (
      req.user.role === ROLES.DOCTOR &&
      appointment.doctorId._id.toString() !== req.user._id.toString()
    ) {
      return sendError(res, "Access denied", 403);
    }

    return sendSuccess(
      res,
      { appointment },
      "Appointment fetched successfully",
    );
  } catch (error) {
    next(error);
  }
};

const createAppointment = async (req, res, next) => {
  try {
    const {
      doctorId,
      slotDate,
      slotStart,
      slotEnd,
      purpose,
      notes,
      patientType,
      patientId,
      patientData,
    } = req.body;
    const meta = getRequestMeta(req);

    const today = new Date().toISOString().split("T")[0];

    if (slotDate < today) {
      return sendError(res, "Cannot book appointments in the past", 400);
    }

    if (slotDate === today) {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const [h, m] = slotStart.split(":").map(Number);
      const slotMinutes = h * 60 + m;

      if (slotMinutes <= currentMinutes) {
        return sendError(
          res,
          "Cannot book a slot that has already passed",
          400,
        );
      }
    }

    const dayName = DAYS_OF_WEEK[new Date(`${slotDate}T00:00:00`).getDay()];
    const schedule = await DoctorSchedule.findOne({
      doctorId,
      dayOfWeek: dayName,
      isActive: true,
    });

    if (!schedule) {
      return sendError(res, "Doctor has no schedule on this date", 400);
    }

    const validSlots = generateSlots({
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      slotDuration: schedule.slotDuration,
      breaks: schedule.breaks,
    });

    const isValidSlot = validSlots.some(
      (s) => s.start === slotStart && s.end === slotEnd,
    );

    if (!isValidSlot) {
      return sendError(res, "Invalid slot for this doctor's schedule", 400);
    }

    let resolvedPatientId;

    if (patientType === "existing") {
      if (!patientId) {
        return sendError(
          res,
          "patientId is required for existing patient",
          400,
        );
      }

      const existingPatient = await Patient.findById(patientId);
      if (!existingPatient) {
        return sendError(res, "Patient not found", 404);
      }

      resolvedPatientId = existingPatient._id;
    } else if (patientType === "new") {
      if (!patientData?.name) {
        return sendError(res, "Patient name is required", 400);
      }

      if (patientData.mobile) {
        const mobileExists = await Patient.findOne({
          mobile: patientData.mobile,
        });
        if (mobileExists) {
          return sendError(
            res,
            "A patient with this mobile already exists. Use existing patient instead.",
            409,
          );
        }
      }

      const newPatient = await Patient.create(patientData);
      resolvedPatientId = newPatient._id;
    } else {
      return sendError(res, "patientType must be 'new' or 'existing'", 400);
    }

    let appointment;
    try {
      appointment = await Appointment.create({
        doctorId,
        patientId: resolvedPatientId,
        slotDate,
        slotStart,
        slotEnd,
        purpose,
        notes,
        bookedBy: req.user._id,
        status: APPOINTMENT_STATUS.BOOKED,
      });
    } catch (err) {
      if (err.code === 11000) {
        return sendError(
          res,
          "This slot was just booked by someone else. Please select another slot.",
          409,
        );
      }
      throw err;
    }

    await appointment.populate([
      { path: "doctorId", select: "name department" },
      { path: "patientId", select: "name mobile patientId" },
      { path: "bookedBy", select: "name role" },
    ]);

    audit({
      userId: req.user._id,
      role: req.user.role,
      action: AUDIT_ACTIONS.CREATE,
      entity: AUDIT_ENTITIES.APPOINTMENT,
      entityId: appointment._id,
      metadata: { doctorId, slotDate, slotStart, patientType },
      ...meta,
    });

    return sendSuccess(
      res,
      { appointment },
      "Appointment booked successfully",
      201,
    );
  } catch (error) {
    next(error);
  }
};

const updateAppointment = async (req, res, next) => {
  try {
    const { purpose, notes } = req.body;
    const meta = getRequestMeta(req);

    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return sendError(res, "Appointment not found", 404);
    }

    if (appointment.status === APPOINTMENT_STATUS.CANCELLED) {
      return sendError(res, "Cannot edit a cancelled appointment", 400);
    }

    if (purpose !== undefined) appointment.purpose = purpose;
    if (notes !== undefined) appointment.notes = notes;

    await appointment.save();

    audit({
      userId: req.user._id,
      role: req.user.role,
      action: AUDIT_ACTIONS.UPDATE,
      entity: AUDIT_ENTITIES.APPOINTMENT,
      entityId: appointment._id,
      metadata: { updatedFields: Object.keys(req.body) },
      ...meta,
    });

    return sendSuccess(
      res,
      { appointment },
      "Appointment updated successfully",
    );
  } catch (error) {
    next(error);
  }
};

const   deleteAppointment = async (req, res, next) => {
  try {
    const meta = getRequestMeta(req);

    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return sendError(res, "Appointment not found", 404);
    }

    if (appointment.status === APPOINTMENT_STATUS.CANCELLED) {
      return sendError(res, "Appointment is already cancelled", 400);
    }

    if (appointment.status === APPOINTMENT_STATUS.COMPLETED) {
      return sendError(res, "Cannot cancel a completed appointment", 400);
    }

    appointment.status = APPOINTMENT_STATUS.CANCELLED;
    appointment.cancelledAt = new Date();
    appointment.cancelledBy = req.user._id;
    await appointment.save();

    audit({
      userId: req.user._id,
      role: req.user.role,
      action: AUDIT_ACTIONS.DELETE,
      entity: AUDIT_ENTITIES.APPOINTMENT,
      entityId: appointment._id,
      metadata: {
        slotDate: appointment.slotDate,
        slotStart: appointment.slotStart,
      },
      ...meta,
    });

    return sendSuccess(res, {}, "Appointment cancelled successfully");
  } catch (error) {
    next(error);
  }
};

const markArrived = async (req, res, next) => {
  try {
    const meta = getRequestMeta(req);

    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return sendError(res, "Appointment not found", 404);
    }

    // Can only mark arrived if currently booked
    if (appointment.status !== APPOINTMENT_STATUS.BOOKED) {
      return sendError(
        res,
        `Cannot mark arrival for a ${appointment.status} appointment`,
        400,
      );
    }

    appointment.status = APPOINTMENT_STATUS.ARRIVED;
    appointment.arrivedAt = new Date(); // exact timestamp
    await appointment.save();

    await appointment.populate([
      { path: "patientId", select: "name mobile patientId" },
      { path: "doctorId", select: "name department" },
    ]);

    audit({
      userId: req.user._id,
      role: req.user.role,
      action: AUDIT_ACTIONS.ARRIVE,
      entity: AUDIT_ENTITIES.APPOINTMENT,
      entityId: appointment._id,
      metadata: {
        arrivedAt: appointment.arrivedAt,
        patientId: appointment.patientId,
      },
      ...meta,
    });

    return sendSuccess(res, { appointment }, "Patient marked as arrived");
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  markArrived,
};
