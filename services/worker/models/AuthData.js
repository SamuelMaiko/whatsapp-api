import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const AuthData = sequelize.define('AuthData', {
    sessionId: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true // Composite primary key
    },
    id: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true // Composite primary key
    },
    data: {
        type: DataTypes.TEXT,
        allowNull: false
    }
});

export default AuthData;
