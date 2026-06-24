const express = require('express');
const router = express.Router();
const { createAppointment, getMyAppointments, updateAppointmentStatus } = require('../controllers/appointmentController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
router.route('/').post(protect, authorizeRoles('user'), createAppointment).get(protect, getMyAppointments);
router.route('/:id/status').put(protect, authorizeRoles('trainer'), updateAppointmentStatus);
module.exports = router;