const { DataTypes } = require('sequelize');
const sequelize = require('../configs/sequelize');
const Doctor = require('./doctor');

const DoctorProfile = sequelize.define('DoctorProfile', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    doctorId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        references: {
            model: Doctor,
            key: 'id'
        }
    },
    qualification: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    experience: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Years of experience'
    },
    specialization: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    clinicAddress: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    consultationFee: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
    },
    bio: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    timestamps: true,
    tableName: 'doctor_profiles'
});

DoctorProfile.belongsTo(Doctor, { foreignKey: 'doctorId' });
module.exports = DoctorProfile;
