const { DataTypes } = require("sequelize");
const sequelize = require('../configs/sequelize');

const Patient = sequelize.define(
  "Patient",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    firstName: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      validate: {
        isNumeric: true,
      },
    },
    dateOfBirth: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    gender: {
      type: DataTypes.ENUM("Male", "Female", "Other"),
      allowNull: true,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    height: {
      type: DataTypes.FLOAT,
      allowNull: true,
      validate: {
        min: 30,
        max: 250,
      },
    },
    weight: {
      type: DataTypes.FLOAT,
      allowNull: true,
      validate: {
        min: 2,
        max: 300,
      },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("active", "inactive", "banned"),
      defaultValue: "active",
    },
  },
  {
    tableName: "patients",
    charset: "utf8mb4",
    collate: "utf8mb4_unicode_ci",
    timestamps: true,
    indexes: [
      { unique: true, fields: ["email"] },
      { unique: true, fields: ["phone"] },
    ],
  }
);

module.exports = Patient;
