const express = require('express');
const router = express.Router();
const { getUsers, getEngineers, updateUserRole } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/engineers', authorize('support_engineer', 'admin'), getEngineers);
router.get('/', authorize('admin'), getUsers);
router.patch('/:id/role', authorize('admin'), updateUserRole);

module.exports = router;
