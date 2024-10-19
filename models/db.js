const { Sequelize } = require('sequelize');
require('dotenv').config();

console.log(`Mysql: User => "${process.env.DB_USER}" password => "${process.env.DB_PASS}" DB name => "${process.env.DB_NAME}"`);

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    pool: {
        max: 5,
        min: 0,
        acquire: 30000, // The maximum time Sequelize will try to get a connection before throwing an error
        idle: 10000     // The maximum time a connection can be idle before being released
    }
});

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected');
    } catch (err) {
        console.log('Error: ' + err);
    }
};

module.exports = { sequelize, connectDB };
