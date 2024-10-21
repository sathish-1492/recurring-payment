const Razorpay = require('razorpay');
const { User, Subscription } = require('../models/configuration');
const { Sequelize, where } = require('sequelize');
const toLowerCaseKeys = require('../middleware/responseFormatter');

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,  // Make sure these are your TEST keys
    key_secret: process.env.RAZORPAY_SECRET_KEY,
});
const planId = process.env.RAZORPAY_PLAN_ID;

const createUser = async (req, res) => {
    try {
        const { NAME, EMAIL, PHONE_NUMBER } = req.body;

        // Check if email or phone number exists
        const isExistUser = await User.findOne({
            where: {
                [Sequelize.Op.or]: [
                    { EMAIL: EMAIL || null },  // Check if email exists
                    { PHONE_NUMBER: PHONE_NUMBER || null },  // Check if phone exists
                ],
            },
        });

        if (isExistUser) {
            return res.status(400).json({
                exists: true,
                message: `User with this ${EMAIL ? 'email' : 'phone number'} already exists.`,
            });
        }

        const user = await User.create({ NAME, EMAIL, PHONE_NUMBER });

        // Create Stripe customer using the provided email and phone
        try {
            const customer = await razorpay.customers.create({
                email: EMAIL,
                phone: PHONE_NUMBER,
                name: NAME
            });

            // Update user record with Razorpay customer ID
            await user.update({ STRIPE_CUSTOMER_ID: customer.id });

            // Step 3: Create a subscription in Razorpay
            const subscriptionData = {
                plan_id: planId,           // Pass the Razorpay plan ID
                customer_id: customer.id,
                total_count: 12,           // For 12 months
                customer_notify: 1         // Notify customer by email
            };

            const subscription = await razorpay.subscriptions.create(subscriptionData);

            // Step 4: Insert subscription details into the SUBSCRIPTION table
            await Subscription.create({
                USER_ID: user.USER_ID,
                RAZORPAY_SUBSCRIPTION_ID: subscription.id,
                PLAN_ID: planId,
                PAID_AMOUNT: 0,
                TOTAL_COUNT: subscription.total_count,
                STATUS: subscription.status,
                START_DATE: new Date(subscription.start_at * 1000),  // Convert from timestamp
                END_DATE: new Date(subscription.end_at * 1000)
            });

            console.log('User and subscription created successfully.');

        } catch {
            console.log('error ', error)
            res.status(500).json({ error: 'Unable to create customers in Razorpay' });
        }


        res.status(201).json(toLowerCaseKeys(user.toJSON()));

    } catch (error) {
        console.log('error ', error.message)
        res.status(500).json({ error: 'Unable to create user' });
    }
};

const getUsers = async (req, res) => {
    try {
        const users = await User.findAll();
        const painUsers = users.map(page => page.get({ plain: true }));

        res.status(200).json(toLowerCaseKeys(painUsers));
    } catch (error) {
        res.status(500).json({ error: 'Unable to retrieve users' });
    }
};

const getUser = async (req, res) => {
    try {
        const users = await User.findByPk(req.params.id);
        res.status(200).json(toLowerCaseKeys(users.toJSON()));
    } catch (error) {
        res.status(500).json({ error: 'Unable to retrieve users' });
    }
};

const updateUsers = async (req, res) => {
    try {
        const users = await User.findByPk(req.params.id);
        users.update(req.body);

        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ error: 'Unable to retrieve users' });
    }
};


// Delete User
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findByPk(id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        await user.destroy();

        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Unable to delete user' });
    }
};

//get subscriptions 
const getUserSubscriptions = async (req, res) => {
    try {
        const user = await User.findOne({
            where: {
                PHONE_NUMBER : req.query.phone
            }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const subscriptions = await Subscription.findAll({
            where: {
                USER_ID: user.USER_ID
            }
        })

        const plainSubscriptions = subscriptions.map(page => page.get({ plain: true }));

        const userSubs = {
            user : user.toJSON(),
            subscriptions : plainSubscriptions
        }

        res.status(200).json(toLowerCaseKeys(userSubs));
    } catch (error) {
        res.status(500).json({ error: 'Unable to get subscriptions' });
    }
}


module.exports = { createUser, getUser, getUsers, updateUsers, deleteUser, getUserSubscriptions };