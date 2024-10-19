const { User } = require('../models/configuration');
const { Sequelize } = require('sequelize');
const toLowerCaseKeys = require('../middleware/responseFormatter');

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
        const customer = await stripe.customers.create({
            email: EMAIL,
            phone: PHONE_NUMBER,
            name: NAME
        });

        // Update the user record with the STRIPE_CUSTOMER_ID
        user.STRIPE_CUSTOMER_ID = customer.id;
        await user.save();

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


module.exports = { createUser, getUser, getUsers, updateUsers, deleteUser };