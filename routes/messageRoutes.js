const express = require('express');
const { sendWhatsAppPaymentLink } = require('../controllers/messageController');
const router = express.Router();

// Route to send payment link via WhatsApp
router.post('/:id', sendWhatsAppPaymentLink);

module.exports = router;
