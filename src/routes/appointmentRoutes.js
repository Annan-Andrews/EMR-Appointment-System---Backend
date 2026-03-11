const express = require("express");
const { body } = require("express-validator");
const {
  getAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  markArrived,
} = require("../controllers/appointmentController");
const { authenticate } = require("../middleware/authMiddleware");
const {
  allRoles,
  receptionistOrAdmin,
} = require("../middleware/rbacMiddleware");
const { validate } = require("../middleware/validateMiddleware");

const router = express.Router();

router.use(authenticate);

const createAppointmentValidation = [
  body("doctorId").notEmpty().withMessage("doctorId is required"),
  body("slotDate")
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage("slotDate must be YYYY-MM-DD"),
  body("slotStart")
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage("slotStart must be HH:MM"),
  body("slotEnd")
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage("slotEnd must be HH:MM"),
  body("patientType")
    .isIn(["new", "existing"])
    .withMessage("patientType must be new or existing"),
];

router.get("/", allRoles, getAppointments);

router.get("/:id", allRoles, getAppointmentById);

router.post(
  "/",
  receptionistOrAdmin,
  createAppointmentValidation,
  validate,
  createAppointment,
);

router.put("/:id", receptionistOrAdmin, updateAppointment);

router.delete("/:id", receptionistOrAdmin, deleteAppointment);

router.post("/:id/arrive", receptionistOrAdmin, markArrived);

module.exports = router;
