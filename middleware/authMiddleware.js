// middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');


const phoneVerificationMiddleware = async (req, res, next) => {
    try {
        const token = req.cookies.phoneAuthToken;

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded; // Attach user data to request object

            console.log('authenticated users:', decoded);
            // Phone number is verified, proceed to next middleware or route handler
            next();
        } catch (error) {
            console.log(error.message);
            return res.status(403).json({ message: 'Invalid token' });
        }

    } catch (error) {
        console.error('Error in phone verification middleware:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

const adminMiddleware = async (req, res, next) => {
    try {
        const token = req.cookies.phoneAuthToken;

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded; // Attach user data to request object

            // Phone number is verified, proceed to next middleware or route handler
            next();
        } catch (error) {
            console.log(error.message);
            return res.status(403).json({ message: 'Invalid token' });
        }

    } catch (error) {
        console.error('Error in phone verification middleware:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = { phoneVerificationMiddleware, adminMiddleware };
