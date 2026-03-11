const User = require("../models/User");
const {
  sendSuccess,
  sendError,
  getPagination,
  paginatedResponse,
} = require("../utils/responseUtils");
const { audit, getRequestMeta } = require("../utils/auditUtils");
const { AUDIT_ACTIONS, AUDIT_ENTITIES, ROLES } = require("../config/constants");

const getDoctors = async (req, res, next) => {
  try {
    const { department } = req.query;

    const filter = {
      role: ROLES.DOCTOR,
      isActive: true,
    };

    if (department) {
      filter.department = { $regex: department, $options: "i" };
    }

    const doctors = await User.find(filter)
      .select("name email department specialization phone")
      .sort({ name: 1 });

    return sendSuccess(res, { doctors }, "Doctors fetched successfully");
  } catch (error) {
    next(error);
  }
};

const getUsers = async (req, res, next) => {
  try {
    const { role, isActive, search, page, limit } = req.query;
    const { skip, page: pageNum, limit: limitNum } = getPagination(page, limit);

    const filter = {};
    if (role) filter.role = role;
    if (isActive !== undefined) {
      filter.isActive = isActive === "true";
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select("-password -refreshToken")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      User.countDocuments(filter),
    ]);

    return sendSuccess(
      res,
      paginatedResponse(users, total, pageNum, limitNum),
      "Users fetched successfully",
    );
  } catch (error) {
    next(error);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select(
      "-password -refreshToken",
    );

    if (!user) {
      return sendError(res, "User not found", 404);
    }

    return sendSuccess(res, { user }, "User fetched successfully");
  } catch (error) {
    next(error);
  }
};

const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, department, specialization, phone } =
      req.body;
    const meta = getRequestMeta(req);

    if (role === ROLES.SUPER_ADMIN) {
      return sendError(res, "Cannot create another Super Admin account", 403);
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return sendError(res, "A user with this email already exists", 409);
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
      department,
      specialization,
      phone,
    });

    audit({
      userId: req.user._id,
      role: req.user.role,
      action: AUDIT_ACTIONS.CREATE,
      entity: AUDIT_ENTITIES.USER,
      entityId: user._id,
      metadata: { name, email, role },
      ...meta,
    });

    return sendSuccess(res, { user }, "User created successfully", 201);
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const { name, email, role, department, specialization, phone, isActive } =
      req.body;
    const meta = getRequestMeta(req);

    if (role === ROLES.SUPER_ADMIN) {
      return sendError(res, "Cannot assign Super Admin role", 403);
    }

    if (req.params.id === req.user._id.toString() && isActive === false) {
      return sendError(res, "You cannot deactivate your own account", 400);
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, role, department, specialization, phone, isActive },
      {
        new: true,
        runValidators: true,
      },
    ).select("-password -refreshToken");

    if (!user) {
      return sendError(res, "User not found", 404);
    }

    audit({
      userId: req.user._id,
      role: req.user.role,
      action: AUDIT_ACTIONS.UPDATE,
      entity: AUDIT_ENTITIES.USER,
      entityId: user._id,
      metadata: { updatedFields: Object.keys(req.body) },
      ...meta,
    });

    return sendSuccess(res, { user }, "User updated successfully");
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const meta = getRequestMeta(req);

    if (req.params.id === req.user._id.toString()) {
      return sendError(res, "You cannot deactivate your own account", 400);
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true },
    );

    if (!user) {
      return sendError(res, "User not found", 404);
    }

    audit({
      userId: req.user._id,
      role: req.user.role,
      action: AUDIT_ACTIONS.DELETE,
      entity: AUDIT_ENTITIES.USER,
      entityId: user._id,
      metadata: { deactivatedUser: user.name, role: user.role },
      ...meta,
    });

    return sendSuccess(res, {}, "User deactivated successfully");
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDoctors,
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};
