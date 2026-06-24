const express = require('express');
const router = express.Router();
const { processDummyPayment, getMyPayments, getAllPayments } = require('../controllers/paymentController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

router.post('/pay',     protect, authorizeRoles('user'), processDummyPayment);
router.get('/my',       protect, authorizeRoles('user'), getMyPayments);
router.get('/all',      protect, authorizeRoles('admin'), getAllPayments);

module.exports = router;
