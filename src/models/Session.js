const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Session = sequelize.define('Session', {
    id: {
        type: DataTypes.STRING, // This will be our unique session identifier (e.g., 'session_123')
        primaryKey: true
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('INIT', 'QR', 'CONNECTED', 'DISCONNECTED'),
        defaultValue: 'INIT'
    },
    webhookUrl: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
            isUrl: true
        }
    },
    pairingCode: {
        type: DataTypes.STRING,
        allowNull: true
    }
});

module.exports = Session;
