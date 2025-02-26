const Patient = require("../models/patient");

const registerPatient = async ({ phone, password }) => {
  return await Patient.create({
    phone,
    password,
  });
};

module.exports = {
  registerPatient,
};
