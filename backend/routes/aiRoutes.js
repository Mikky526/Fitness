const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const { generateDietPlan, trainerPreviewDietPlan, trainerSendDietPlan } = require('../controllers/aiController');

router.post('/diet-plan', protect, generateDietPlan);
router.post('/trainer-diet-preview', protect, authorizeRoles('trainer'), trainerPreviewDietPlan);
router.post('/trainer-diet-send', protect, authorizeRoles('trainer'), trainerSendDietPlan);

module.exports = router;
