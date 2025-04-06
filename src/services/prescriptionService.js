const Prescription = require("../models/Prescription");
const createPrescription = async (prescriptionData) => {
  try {
    const prescription = await Prescription.create(prescriptionData);
    return prescription;
  } catch (error) {
    throw new Error("Failed to save prescription in database");
  }
};

const getPrescriptionsByPatientId = async (patientId) => {
  try {
    const prescriptions = await Prescription.findAll({
      where: { patientId },
      order: [['createdAt', 'DESC']]
    });
    return prescriptions;
  } catch (error) {
    throw new Error("Failed to retrieve prescriptions by patient ID");
  }
};
module.exports = {
  createPrescription,
  getPrescriptionsByPatientId
};