const express = require("express");
const { body } = require("express-validator");
const {
  login,
  refresh,
  logout,
  getMe,
} = require("../controllers/authController");
const { authenticate } = require("../middleware/authMiddleware");
const { validate } = require("../middleware/validateMiddleware");

const router = express.Router();

router.post(
  "/login",
  [
    body("email")
      .isEmail()
      .withMessage("Valid email is required")
      .normalizeEmail(),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  validate,
  login,
);

router.post("/refresh", refresh);

router.post("/logout", authenticate, logout);

router.get("/me", authenticate, getMe);

module.exports = router;
