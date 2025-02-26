const Patient = require("../models/patient");
const { Sequelize } = require("sequelize");

const findPatientByPhone = async (phone) => {
  try {
    return await Patient.findOne({ where: { phone } });
  } catch (error) {
    if (error instanceof Sequelize.DatabaseError) {
      throw new Error(`Database error: ${error.message}`);
    }
    throw error;
  }
};

const registerPatient = async ({ phone, password }) => {
  return await Patient.create({
    phone,
    password,
  });
};

module.exports = {
  registerPatient,
  findPatientByPhone,
};