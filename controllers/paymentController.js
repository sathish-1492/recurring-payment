const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/configuration');
const Subscription = require('../models/configuration');

const createSubscription = async (req, res) => {
    try {
        const { userId, paymentMethodId } = req.body;
        const user = await User.findByPk(userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // If user doesn't have a Stripe customer ID, create one
        let stripeCustomerId = user.stripeCustomerId;
        if (!stripeCustomerId) {
            const customer = await stripe.customers.create({
                email: user.email,
                payment_method: paymentMethodId,
                invoice_settings: { default_payment_method: paymentMethodId },
            });
            stripeCustomerId = customer.id;
            user.stripeCustomerId = stripeCustomerId;
            await user.save();
        }

        // Create the subscription
        const subscription = await stripe.subscriptions.create({
            customer: stripeCustomerId,
            items: [{ price: 'price_XXXXXXXXXXXXXX' }],  // Replace with your Stripe price ID
            expand: ['latest_invoice.payment_intent'],
        });

        // Store subscription in the database
        const dbSubscription = await Subscription.create({
            userId: user.id,
            stripeSubscriptionId: subscription.id,
            status: subscription.status,
        });

        res.status(200).json({ subscription: dbSubscription, stripeSubscription: subscription });
    } catch (error) {
        res.status(500).json({ error: 'Unable to create subscription' });
    }
};

module.exports = { createSubscription };
