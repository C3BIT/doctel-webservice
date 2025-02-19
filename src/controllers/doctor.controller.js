const {
  registerDoctor,
  findDoctorByEmail,
  findDoctorByPhone,
} = require("../services/doctorService");
const { statusCodes } = require("../utils/statusCodes");
const { doctorRegistrationSchema } = require("../validations/doctorValidation");
const { errorResponseHandler } = require('../middlewares/errorResponseHandler');
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
    const doctor = await registerDoctor({ firstName, lastName, email, phone, password, status });
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



module.exports = { registerDoctorController };
