// routes/checkPhoneVerification.js
const express = require('express');
const { User } = require('../models/configuration'); // Adjust the path as necessary

const router = express.Router();

// Endpoint to check phone number verification status
router.get('/:phoneNumber', async (req, res) => {
    const { phoneNumber } = req.params; // Get phone number from query parameters

    if (!phoneNumber) {
        return res.status(400).json({ message: 'Phone number is required' });
    }

    try {
        // Retrieve user from the database by phone number
        const user = await User.findOne({ where: { PHONE_NUMBER: phoneNumber } });
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const data = { "phone": phoneNumber, "is_phone_verified": user.IS_VERIFIED }
        // Check if phone number is verified
        return res.status(200).json(data);
    } catch (error) {
        console.error('Error checking phone verification:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
