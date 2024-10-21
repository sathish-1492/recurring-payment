const crypto = require('crypto');
const { Subscription, User } = require('../models/configuration');  // Assuming you have Sequelize models for Subscription and User

// Secret key for Razorpay webhook signature verification
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_SECRET_KEY;

const handleWebhook = async (req, res) => {
    const event = req.body;
    const razorpaySignature = req.headers['x-razorpay-signature'];

    // Step 1: Verify the webhook signature
    const isValid = verifyWebhookSignature(req.rawBody, razorpaySignature, RAZORPAY_WEBHOOK_SECRET);
    if (!isValid) {
        return res.status(400).send('Invalid Signature');
    }

    // Step 2: Handle the event based on its type
    switch (event.event) {
        case 'subscription.charged':
            await handleSubscriptionCharged(event.payload.subscription.entity);
            break;
        // Handle other events like subscription.failed, subscription.canceled, etc.
        default:
            console.log('Unhandled event type:', event.event);
    }

    res.status(200).send('Webhook received successfully');
};

// Helper function to verify the webhook signature
const verifyWebhookSignature = (rawBody, razorpaySignature, webhookSecret) => {
    const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody, 'utf-8')
        .digest('hex');

    return razorpaySignature === expectedSignature;
};

// Handle 'subscription.charged' event
const handleSubscriptionCharged = async (subscriptionEntity) => {
    try {
        const { id, customer_id, plan_id, status, total_count, paid_count } = subscriptionEntity;

        // Find the user linked to the subscription
        const subscription = await Subscription.findOne({ where: { RAZORPAY_SUBSCRIPTION_ID: id } });
        if (!subscription) {
            console.error('Subscription not found:', id);
            return;
        }

        // Update the subscription status
        subscription.STATUS = status;
        subscription.PAID_AMOUNT = paid_count;
        await subscription.save();

        // Optionally: Notify the user of successful charge
        const user = await User.findOne({ where: { id: subscription.USER_ID } });
        if (user) {
            // Notify the user via email, SMS, etc. (Implement this as per your needs)
            console.log(`Payment successful for user ${user.email}.`);
        }

        console.log(`Subscription charged successfully for subscription ID: ${id}`);
    } catch (error) {
        console.error('Error handling subscription charged event:', error);
    }
};



module.exports = { handleWebhook };
