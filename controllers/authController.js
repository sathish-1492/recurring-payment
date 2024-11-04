// controllers/authController.js
const { User } = require('../models/configuration');
const twilio = require('twilio');
const jwt = require('jsonwebtoken');
const axios = require('axios');

const client = new twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '1h';


// Send verification code
exports.sendVerificationCode = async (req, res) => {
    const { phone } = req.body;

    try {

        const user = await User.findOne({ where: { PHONE_NUMBER: phone } });
        if (!user) {
            return res.status(400).json({ message: 'Phone number not found' });
        }

        if(user.VERIFICATION_CODE) {
            return res.status(200).json({ message: 'Verification code already sent.', code: user.VERIFICATION_CODE});
        }

        const generateOtp = () => {
            return Math.floor(100000 + Math.random() * 900000).toString(); // Generates a 6-digit numeric OTP
        };

        const apiKey = process.env.FAST2SMS_API_KEY; // Replace with your Fast2SMS API key

        const senderId = 'YOUR_SENDER_ID'; // Replace with your registered Sender ID
        const message = `Your OTP code is: ${otp}`;
    
        const otp = generateOtp(); // Generate the OTP

        //const url = `https://www.fast2sms.com/dev/bulkV2?authorization=${apiKey}&sender_id=${senderId}&message=${encodeURIComponent(message)}&numbers=${phoneNumber}`;
        const url = `https://www.fast2sms.com/dev/bulkV2?authorization=${apiKey}&route=otp&numbers=${phone}&variables_values=${otp}`;

        try {
            const response = await axios.get(url);
            console.log('SMS sent successfully:', response.data);

            user.IS_VERIFIED = false;
            user.VERIFICATION_CODE = otp;
            await user.save();

            return res.status(200).json({ message: 'Verification code sent.' });
        } catch (error) {
            console.error('Error sending SMS:', error.response.data);
        }

    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ error: 'Failed to send verification code.' });
    }
};

// Verify code and log in user
exports.verifyCode = async (req, res) => {
    const { phone, code } = req.body;

    try {
        const user = await User.findOne({ where: { PHONE_NUMBER: phone } });
        if (!user || user.VERIFICATION_CODE !== code) {
            return res.status(400).json({ message: 'Invalid code.' });
        }

        user.IS_VERIFIED = true; // Mark user as verified
        user.VERIFICATION_CODE = null; // Clear the verification code
        await user.save();

        // Generate JWT token
        const token = jwt.sign({ phone_number: user.PHONE_NUMBER, user_id: user.USER_ID }, JWT_SECRET, { expiresIn: JWT_EXPIRATION });

        // Set the token in a secure, HTTP-only cookie
        res.cookie('phoneAuthToken', token, {
            httpOnly: true,
            secure: true, // Set to true in production (requires HTTPS)
            maxAge: 24 * 60 * 60 * 1000 // 1 hour in milliseconds
        });

        return res.status(200).json({ message: 'OTP verified and token issued' });
    } catch (error) {
        return res.status(500).json({ error: 'Verification failed.' });
    }
};
