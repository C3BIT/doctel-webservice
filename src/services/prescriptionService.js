const Prescription = require("../models/Prescription");
const createPrescription = async (prescriptionData) => {
  try {
    const prescription = await Prescription.create(prescriptionData);
    return prescription;
  } catch (error) {
    throw new Error("Failed to save prescription in database");
  }
};
module.exports = {
  createPrescription,
};