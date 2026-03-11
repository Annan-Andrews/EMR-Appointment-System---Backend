const express = require("express");
const { body } = require("express-validator");
const {
  getSlots,
  getDoctorSchedule,
  upsertDoctorSchedule,
  deleteSchedule,
} = require("../controllers/slotController");
const { authenticate } = require("../middleware/authMiddleware");
const { superAdminOnly, allRoles } = require("../middleware/rbacMiddleware");
const { validate } = require("../middleware/validateMiddleware");

const router = express.Router();

router.use(authenticate);

const scheduleValidation = [
  body("doctorId").notEmpty().withMessage("doctorId is required"),
  body("dayOfWeek")
    .isIn([
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ])
    .withMessage("Invalid day of week"),
  body("startTime")
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage("startTime must be HH:MM"),
  body("endTime")
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage("endTime must be HH:MM"),
  body("slotDuration")
    .isInt({ min: 5, max: 120 })
    .withMessage("slotDuration must be between 5 and 120 minutes"),
];

router.get("/", allRoles, getSlots);

router.get("/schedule/:doctorId", allRoles, getDoctorSchedule);

router.post(
  "/schedule",
  superAdminOnly,
  scheduleValidation,
  validate,
  upsertDoctorSchedule,
);

router.delete("/schedule/:scheduleId", superAdminOnly, deleteSchedule);

module.exports = router;
