const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema(
  {
    patientId: {
      type: String,
      unique: true,
    },
    name: {
      type: String,
      required: [true, "Patient name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    mobile: {
      type: String,
      trim: true,
      match: [/^[0-9]{10,15}$/, "Please provide a valid mobile number"],
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    dob: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
    },
    address: {
      type: String,
      trim: true,
    },
    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

patientSchema.pre("save", async function () {
  if (!this.isNew) return;

  let isUnique = false;
  while (!isUnique) {
    const count = await mongoose.model("Patient").countDocuments();
    const candidate = `PAT${String(count + 1).padStart(6, "0")}`;

    const existing = await mongoose
      .model("Patient")
      .findOne({ patientId: candidate });
    if (!existing) {
      this.patientId = candidate;
      isUnique = true;
    }
  }
});

patientSchema.index({ mobile: 1 }, { unique: true, sparse: true });
patientSchema.index({ name: "text" });

module.exports = mongoose.model("Patient", patientSchema);
