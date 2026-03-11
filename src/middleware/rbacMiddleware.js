const { sendError } = require("../utils/responseUtils");
const { ROLES } = require("../config/constants");

const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, "Authentication required", 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendError(
        res,
        `Access denied. This action requires: ${allowedRoles.join(" or ")}`,
        403,
      );
    }

    next();
  };
};

const superAdminOnly = requireRole(ROLES.SUPER_ADMIN);

const doctorOnly = requireRole(ROLES.DOCTOR);

const receptionistOrAdmin = requireRole(ROLES.RECEPTIONIST, ROLES.SUPER_ADMIN);

const allRoles = requireRole(
  ROLES.SUPER_ADMIN,
  ROLES.DOCTOR,
  ROLES.RECEPTIONIST,
);

module.exports = {
  requireRole,
  superAdminOnly,
  doctorOnly,
  receptionistOrAdmin,
  allRoles,
};
