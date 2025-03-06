const {
  registerDoctor,
  findDoctorByEmail,
  findDoctorByPhone,
  verifyPassword,
  updateDoctorProfile,
  updateDoctorImage,
} = require("../services/doctorService");
const { statusCodes } = require("../utils/statusCodes");
const {
  doctorRegistrationSchema,
  doctorLoginSchema,
} = require("../validations/doctorValidation");
const { errorResponseHandler } = require("../middlewares/errorResponseHandler");
const { generateToken } = require("../utils/jwtHelper");
const spaceService = require("../services/spaceService");
const { verifyOtp } = require("../services/otpService");
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
      throw Object.assign(new Error(), {
        status: statusCodes.BAD_REQUEST,
        error: { code: 40001 , errors: error.details.map((err) => err.message),},
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

    const token = generateToken({
      id: doctor.id,
      phone: doctor.phone,
      role: "doctor",
    });

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
    const { firstName, lastName, phone, status } = req.body;
    const doctorId = req.user.id;
    const updateData = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (phone) updateData.phone = phone;
    if (status) updateData.status = status;

    if (Object.keys(updateData).length === 0) {
      throw Object.assign(new Error(), {
        status: statusCodes.BAD_REQUEST,
        error: { code: 40002 },
      });
    }

    const updatedDoctor = await updateDoctorProfile(doctorId, updateData);

    return res.success(updatedDoctor, "Doctor profile updated successfully");
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
    const imageUrl = await spaceService.profileFileUpload(
      req.file
    );
    await updateDoctorImage(doctorId, imageUrl);
    return res.success({ imageUrl }, "Profile image uploaded successfully");
  } catch (error) {
    errorResponseHandler(error, req, res);
  }
};

module.exports = {
  registerDoctorController,
  loginDoctorController,
  updateDoctorProfileController,
  uploadDoctorProfileImage,
};
