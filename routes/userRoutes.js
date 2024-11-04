const express = require('express');
const user = require('../controllers/userController');
const toUpperCase = require('../middleware/uppercase');
const { phoneVerificationMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();
router.use(toUpperCase);

router.post('/', user.createUser);
router.get('/subscriptions', phoneVerificationMiddleware, user.getUserSubscriptions);
router.get('/', phoneVerificationMiddleware, user.getUsers);
router.get('/:id', user.getUser);
router.put('/:id', user.updateUsers);
router.delete('/:id', user.deleteUser);
router.post('/plan', phoneVerificationMiddleware, user.createPlan);

module.exports = router;
