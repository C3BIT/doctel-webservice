const { Doctor, DoctorProfile } = require("../models/doctor");
const bcrypt = require("bcryptjs");

const registerDoctor = async (phone) => {
  try {
    return await Doctor.create({ phone });
  } catch (error) {
    throw error;
  }
};

const findDoctorByEmail = async (email) => {
  return await Doctor.findOne({ where: { email } });
};

const findDoctorByPhone = async (phone) => {
  return await Doctor.findOne({ where: { phone } });
};

const verifyPassword = async (inputPassword, storedPassword) => {
  return await bcrypt.compare(inputPassword, storedPassword);
};

const updateDoctorProfile = async (doctorId, updateData) => {
  const [rowsUpdated] = await Doctor.update(updateData, {
    where: { id: doctorId },
  });

  if (rowsUpdated > 0) {
    return await Doctor.findByPk(doctorId, {
      attributes: { exclude: ["id", "phone", "createdAt", "updatedAt"] },
    });
  }

  return null;
};

const updateDoctorImage = async (doctorId, imageUrl) => {
  return await Doctor.update(
    { profileImage: imageUrl },
    {
      where: { id: doctorId },
      returning: true,
    }
  );
};

const getDoctorProfileDetails = async (doctorId) => {
  try {
    const doctorProfile = await Doctor.findOne({
      where: { id: doctorId },
      attributes: [
        "id",
        "firstName",
        "lastName",
        "phone",
        "status",
        "profileImage",
      ],
      include: [
        {
          model: DoctorProfile,
          as: "profile",
          attributes: [
            "qualification",
            "experience",
            "specialization",
            "clinicAddress",
            "consultationFee",
            "bio",
          ],
        },
      ],
    });

    return doctorProfile;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  registerDoctor,
  findDoctorByEmail,
  findDoctorByPhone,
  verifyPassword,
  updateDoctorProfile,
  updateDoctorImage,
  getDoctorProfileDetails,
};
