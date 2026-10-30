const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/statsController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.get('/dashboard', authorize('support_engineer', 'admin'), getDashboardStats);

module.exports = router;
