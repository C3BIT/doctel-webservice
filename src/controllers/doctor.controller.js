const {
  registerDoctor,
  findDoctorByEmail,
  findDoctorByPhone,
  verifyPassword,
  updateDoctorProfile,
  updateDoctorImage,
  getDoctorProfileDetails,
} = require("../services/doctorService");
const { statusCodes } = require("../utils/statusCodes");
const {
  doctorRegistrationSchema,
  doctorLoginSchema,
  updateDoctorProfileSchema,
} = require("../validations/doctorValidation");
const { errorResponseHandler } = require("../middlewares/errorResponseHandler");
const { generateToken } = require("../utils/jwtHelper");
const spaceService = require("../services/spaceService");
const { verifyOtp, sendPrescriptionLink } = require("../services/otpService");
const {
  updateDoctorProfileDetails,
} = require("../services/doctorProfileService");
const {
  createPrescription,
} = require("../services/prescriptionService");
const { findPatientByPhone } = require("../services/patientService");
const registerDoctorController = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password, status } = req.body;
    const { error } = doctorRegistrationSchema.validate(req.body);
    if (error) {
      throw Object.assign(new Error(error.details[0].message), {
        status: statusCodes.BAD_REQUEST,
        error: { code: 40001 },
      });
    }
    const existingDoctor = await findDoctorByEmail(email);
    if (existingDoctor) {
      throw Object.assign(new Error(), {
        status: statusCodes.CONFLICT,
        error: { code: 40005 },
      });
    }

    const existingDoctorByPhone = await findDoctorByPhone(phone);
    if (existingDoctorByPhone) {
      throw Object.assign(new Error("Phone number already exists"), {
        status: statusCodes.CONFLICT,
        error: { code: 40006 },
      });
    }
    const doctor = await registerDoctor({
      firstName,
      lastName,
      email,
      phone,
      password,
      status,
    });
    const responseData = {
      name: `${doctor.firstName} ${doctor.lastName}`,
      email: doctor.email,
      phone: doctor.phone,
    };

    return res.created(responseData, "Doctor registered successfully");
  } catch (error) {
    errorResponseHandler(error, req, res);
  }
};

const loginDoctorController = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    const { error } = doctorLoginSchema.validate(req.body);
    if (error) {
      const errorDetails = error.details.map((detail) => ({
        field: detail.path[0],
        message: detail.message,
      }));
      throw Object.assign(new Error(), {
        status: statusCodes.BAD_REQUEST,
        error: { code: 40001, details: errorDetails },
      });
    }
    const isOtpValid = await verifyOtp(phone, otp);
    if (!isOtpValid) {
      throw Object.assign(new Error("Invalid or expired OTP"), {
        status: statusCodes.UNAUTHORIZED,
        error: { code: 40011 },
      });
    }
    let doctor = await findDoctorByPhone(phone);
    if (!doctor) {
      doctor = await registerDoctor(phone);
    }

    const {
      id,
      firstName,
      lastName,
      profileImage,
    } = doctor || {};
    
    const tokenPayload = {
      id,
      phone,
      role: "doctor",
      ...(firstName && lastName && { name: `${firstName} ${lastName}` }),
      ...(profileImage && { image: profileImage }),
    };
    
    const token = generateToken(tokenPayload);

    return res.success(
      {
        phone: doctor.phone,
        token,
      },
      "Doctor logged in successfully"
    );
  } catch (error) {
    errorResponseHandler(error, req, res);
  }
};

const updateDoctorProfileController = async (req, res) => {
  try {
    const { error } = updateDoctorProfileSchema.validate(req.body);
    if (error) {
      const errorDetails = error.details.map((detail) => ({
        field: detail.path[0],
        message: detail.message,
      }));
      throw Object.assign(new Error(), {
        status: statusCodes.BAD_REQUEST,
        error: { code: 40002, details: errorDetails },
      });
    }

    const doctorId = req.user.id;
    const {
      firstName,
      lastName,
      status,
      qualification,
      experience,
      specialization,
      clinicAddress,
      consultationFee,
      bio,
    } = req.body;
    let profileImage;
    if (req.file) {
      profileImage = await spaceService.profileFileUpload(req.file);
    }

    const doctorUpdateData = {};
    const profileUpdateData = {};

    if (firstName) doctorUpdateData.firstName = firstName;
    if (lastName) doctorUpdateData.lastName = lastName;
    if (status) doctorUpdateData.status = status;
    if (profileImage) doctorUpdateData.profileImage = profileImage;

    if (qualification) profileUpdateData.qualification = qualification;
    if (experience) profileUpdateData.experience = experience;
    if (specialization) profileUpdateData.specialization = specialization;
    if (clinicAddress) profileUpdateData.clinicAddress = clinicAddress;
    if (consultationFee) profileUpdateData.consultationFee = consultationFee;
    if (bio) profileUpdateData.bio = bio;
    if (
      Object.keys(doctorUpdateData).length === 0 &&
      Object.keys(profileUpdateData).length === 0
    ) {
      throw Object.assign(new Error("No valid fields to update"), {
        status: statusCodes.BAD_REQUEST,
        error: { code: 40003, message: "No fields provided for update" },
      });
    }

    if (Object.keys(doctorUpdateData).length > 0) {
      await updateDoctorProfile(doctorId, doctorUpdateData);
    }

    if (Object.keys(profileUpdateData).length > 0) {
      await updateDoctorProfileDetails(doctorId, profileUpdateData);
    }

    return res.success(
      { message: "Doctor profile updated successfully" },
      "Profile updated successfully"
    );
  } catch (error) {
    errorResponseHandler(error, req, res);
  }
};

const uploadDoctorProfileImage = async (req, res) => {
  try {
    const doctorId = req.user.id;
    if (!req.file) {
      throw Object.assign(new Error("No image file provided"), {
        status: statusCodes.BAD_REQUEST,
        error: { code: 40002 },
      });
    }
    const imageUrl = await spaceService.profileFileUpload(req.file);
    await updateDoctorImage(doctorId, imageUrl);
    return res.success({ imageUrl }, "Profile image uploaded successfully");
  } catch (error) {
    errorResponseHandler(error, req, res);
  }
};

const getDoctorProfileController = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const doctorProfile = await getDoctorProfileDetails(doctorId);

    if (!doctorProfile) {
      throw Object.assign(new Error("Doctor profile not found"), {
        status: statusCodes.NOT_FOUND,
        error: { code: 40401 },
      });
    }

    return res.success(doctorProfile, "Doctor profile fetched successfully");
  } catch (error) {
    errorResponseHandler(error, req, res);
  }
};
const createPrescriptionController = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const { phone } = req.body;
    if (!phone) {
      throw Object.assign(new Error("patientId is required"), {
        status: statusCodes.BAD_REQUEST,
        error: { code: 40013 },
      });
    }
    const patient = await findPatientByPhone(phone);
    if (!req.file) {
      throw Object.assign(new Error("No Prescription file provided"), {
        status: statusCodes.BAD_REQUEST,
        error: { code: 40012 },
      });
    }
    const prescriptionUrl = await spaceService.prescriptionFileUpload(req.file);
    await sendPrescriptionLink(phone, prescriptionUrl)
    const prescription = await createPrescription({
      doctorId,
      patientId: patient.id,
      prescriptionURL: prescriptionUrl
    });
    return res.created(prescription, "Prescription created successfully");
  } catch (error) {
    errorResponseHandler(error, req, res);
  }
};
module.exports = {
  registerDoctorController,
  loginDoctorController,
  updateDoctorProfileController,
  uploadDoctorProfileImage,
  getDoctorProfileController,
  createPrescriptionController
};
