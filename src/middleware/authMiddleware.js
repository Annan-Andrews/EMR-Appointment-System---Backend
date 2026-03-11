const { verifyAccessToken } = require("../utils/tokenUtils");
const { sendError } = require("../utils/responseUtils");
const User = require("../models/User");

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return sendError(res, "Access token required", 401);
    }

    const token = authHeader.split(" ")[1];

    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return sendError(res, "Access token expired, please refresh", 401);
      }
      return sendError(res, "Invalid access token", 401);
    }

    const user = await User.findById(decoded.id).select(
      "-password -refreshToken",
    );

    if (!user) {
      return sendError(res, "User no longer exists", 401);
    }

    if (!user.isActive) {
      return sendError(
        res,
        "Your account has been deactivated. Contact admin.",
        403,
      );
    }

    req.user = user;

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { authenticate };
