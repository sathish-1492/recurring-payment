const Razorpay = require('razorpay');
require('dotenv').config();

console.log("key::::", process.env.RAZORPAY_KEY_ID, "secret::::", process.env.RAZORPAY_SECRET_KEY);

const razorpay = new Razorpay({
    key_id: 'rzp_test_wMbIcdyFzO7VMh',
    key_secret: 'FxxSZXAHNxrow8nDKXZkuzyX',
});

async function createPlan() {
    const planData = {
        period: 'monthly', // or 'weekly', 'yearly'
        interval: 1, // Interval count
        item: {
            name: 'Premium Subscription - Monthly',
            currency: 'INR',
            amount: 50000, // Amount in smallest currency unit (i.e., ₹500)
            description: "Description for the test plan"
        }
    };

    try {
        const plan = await razorpay.plans.create(planData);
        console.log('Plan created:', plan);
    } catch (error) {
        console.error('Error creating plan:', error);
    }
}

createPlan();
