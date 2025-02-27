const Patient = require("../models/Patient");
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
const updatePatientProfile = async (id, updateData) => {
  try {
    const patient = await Patient.findOne({ where: { id } });
    await patient.update(updateData);
    return patient;
  } catch (error) {
    throw error;
  }
};
module.exports = {
  registerPatient,
  findPatientByPhone,
  updatePatientProfile
};