import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import crypto from 'crypto';

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
    apiKey: {
        type: DataTypes.STRING,
        unique: true
    },
    webhookUrl: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
            isUrlOrEmpty(value) {
                if (value && value !== '' && !/^(http|https):\/\/[^ "]+$/.test(value)) {
                    throw new Error('Invalid URL format');
                }
            }
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
}, {
    hooks: {
        beforeCreate: (session) => {
            if (!session.apiKey) {
                session.apiKey = crypto.randomBytes(16).toString('hex');
            }
        }
    }
});

export default Session;
