const { DataTypes } = require("sequelize");
const sequelize = require('../configs/sequelize');

const Prescription = sequelize.define("Prescription", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  doctorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'doctors',
      key: 'id'
    }
  },
  patientId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'patients',
      key: 'id'
    }
  },
  prescriptionURL: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      isUrl: true
    }
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  }
}, {
  tableName: "prescriptions",
  timestamps: true,
  indexes: [
    {
      fields: ['patientId']
    },
    {
      fields: ['doctorId']
    }
  ]
});

module.exports = Prescription;
