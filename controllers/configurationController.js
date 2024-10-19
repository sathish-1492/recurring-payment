//controllers/configurationController.js
const { Configuration } = require('../models/configuration');
const toLowerCaseKeys = require('../middleware/responseFormatter');

const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../json', 'config.json');

exports.createConfiguration = async (req, res) => {
    let config;
    try {
        const data = fs.readFileSync(configPath, 'utf8');
        config = JSON.parse(data);
    } catch (err) {
        console.error('Error reading config.json:', err);
        process.exit(1);
    }

    try {

        const configEntry = {
            CREATED_TIME: new Date(),
            UPDATED_TIME: new Date()
        }
        for (const [key, value] of Object.entries(config)) {
            if(value) {
                configEntry[key.toUpperCase()] = value;

            }
        }

        const findVersion = await Configuration.findOne({
            where: {
                VERSION: parseFloat(configEntry.VERSION)
            }
        });

        console.log(`CONFIGURATION: ${JSON.stringify(findVersion)}`);

        if(!findVersion) {
            await Configuration.upsert(configEntry);
        }

        console.log('Database configuration updated successfully.');
    } catch (err) {
        console.error('Error updating database configuration:', err);
    }
}

exports.getLastConfiguration = async (req, res) => {
    try {
        const lastConfig = await Configuration.findOne({
            order: [['CONFIGURATION_ID', 'DESC']], // Order by 'id' (or 'createdAt' if using timestamps)
            attributes: ['CONFIGURATION_ID', 'APP_NAME', 'APP_DEVELOPER', 'VERSION', 'STORAGE']
        });

        if (lastConfig) {
            return res.status(200).json(toLowerCaseKeys(lastConfig.toJSON())); // Return the last row in JSON format
        } else {
            return res.status(404).json({ message: 'No configuration found.' });
        }

    } catch (error) {
        console.error('Error fetching the last configuration:', error);
    }
}
