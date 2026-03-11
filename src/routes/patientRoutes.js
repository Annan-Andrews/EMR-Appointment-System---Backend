const express = require("express");
const { body } = require("express-validator");
const {
  getPatients,
  getPatientById,
  createPatient,
  updatePatient,
} = require("../controllers/patientController");
const { authenticate } = require("../middleware/authMiddleware");
const { receptionistOrAdmin } = require("../middleware/rbacMiddleware");
const { validate } = require("../middleware/validateMiddleware");

const router = express.Router();

router.use(authenticate, receptionistOrAdmin);

const createPatientValidation = [
  body("name").notEmpty().trim().withMessage("Patient name is required"),
  body("mobile")
    .optional()
    .matches(/^[0-9]{10,15}$/)
    .withMessage("Valid mobile number required"),
  body("email")
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage("Valid email required"),
  body("gender")
    .optional()
    .isIn(["male", "female", "other"])
    .withMessage("Invalid gender"),
];

router.get("/", getPatients);

router.get("/:id", getPatientById);

router.post("/", createPatientValidation, validate, createPatient);

router.put("/:id", updatePatient);

module.exports = router;
