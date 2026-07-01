const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const { getMyDietPlans, getAllDietPlans, reviewDietPlan, addTrainerComment, updateDietPlan, deleteDietPlan } = require('../controllers/dietPlanController');

router.get('/my', protect, getMyDietPlans);
router.get('/', protect, authorizeRoles('trainer', 'admin'), getAllDietPlans);
router.put('/:id/review', protect, authorizeRoles('trainer'), reviewDietPlan);
router.post('/:id/comments', protect, authorizeRoles('trainer'), addTrainerComment);
router.put('/:id', protect, authorizeRoles('admin'), updateDietPlan);
router.delete('/:id', protect, authorizeRoles('admin'), deleteDietPlan);

module.exports = router;
