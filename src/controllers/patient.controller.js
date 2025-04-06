const bcrypt = require("bcryptjs");
const OtpService = require("../services/otpService");
const PatientService = require("../services/patientService");
const PrescriptionService = require("../services/prescriptionService");
const { errorResponseHandler } = require("../middlewares/errorResponseHandler");
const { statusCodes } = require("../utils/statusCodes");
const {
  patientRegistrationSchema,
  patientLoginSchema,
  patientUpdateSchema,
} = require("../validations/patientValidation");
const spaceService = require("../services/spaceService");
const { generatePatientToken } = require("../utils/jwtHelper");

const registerPatientController = async (req, res) => {
  try {
    const { phone, password, otp } = req.body;
    const { error } = patientRegistrationSchema.validate(
      { phone, password, otp },
      {
        abortEarly: false,
      }
    );

    if (error) {
      const errorDetails = error.details.map((detail) => ({
        field: detail.path[0],
        message: detail.message,
      }));

      throw Object.assign(new Error("Validation failed"), {
        status: statusCodes.BAD_REQUEST,
        error: {
          code: 40002,
          reason: "Validation error",
          details: errorDetails,
        },
      });
    }
    const existingPatient = await PatientService.findPatientByPhone(phone);
    if (existingPatient) {
      throw Object.assign(new Error("Patient already exists"), {
        status: statusCodes.CONFLICT,
        error: { code: 40901 },
      });
    }
    const isValidOtp = await OtpService.verifyOtp(phone, otp);
    if (!isValidOtp) {
      throw Object.assign(new Error("Invalid or expired OTP"), {
        status: statusCodes.BAD_REQUEST,
        error: { code: 40011 },
      });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await PatientService.registerPatient({
      phone,
      password: hashedPassword,
    });

    return res.success({}, "Patient registered successfully.");
  } catch (error) {
    errorResponseHandler(error, req, res);
  }
};
const loginPatientController = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    const { error } = patientLoginSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      const errorDetails = error.details.map((detail) => ({
        field: detail.path[0],
        message: detail.message,
      }));

      throw Object.assign(new Error("Validation failed"), {
        status: statusCodes.BAD_REQUEST,
        error: {
          code: 40002,
          reason: "Validation error",
          details: errorDetails,
        },
      });
    }

    const isValidOtp = await OtpService.verifyOtp(phone, otp);
    if (!isValidOtp) {
      throw Object.assign(new Error("Invalid or expired OTP"), {
        status: statusCodes.BAD_REQUEST,
        error: { code: 40011 },
      });
    }

    let patient = await PatientService.findPatientByPhone(phone);
    if (!patient) {
      patient = await PatientService.registerPatient({
        phone,
      });
    }

    const token = generatePatientToken({
      id: patient.id,
      phone: patient.phone,
      role: "patient",
    });

    return res.success({ phone, token }, "Patient logged in successfully.");
  } catch (error) {
    errorResponseHandler(error, req, res);
  }
};
const updatePatientProfileController = async (req, res) => {
  try {
    const patientId = req.user.id;
    const updateData = req.body;
    const { error } = patientUpdateSchema.validate(updateData, {
      abortEarly: false,
    });

    if (error) {
      const errorDetails = error.details.map((detail) => ({
        field: detail.path[0],
        message: detail.message,
      }));

      throw Object.assign(new Error("Patient profile update failed"), {
        status: statusCodes.BAD_REQUEST,
        error: {
          code: 40002,
          reason: "Validation error",
          details: errorDetails,
        },
      });
    }

    if (Object.keys(updateData).length === 0 && !req.file) {
      throw Object.assign(new Error("No data provided for update"), {
        status: statusCodes.BAD_REQUEST,
        error: {
          code: 40003,
          message: "No fields provided for update",
        },
      });
    }

    if (req.file) {
      const profileImage = await spaceService.profileFileUpload(req.file);
      updateData.profileImage = profileImage;
    }

    if (updateData.phone) {
      delete updateData.phone;
    }

    const updatedPatient = await PatientService.updatePatientProfile(
      patientId,
      updateData
    );

    return res.success(updatedPatient, "Patient profile updated successfully");
  } catch (error) {
    errorResponseHandler(error, req, res);
  }
};
const getPatientProfileController = async (req, res) => {
  try {
    const patientId = req.user.id;
    const patientProfile = await PatientService.getPatientProfile(patientId);
    if (!patientProfile) {
      throw Object.assign(new Error("Patient profile not found"), {
        status: statusCodes.NOT_FOUND,
        error: { code: 40401 },
      });
    }

    return res.success(patientProfile, "Patient profile fetched successfully");
  } catch (error) {
    errorResponseHandler(error, req, res);
  }
};

const getPatientInfoController = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      throw Object.assign(new Error("Phone number is required"), {
        status: statusCodes.BAD_REQUEST,
        error: { code: 40004, message: "Phone number is required" },
      });
    }

    const patient = await PatientService.findPatientByPhone(phone);
    if (!patient) {
      throw Object.assign(new Error("Patient not found"), {
        status: statusCodes.NOT_FOUND,
        error: { code: 40401 },
      });
    }

    return res.success(patient, "Patient information fetched successfully.");
  } catch (error) {
    errorResponseHandler(error, req, res);
  }
};

const getPatientPrescriptionsController = async (req, res) => {
  try {
    const patientId = req.user.id;

    const prescriptions = await PrescriptionService.getPrescriptionsByPatientId(patientId);

    return res.success(prescriptions, "Prescriptions fetched successfully.");
  } catch (error) {
    errorResponseHandler(error, req, res);
  }
};
module.exports = {
  registerPatientController,
  updatePatientProfileController,
  loginPatientController,
  getPatientProfileController,
  getPatientInfoController,
  getPatientPrescriptionsController
};
