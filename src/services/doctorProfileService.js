const DoctorProfile = require("../models/doctorProfile");

const updateDoctorProfileDetails = async (doctorId, updateData) => {
  try {
    const existingProfile = await DoctorProfile.findOne({ where: { doctorId } });

    if (existingProfile) {
      await DoctorProfile.update(updateData, { where: { doctorId } });
      return await DoctorProfile.findOne({ where: { doctorId }, raw: true });
    } else {
      updateData.doctorId = doctorId;
      return await DoctorProfile.create(updateData);
    }
  } catch (error) {
    throw error;
  }
};

module.exports = {
  updateDoctorProfileDetails,
};
