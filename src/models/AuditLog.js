const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    // WHO
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,    // null for failed logins (no user yet)
    },
    role: {
      type: String,
      default: "unknown",
    },

    // WHAT
    action: {
      type: String,
      required: true,   // "LOGIN", "CREATE", "DELETE" etc
    },

    // ON WHAT
    entity: {
      type: String,
      required: true,   // "Appointment", "Patient", "User"
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,    // which specific record was affected
    },

    // EXTRA CONTEXT
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},      // flexible — store anything extra
    },

    // WHERE FROM
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,     // browser/device info
    },

    // DID IT WORK
    success: {
      type: Boolean,
      default: true,
    },
    errorMessage: {
      type: String,
    },
  },
  { timestamps: true }  // createdAt = the audit timestamp
);

// Common query patterns for audit log searches
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ entity: 1, entityId: 1 });

module.exports = mongoose.model("AuditLog", auditLogSchema);