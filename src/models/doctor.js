const { DataTypes } = require("sequelize");
const sequelize = require("../configs/sequelize");

const Doctor = sequelize.define(
  "Doctor",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    firstName: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    lastName: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
    status: {
      type: DataTypes.ENUM("online", "offline", "busy", "connected"),
      defaultValue: "offline",
    },
    profileImage: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    timestamps: true,
    tableName: "doctors",
  }
);

const DoctorProfile = sequelize.define(
  "DoctorProfile",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    doctorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
    },
    qualification: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    experience: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "Years of experience",
    },
    specialization: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    clinicAddress: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    consultationFee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    timestamps: true,
    tableName: "doctor_profiles",
  }
);

Doctor.hasOne(DoctorProfile, {
  foreignKey: "doctorId",
  as: "profile",
  onDelete: "CASCADE",
});

DoctorProfile.belongsTo(Doctor, {
  foreignKey: "doctorId",
  as: "doctor",
});

module.exports = {
  Doctor,
  DoctorProfile,
};
