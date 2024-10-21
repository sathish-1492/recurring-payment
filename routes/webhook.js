const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');

// Define webhook route for Razorpay
router.post('/razorpay', express.json(), webhookController.handleWebhook);

module.exports = router;
