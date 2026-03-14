import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Session = sequelize.define('Session', {
    id: {
        type: DataTypes.STRING,
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
    },
    qr: {
        type: DataTypes.TEXT,
        allowNull: true
    }
});

export default Session;
