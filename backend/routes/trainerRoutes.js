const express = require('express');
const router = express.Router();
const { getAllTrainers, selectTrainer, getMyTrainer, getMyMembers } = require('../controllers/trainerController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

router.get('/', protect, getAllTrainers);
router.get('/my-trainer', protect, authorizeRoles('user'), getMyTrainer);
router.put('/select/:trainerId', protect, authorizeRoles('user'), selectTrainer);
router.get('/my-members', protect, authorizeRoles('trainer'), getMyMembers);

module.exports = router;
