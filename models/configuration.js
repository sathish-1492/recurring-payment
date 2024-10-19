const { Sequelize, DataTypes } = require('sequelize');
const { sequelize } = require('./db');

// Configuration Model
const Configuration = sequelize.define('CONFIGURATION', {
    CONFIGURATION_ID: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
    },
    APP_NAME: { type: DataTypes.STRING, allowNull: false },
    APP_DEVELOPER: { type: DataTypes.STRING, allowNull: false },
    APP_EMAIL: { type: DataTypes.STRING, allowNull: false },
    DEVELOPER_EMAIL: {
        type: DataTypes.JSON,
        allowNull: false
    },
    VERSION: { type: DataTypes.FLOAT, allowNull: false },
    STORAGE: { type: DataTypes.JSON },
    API: { type: DataTypes.JSON },
    EDITOR: { type: DataTypes.JSON },
    PLANS: { type: DataTypes.JSON }
}, {
    timestamps: true,
    initialAutoIncrement: '1000000001', // Start ID with 10 digits
    tableName: 'CONFIGURATION',
    createdAt: 'CREATED_TIME',
    updatedAt: 'UPDATED_TIME',
});


const User = sequelize.define('User', {
    USER_ID: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
        validate: {
            isEmail: true,
        }
    },
    NAME: { type: DataTypes.STRING, allowNull: true},
    EMAIL: { type: DataTypes.STRING, allowNull: false, unique: true },
    PHONE_NUMBER: { type: DataTypes.STRING, allowNull: true},
    STRIPE_CUSTOMER_ID: { type: DataTypes.STRING }
}, { 
    timestamps: true,
    initialAutoIncrement: '2000000001', // Start ID with 10 digits
    tableName: 'USER',
    createdAt: 'CREATED_TIME',
    updatedAt: 'UPDATED_TIME', 
});


const Subscription = sequelize.define('Subscription', {
    SUBSCRIPTION_ID: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
    },
    USER_ID: { type: DataTypes.INTEGER, allowNull: false },
    STRIPE_SUBSCRIPTION_ID: { type: DataTypes.STRING },
    AMOUNT: { type: DataTypes.INTEGER, allowNull: false },
    MONTH: { type: DataTypes.DATE, allowNull: false},
    STATUS: { type: DataTypes.STRING, allowNull: false },
}, { 
    timestamps: true,
    initialAutoIncrement: '3000000001', // Start ID with 10 digits
    tableName: 'SUBSCRIPTION',
    createdAt: 'CREATED_TIME',
    updatedAt: 'UPDATED_TIME',  
});


module.exports = { Configuration, User, Subscription };

