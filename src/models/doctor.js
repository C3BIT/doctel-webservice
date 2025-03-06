const { DataTypes } = require('sequelize');
const sequelize = require('../configs/sequelize');

const Doctor = sequelize.define('Doctor', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    firstName: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    lastName: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    phone: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true
    },
    status: {
        type: DataTypes.ENUM('online', 'offline', 'busy', 'connected'),
        defaultValue: 'offline'
    },
    profileImage: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
}, {
    timestamps: true,
    tableName: 'doctors'
});

module.exports = Doctor;
