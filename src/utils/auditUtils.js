/**
 * auditUtils.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Handles audit logging across the entire application.
 *
 * Key design decision — FIRE AND FORGET:
 *   audit() is never awaited by callers.
 *   Audit logging runs in the background.
 *   If it fails, the main request is NOT affected.
 *   A failed audit log should never break a real user action.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const AuditLog = require("../models/AuditLog");

/**
 * Create an audit log entry (non-blocking)
 *
 * @param {object} data
 * @param {string} data.action       - What happened (LOGIN, CREATE, DELETE...)
 * @param {string} data.entity       - What was affected (User, Appointment...)
 * @param {string} [data.userId]     - Who did it (null for failed logins)
 * @param {string} [data.role]       - Their role
 * @param {string} [data.entityId]   - Which specific record
 * @param {object} [data.metadata]   - Any extra context
 * @param {string} [data.ipAddress]  - Request IP
 * @param {string} [data.userAgent]  - Browser/device info
 * @param {boolean}[data.success]    - Did the action succeed
 * @param {string} [data.errorMessage] - If it failed, why
 *
 * Usage:
 *   // DO THIS — no await, fire and forget
 *   audit({
 *     userId: req.user._id,
 *     role: req.user.role,
 *     action: AUDIT_ACTIONS.CREATE,
 *     entity: AUDIT_ENTITIES.APPOINTMENT,
 *     entityId: appointment._id,
 *     metadata: { doctorId, slotDate },
 *     ...getRequestMeta(req),
 *   });
 *
 *   // NOT THIS — never await audit
 *   await audit({...})
 */
const audit = (data) => {
  const {
    userId = null,
    role = "unknown",
    action,
    entity,
    entityId = null,
    metadata = {},
    ipAddress = null,
    userAgent = null,
    success = true,
    errorMessage = null,
  } = data;

  // Fire and forget — no await, runs in background
  // .catch() ensures errors are silently handled, never thrown
  AuditLog.create({
    userId,
    role,
    action,
    entity,
    entityId,
    metadata,
    ipAddress,
    userAgent,
    success,
    errorMessage,
  }).catch((err) => {
    // Never crash the app over a failed audit log
    // Just warn in console so developers can investigate
    console.error("⚠️  Audit log failed (non-critical):", err.message);
  });

  // No return value — callers should not depend on audit completing
};

/**
 * Extract IP address and user agent from an Express request
 * Used to enrich audit logs with request context
 *
 * x-forwarded-for is checked first because when running behind
 * a proxy or load balancer (like on Render/Railway), req.ip
 * gives you the proxy IP, not the real client IP
 *
 * Usage:
 *   const meta = getRequestMeta(req);
 *   audit({ ...meta, action: "LOGIN" ... });
 *
 *   // or spread directly:
 *   audit({ action: "LOGIN", ...getRequestMeta(req), ... });
 */
const getRequestMeta = (req) => ({
  ipAddress: req.headers["x-forwarded-for"] || req.ip,
  userAgent: req.headers["user-agent"],
});

module.exports = { audit, getRequestMeta };