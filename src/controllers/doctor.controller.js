const {
  registerDoctor,
  findDoctorByEmail,
} = require("../services/doctorService");
const { statusCodes } = require("../utils/statusCodes");
const { doctorRegistrationSchema } = require("../validations/doctorValidation");
const { errorResponseHandler } = require('../middlewares/errorResponseHandler');
const registerDoctorController= async (req, res) => {
  try {
    const { error } = doctorRegistrationSchema.validate(req.body);
    if (error) {
      throw Object.assign(new Error(error.details[0].message), {
        status: statusCodes.BAD_REQUEST,
        error: { code: 40001 },
      });
    }

    const existingDoctor = await findDoctorByEmail(req.body.email);
    if (existingDoctor) {
      throw Object.assign(new Error(), {
        status: statusCodes.CONFLICT,
        error: { code: 40005 },
      });
    }

    const doctor = await registerDoctor(req.body);
    return res.created(doctor, "Doctor registered successfully");
  } catch (error) {
    errorResponseHandler(error, req, res);
  }
}

module.exports = { registerDoctorController };
