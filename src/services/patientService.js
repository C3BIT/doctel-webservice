const Patient = require("../models/patient");

const registerPatient = async ({ name, email, phone, dateOfBirth, gender, password }) => {
  return await Patient.create({
    name,
    email,
    phone,
    dateOfBirth,
    gender,
    password,
  });
};

module.exports = {
  registerPatient,
};
