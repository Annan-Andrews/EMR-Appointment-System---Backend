const express = require("express");
const authRoutes = require("./authRoutes");
const userRoutes = require("./userRoutes");
const patientRoutes = require("./patientRoutes");
const slotRoutes = require("./slotRoutes");
const appointmentRoutes = require("./appointmentRoutes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/patients", patientRoutes);
router.use("/slots", slotRoutes);
router.use("/appointments", appointmentRoutes);

module.exports = router;
