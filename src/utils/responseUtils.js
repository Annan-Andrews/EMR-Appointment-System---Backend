/**
 * Send a success response
 *
 * @param {object} res        - Express response object
 * @param {object} data       - Payload to send to client
 * @param {string} message    - Human readable success message
 * @param {number} statusCode - HTTP status code (default 200)
 *
 * Usage:
 *   return sendSuccess(res, { user }, "Login successful");
 *   return sendSuccess(res, { appointment }, "Appointment booked", 201);
 */
const sendSuccess = (res, data = {}, message = "Success", statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * Send an error response
 *
 * @param {object} res        - Express response object
 * @param {string} message    - Human readable error message
 * @param {number} statusCode - HTTP status code (default 500)
 * @param {Array}  errors     - Validation errors array (optional)
 *
 * Usage:
 *   return sendError(res, "User not found", 404);
 *   return sendError(res, "Validation failed", 422, errorsArray);
 */
const sendError = (
  res,
  message = "Something went wrong",
  statusCode = 500,
  errors = null,
) => {
  const response = {
    success: false,
    message,
  };

  if (errors) response.errors = errors;

  return res.status(statusCode).json(response);
};

/**
 * Calculate pagination values from query params
 *
 * @param {number} page  - Current page number (default 1)
 * @param {number} limit - Items per page (default 20, max 100)
 * @returns {{ page, limit, skip }}
 *
 * How skip works:
 *   page=1, limit=20 → skip=0   (documents 1–20)
 *   page=2, limit=20 → skip=20  (documents 21–40)
 *   page=3, limit=20 → skip=40  (documents 41–60)
 *
 * Usage:
 *   const { page, limit, skip } = getPagination(req.query.page, req.query.limit);
 *   const users = await User.find().skip(skip).limit(limit);
 */
const getPagination = (page = 1, limit = 20) => {
  const pageNum = Math.max(1, parseInt(page)); // minimum page 1
  const limitNum = Math.min(100, Math.max(1, parseInt(limit))); // between 1-100
  const skip = (pageNum - 1) * limitNum;
  return { page: pageNum, limit: limitNum, skip };
};

/**
 * Build a consistent paginated response object
 *
 * @param {Array}  data  - The documents for current page
 * @param {number} total - Total documents matching the query
 * @param {number} page  - Current page number
 * @param {number} limit - Items per page
 *
 * Usage:
 *   return sendSuccess(res, paginatedResponse(users, total, page, limit));
 */
const paginatedResponse = (data, total, page, limit) => ({
  data,
  pagination: {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasMore: page * limit < total,
  },
});

module.exports = {
  sendSuccess,
  sendError,
  getPagination,
  paginatedResponse,
};
