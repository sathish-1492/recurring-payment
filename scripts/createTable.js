const { sequelize, connectDB } = require('../models/db');
const { configuration, subscription, User } = require('../models/configuration');

const createTable = async () => {
    try {
        connectDB();
        console.log('Connection has been established successfully.');

        // Sync all models
        await sequelize.sync({ alter: true });
       // await user.sync({ force: true });
        //  await user.sync({ force: true });

       // console.log('Tables have been created.');
        console.log('Tables have been modified.');


    } catch (error) {
        console.error('Unable to connect to the database:', error);
    } finally {
        await sequelize.close();
    }
};

createTable();




