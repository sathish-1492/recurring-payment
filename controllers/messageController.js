const Razorpay = require('razorpay');
const twilio = require('twilio');
const { User } = require('../models/configuration');

// Razorpay instance
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_SECRET_KEY
});

// Twilio instance
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

const sendWhatsAppPaymentLink = async (req, res) => {
    try {

        const user = await User.findByPk(req.params.id);
        const amount = 1;

        // Create a Razorpay payment link
        const paymentLink = await razorpay.paymentLink.create({
            amount: amount * 100, // Amount in smallest unit (e.g., paise for INR)
            currency: 'INR',
            accept_partial: false,
            description: 'Monthly Subscription Payment',
            callback_url: 'https://recurringpayment.in/payment-success', // Change to your actual callback URL
            callback_method: 'get'
        });

        if (!paymentLink) {
            return res.status(400).json({ message: 'Failed to create payment link' });
        }

        // Send payment link via WhatsApp using Twilio
        const message = await client.messages.create({
            from: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`, // Twilio WhatsApp-approved number
            to: `whatsapp:+91${user.PHONE_NUMBER}`,
            body: `Please complete your payment using this link: ${paymentLink.short_url}`
        })
            .then(message => {
                console.log('Payment link sent via WhatsApp, Message SID:', message.sid);
            })
            .catch(error => {
                console.error('Error sending WhatsApp payment link:', error.message);
            });

        res.status(200).json({
            message: 'Payment link sent successfully via WhatsApp',
            paymentLink: paymentLink.short_url,
            whatsappResponse: message
        });
    } catch (error) {
        console.error('Error sending WhatsApp payment link:', error);
        res.status(500).json({ message: 'Internal Server Error', error });
    }
};

module.exports = { sendWhatsAppPaymentLink };
