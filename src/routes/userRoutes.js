const express = require("express");
const { body } = require("express-validator");
const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getDoctors,
} = require("../controllers/userController");
const { authenticate } = require("../middleware/authMiddleware");
const { superAdminOnly, allRoles } = require("../middleware/rbacMiddleware");
const { validate } = require("../middleware/validateMiddleware");

const router = express.Router();

router.use(authenticate);

const createUserValidation = [
  body("name").notEmpty().trim().withMessage("Name is required"),
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Valid email is required"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),
  body("role")
    .isIn(["doctor", "receptionist"])
    .withMessage("Role must be doctor or receptionist"),
];

router.get("/doctors", allRoles, getDoctors);

router.get("/", superAdminOnly, getUsers);

router.get("/:id", superAdminOnly, getUserById);

router.post("/", superAdminOnly, createUserValidation, validate, createUser);

router.put("/:id", superAdminOnly, updateUser);

router.delete("/:id", superAdminOnly, deleteUser);

module.exports = router;
