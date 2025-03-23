const Patient = require("../models/Patient");
const { Sequelize } = require("sequelize");
const { statusCodes } = require("../utils/statusCodes");

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
    phone
  });
};
const updatePatientProfile = async (id, updateData) => {
  try {
    const [affectedRows] = await Patient.update(updateData, {
      where: { id }
    });
    
    if (affectedRows === 0) {
      throw Object.assign(new Error("Patient not found"), {
        status: statusCodes.NOT_FOUND,
        error: { code: 40401 }
      });
    }
    
    const updatedPatient = await Patient.findByPk(id);
    return updatedPatient;
  } catch (error) {
    throw error;
  }
};
const getPatientProfile = async (id) => {
  try {
    const patient = await Patient.findByPk(id, {
      attributes: { 
        exclude: ['password']
      }
    });
    
    if (!patient) {
      return null;
    }
    
    return patient;
  } catch (error) {
    throw error;
  }
};
module.exports = {
  registerPatient,
  findPatientByPhone,
  updatePatientProfile,
  getPatientProfile
};