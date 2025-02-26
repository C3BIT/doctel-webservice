const { DataTypes } = require("sequelize");
const sequelize = require('../configs/sequelize');
const OtpVerification = sequelize.define("OtpVerification", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
  },
  otp: {
    type: DataTypes.STRING(4),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM("pending", "used", "expired"),
    defaultValue: "pending",
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: "otp_verifications",
  timestamps: true,
  updatedAt: false,
});

module.exports = OtpVerification;
