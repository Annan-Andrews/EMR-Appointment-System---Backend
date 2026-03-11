const Patient = require("../models/Patient");
const {
  sendSuccess,
  sendError,
  getPagination,
  paginatedResponse,
} = require("../utils/responseUtils");
const { audit, getRequestMeta } = require("../utils/auditUtils");
const { AUDIT_ACTIONS, AUDIT_ENTITIES } = require("../config/constants");

const getPatients = async (req, res, next) => {
  try {
    const { search, page, limit } = req.query;
    const { skip, page: pageNum, limit: limitNum } = getPagination(page, limit);

    const filter = { isActive: true };

    if (search && search.trim()) {
      filter.$or = [
        { name: { $regex: search.trim(), $options: "i" } },
        { mobile: { $regex: search.trim(), $options: "i" } },
        { patientId: { $regex: search.trim(), $options: "i" } },
      ];
    }

    const [patients, total] = await Promise.all([
      Patient.find(filter).sort({ name: 1 }).skip(skip).limit(limitNum).lean(),
      Patient.countDocuments(filter),
    ]);

    return sendSuccess(
      res,
      paginatedResponse(patients, total, pageNum, limitNum),
      "Patients fetched successfully",
    );
  } catch (error) {
    next(error);
  }
};

const getPatientById = async (req, res, next) => {
  try {
    const patient = await Patient.findById(req.params.id).lean();

    if (!patient) {
      return sendError(res, "Patient not found", 404);
    }

    return sendSuccess(res, { patient }, "Patient fetched successfully");
  } catch (error) {
    next(error);
  }
};

const createPatient = async (req, res, next) => {
  try {
    const { name, mobile, email, dob, gender, address, bloodGroup } = req.body;
    const meta = getRequestMeta(req);

    if (mobile) {
      const existingPatient = await Patient.findOne({ mobile }).lean();
      if (existingPatient) {
        return sendError(
          res,
          `A patient with mobile ${mobile} already exists`,
          409,
        );
      }
    }

    const patient = await Patient.create({
      name,
      mobile,
      email,
      dob,
      gender,
      address,
      bloodGroup,
    });

    audit({
      userId: req.user._id,
      role: req.user.role,
      action: AUDIT_ACTIONS.CREATE,
      entity: AUDIT_ENTITIES.PATIENT,
      entityId: patient._id,
      metadata: { name, mobile },
      ...meta,
    });

    return sendSuccess(res, { patient }, "Patient created successfully", 201);
  } catch (error) {
    next(error);
  }
};

const updatePatient = async (req, res, next) => {
  try {
    const { name, email, dob, gender, address, bloodGroup } = req.body;
    const meta = getRequestMeta(req);

    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      { name, email, dob, gender, address, bloodGroup },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!patient) {
      return sendError(res, "Patient not found", 404);
    }

    audit({
      userId: req.user._id,
      role: req.user.role,
      action: AUDIT_ACTIONS.UPDATE,
      entity: AUDIT_ENTITIES.PATIENT,
      entityId: patient._id,
      metadata: { updatedFields: Object.keys(req.body) },
      ...meta,
    });

    return sendSuccess(res, { patient }, "Patient updated successfully");
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPatients,
  getPatientById,
  createPatient,
  updatePatient,
};
