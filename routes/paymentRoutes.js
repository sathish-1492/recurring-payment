const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { User, Subscription } = require('../models/configuration');
const { createSubscription } = require('../controllers/paymentController');
const router = express.Router();

router.post('/create-subscription', async (req, res) => {
    const { email, paymentMethodId, amount } = req.body;

    try {
        // Create Stripe customer
        const customer = await stripe.customers.create({
            email: email,
            payment_method: paymentMethodId,
            invoice_settings: { default_payment_method: paymentMethodId },
        });

        // Create a subscription
        const subscription = await stripe.subscriptions.create({
            customer: customer.id,
            items: [{ price_data: { currency: 'usd', product: 'prod_xxx', unit_amount: amount * 100, recurring: { interval: 'month' } } }],
            expand: ['latest_invoice.payment_intent'],
        });

        // Save user and subscription to DB
        const user = await User.create({ email, stripeCustomerId: customer.id });
        await Subscription.create({
            userId: user.id,
            stripeSubscriptionId: subscription.id,
            amount,
            status: 'active',
        });

        res.status(200).json({ message: 'Subscription successful', subscription });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Subscription failed' });
    }
});

// Webhook to handle payment events from Stripe
router.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle subscription payments
    if (event.type === 'invoice.payment_succeeded') {
        const invoice = event.data.object;
        // Update subscription status to 'paid'
        Subscription.update({ status: 'paid' }, { where: { stripeSubscriptionId: invoice.subscription } });
    } else if (event.type === 'invoice.payment_failed') {
        const invoice = event.data.object;
        // Update subscription status to 'unpaid'
        Subscription.update({ status: 'unpaid' }, { where: { stripeSubscriptionId: invoice.subscription } });
    }

    res.json({ received: true });
});

router.get('/subscriptions', async (req, res) => {

    const { email, paymentMethodId, amount } = req.body;

    try {

        const subscription = [{
            email : "viji@gmail.com",
            amount: 500,
            status: 'completed'
        },
        {
            email : "nithish@gmail.com",
            amount: 500,
            status: 'completed'
        }];

        res.status(200).json({ message: 'get subscriptions', subscription });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Subscription failed' });
    }
})

router.post('/subscribe', createSubscription);

module.exports = router;
