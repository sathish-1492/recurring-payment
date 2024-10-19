const express = require('express');
const user = require('../controllers/userController');
const toUpperCase = require('../middleware/uppercase');

const router = express.Router();
router.use(toUpperCase);

router.post('/', user.createUser);
router.get('/', user.getUsers);
router.get('/:id', user.getUser);
router.put('/:id', user.updateUsers);
router.delete('/:id', user.deleteUser);

module.exports = router;
