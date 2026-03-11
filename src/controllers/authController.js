const User = require("../models/User");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
} = require("../utils/tokenUtils");
const { sendSuccess, sendError } = require("../utils/responseUtils");
const { audit, getRequestMeta } = require("../utils/auditUtils");
const { AUDIT_ACTIONS, AUDIT_ENTITIES } = require("../config/constants");

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const meta = getRequestMeta(req); // IP + userAgent for audit

    const user = await User.findOne({ email }).select("+password");

    const isPasswordValid = user && (await user.comparePassword(password));

    if (!user || !isPasswordValid) {
      audit({
        action: AUDIT_ACTIONS.LOGIN_FAILED,
        entity: AUDIT_ENTITIES.USER,
        metadata: { email },
        success: false,
        errorMessage: "Invalid credentials",
        ...meta,
      });
      return sendError(res, "Invalid email or password", 401);
    }

    if (!user.isActive) {
      return sendError(
        res,
        "Your account has been deactivated. Please contact admin.",
        403,
      );
    }

    const tokenPayload = { id: user._id, role: user.role };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    setRefreshTokenCookie(res, refreshToken);

    audit({
      userId: user._id,
      role: user.role,
      action: AUDIT_ACTIONS.LOGIN,
      entity: AUDIT_ENTITIES.USER,
      entityId: user._id,
      success: true,
      ...meta,
    });

    return sendSuccess(
      res,
      {
        accessToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
          specialization: user.specialization,
        },
      },
      "Login successful",
    );
  } catch (error) {
    next(error);
  }
};

const refresh = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;

    if (!token) {
      return sendError(
        res,
        "Refresh token not found. Please login again.",
        401,
      );
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch (err) {
      clearRefreshTokenCookie(res);
      return sendError(res, "Session expired. Please login again.", 401);
    }

    const user = await User.findById(decoded.id).select("+refreshToken");

    if (!user || user.refreshToken !== token) {
      clearRefreshTokenCookie(res);
      return sendError(res, "Invalid session. Please login again.", 401);
    }

    if (!user.isActive) {
      return sendError(res, "Account deactivated.", 403);
    }

    const tokenPayload = { id: user._id, role: user.role };
    const newAccessToken = generateAccessToken(tokenPayload);
    const newRefreshToken = generateRefreshToken(tokenPayload);

    user.refreshToken = newRefreshToken;
    await user.save({ validateBeforeSave: false });
    setRefreshTokenCookie(res, newRefreshToken);

    return sendSuccess(
      res,
      { accessToken: newAccessToken },
      "Token refreshed successfully",
    );
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const meta = getRequestMeta(req);

    await User.findByIdAndUpdate(
      req.user._id,
      { refreshToken: null },
      { validateBeforeSave: false },
    );

    clearRefreshTokenCookie(res);

    audit({
      userId: req.user._id,
      role: req.user.role,
      action: AUDIT_ACTIONS.LOGOUT,
      entity: AUDIT_ENTITIES.USER,
      entityId: req.user._id,
      ...meta,
    });

    return sendSuccess(res, {}, "Logged out successfully");
  } catch (error) {
    next(error);
  }
};

const getMe = (req, res) => {
  return sendSuccess(res, { user: req.user }, "User fetched successfully");
};

module.exports = { login, refresh, logout, getMe };
